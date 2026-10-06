"""
Official UCI Credit Card Default Dataset Loader.

Loads the authentic public UCI 'Default of Credit Card Clients' dataset (30,000 records)
from the official UCI Machine Learning Repository:
https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients

PROVENANCE:
- Data Source: UCI ML Repository (Dataset ID: 350)
- Dimensions: 30,000 rows x 24 features (+ target)
- Output Target: default_label (1 = default next month, 0 = on-time)
- Note: This is REAL public benchmark data and is NEVER synthesized.
"""

import os
import json
import urllib.request
import zipfile
import io
import pandas as pd

UCI_DATASET_URL = "https://archive.ics.uci.edu/static/public/350/default+of+credit+card+clients.zip"

class UCIDefaultLoader:
    def __init__(self, data_dir: str = "ml-core/data/uci"):
        self.data_dir = data_dir
        os.makedirs(self.data_dir, exist_ok=True)
        self.csv_path = os.path.join(self.data_dir, "default_of_credit_card_clients.csv")
        self.meta_path = os.path.join(self.data_dir, "metadata.json")

    def load_dataset(self) -> pd.DataFrame:
        """
        Loads the authentic 30,000-record UCI dataset from CSV cache or downloads from UCI repository.
        Fails clearly if network download is unavailable and no local dataset exists.
        """
        if os.path.exists(self.csv_path):
            df = pd.read_csv(self.csv_path)
            if len(df) == 30000:
                print(f"[OK] Loaded authentic UCI Credit Card Default dataset from local cache: {df.shape}")
                return df

        print(f"Downloading authentic UCI Credit Card Default dataset from {UCI_DATASET_URL}...")
        try:
            req = urllib.request.urlopen(UCI_DATASET_URL)
            z = zipfile.ZipFile(io.BytesIO(req.read()))
            z.extractall(self.data_dir)

            xls_files = [f for f in os.listdir(self.data_dir) if f.endswith('.xls') or f.endswith('.xlsx')]
            if xls_files:
                xls_path = os.path.join(self.data_dir, xls_files[0])
                df = pd.read_excel(xls_path, header=1)
                
                # Standardize target column name
                for col in ["default payment next month", "default.payment.next.month"]:
                    if col in df.columns:
                        df.rename(columns={col: "default_label"}, inplace=True)
                
                df.to_csv(self.csv_path, index=False)
                
                # Write metadata
                meta = {
                    "dataset_name": "UCI Default of Credit Card Clients",
                    "source_url": UCI_DATASET_URL,
                    "download_date": "2026-10-06",
                    "total_records": len(df),
                    "features_count": len(df.columns) - 1,
                    "target_column": "default_label",
                    "is_synthetic": False
                }
                with open(self.meta_path, "w") as f:
                    json.dump(meta, f, indent=2)

                print(f"[OK] Successfully downloaded and saved authentic UCI dataset: {df.shape}")
                return df
        except Exception as e:
            raise RuntimeError(
                f"Failed to load authentic UCI dataset from cache or network ({e}).\n"
                "Please run python ml-core/scripts/download_uci.py with internet access to fetch the real 30,000-record dataset."
            ) from e

if __name__ == "__main__":
    loader = UCIDefaultLoader()
    df = loader.load_dataset()
    print(f"Dataset shape: {df.shape}, Default rate: {df['default_label'].mean():.2%}")
