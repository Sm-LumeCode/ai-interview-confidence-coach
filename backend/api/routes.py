from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import time
from services.evaluator import evaluate_answer_legacy
from services.answer_generator import generate_ideal_answer
from services.llm_evaluator import generate_structured_feedback

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

# Request models
class EvaluationRequest(BaseModel):
    question: str
    answer: str
    keywords: Optional[List[str]] = None

class FeedbackRequest(BaseModel):
    question: str
    answer: str
    keywords: Optional[List[str]] = None
    scores: Optional[dict] = None

class AnswerGenerationRequest(BaseModel):
    question: str
    keywords: Optional[List[str]] = None

# Get questions by category
@router.get("/questions/{category}")
def get_questions(category: str):
    file_path = os.path.join(DATA_DIR, f"{category}.json")

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"No questions found for role: {category}"
        )

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return data if isinstance(data, list) else data.get("questions", [])


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


# Separate AI feedback endpoint (called after scores are shown)
@router.post("/generate-feedback")
def generate_ai_feedback(request: FeedbackRequest):
    """
    Generate detailed AI feedback - called AFTER evaluation.
    Can take 5-10 seconds. Non-blocking for UI.
    """
    try:
        if not request.question or not request.answer:
            raise HTTPException(
                status_code=400,
                detail="Question and answer are required"
            )
        
        print("="*70)
        print(f"🤖 AI FEEDBACK GENERATION REQUEST")
        print(f"Question: {request.question[:60]}...")
        print(f"Answer length: {len(request.answer)} chars")
        print("="*70)
        
        start_time = time.time()
        
        # Generate LLM structured feedback
        llm_feedback = generate_structured_feedback(
            question=request.question,
            answer=request.answer,
            keywords=request.keywords or [],
            scores=request.scores or {}
        )
        
        elapsed_time = time.time() - start_time
        
        print("="*70)
        print(f"{'✅' if llm_feedback['success'] else '⚠️'} AI FEEDBACK COMPLETE in {elapsed_time:.3f}s")
        print(f"Method: {llm_feedback['method']}")
        print(f"Feedback sections: {len(llm_feedback['feedback'])}")
        print("="*70)
        
        return {
            'success': llm_feedback['success'],
            'feedback': llm_feedback['feedback'],
            'method': llm_feedback['method'],
            'generation_time_seconds': round(elapsed_time, 3)
        }
    
    except Exception as e:
        print(f"❌ FEEDBACK GENERATION ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"Feedback generation failed: {str(e)}"
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