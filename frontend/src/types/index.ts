export interface ApplicantInput {
  applicant_id: string;
  monthly_inflow_avg: number;
  monthly_outflow_avg: number;
  inflow_volatility: number;
  inflow_outflow_ratio: number;
  active_days_ratio: number;
  utility_punctuality_score: number;
  recharge_regularity_index: number;
  avg_transaction_value: number;
  peak_daily_inflow: number;
  emergency_drawdown_count: number;
  zero_balance_days: number;
  platform_diversity: number;
  tenure_months: number;
  gender: string;
  city_tier: string;
}

export interface SHAPInfo {
  base_value?: number;
  shap_attributions: Record<string, number>;
  top_risk_drivers: string[];
  top_protective_drivers: string[];
}

export interface ScoringResponse {
  applicant_id: string;
  credit_score: number;
  default_probability: number;
  decision: "APPROVED" | "MANUAL_REVIEW" | "REJECTED";
  risk_tier: "LOW_RISK" | "MEDIUM_RISK" | "MEDIUM_HIGH_RISK" | "HIGH_RISK";
  optimal_threshold_used?: number;
  shap_explanation: SHAPInfo;
  timestamp?: string;
}

export interface PersonaPreset {
  id: string;
  name: string;
  role: string;
  avatar: string;
  description: string;
  data: ApplicantInput;
}
