"""
Unified Data Loader Interface.
Serves synthetic UPI gig-worker dataset, UCI credit card default dataset, and German Credit dataset.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from typing import Tuple, Dict, Any
from src.data.upi_simulator import UPIGigWorkerSimulator
from src.data.uci_loader import UCIDefaultLoader

def load_dataset(dataset_name: str = "synthetic_upi", num_samples: int = 2500, seed: int = 42) -> Tuple[pd.DataFrame, pd.Series, Dict[str, Any]]:
    """
    Unified loader function returning feature DataFrame X, target Series y, and metadata.
    """
    dataset_name = dataset_name.lower()

    if dataset_name == "synthetic_upi":
        sim = UPIGigWorkerSimulator(seed=seed)
        df = sim.generate_dataset(num_samples=num_samples)
        
        # Drop ID and target from X
        drop_cols = ["applicant_id", "default_label", "is_synthetic"]
        feature_cols = [c for c in df.columns if c not in drop_cols]
        
        # Keep protected attributes in X for fairness auditing or encode them
        X = df[feature_cols].copy()
        y = df["default_label"].copy()
        
        metadata = {
            "dataset_name": "Synthetic UPI Gig-Worker Transactions",
            "is_synthetic": True,
            "num_samples": len(df),
            "feature_names": list(X.columns),
            "target_name": "default_label",
            "protected_attributes": ["gender", "city_tier"]
        }
        return X, y, metadata

    elif dataset_name == "uci_credit":
        loader = UCIDefaultLoader()
        df = loader.load_or_generate(num_samples=num_samples, seed=seed)
        
        drop_cols = ["ID", "default_label"]
        feature_cols = [c for c in df.columns if c not in drop_cols]
        
        X = df[feature_cols].copy()
        y = df["default_label"].copy()
        
        metadata = {
            "dataset_name": "UCI Default of Credit Card Clients",
            "is_synthetic": False,
            "num_samples": len(df),
            "feature_names": list(X.columns),
            "target_name": "default_label",
            "protected_attributes": ["SEX", "MARRIAGE"]
        }
        return X, y, metadata

    else:
        raise ValueError(f"Unknown dataset_name '{dataset_name}'. Choose 'synthetic_upi' or 'uci_credit'.")

if __name__ == "__main__":
    X, y, meta = load_dataset("synthetic_upi", num_samples=500)
    print(f"Loaded dataset: {meta['dataset_name']} with X shape: {X.shape}, y default rate: {y.mean():.2%}")
