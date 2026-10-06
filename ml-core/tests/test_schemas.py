"""
Unit tests for Account Aggregator Pydantic Data Contracts & Schemas.
"""

import sys, os
sys.path.insert(0, os.path.abspath('.'))
sys.path.insert(0, os.path.abspath('ml-core'))

from pydantic import ValidationError
from src.data.schemas import RawTransaction, AccountAggregatorPayload, CreditFeatureVector, ScoringResult

def test_raw_transaction_validation():
    tx = RawTransaction(
        transaction_id="TX_1001",
        timestamp="2025-06-01T10:00:00Z",
        amount=500.0,
        type="CREDIT",
        category="PLATFORM_PAYOUT",
        counterparty="UPI_ZOMATO"
    )
    assert tx.amount == 500.0
    assert tx.type == "CREDIT"

def test_account_aggregator_payload():
    payload_data = {
        "account_id": "ACC_998811",
        "account_type": "SAVINGS",
        "consent_id": "AA_CONSENT_5544",
        "period_months": 6,
        "transactions": [
            {
                "transaction_id": "TX_01",
                "timestamp": "2025-05-10T12:00:00Z",
                "amount": 1200.0,
                "type": "CREDIT",
                "category": "PLATFORM_PAYOUT"
            }
        ]
    }
    payload = AccountAggregatorPayload(**payload_data)
    assert payload.account_id == "ACC_998811"
    assert len(payload.transactions) == 1

def test_credit_feature_vector():
    feature_data = {
        "applicant_id": "UPI_GIG_001",
        "monthly_inflow_avg": 25000.0,
        "monthly_outflow_avg": 18000.0,
        "inflow_volatility": 0.22,
        "inflow_outflow_ratio": 1.38,
        "active_days_ratio": 0.85,
        "utility_punctuality_score": 0.90,
        "recharge_regularity_index": 0.88,
        "avg_transaction_value": 120.0,
        "peak_daily_inflow": 1500.0,
        "emergency_drawdown_count": 0,
        "zero_balance_days": 1,
        "platform_diversity": 2,
        "tenure_months": 12,
        "gender": "Female",
        "city_tier": "Tier-2"
    }
    vec = CreditFeatureVector(**feature_data)
    assert vec.applicant_id == "UPI_GIG_001"
    assert vec.inflow_volatility == 0.22

def test_invalid_feature_vector_raises_error():
    try:
        CreditFeatureVector(applicant_id="INVALID")
        assert False, "Should have raised ValidationError"
    except ValidationError:
        pass  # Expected

if __name__ == "__main__":
    test_raw_transaction_validation()
    test_account_aggregator_payload()
    test_credit_feature_vector()
    test_invalid_feature_vector_raises_error()
    print("[OK] All Pydantic schema validation unit tests passed successfully!")
