from pydantic import BaseModel, Field


class UserBase(BaseModel):
    username: str
    password: str = Field(..., min_length=8, max_length=14)


class UserDisplay(BaseModel):
    username: str
    id: int

    class Config:
        orm_mode = True


class NoteBase(BaseModel):
    title: str = Field(..., min_length=8, max_length=50)
    content: str = Field(..., min_length=8, max_length=500)
    completed: bool = False
