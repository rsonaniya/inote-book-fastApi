import os
from fastapi_mail import (
    ConnectionConfig,
    FastMail,
    MessageSchema,
    MessageType,
)

conf = ConnectionConfig(
    MAIL_USERNAME="rajat.dev0305@gmail.com",
    MAIL_PASSWORD="ilnd lbvk zwhz dgdp",
    MAIL_FROM="Focus-app@gmail.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_FROM_NAME="Focus Team",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
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
    message = MessageSchema(
        subject="Welcome to Focus! ✨",
        recipients=[email_to],
        body=html_content,
        subtype=MessageType.html,
    )
    fm = FastMail(conf)
    await fm.send_message(message)


async def send_signup_otp_email(otp_code: str, email_to: str, fullname: str):
    """Asynchronously transmits the 6-digit verification security token."""
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
                
                <p style="font-size: 13px; color: #666; text-align: center;">This security code is strictly valid for <strong>5 minutes</strong>.</p>
            </div>
        </body>
    </html>
    """

    message = MessageSchema(
        subject="Focus Verification Code 🔐",
        recipients=[email_to],
        body=html_content,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    await fm.send_message(message)
