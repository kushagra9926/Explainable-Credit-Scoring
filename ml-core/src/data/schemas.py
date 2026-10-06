"""
Account Aggregator (AA) Data Contract & Schema Definitions.
Defines standard JSON schemas for transaction ingestion and feature contracts.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class RawTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    transaction_id: str
    timestamp: str
    amount: float
    type: str = Field(..., description="CREDIT or DEBIT")
    category: str = Field(..., description="INCOME, UTILITY, RECHARGE, RENT, PERSONAL, PLATFORM_PAYOUT")
    counterparty: Optional[str] = None

class AccountAggregatorPayload(BaseModel):
    """
    Standard India Account Aggregator (AA) Consent-based Statement Ingestion Payload.
    """
    account_id: str
    account_type: str = Field(default="SAVINGS")
    consent_id: str
    period_months: int = Field(default=6, ge=1, le=24)
    transactions: List[RawTransaction]
    customer_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class CreditFeatureVector(BaseModel):
    """
    Derived behavioral & financial features used for credit scoring.
    """
    applicant_id: str
    monthly_inflow_avg: float
    monthly_outflow_avg: float
    inflow_volatility: float = Field(..., description="Coeff of variation of monthly income")
    inflow_outflow_ratio: float
    active_days_ratio: float = Field(..., description="Fraction of days with positive earnings")
    utility_punctuality_score: float = Field(..., description="Ratio of on-time utility/rent payments [0, 1]")
    recharge_regularity_index: float = Field(..., description="Regularity index of mobile/data recharges [0, 1]")
    avg_transaction_value: float
    peak_daily_inflow: float
    emergency_drawdown_count: int = Field(..., description="Frequency of rapid cash drains post payout")
    zero_balance_days: int
    platform_diversity: int = Field(..., description="Number of gig platforms generating income")
    tenure_months: int
    
    # Protected Attributes for Fairness Audit
    gender: str = Field(default="Female", description="Protected attribute: Male / Female")
    city_tier: str = Field(default="Tier-2", description="Protected attribute: Tier-1 / Tier-2 / Tier-3")

class ScoringResult(BaseModel):
    applicant_id: str
    credit_score: int = Field(..., ge=300, le=900)
    default_probability: float = Field(..., ge=0.0, le=1.0)
    decision: str = Field(..., description="APPROVED, MANUAL_REVIEW, REJECTED")
    risk_tier: str = Field(..., description="LOW_RISK, MEDIUM_RISK, HIGH_RISK")
    shap_explanations: Dict[str, float]
    top_positive_factors: List[str]
    top_negative_factors: List[str]
