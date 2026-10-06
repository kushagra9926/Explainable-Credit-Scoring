import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("ml-core"))
sys.path.insert(0, os.path.abspath("inference-service"))

from app.services.scoring_service import ScoringService

def test_scoring_service_single():
    service = ScoringService()
    features = {
        "applicant_id": "TEST_APP_555",
        "monthly_inflow_avg": 25000.0,
        "monthly_outflow_avg": 18000.0,
        "inflow_volatility": 0.28,
        "inflow_outflow_ratio": 1.38,
        "active_days_ratio": 0.80,
        "utility_punctuality_score": 0.90,
        "recharge_regularity_index": 0.85,
        "avg_transaction_value": 150.0,
        "peak_daily_inflow": 1200.0,
        "emergency_drawdown_count": 0,
        "zero_balance_days": 0,
        "platform_diversity": 2,
        "tenure_months": 12,
        "gender": "Female",
        "city_tier": "Tier-2"
    }

    res = service.score_single(features)
    assert res["applicant_id"] == "TEST_APP_555"
    assert "credit_score" in res
    assert "creditworthiness_score" in res
    assert 0 <= res["creditworthiness_score"] <= 100
    assert 300 <= res["credit_score"] <= 900
    assert 0.0 <= res["default_probability"] <= 1.0
