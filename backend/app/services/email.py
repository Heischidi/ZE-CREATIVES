"""
Email service with SMTP support.
Gracefully handles missing credentials in development.
"""
import logging
try:
    import aiosmtplib
except ImportError:
    aiosmtplib = None
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.enabled = bool(settings.SMTP_USER and settings.SMTP_PASSWORD)
        if not self.enabled:
            logger.warning(
                "Email service not configured. Set SMTP_USER and SMTP_PASSWORD env vars. "
                "Emails will be logged to console in development."
            )

    async def _send(self, to_email: str, subject: str, html_content: str) -> bool:
        if not self.enabled:
            logger.info(
                f"[DEV EMAIL] To: {to_email} | Subject: {subject}\n"
                f"Content preview: {html_content[:200]}..."
            )
            return True

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))

        try:
            await aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=settings.SMTP_TLS,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    async def send_invitation(
        self, to_email: str, first_name: str, raw_token: str, role: str
    ) -> bool:
        activation_url = f"{settings.ALLOWED_ORIGINS[0]}/activate?token={raw_token}"
        subject = "You're invited to Ze: Creatives"
        html = f"""
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #171526;">
            <div style="background: linear-gradient(135deg, #7957F5, #9B7CF7); padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Ze: Creatives</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Creative Jobs. Real Opportunities.</p>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #EEEAF5;">
                <h2>Welcome, {first_name}! 🎉</h2>
                <p>Your <strong>{role}</strong> account on Ze: Creatives has been approved.</p>
                <p>Click the button below to activate your account and set your password. This link expires in 72 hours.</p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="{activation_url}" style="background: #7957F5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                        Activate My Account
                    </a>
                </div>
                <p style="color: #777386; font-size: 14px;">Or paste this link into your browser:<br>
                <a href="{activation_url}" style="color: #7957F5;">{activation_url}</a></p>
                <hr style="border: 1px solid #EEEAF5; margin: 24px 0;">
                <p style="color: #777386; font-size: 13px;">If you didn't expect this email, please ignore it.</p>
            </div>
        </div>
        """
        return await self._send(to_email, subject, html)

    async def send_password_reset(self, to_email: str, first_name: str, raw_token: str) -> bool:
        reset_url = f"{settings.ALLOWED_ORIGINS[0]}/reset-password?token={raw_token}"
        subject = "Reset your Ze: Creatives password"
        html = f"""
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #171526;">
            <div style="background: linear-gradient(135deg, #7957F5, #9B7CF7); padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Ze: Creatives</h1>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #EEEAF5;">
                <h2>Reset your password</h2>
                <p>Hi {first_name}, we received a request to reset your password.</p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="{reset_url}" style="background: #7957F5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #777386; font-size: 14px;">This link expires in 24 hours. If you didn't request this, ignore this email.</p>
            </div>
        </div>
        """
        return await self._send(to_email, subject, html)

    async def send_application_received(self, to_email: str, first_name: str) -> bool:
        subject = "We received your application — Ze: Creatives"
        html = f"""
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #171526;">
            <div style="background: linear-gradient(135deg, #7957F5, #9B7CF7); padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Ze: Creatives</h1>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #EEEAF5;">
                <h2>Application received! ✨</h2>
                <p>Hi {first_name}, thank you for applying to join Ze: Creatives as a creative professional.</p>
                <p>Our team will review your application and get back to you within <strong>3–5 business days</strong>.</p>
                <p>We'll notify you by email once a decision has been made.</p>
                <hr style="border: 1px solid #EEEAF5; margin: 24px 0;">
                <p style="color: #777386; font-size: 13px;">Ze: Creatives — Creative Jobs. Real Opportunities.</p>
            </div>
        </div>
        """
        return await self._send(to_email, subject, html)

    async def send_application_status(
        self, to_email: str, first_name: str, status: str, reason: Optional[str] = None
    ) -> bool:
        if status == "approved":
            subject = "Your Ze: Creatives application has been approved 🎉"
            body = "<p>Great news! Your creative application has been approved. You'll receive a separate account activation email shortly.</p>"
        else:
            subject = "Update on your Ze: Creatives application"
            reason_html = f"<p><strong>Reason:</strong> {reason}</p>" if reason else ""
            body = f"<p>After careful review, we're unable to approve your application at this time.</p>{reason_html}<p>You're welcome to apply again in the future.</p>"

        html = f"""
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #171526;">
            <div style="background: linear-gradient(135deg, #7957F5, #9B7CF7); padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">Ze: Creatives</h1>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #EEEAF5;">
                <h2>Hi {first_name},</h2>
                {body}
                <hr style="border: 1px solid #EEEAF5; margin: 24px 0;">
                <p style="color: #777386; font-size: 13px;">Ze: Creatives — Creative Jobs. Real Opportunities.</p>
            </div>
        </div>
        """
        return await self._send(to_email, subject, html)


email_service = EmailService()
