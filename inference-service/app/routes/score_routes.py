"""
API Routes for Credit Scoring, Transaction Simulation, Model Cards, and AA Ingestion.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import pandas as pd
import io
import json

from src.data.upi_simulator import UPIGigWorkerSimulator
from src.data.schemas import AccountAggregatorPayload, CreditFeatureVector, ScoringResult

router = APIRouter(prefix="/api/v1", tags=["scoring"])

# Dynamic instance of ScoringService
def get_scoring_service():
    from app.services.scoring_service import ScoringService
    return ScoringService()

@router.post("/score", response_model=ScoringResult)
def score_applicant(payload: CreditFeatureVector):
    service = get_scoring_service()
    res = service.score_single(payload.model_dump())
    
    return ScoringResult(
        applicant_id=res["applicant_id"],
        credit_score=res["credit_score"],
        default_probability=res["default_probability"],
        decision=res["decision"],
        risk_tier=res["risk_tier"],
        shap_explanations=res["shap_explanation"]["shap_attributions"],
        top_positive_factors=res["shap_explanation"]["top_protective_drivers"],
        top_negative_factors=res["shap_explanation"]["top_risk_drivers"]
    )

@router.post("/batch-score")
def score_batch(items: List[CreditFeatureVector]):
    service = get_scoring_service()
    results = [service.score_single(item.model_dump()) for item in items]
    return {"count": len(results), "results": results}

@router.post("/upload-csv")
async def score_csv_file(file: UploadFile = File(...)):
    service = get_scoring_service()
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    
    items = df.to_dict(orient="records")
    results = service.score_batch(items)
    return {"filename": file.filename, "scored_records": len(results), "results": results}

@router.post("/simulate-upi")
def simulate_upi_applicant(platform_type: str = "delivery", gender: str = "Female", city_tier: str = "Tier-2"):
    sim = UPIGigWorkerSimulator(seed=None)
    data = sim.generate_applicant_transactions(
        applicant_id="DEMO_UPI_GIG_88",
        platform_type=platform_type,
        num_months=6,
        protected_gender=gender,
        protected_city_tier=city_tier
    )
    service = get_scoring_service()
    score_res = service.score_single(data["features"])
    
    return {
        "simulation_info": {
            "applicant_id": data["applicant_id"],
            "platform_type": platform_type,
            "gender": gender,
            "city_tier": city_tier,
            "total_transactions_simulated": len(data["transactions"])
        },
        "extracted_features": data["features"],
        "credit_decision": score_res
    }

@router.get("/model-info")
def get_model_card():
    card_path = "ml-core/artifacts/model_card.json"
    try:
        with open(card_path, "r") as f:
            return json.load(f)
    except Exception:
        return {
            "model_name": "Bank-Deployable Monotonic Gradient Boosting Scorer",
            "model_version": "3.0.0",
            "status": "Ready",
            "notice": "Model card will be fully populated upon script execution."
        }
