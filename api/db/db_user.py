from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from db.hash_password import HashPassword
from db.models import DbUser
from schemas import UserBase


def create_db_user(request: UserBase, db: Session):
    existing_user = db.query(DbUser).filter(DbUser.username == request.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"username {request.username} already taken",
        )
    new_user = DbUser(
        username=request.username, password=HashPassword.bcrypt(request.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def get_db_user(id: int, db: Session):
    user = db.query(DbUser).filter(DbUser.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"no user found with id {id}",
        )
    return user


def get_db_user_by_username(username: str, db: Session):
    user = db.query(DbUser).filter(DbUser.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"no user found with username {username}",
        )
    return user
