from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from db.hash_password import HashPassword
from db.models import DbUser
from schemas import UserBase


def create_db_user(
    request: UserBase,
    db: Session,
    otp_code: str,
    is_verified: bool,
    otp_expires_at: datetime,
):
    existing_user = db.query(DbUser).filter(DbUser.email == request.email).first()
    if existing_user and existing_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"email {request.email} already taken",
        )
    if existing_user and not existing_user.is_verified:
        existing_user.password = HashPassword.bcrypt(request.password)
        existing_user.fullname = request.fullname
        existing_user.is_verified = is_verified
        existing_user.otp_code = otp_code
        existing_user.otp_expires_at = otp_expires_at
        db.commit()
        db.refresh(existing_user)
        return existing_user

    new_user = DbUser(
        email=request.email,
        password=HashPassword.bcrypt(request.password),
        fullname=request.fullname,
        is_verified=is_verified,
        otp_code=otp_code,
        otp_expires_at=otp_expires_at,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def update_db_user(db: Session, user: DbUser):
    db.commit()
    db.refresh(user)
    return user


def get_db_user(id: int, db: Session):
    user = db.query(DbUser).filter(DbUser.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"no user found with id {id}",
        )
    return user


def get_db_user_by_email(email: str, db: Session):
    user = db.query(DbUser).filter(DbUser.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"no user found with email {email}",
        )
    return user
