import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_5lqVLtCS6asB@ep-billowing-heart-aqwwn6f2.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require",
)
is_sqlite = DB_URL.startswith("sqlite")
engine = create_engine(
    DB_URL, connect_args={"check_same_thread": False} if is_sqlite else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
