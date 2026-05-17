from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.oauth2 import get_current_user
from db.database import get_db
from db.db_notes import (
    create_db_notes,
    delete_db_note,
    get_db_note,
    get_db_notes,
    update_db_note,
)
from schemas import NoteBase

router = APIRouter(prefix="/notes", tags=["Notes"])


@router.post("/")
def create_note(
    request: NoteBase,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return create_db_notes(db, request, creator_id=current_user.id)


@router.get("/")
def get_notes(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_db_notes(db, current_user.id)


@router.get("/{id}")
def get_note(
    id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    note = get_db_note(db, id)
    if note.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not own this note",
        )
    return note


@router.put("/{id}")
def update_note(
    id: int,
    request: NoteBase,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    note = get_db_note(
        db,
        id,
    )
    if note.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not own this note",
        )
    return update_db_note(db, note, request)


@router.delete("/{id}")
def delete_note(
    id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    note = get_db_note(db, id)
    if note.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not own this note",
        )
    return delete_db_note(db, note)
