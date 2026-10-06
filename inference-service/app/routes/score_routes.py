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

class BankScoreRequest(BaseModel):
    preset_name: Optional[str] = Field(default="bank_alpha", description="bank_alpha or bank_beta")
    bank_raw_data: Dict[str, Any]
    mapping_config: Optional[Dict[str, str]] = None

@router.post("/bank-score")
def score_bank_payload(payload: BankScoreRequest):
    """
    Bank-Deployable Feature Adapter Endpoint.
    Translates bank raw schema into canonical credit features before scoring.
    """
    from src.data.bank_adapter import BankFeatureAdapter

    try:
        if payload.mapping_config:
            adapter = BankFeatureAdapter(mapping_config=payload.mapping_config)
        else:
            preset = payload.preset_name or "bank_alpha"
            adapter = BankFeatureAdapter.from_preset(preset)

        adapted_features = adapter.adapt_record(payload.bank_raw_data)
        service = get_scoring_service()
        scoring_res = service.score_single(adapted_features)

        return {
            "preset_used": payload.preset_name,
            "bank_raw_input": payload.bank_raw_data,
            "adapted_canonical_features": adapted_features,
            "credit_decision": scoring_res
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to adapt bank payload: {str(e)}")

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
