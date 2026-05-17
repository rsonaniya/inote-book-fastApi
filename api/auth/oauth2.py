from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from db import db_user
from db.database import get_db

SECRET_KEY = "usually i do not want to keep things secured but for now lets just do it"
ALGORITHM = "HS256"

auth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def create_access_token(data: dict):
    to_encode = data.copy()
    expires_in = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expires_in})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(auth2_scheme), db: Session = Depends(get_db)):
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not authenticate credentials",
        headers={"www-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credential_exception
    except JWTError:
        raise credential_exception
    user = db_user.get_db_user_by_username(username, db)
    if user is None:
        raise credential_exception
    return user
