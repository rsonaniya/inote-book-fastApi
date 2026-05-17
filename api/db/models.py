from sqlalchemy import Boolean, Column, ForeignKey, Integer, String

from db.database import Base


class DbUser(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String)
    password = Column(String)


class DbNote(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)
    completed = Column(Boolean)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
