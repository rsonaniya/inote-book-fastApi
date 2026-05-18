from genericpath import isfile

from fastapi import FastAPI
from db import models
from routers import notes, users
from auth import authentication
from db.database import engine
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

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

CLIENT_BUILD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../client/dist")
)

ASSETS_PATH = os.path.join(CLIENT_BUILD_DIR, "assets")
if os.path.exists(ASSETS_PATH):
    app.mount("/assets", StaticFiles(directory=ASSETS_PATH), name="assets")


@app.get("/{catchall:path}")
def serve_react_app(catchall: str):
    index_path = os.path.join(CLIENT_BUILD_DIR, "index.html")
    requested_file = os.path.join(CLIENT_BUILD_DIR, catchall)
    if os.path.isfile(requested_file):
        return FileResponse(requested_file)
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "error": "React build not found. Please run 'npm run build' in the client directory."
    }
