from uuid import UUID
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.orm import joinedload, selectinload

from app.core.deps import DBSession, ActiveUser
from app.models import Conversation, ConversationParticipant, Message, User

router = APIRouter()


class SendMessageRequest(BaseModel):
    content: str
    attachments: Optional[list] = None


class CreateConversationRequest(BaseModel):
    recipient_user_id: UUID
    subject: Optional[str] = None
    initial_message: str


@router.get("/conversations")
async def list_my_conversations(db: DBSession, current_user: ActiveUser):
    # Find all conversations current user participates in
    res = await db.execute(
        select(Conversation)
        .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
        .where(ConversationParticipant.user_id == current_user.id)
        .options(
            selectinload(Conversation.participants).joinedload(ConversationParticipant.user),
            selectinload(Conversation.messages),
        )
        .order_by(Conversation.last_message_at.desc().nullslast(), Conversation.created_at.desc())
    )
    convos = res.scalars().all()

    items = []
    for c in convos:
        # Find the other participant
        other_part = next((p for p in c.participants if p.user_id != current_user.id), None)
        last_msg = c.messages[-1] if c.messages else None
        items.append({
            "id": str(c.id),
            "subject": c.subject,
            "last_message_at": c.last_message_at.isoformat() if c.last_message_at else None,
            "last_message": last_msg.content if last_msg else None,
            "other_participant": {
                "id": str(other_part.user.id),
                "name": f"{other_part.user.first_name} {other_part.user.last_name}",
                "avatar_url": other_part.user.avatar_url,
                "role": other_part.user.role.value if hasattr(other_part.user.role, "value") else str(other_part.user.role),
            } if other_part and other_part.user else None,
        })

    return items


@router.post("/conversations", status_code=status.HTTP_201_CREATED)
async def create_conversation(payload: CreateConversationRequest, db: DBSession, current_user: ActiveUser):
    now = datetime.now(timezone.utc)
    conv = Conversation(subject=payload.subject, last_message_at=now)
    db.add(conv)
    await db.flush()

    # Add participants
    p1 = ConversationParticipant(conversation_id=conv.id, user_id=current_user.id)
    p2 = ConversationParticipant(conversation_id=conv.id, user_id=payload.recipient_user_id)
    db.add_all([p1, p2])

    # Add initial message
    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=payload.initial_message,
    )
    db.add(msg)
    await db.flush()

    return {"message": "Conversation started.", "conversation_id": str(conv.id)}


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: UUID, db: DBSession, current_user: ActiveUser):
    # Verify participant
    part_res = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id,
        )
    )
    part = part_res.scalar_one_or_none()
    if not part:
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation.")

    # Mark as read
    part.last_read_at = datetime.now(timezone.utc)

    res = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id, Message.deleted_at.is_(None))
        .options(joinedload(Message.sender))
        .order_by(Message.created_at.asc())
    )
    msgs = res.scalars().all()

    return [
        {
            "id": str(m.id),
            "sender_id": str(m.sender_id),
            "sender_name": f"{m.sender.first_name} {m.sender.last_name}" if m.sender else "",
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "is_me": m.sender_id == current_user.id,
        }
        for m in msgs
    ]


@router.post("/conversations/{conversation_id}/messages", status_code=status.HTTP_201_CREATED)
async def send_message(conversation_id: UUID, payload: SendMessageRequest, db: DBSession, current_user: ActiveUser):
    part_res = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id,
        )
    )
    if not part_res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a participant in this conversation.")

    now = datetime.now(timezone.utc)
    msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=payload.content,
        attachments=payload.attachments,
    )
    db.add(msg)

    # Update conversation last_message_at
    await db.execute(
        update(Conversation).where(Conversation.id == conversation_id).values(last_message_at=now)
    )
    await db.flush()

    return {
        "id": str(msg.id),
        "sender_id": str(msg.sender_id),
        "content": msg.content,
        "created_at": msg.created_at.isoformat(),
    }
