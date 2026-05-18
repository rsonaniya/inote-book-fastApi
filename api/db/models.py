from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from db.database import Base


class DbUser(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    fullname = Column(String)
    is_verified = Column(Boolean, default=False)
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)


class DbNote(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)
    completed = Column(Boolean)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
