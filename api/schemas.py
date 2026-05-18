from pydantic import BaseModel, Field, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=14)
    fullname: str = Field(..., min_length=2, max_length=50)


class UserDisplay(BaseModel):
    email: str
    id: int
    fullname: str

    class Config:
        orm_mode = True


class NoteBase(BaseModel):
    title: str = Field(..., min_length=8, max_length=50)
    content: str = Field(..., min_length=8, max_length=500)
    completed: bool = False


class VerifyOtpBase(BaseModel):
    otp_code: str
    email: EmailStr


class ResendOtpBase(BaseModel):
    email: EmailStr
