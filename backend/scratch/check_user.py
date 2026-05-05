import os
import json
from dotenv import load_dotenv
from services.firebase_service import get_firebase_service

load_dotenv()

def check_user(email):
    svc = get_firebase_service()
    uid = svc._get_uid_by_email(email)
    print(f"User: {email}")
    print(f"UID: {uid}")
    if uid:
        user = svc._db.reference("users").child(uid).get()
        print(f"User Data: {json.dumps(user, indent=2)}")
    else:
        print("User does not exist.")

if __name__ == "__main__":
    check_user("surabhim1101@gmail.com")
