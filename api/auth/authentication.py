from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from auth import oauth2
from db.hash_password import HashPassword

from db.database import get_db
from db.models import DbUser

router = APIRouter(tags=["Authentication"])


@router.post("/login")
def get_token(
    request: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = db.query(DbUser).filter(DbUser.email == request.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid credentials"
        )
    if not HashPassword.verify(user.password, request.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid credentials"
        )
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your Account is not verified, Please verify it first",
        )
    access_token = oauth2.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "user_id": user.id,
        "email": user.email,
        "fullname": user.fullname,
    }
