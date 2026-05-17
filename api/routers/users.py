from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.oauth2 import get_current_user
from db.database import get_db
from db.db_user import create_db_user, get_db_user
from schemas import UserBase, UserDisplay

router = APIRouter(prefix="/user", tags=["user"])


@router.post("/", response_model=UserDisplay)
def create_user(request: UserBase, db: Session = Depends(get_db)):
    return create_db_user(request, db)


@router.get("/{id}", response_model=UserDisplay)
def get_user(id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.id != id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You are not authorized to access this user's profile information.",
        )

    return get_db_user(id, db)
