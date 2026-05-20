from random import randint
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session
from auth.oauth2 import get_current_user
from db.database import get_db
from db.db_user import create_db_user, get_db_user, get_db_user_by_email, update_db_user
from schemas import ResendOtpBase, UserBase, UserDisplay, VerifyOtpBase
from utils.email import send_signup_otp_email, send_welcome_email
from datetime import timedelta, datetime, timezone
import cloudinary.uploader

router = APIRouter(prefix="/user", tags=["user"])

from datetime import datetime, timedelta, timezone


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_otp_expiry(minutes: int = 5) -> datetime:
    return get_utc_now() + timedelta(minutes=minutes)


@router.post("/")
def create_user(
    request: UserBase, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    otp_code = str(randint(100000, 999999))
    is_verified = False
    otp_expires_at = get_otp_expiry(5)
    user = create_db_user(request, db, otp_code, is_verified, otp_expires_at)
    bg_tasks.add_task(
        send_signup_otp_email,
        otp_code,
        user.email,
        user.fullname,
    )
    return {"message": "Your Accoout is created successfuly"}


@router.post("/verify-otp")
def verify_otp(
    request: VerifyOtpBase, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    user = get_db_user_by_email(request.email, db)
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account already verified, Please login with your credentials",
        )
    if user.otp_code != request.otp_code:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid OTP")
    if user.otp_expires_at < get_utc_now():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="OTP expired")

    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    updated_user = update_db_user(db, user)
    bg_tasks.add_task(send_welcome_email, updated_user.email, updated_user.fullname)
    return {"message": "Your account is verified now"}


@router.post("/resend-otp")
def resend_otp(
    request: ResendOtpBase, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    user = get_db_user_by_email(request.email, db)
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account already verified, Please login with your credentials",
        )
    otp_code = str(randint(100000, 999999))
    is_verified = False
    otp_expires_at = get_otp_expiry(5)
    user.is_verified = is_verified
    user.otp_code = otp_code
    user.otp_expires_at = otp_expires_at
    updated_user = update_db_user(db, user)
    bg_tasks.add_task(
        send_signup_otp_email,
        otp_code,
        user.email,
        user.fullname,
    )
    return {"message": f"A new otp has been sent to your email: {updated_user.email}"}


@router.get("/{id}", response_model=UserDisplay)
def get_user(id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.id != id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You are not authorized to access this user's profile information.",
        )

    return get_db_user(id, db)


@router.post("/upload-profile-pic", response_model=UserDisplay)
def upload_profile(
    profile_pic: UploadFile = File(...),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    profile_pic_size = profile_pic.size
    is_size_correct = profile_pic_size >= 102400 and profile_pic_size <= 5242880
    if not is_size_correct:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="a valid image file between 100 KB and 5 MB is allowed",
        )
    accepted_file_types = ["image/jpeg", "image/png", "image/webp"]
    if not profile_pic.content_type in accepted_file_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and WEBP images are allowed",
        )
    if current_user.profile_pic_public_id:
        delete_result = cloudinary.uploader.destroy(current_user.profile_pic_public_id)
        if delete_result.get("result") not in ["ok", "not found"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="failed to upload the image",
            )
    result = cloudinary.uploader.upload(profile_pic.file)
    current_user.profile_pic_url = result.get("secure_url")
    current_user.profile_pic_public_id = result.get("public_id")
    updated_user = update_db_user(db, current_user)
    return updated_user
