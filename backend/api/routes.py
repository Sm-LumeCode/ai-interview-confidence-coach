from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import time
import tempfile
from services.evaluator import evaluate_answer_legacy
from services.answer_generator import generate_ideal_answer

from services.firebase_service import FirebaseConfigError, get_firebase_service

router = APIRouter()

def _firebase_or_503():
    try:
        return get_firebase_service()
    except FirebaseConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")


def safe_log(message: str):
    print(message.encode("ascii", "replace").decode("ascii"))

# Request models
class EvaluationRequest(BaseModel):
    question: str
    answer: str
    keywords: Optional[List[str]] = None

class AnswerGenerationRequest(BaseModel):
    question: str
    keywords: Optional[List[str]] = None

class SignupRequest(BaseModel):
    email: str
    password: str
    fullName: str

class LoginRequest(BaseModel):
    email: str
    password: str

class EmailLookupRequest(BaseModel):
    email: str

class PasswordResetRequest(BaseModel):
    email: str
    password: str


def _firebase_or_503():
    try:
        return get_firebase_service()
    except FirebaseConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        print(f"Firebase initialization failed: {exc}")
        raise HTTPException(status_code=503, detail="Firebase is not configured correctly.")


@router.post("/auth/signup")
def signup(request: SignupRequest):
    if not request.email.strip():
        raise HTTPException(status_code=400, detail="Email is required.")
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if not request.fullName.strip():
        raise HTTPException(status_code=400, detail="Full name is required.")

    try:
        user = _firebase_or_503().signup(request.email, request.password, request.fullName)
        return {"user": user}
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post("/auth/login")
def login(request: LoginRequest):
    try:
        user = _firebase_or_503().login(request.email, request.password)
        return {"user": user}
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


@router.get("/auth/users")
def list_auth_users():
    users = _firebase_or_503().list_public_users()
    return {"users": users}


@router.post("/auth/user-exists")
def user_exists(request: EmailLookupRequest):
    exists = _firebase_or_503().user_exists(request.email)
    return {"exists": exists}


@router.post("/auth/reset-password")
def reset_password(request: PasswordResetRequest):
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    try:
        _firebase_or_503().reset_password(request.email, request.password)
        return {"status": "updated"}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

class ChangePasswordRequest(BaseModel):
    email: str
    oldPassword: str
    newPassword: str

@router.post("/auth/change-password")
def change_password_route(request: ChangePasswordRequest):
    try:
        _firebase_or_503().change_password(request.email, request.oldPassword, request.newPassword)
        return {"status": "updated"}
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

class ProfileUpdateRequest(BaseModel):
    email: str
    username: Optional[str] = None
    fullName: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    twoFactorEnabled: Optional[bool] = None
    privacyModeEnabled: Optional[bool] = None
    emailNotificationsEnabled: Optional[bool] = None
    appNotificationsEnabled: Optional[bool] = None

@router.post("/auth/update-profile")
def update_profile(request: ProfileUpdateRequest):
    try:
        updated_user = _firebase_or_503().update_user(request.email, request.dict(exclude_unset=True))
        return {"user": updated_user}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

