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
    
    # List root keys
    root = svc._db.reference("/").get()
    if root:
        print(f"Root keys: {list(root.keys())}")
    else:
        print("Root is empty.")
        
    if uid:
        user_ref = svc._db.reference("users").child(uid)
        user_data = user_ref.get()
        print(f"Full User Data: {json.dumps(user_data, indent=2)}")
        
        progress = user_ref.child("progress").get()
        print(f"Progress Data: {json.dumps(progress, indent=2)}")
        
        daily = user_ref.child("dailyProgress").get()
        print(f"Daily Progress Data: {json.dumps(daily, indent=2)}")
    else:
        print("User does not exist in userEmails map.")

if __name__ == "__main__":
    check_user("spandanam444@gmail.com")
