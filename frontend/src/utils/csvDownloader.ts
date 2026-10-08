// Helper to generate downloadable sample CSV persona files containing ONLY transaction & credit history records

export interface PersonaCSV {
  filename: string;
  title: string;
  riskCategory: string;
  description: string;
  csvContent: string;
}

export const SAMPLE_PERSONA_FILES: PersonaCSV[] = [
  {
    filename: "borrower_5_prime_vendor_rajesh.csv",
    title: "High Loan Vendor A: Rajesh Store (₹3.8L Inflow)",
    riskCategory: "Prime Vendor / High Loan Capacity",
    description: "Kirana & General Merchant with ₹380,000 monthly turnover, ₹120,000 net margin, 98% punctuality. Supports higher loans up to ₹7,00,000+!",
    csvContent: `applicant_id,platform_type,monthly_inflow_avg,monthly_outflow_avg,inflow_volatility,inflow_outflow_ratio,active_days_ratio,utility_punctuality_score,recharge_regularity_index,avg_transaction_value,peak_daily_inflow,emergency_drawdown_count,zero_balance_days,platform_diversity,tenure_months,gender,city_tier
VENDOR_005_RAJESH_STORE,vendor,380000.0,260000.0,0.12,1.46,0.92,0.98,0.96,450.0,22000.0,0,0,2,36,Male,Tier-1`
  },
  {
    filename: "borrower_6_supermarket_anita.csv",
    title: "High Loan Vendor B: Anita Textiles (₹2.2L Inflow)",
    riskCategory: "Prime Merchant / ₹2.2L Turnover",
    description: "Textile & Supermarket Owner with ₹220,000 monthly turnover, ₹70,000 net margin, 95% punctuality. Supports higher loans up to ₹4,00,000+!",
    csvContent: `applicant_id,platform_type,monthly_inflow_avg,monthly_outflow_avg,inflow_volatility,inflow_outflow_ratio,active_days_ratio,utility_punctuality_score,recharge_regularity_index,avg_transaction_value,peak_daily_inflow,emergency_drawdown_count,zero_balance_days,platform_diversity,tenure_months,gender,city_tier
VENDOR_006_ANITA_TEXTILES,vendor,220000.0,150000.0,0.15,1.47,0.88,0.95,0.94,850.0,14000.0,0,1,2,24,Female,Tier-1`
  },
  {
    filename: "borrower_7_hardware_suresh.csv",
    title: "High Loan Vendor C: Suresh Hardware (₹1.25L Inflow)",
    riskCategory: "Good Merchant / ₹1.25L Turnover",
    description: "Hardware & Electronics Retailer with ₹125,000 monthly turnover, ₹40,000 net margin, 94% punctuality. Supports loans up to ₹2,50,000+!",
    csvContent: `applicant_id,platform_type,monthly_inflow_avg,monthly_outflow_avg,inflow_volatility,inflow_outflow_ratio,active_days_ratio,utility_punctuality_score,recharge_regularity_index,avg_transaction_value,peak_daily_inflow,emergency_drawdown_count,zero_balance_days,platform_diversity,tenure_months,gender,city_tier
VENDOR_007_SURESH_HARDWARE,vendor,125000.0,85000.0,0.17,1.47,0.85,0.94,0.91,620.0,8500.0,0,1,1,18,Male,Tier-2`
  },
  {
    filename: "borrower_8_restaurant_sunil.csv",
    title: "Vendor D: Sunil Restaurant (₹75k Inflow)",
    riskCategory: "Growth Merchant / ₹75k Turnover",
    description: "Multi-Cuisine Restaurant with ₹75,000 monthly turnover, ₹27,000 net margin, 92% punctuality. Supports loans up to ₹1,50,000+!",
    csvContent: `applicant_id,platform_type,monthly_inflow_avg,monthly_outflow_avg,inflow_volatility,inflow_outflow_ratio,active_days_ratio,utility_punctuality_score,recharge_regularity_index,avg_transaction_value,peak_daily_inflow,emergency_drawdown_count,zero_balance_days,platform_diversity,tenure_months,gender,city_tier
VENDOR_008_SUNIL_RESTAURANT,vendor,75000.0,48000.0,0.20,1.56,0.82,0.92,0.88,240.0,4200.0,0,2,1,12,Male,Tier-2`
  },
  {
    filename: "borrower_9_apparel_kavita.csv",
    title: "Vendor E: Kavita Boutique (₹42k Inflow)",
    riskCategory: "Small Merchant / ₹42k Turnover",
    description: "Fashion & Apparel Boutique with ₹42,000 monthly turnover, ₹16,000 net margin, 90% punctuality. Supports loans up to ₹80,000+!",
    csvContent: `applicant_id,platform_type,monthly_inflow_avg,monthly_outflow_avg,inflow_volatility,inflow_outflow_ratio,active_days_ratio,utility_punctuality_score,recharge_regularity_index,avg_transaction_value,peak_daily_inflow,emergency_drawdown_count,zero_balance_days,platform_diversity,tenure_months,gender,city_tier
VENDOR_009_KAVITA_BOUTIQUE,vendor,42000.0,26000.0,0.22,1.61,0.80,0.90,0.85,320.0,2800.0,0,1,1,12,Female,Tier-2`
  },
  {
    filename: "borrower_1_low_risk_aarav.csv",
    title: "Gig Worker A: Low Risk (Aarav - Delivery)",
    riskCategory: "Low Risk / High Punctuality",
    description: "Zomato delivery partner transaction & credit history record (96% bill punctuality, 0 emergency drawdowns).",
    csvContent: `applicant_id,platform_type,monthly_inflow_avg,monthly_outflow_avg,inflow_volatility,inflow_outflow_ratio,active_days_ratio,utility_punctuality_score,recharge_regularity_index,avg_transaction_value,peak_daily_inflow,emergency_drawdown_count,zero_balance_days,platform_diversity,tenure_months,gender,city_tier
BORROWER_001_LOW_RISK,delivery,28500.0,18200.0,0.16,1.56,0.90,0.96,0.94,92.0,1250.0,0,1,1,18,Male,Tier-2`
  },
  {
    filename: "borrower_3_high_risk_vikram.csv",
    title: "High Risk Freelancer: Vikram",
    riskCategory: "High Risk / Irregular Inflows",
    description: "Freelance designer transaction & credit history record (high volatility, 3 emergency drawdowns).",
    csvContent: `applicant_id,platform_type,monthly_inflow_avg,monthly_outflow_avg,inflow_volatility,inflow_outflow_ratio,active_days_ratio,utility_punctuality_score,recharge_regularity_index,avg_transaction_value,peak_daily_inflow,emergency_drawdown_count,zero_balance_days,platform_diversity,tenure_months,gender,city_tier
BORROWER_003_HIGH_RISK,freelance,52000.0,44000.0,0.58,1.18,0.48,0.62,0.58,3500.0,14000.0,3,9,3,36,Male,Tier-1`
  }
];

export function downloadPersonaCSV(persona: PersonaCSV) {
  const blob = new Blob([persona.csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', persona.filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
