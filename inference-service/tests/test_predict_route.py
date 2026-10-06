import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("ml-core"))
sys.path.insert(0, os.path.abspath("inference-service"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_score_applicant_route():
    payload = {
        "applicant_id": "TEST_GIG_101",
        "monthly_inflow_avg": 28000.0,
        "monthly_outflow_avg": 19000.0,
        "inflow_volatility": 0.25,
        "inflow_outflow_ratio": 1.47,
        "active_days_ratio": 0.85,
        "utility_punctuality_score": 0.90,
        "recharge_regularity_index": 0.88,
        "avg_transaction_value": 160.0,
        "peak_daily_inflow": 1300.0,
        "emergency_drawdown_count": 0,
        "zero_balance_days": 0,
        "platform_diversity": 2,
        "tenure_months": 12,
        "gender": "Female",
        "city_tier": "Tier-2"
    }
    response = client.post("/api/v1/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["applicant_id"] == "TEST_GIG_101"
    assert "credit_score" in data
    assert "default_probability" in data
    assert data["decision"] in ["APPROVED", "MANUAL_REVIEW", "REJECTED"]

def test_bank_score_adapter_route():
    payload = {
        "preset_name": "bank_alpha",
        "bank_raw_data": {
            "customer_id": "BANK_ALPHA_TEST_1",
            "upi_credit_total_avg": 31000.0,
            "upi_debit_total_avg": 20000.0,
            "income_std_ratio": 0.22,
            "credit_debit_ratio": 1.55,
            "active_earning_days_pct": 0.82,
            "utility_on_time_ratio": 0.94,
            "recharge_consistency_idx": 0.90,
            "mean_tx_amt": 175.0,
            "max_single_day_credit": 1400.0,
            "rapid_drain_events": 0,
            "days_with_zero_bal": 0,
            "num_earning_channels": 2,
            "account_age_months": 14,
            "cust_gender": "Female",
            "cust_city_tier": "Tier-1"
        }
    }
    response = client.post("/api/v1/bank-score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "adapted_canonical_features" in data
    assert data["credit_decision"]["applicant_id"] == "BANK_ALPHA_TEST_1"
