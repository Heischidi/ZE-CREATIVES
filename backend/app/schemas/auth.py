from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    status: str
    first_name: str
    last_name: str
    email: str
    avatar_url: Optional[str] = None


class ActivateAccountRequest(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str

    def model_post_init(self, __context) -> None:
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirmRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str

    def model_post_init(self, __context) -> None:
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match.")


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str

    def model_post_init(self, __context) -> None:
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match.")
