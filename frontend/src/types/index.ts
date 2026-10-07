export interface ApplicantInput {
  applicant_id: string;
  monthly_inflow_avg: number;
  monthly_outflow_avg: number;
  inflow_volatility: number;
  inflow_outflow_ratio?: number;
  active_days_ratio: number;
  utility_punctuality_score: number;
  recharge_regularity_index: number;
  avg_transaction_value?: number;
  peak_daily_inflow?: number;
  emergency_drawdown_count: number;
  zero_balance_days: number;
  platform_diversity?: number;
  tenure_months: number;
  gender: string;
  city_tier: string;
  
  // Merchant & Loan Questionnaire Inputs
  requested_amount?: number;
  requested_tenure_months?: number;
  loan_purpose?: string;
  existing_monthly_emi?: number;
}

export interface SHAPInfo {
  base_value?: number;
  shap_attributions: Record<string, number>;
  top_risk_drivers: string[];
  top_protective_drivers: string[];
}

export interface UnderwritingSummary {
  requested_amount: number;
  requested_tenure_months: number;
  loan_purpose: string;
  estimated_monthly_emi: number;
  max_recommended_loan_amount: number;
  approved_amount: number;
}

export interface ScoringResponse {
  applicant_id: string;
  credit_score: number;
  creditworthiness_score?: number;
  default_probability: number;
  decision: string;
  risk_tier: string;
  risk_label?: string;
  optimal_threshold_used?: number;
  
  // 3-Layer Explanation System
  shap_explanation?: SHAPInfo;
  explanation_layer_1_shap?: SHAPInfo;
  explanation_layer_2_narrative?: string;
  explanation_layer_3_actionable_tips?: string[];
  
  underwriting_summary?: UnderwritingSummary;
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
