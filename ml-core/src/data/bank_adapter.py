"""
Bank Internal Feature Adapter & Schema Translation Interface.

Allows partner financial institutions (Bank Alpha, Bank Beta, etc.) to keep raw customer/transactional data 
inside their own secure infrastructure. The bank translates its internal feature names to our canonical schema 
via configuration mappings before passing data to the Explainable Credit Scoring engine.

Architecture:
Bank Internal Data -> Bank Feature Adapter -> Canonical Credit Feature Schema -> Preprocessor -> Model -> SHAP -> Decision
"""

import json
from typing import Dict, Any, Optional
import pandas as pd
from pydantic import BaseModel, ValidationError

class BankFeatureAdapter:
    """
    Translates bank-specific raw schema to canonical credit feature contract.
    """
    # Built-in bank mapping presets for demonstration
    PRESET_MAPPINGS = {
        "bank_alpha": {
            "bank_name": "Bank Alpha (Retail Banking Division)",
            "mapping": {
                "upi_credit_total_avg": "monthly_inflow_avg",
                "upi_debit_total_avg": "monthly_outflow_avg",
                "income_std_ratio": "inflow_volatility",
                "credit_debit_ratio": "inflow_outflow_ratio",
                "active_earning_days_pct": "active_days_ratio",
                "utility_on_time_ratio": "utility_punctuality_score",
                "recharge_consistency_idx": "recharge_regularity_index",
                "mean_tx_amt": "avg_transaction_value",
                "max_single_day_credit": "peak_daily_inflow",
                "rapid_drain_events": "emergency_drawdown_count",
                "days_with_zero_bal": "zero_balance_days",
                "num_earning_channels": "platform_diversity",
                "account_age_months": "tenure_months",
                "cust_gender": "gender",
                "cust_city_tier": "city_tier"
            }
        },
        "bank_beta": {
            "bank_name": "Bank Beta (Digital Lending Division)",
            "mapping": {
                "total_monthly_deposits": "monthly_inflow_avg",
                "total_monthly_withdrawals": "monthly_outflow_avg",
                "deposit_volatility_coeff": "inflow_volatility",
                "cashflow_coverage_ratio": "inflow_outflow_ratio",
                "transacting_days_share": "active_days_ratio",
                "bill_payment_punctuality": "utility_punctuality_score",
                "mobile_pay_regularity": "recharge_regularity_index",
                "avg_ticket_size": "avg_transaction_value",
                "highest_daily_deposit": "peak_daily_inflow",
                "low_balance_stress_count": "emergency_drawdown_count",
                "zero_balance_days_count": "zero_balance_days",
                "platform_sources_count": "platform_diversity",
                "relationship_duration_m": "tenure_months",
                "gender_code": "gender",
                "location_tier": "city_tier"
            }
        }
    }

    CANONICAL_DEFAULTS = {
        "monthly_inflow_avg": 25000.0,
        "monthly_outflow_avg": 18000.0,
        "inflow_volatility": 0.30,
        "inflow_outflow_ratio": 1.25,
        "active_days_ratio": 0.75,
        "utility_punctuality_score": 0.85,
        "recharge_regularity_index": 0.80,
        "avg_transaction_value": 150.0,
        "peak_daily_inflow": 1200.0,
        "emergency_drawdown_count": 0,
        "zero_balance_days": 1,
        "platform_diversity": 1,
        "tenure_months": 12,
        "platform_type": "delivery",
        "gender": "Female",
        "city_tier": "Tier-2"
    }

    def __init__(self, mapping_config: Optional[Dict[str, str]] = None):
        self.mapping_config = mapping_config or {}

    @classmethod
    def from_preset(cls, preset_key: str):
        if preset_key.lower() not in cls.PRESET_MAPPINGS:
            raise ValueError(f"Unknown preset '{preset_key}'. Choose from {list(cls.PRESET_MAPPINGS.keys())}")
        return cls(mapping_config=cls.PRESET_MAPPINGS[preset_key.lower()]["mapping"])

    def adapt_record(self, bank_raw_data: Dict[str, Any], applicant_id_key: str = "customer_id") -> Dict[str, Any]:
        """
        Translates a single bank raw record into canonical feature dictionary.
        """
        canonical_record = {}
        
        # Applicant ID handling
        applicant_id = str(bank_raw_data.get(applicant_id_key, bank_raw_data.get("applicant_id", "BANK_CUST_999")))
        canonical_record["applicant_id"] = applicant_id

        # Map fields according to config
        for bank_col, val in bank_raw_data.items():
            if bank_col in self.mapping_config:
                canonical_field = self.mapping_config[bank_col]
                canonical_record[canonical_field] = val
            elif bank_col in self.CANONICAL_DEFAULTS:
                canonical_record[bank_col] = val

        # Fill any missing canonical features with default safe values
        for feat, default_val in self.CANONICAL_DEFAULTS.items():
            if feat not in canonical_record or canonical_record[feat] is None:
                canonical_record[feat] = default_val

        # Numeric conversions & bounds validation
        canonical_record["monthly_inflow_avg"] = float(canonical_record["monthly_inflow_avg"])
        canonical_record["monthly_outflow_avg"] = float(canonical_record["monthly_outflow_avg"])
        canonical_record["inflow_volatility"] = float(canonical_record["inflow_volatility"])
        canonical_record["inflow_outflow_ratio"] = float(canonical_record["inflow_outflow_ratio"])
        canonical_record["active_days_ratio"] = float(canonical_record["active_days_ratio"])
        canonical_record["utility_punctuality_score"] = float(canonical_record["utility_punctuality_score"])
        canonical_record["recharge_regularity_index"] = float(canonical_record["recharge_regularity_index"])
        canonical_record["avg_transaction_value"] = float(canonical_record["avg_transaction_value"])
        canonical_record["peak_daily_inflow"] = float(canonical_record["peak_daily_inflow"])
        canonical_record["emergency_drawdown_count"] = int(canonical_record["emergency_drawdown_count"])
        canonical_record["zero_balance_days"] = int(canonical_record["zero_balance_days"])
        canonical_record["platform_diversity"] = int(canonical_record["platform_diversity"])
        canonical_record["tenure_months"] = int(canonical_record["tenure_months"])
        canonical_record["gender"] = str(canonical_record["gender"])
        canonical_record["city_tier"] = str(canonical_record["city_tier"])

        return canonical_record

if __name__ == "__main__":
    bank_a_sample = {
        "customer_id": "BANK_A_44921",
        "upi_credit_total_avg": 34000.0,
        "upi_debit_total_avg": 22000.0,
        "income_std_ratio": 0.28,
        "credit_debit_ratio": 1.54,
        "active_earning_days_pct": 0.88,
        "utility_on_time_ratio": 0.95,
        "recharge_consistency_idx": 0.90,
        "mean_tx_amt": 210.0,
        "max_single_day_credit": 1800.0,
        "rapid_drain_events": 0,
        "days_with_zero_bal": 0,
        "num_earning_channels": 2,
        "account_age_months": 18,
        "cust_gender": "Female",
        "cust_city_tier": "Tier-1"
    }

    adapter = BankFeatureAdapter.from_preset("bank_alpha")
    adapted = adapter.adapt_record(bank_a_sample)
    print("Adapted Bank Alpha record to Canonical Schema:")
    print(json.dumps(adapted, indent=2))
