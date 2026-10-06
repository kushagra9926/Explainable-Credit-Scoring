import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("ml-core"))

from src.data.bank_adapter import BankFeatureAdapter

def test_bank_feature_adapter_presets():
    bank_a_sample = {
        "customer_id": "BANK_A_001",
        "upi_credit_total_avg": 35000.0,
        "upi_debit_total_avg": 20000.0,
        "income_std_ratio": 0.20,
        "credit_debit_ratio": 1.75,
        "active_earning_days_pct": 0.85,
        "utility_on_time_ratio": 0.90,
        "recharge_consistency_idx": 0.88,
        "mean_tx_amt": 200.0,
        "max_single_day_credit": 1500.0,
        "rapid_drain_events": 0,
        "days_with_zero_bal": 0,
        "num_earning_channels": 2,
        "account_age_months": 12,
        "cust_gender": "Female",
        "cust_city_tier": "Tier-2"
    }

    adapter = BankFeatureAdapter.from_preset("bank_alpha")
    adapted = adapter.adapt_record(bank_a_sample)

    assert adapted["applicant_id"] == "BANK_A_001"
    assert adapted["monthly_inflow_avg"] == 35000.0
    assert adapted["monthly_outflow_avg"] == 20000.0
    assert adapted["inflow_volatility"] == 0.20
    assert adapted["utility_punctuality_score"] == 0.90
    assert adapted["gender"] == "Female"
    assert adapted["city_tier"] == "Tier-2"
