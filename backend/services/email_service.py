import smtplib
import os
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        # Default to Gmail, but could be any SMTP server
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        
    def send_otp(self, recipient_email, otp_code):
        """
        Sends a real OTP email using SMTP.
        Note: The user must provide SMTP_USER and SMTP_PASSWORD in their .env file.
        For Gmail, they must use an 'App Password' if 2FA is enabled.
        """
        if not self.smtp_user or not self.smtp_password:
            print("ERROR: [EMAIL ERROR] SMTP_USER or SMTP_PASSWORD not set in .env")
            return False
            
        try:
            # Create a professional, branded email
            msg = MIMEMultipart()
            msg['From'] = f"InterviewCoach AI <{self.smtp_user}>"
            msg['To'] = recipient_email
            msg['Subject'] = f"{otp_code} is your InterviewCoach verification code"
            
            body = f"""
            <html>
                <body style="font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 40px; margin: 0;">
                    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #f1f5f9;">
                        
                        <div style="background-color: #10b981; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -1px;">InterviewCoach</h1>
                        </div>
                        
                        <div style="padding: 40px; text-align: center;">
                            <h2 style="color: #0f172a; margin-bottom: 10px; font-size: 20px;">Identity Verification</h2>
                            <p style="color: #64748b; font-size: 15px; line-height: 1.6;">
                                You're almost there! To verify your account and build your confidence, use the code below:
                            </p>
                            
                            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin: 30px 0; border: 2px dashed #cbd5e1;">
                                <span style="font-size: 32px; font-weight: 900; color: #0f172a; letter-spacing: 12px; margin-left: 12px;">{otp_code}</span>
                            </div>
                            
                            <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">
                                This code will expire in 5 minutes. If you did not request this, please ignore this email.
                            </p>
                        </div>
                        
                        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
                            <p style="color: #94a3b8; font-size: 11px; margin: 0; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">
                                Powered by AI Confidence coaching
                            </p>
                        </div>
                    </div>
                </body>
            </html>
            """
            msg.attach(MIMEText(body, 'html'))
            
            # Connect to GMail or other SMTP server
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls() # Secure the connection
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            print(f"OK: [EMAIL SUCCESS] OTP {otp_code} successfully delivered to {recipient_email}")
            return True
            
        except Exception as e:
            print(f"ERROR: [EMAIL ERROR] Critical failure during delivery: {str(e)}")
            return False
