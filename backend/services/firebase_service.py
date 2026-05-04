import base64
import hashlib
import json
import os
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import firebase_admin
from firebase_admin import credentials, db


class FirebaseConfigError(RuntimeError):
    pass


class FirebaseService:
    def __init__(self) -> None:
        self._app = self._initialize_app()

    def signup(self, email: str, password: str, full_name: str) -> Dict[str, str]:
        email = email.strip().lower()
        full_name = full_name.strip()

        if self._get_uid_by_email(email):
            raise ValueError("Account already exists.")

        uid = self._make_uid(email)
        now = _utc_now()
        username = _make_username(full_name, email)
        password_hash = _hash_password(password)

        user_record = {
            "id": uid,
            "email": email,
            "username": username,
            "fullName": full_name,
            "passwordHash": password_hash,
            "createdAt": now,
            "updatedAt": now,
        }

        root = db.reference("/")
        root.child("users").child(uid).set(user_record)
        root.child("userEmails").child(_email_key(email)).set(uid)

        return _public_user(user_record)

    def login(self, email: str, password: str) -> Dict[str, str]:
        user = self.get_user_by_email(email)
        if not user or not _verify_password(password, user.get("passwordHash", "")):
            raise ValueError("Invalid email or password.")
        return _public_user(user)

    def user_exists(self, email: str) -> bool:
        return self._get_uid_by_email(email) is not None

    def reset_password(self, email: str, password: str) -> None:
        uid = self._get_uid_by_email(email)
        if not uid:
            raise ValueError("No account found with this email.")

        db.reference("users").child(uid).update({
            "passwordHash": _hash_password(password),
            "updatedAt": _utc_now(),
        })

    def list_public_users(self, limit: int = 10) -> List[Dict[str, str]]:
        data = db.reference("users").order_by_child("createdAt").limit_to_last(limit).get() or {}
        users = [_public_user(user) for user in data.values() if isinstance(user, dict)]
        return sorted(users, key=lambda user: user.get("createdAt", ""), reverse=True)

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        uid = self._get_uid_by_email(email)
        if not uid:
            return None
        user = db.reference("users").child(uid).get()
        return user if isinstance(user, dict) else None

    def _get_uid_by_email(self, email: str) -> Optional[str]:
        uid = db.reference("userEmails").child(_email_key(email.strip().lower())).get()
        return uid if isinstance(uid, str) else None

    def _initialize_app(self) -> firebase_admin.App:
        if firebase_admin._apps:
            return firebase_admin.get_app()

        database_url = os.getenv("FIREBASE_DATABASE_URL")
        if not database_url:
            raise FirebaseConfigError("FIREBASE_DATABASE_URL is missing.")

        cred_data = _load_credentials()
        return firebase_admin.initialize_app(
            credentials.Certificate(cred_data),
            {"databaseURL": database_url},
        )


def get_firebase_service() -> FirebaseService:
    return FirebaseService()


def _load_credentials() -> Dict[str, Any]:
    raw_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    raw_b64 = os.getenv("FIREBASE_SERVICE_ACCOUNT_BASE64")
    path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")

    if raw_json:
        return json.loads(raw_json)

    if raw_b64:
        return json.loads(base64.b64decode(raw_b64).decode("utf-8"))

    if path:
        credentials_path = Path(path)
        if not credentials_path.is_absolute():
            credentials_path = Path(__file__).resolve().parents[1] / credentials_path
        with credentials_path.open("r", encoding="utf-8") as credential_file:
            return json.load(credential_file)

    project_id = os.getenv("FIREBASE_PROJECT_ID")
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
    private_key = os.getenv("FIREBASE_PRIVATE_KEY")
    if project_id and client_email and private_key:
        return {
            "type": "service_account",
            "project_id": project_id,
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID", ""),
            "private_key": private_key.replace("\\n", "\n"),
            "client_email": client_email,
            "client_id": os.getenv("FIREBASE_CLIENT_ID", ""),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL", ""),
        }

    raise FirebaseConfigError("Firebase service account credentials are missing.")


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return f"pbkdf2_sha256$120000${salt}${digest.hex()}"


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, digest = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            int(iterations),
        ).hex()
        return secrets.compare_digest(candidate, digest)
    except (AttributeError, ValueError):
        return False


def _make_uid(email: str) -> str:
    return hashlib.sha256(email.encode("utf-8")).hexdigest()


def _email_key(email: str) -> str:
    return hashlib.sha256(email.encode("utf-8")).hexdigest()


def _make_username(full_name: str, email: str) -> str:
    base = full_name.split()[0] if full_name else email.split("@")[0]
    cleaned = "".join(ch for ch in base.lower() if ch.isalnum() or ch in ("_", "-"))
    return cleaned or "user"


def _public_user(user: Dict[str, Any]) -> Dict[str, str]:
    return {
        "id": str(user.get("id", "")),
        "username": str(user.get("username", "")),
        "fullName": str(user.get("fullName", "")),
        "email": str(user.get("email", "")),
        "createdAt": str(user.get("createdAt", "")),
    }


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()
