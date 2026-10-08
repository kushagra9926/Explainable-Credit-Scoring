"""
Script to generate a 100,000 record synthetic UPI credit dataset ranging from 3 to 60 months tenure.
Also generates vendor demo borrower transaction & credit history CSV files for higher loan approvals (₹35k to ₹400k monthly inflows).
"""

import sys
import os
import json
import pandas as pd

# Ensure pathing for ml-core modules
sys.path.insert(0, os.path.abspath('.'))
sys.path.insert(0, os.path.abspath('ml-core'))

from src.data.upi_simulator import UPIGigWorkerSimulator

def generate_full_100k_dataset():
    print("Generating 100,000 synthetic UPI records (Tenure: 3-60 months)...")
    sim = UPIGigWorkerSimulator(seed=42)
    
    # Generate 100,000 records
    df = sim.generate_dataset(num_samples=100000, min_months=3, max_months=60)
    
    output_dir = os.path.join("ml-core", "data", "synthetic")
    os.makedirs(output_dir, exist_ok=True)
    
    csv_path = os.path.join(output_dir, "synthetic_upi_100k_3to60m.csv")
    df.to_csv(csv_path, index=False)
    print(f"Saved 100,000 record dataset to {csv_path} (File size: {os.path.getsize(csv_path) / (1024*1024):.2f} MB)")
    
    # Save metadata
    meta_path = os.path.join(output_dir, "metadata_100k.json")
    metadata = {
        "dataset_name": "Synthetic UPI Gig-Worker & Micro-Merchant 100k Dataset",
        "num_samples": len(df),
        "tenure_range_months": "3 to 60 months",
        "default_rate": float(df["default_label"].mean()),
        "features_count": len(df.columns),
        "columns": list(df.columns),
        "disclaimer": "SYNTHETIC DATA GENERATED FOR EXPLAINABLE CREDIT SCORING RESEARCH"
    }
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to {meta_path}")

def generate_sample_borrowers():
    print("Generating Vendor demo borrower history files (₹35,000 to ₹400,000 monthly inflows)...")
    samples = [
        {
            "filename": "borrower_5_prime_vendor_rajesh.csv",
            "data": {
                "applicant_id": "VENDOR_005_RAJESH_STORE",
                "platform_type": "vendor",
                "monthly_inflow_avg": 380000.0,
                "monthly_outflow_avg": 260000.0,
                "inflow_volatility": 0.12,
                "inflow_outflow_ratio": 1.46,
                "active_days_ratio": 0.92,
                "utility_punctuality_score": 0.98,
                "recharge_regularity_index": 0.96,
                "avg_transaction_value": 450.0,
                "peak_daily_inflow": 22000.0,
                "emergency_drawdown_count": 0,
                "zero_balance_days": 0,
                "platform_diversity": 2,
                "tenure_months": 36,
                "gender": "Male",
                "city_tier": "Tier-1"
            }
        },
        {
            "filename": "borrower_6_supermarket_anita.csv",
            "data": {
                "applicant_id": "VENDOR_006_ANITA_TEXTILES",
                "platform_type": "vendor",
                "monthly_inflow_avg": 220000.0,
                "monthly_outflow_avg": 150000.0,
                "inflow_volatility": 0.15,
                "inflow_outflow_ratio": 1.47,
                "active_days_ratio": 0.88,
                "utility_punctuality_score": 0.95,
                "recharge_regularity_index": 0.94,
                "avg_transaction_value": 850.0,
                "peak_daily_inflow": 14000.0,
                "emergency_drawdown_count": 0,
                "zero_balance_days": 1,
                "platform_diversity": 2,
                "tenure_months": 24,
                "gender": "Female",
                "city_tier": "Tier-1"
            }
        },
        {
            "filename": "borrower_7_hardware_suresh.csv",
            "data": {
                "applicant_id": "VENDOR_007_SURESH_HARDWARE",
                "platform_type": "vendor",
                "monthly_inflow_avg": 125000.0,
                "monthly_outflow_avg": 85000.0,
                "inflow_volatility": 0.17,
                "inflow_outflow_ratio": 1.47,
                "active_days_ratio": 0.85,
                "utility_punctuality_score": 0.94,
                "recharge_regularity_index": 0.91,
                "avg_transaction_value": 620.0,
                "peak_daily_inflow": 8500.0,
                "emergency_drawdown_count": 0,
                "zero_balance_days": 1,
                "platform_diversity": 1,
                "tenure_months": 18,
                "gender": "Male",
                "city_tier": "Tier-2"
            }
        },
        {
            "filename": "borrower_8_restaurant_sunil.csv",
            "data": {
                "applicant_id": "VENDOR_008_SUNIL_RESTAURANT",
                "platform_type": "vendor",
                "monthly_inflow_avg": 75000.0,
                "monthly_outflow_avg": 48000.0,
                "inflow_volatility": 0.20,
                "inflow_outflow_ratio": 1.56,
                "active_days_ratio": 0.82,
                "utility_punctuality_score": 0.92,
                "recharge_regularity_index": 0.88,
                "avg_transaction_value": 240.0,
                "peak_daily_inflow": 4200.0,
                "emergency_drawdown_count": 0,
                "zero_balance_days": 2,
                "platform_diversity": 1,
                "tenure_months": 12,
                "gender": "Male",
                "city_tier": "Tier-2"
            }
        },
        {
            "filename": "borrower_9_apparel_kavita.csv",
            "data": {
                "applicant_id": "VENDOR_009_KAVITA_BOUTIQUE",
                "platform_type": "vendor",
                "monthly_inflow_avg": 42000.0,
                "monthly_outflow_avg": 26000.0,
                "inflow_volatility": 0.22,
                "inflow_outflow_ratio": 1.61,
                "active_days_ratio": 0.80,
                "utility_punctuality_score": 0.90,
                "recharge_regularity_index": 0.85,
                "avg_transaction_value": 320.0,
                "peak_daily_inflow": 2800.0,
                "emergency_drawdown_count": 0,
                "zero_balance_days": 1,
                "platform_diversity": 1,
                "tenure_months": 12,
                "gender": "Female",
                "city_tier": "Tier-2"
            }
        }
    ]

    target_dirs = [
        os.path.join("ml-core", "data", "samples"),
        os.path.join("frontend", "public", "samples")
    ]
    for d in target_dirs:
        os.makedirs(d, exist_ok=True)
        for s in samples:
            df = pd.DataFrame([s["data"]])
            file_path = os.path.join(d, s["filename"])
            df.to_csv(file_path, index=False)
            print(f"Saved sample test file: {file_path}")

if __name__ == "__main__":
    generate_full_100k_dataset()
    generate_sample_borrowers()
