from fastapi import FastAPI
from db import models
from routers import notes, users
from auth import authentication
from db.database import engine
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


app.include_router(users.router)
app.include_router(authentication.router)
app.include_router(notes.router)


@app.get("/test")
def get_health_status():
    return {"message": "Inotebook backend is working fine "}


models.Base.metadata.create_all(engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
