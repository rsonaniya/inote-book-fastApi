import os
import httpx
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY")

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


async def send_brevo_email(subject: str, email_to: str, html_content: str):
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }
    payload = {
        "sender": {"name": "Focus Team", "email": "rajatsonaniya28@gmail.com"},
        "to": [{"email": email_to}],
        "subject": subject,
        "htmlContent": html_content,
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(BREVO_API_URL, headers=headers, json=payload)
            if response.status_code not in [200, 201, 202]:
                print(f"Brevo error response {response.text}")
                raise HTTPException(
                    status_code=500, detail=f"Email delivery failed: {response.text}"
                )
            print(f"email successfully sent to route {email_to}")
        except httpx.HTTPError as exc:
            print(f"not work error while connecting to brevo: {exc}")
            raise HTTPException(
                status_code=500, detail="Internal network error during email broadcast."
            )


async def send_welcome_email(email_to: str, fullname: str):
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
                <h2 style="color: #4F46E5;">Welcome to <b>Focus</b>, {fullname}! 🎉</h2>
                <p>Thank you for signing up. Your full-stack cloud notebook account has been successfully initialized.</p>
                <p>Your registered login identifier is: <strong>{email_to}</strong></p>
                <p>You can now log in natively, securely create personal markdown logs, and manage your cloud data CRUD layers seamlessly.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 11px; color: #999; text-align: center;"><b>Focus</b> App System Relays</p>
            </div>
        </body>
    </html>
    """
    await send_brevo_email("Welcome to Focus! ✨", email_to, html_content)


async def send_signup_otp_email(otp_code: str, email_to: str, fullname: str):
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 450px; margin: 0 auto; padding: 25px; border: 1px solid #e4e4e7; border-radius: 12px;">
                <h2 style="color: #4F46E5; text-align: center;">Verify Your Account</h2>
                <p>Hi <strong>{fullname}</strong>,</p>
                <p>Thank you for signing up with <b>Focus</b>. Please use the following One-Time Password (OTP) to complete your verification setup:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; padding: 10px 20px; background-color: #F3F4F6; border-radius: 6px; display: inline-block;">
                        {otp_code}
                    </span>
                </div>
                
                <p style="font-size: 13px; color: #666; text-align: center;">This security code is strictly valid for <strong>1 minute</strong>.</p>
            </div>
        </body>
    </html>
    """
    await send_brevo_email("Focus Verification Code 🔐", email_to, html_content)
