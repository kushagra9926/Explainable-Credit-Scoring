"""
Generate Large-Scale Synthetic UPI Dataset (100,000 Applicants).

Varies account tenure (3 months to 60 months / 5 years), transaction frequency multipliers,
platform types, and latent borrower traits.
"""

import sys
import os
import time

sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("ml-core"))

from src.data.upi_simulator import UPIGigWorkerSimulator

def main(num_samples: int = 100000):
    print("=" * 80)
    print(f" GENERATING LARGE SYNTHETIC UPI DATASET (N = {num_samples:,})")
    print("=" * 80)

    save_dir = "ml-core/data/synthetic"
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, "synthetic_upi_gig_workers.csv")

    start_time = time.time()
    sim = UPIGigWorkerSimulator(seed=42)

    print(f"[*] Simulating daily transaction streams and deriving canonical features...")
    df = sim.generate_dataset(num_samples=num_samples, min_months=3, max_months=60)

    print(f"[*] Saving dataset to {save_path}...")
    df.to_csv(save_path, index=False)

    elapsed = time.time() - start_time
    print("-" * 80)
    print(f"[SUCCESS] Dataset Generation Complete!")
    print(f" - Shape: {df.shape[0]:,} records x {df.shape[1]} columns")
    print(f" - Default Rate: {df['default_label'].mean():.2%}")
    print(f" - Account Tenure Range: {df['tenure_months'].min()} to {df['tenure_months'].max()} months (3m to 5 years)")
    print(f" - Saved File Size: {os.path.getsize(save_path) / (1024 * 1024):.2f} MB")
    print(f" - Time Elapsed: {elapsed:.2f} seconds")
    print("=" * 80)

if __name__ == "__main__":
    num = 100000
    if len(sys.argv) > 1:
        num = int(sys.argv[1])
    main(num_samples=num)
