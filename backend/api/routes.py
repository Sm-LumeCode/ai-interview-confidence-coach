from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from services.llm_evaluator import evaluate_answer

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

# Request model for evaluation
class EvaluationRequest(BaseModel):
    question: str
    answer: str
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

# Evaluate answer with LLM
@router.post("/evaluate")
def evaluate_interview_answer(request: EvaluationRequest):
    try:
        if not request.question or not request.answer:
            raise HTTPException(
                status_code=400,
                detail="Question and answer are required"
            )
        
        # Call LLM evaluator with keywords
        result = evaluate_answer(
            question=request.question,
            answer=request.answer,
            keywords=request.keywords
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation failed: {str(e)}"
        )