# Get questions by category
@router.get("/questions/{category}")
def get_questions(category: str):
    """
    Retrieves questions for a specific category from the local JSON storage.
    """
    safe_log(f"[GET] /api/questions/{category} requested")
    
    try:
        # Sanitize category name
        category = category.strip().lower()
        file_path = os.path.join(DATA_DIR, f"{category}.json")

        if not os.path.exists(file_path):
            safe_log(f"[NOT FOUND] No questions file at: {file_path}")
            raise HTTPException(
                status_code=404,
                detail=f"No questions found for role: {category}"
            )

        safe_log(f"Reading questions from: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        questions = data if isinstance(data, list) else data.get("questions", [])
        safe_log(f"Successfully retrieved {len(questions)} questions for: {category}")
        return questions

    except json.JSONDecodeError as e:
        safe_log(f"[CORRUPTION] JSON file at {file_path} is corrupted: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Questions data for {category} is corrupted. Please contact support."
        )
    except HTTPException:
        raise
    except Exception as e:
        safe_log(f"[SERVER ERROR] Error fetching questions for {category}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load questions: {str(e)}"
        )


# Fast evaluation endpoint (<2 seconds)
@router.post("/evaluate")
def evaluate_interview_answer(request: EvaluationRequest):
    """
    Fast deterministic evaluation - completes in <2 seconds.
    Returns scores immediately WITHOUT LLM feedback.
    """
    try:
        if not request.question or not request.answer:
            raise HTTPException(
                status_code=400,
                detail="Question and answer are required"
            )
        
        print("="*70)
        print(f"⚡ FAST EVALUATION REQUEST")
        print(f"Question: {request.question[:60]}...")
        print(f"Answer length: {len(request.answer)} chars")
        print(f"Keywords: {request.keywords}")
        print("="*70)
        
        start_time = time.time()
        
        # Get deterministic scores (includes 1 fast LLM call for context validation)
        result = evaluate_answer_legacy(
            question=request.question,
            answer=request.answer,
            keywords=request.keywords or []
        )
        
        elapsed_time = time.time() - start_time
        
        print("="*70)
        print(f"✅ EVALUATION COMPLETE in {elapsed_time:.3f}s")
        print(f"Technical: {result['technical_score']}% (Context: {result.get('llm_context_validation', 'N/A')})")
        print(f"Communication: {result['communication_score']}%")
        print(f"Confidence: {result['confidence_score']}%")
        print(f"Overall: {result['overall_score']}%")
        print(f"Hard Gate: {'FAILED - ' + result.get('gate_reason', '') if result.get('hard_gate_failed') else 'PASSED'}")
        print("="*70)
        
        result['evaluation_time_seconds'] = round(elapsed_time, 3)
        
        # DO NOT generate LLM feedback here - let frontend request it separately
        result['llm_structured_feedback'] = None
        result['llm_feedback_method'] = 'not_generated_yet'
        
        return result
    
    except Exception as e:
        print(f"❌ EVALUATION ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation failed: {str(e)}"
        )





# Generate ideal answer
@router.post("/generate-answer")
def generate_answer(request: AnswerGenerationRequest):
    try:
        if not request.question:
            raise HTTPException(
                status_code=400,
                detail="Question is required"
            )
        
        print("="*70)
        print(f"💡 GENERATING IDEAL ANSWER")
        print(f"Question: {request.question[:60]}...")
        print("="*70)
        
        start_time = time.time()
        
        result = generate_ideal_answer(
            question=request.question,
            keywords=request.keywords or []
        )
        
        elapsed_time = time.time() - start_time
        
        print("="*70)
        print(f"✅ ANSWER GENERATED in {elapsed_time:.3f}s")
        print(f"Word count: {result['word_count']}")
        print("="*70)
        
        result['generation_time_seconds'] = round(elapsed_time, 3)
        
        return result
    
    except Exception as e:
        print(f"❌ GENERATION ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"Answer generation failed: {str(e)}"
        )

# Transcription endpoint (initialize STT service lazily to avoid import-time failures)
@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    try:
        suffix = os.path.splitext(audio.filename)[1] if audio.filename else ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await audio.read())
            tmp_path = tmp.name

        try:
            # Import and initialize STT service here to avoid failing imports
            # when Deepgram is not available or incompatible
            from services.stt import SpeechToTextService
            stt_service = SpeechToTextService()
            transcript = stt_service.transcribe(tmp_path)
            return {"transcript": transcript}
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    except Exception as e:
        print(f"❌ TRANSCRIPTION ERROR: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}"
        )

# OTP storage (In-memory for demo, should use Redis/Cache in prod)
otp_storage = {}

class OTPRequest(BaseModel):
    email: str

class OTPVerifyRequest(BaseModel):
    email: str
    otp: str

@router.post("/send-otp")
def send_otp_handler(request: OTPRequest):
    """
    Sends a real OTP code to the provided email.
    """
    import random
    from services.email_service import EmailService
    
    otp = str(random.randint(1001, 9999))
    email_service = EmailService()
    
    print(f"🔄 [OTP] Processing request for {request.email}...")
    success = email_service.send_otp(request.email, otp)
    
    if success:
        otp_storage[request.email] = otp
        return {"status": "sent", "message": f"Verification code sent to {request.email}"}
    else:
        # Fallback simulation if credentials are missing
        # We store it anyway so the user can 'verify' even without a real email if they check logs
        otp_storage[request.email] = otp
        print(f"⚠️ [SIMULATION] Credentials missing, OTP for {request.email} is: {otp}")
        return {
            "status": "simulated", 
            "message": "Simulated OTP (Backend credentials missing). Check console/logs.",
            "otp_preview": otp # In real life, we wouldn't show this
        }

@router.post("/verify-otp")
def verify_otp_handler(request: OTPVerifyRequest):
    """
    Verifies that the OTP code matches the stored value for the user's email.
    """
    stored_otp = otp_storage.get(request.email)
    
    if not stored_otp:
        raise HTTPException(status_code=400, detail="OTP session expired or not found")
        
    if stored_otp == request.otp:
        # Remove OTP after successful verification
        del otp_storage[request.email]
        return {"status": "verified", "message": "Identity confirmed"}
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code")
