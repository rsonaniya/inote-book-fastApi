from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from db.models import DbNote
from schemas import NoteBase


def create_db_notes(db: Session, request: NoteBase, creator_id: int):
    new_note = DbNote(
        title=request.title,
        content=request.content,
        creator_id=creator_id,
        completed=request.completed,
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


def get_db_notes(db: Session, creator_id: int):
    notes = db.query(DbNote).filter(DbNote.creator_id == creator_id).all()
    return notes


def get_db_note(db: Session, id: int):
    note = db.query(DbNote).filter(DbNote.id == id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"note with given id {id} not found",
        )
    return note


def update_db_note(db: Session, note: DbNote, request: NoteBase):
    note.title = request.title
    note.content = request.content
    note.completed = request.completed
    db.commit()
    db.refresh(note)
    return note


def delete_db_note(db: Session, note: DbNote):
    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}
