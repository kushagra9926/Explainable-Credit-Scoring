"""
Download and verify real UCI Credit Card Default dataset (30,000 records).
"""

import sys, os
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("ml-core"))

from src.data.uci_loader import UCIDefaultLoader

if __name__ == "__main__":
    loader = UCIDefaultLoader()
    df = loader.load_dataset()
    print(f"[OK] UCI Dataset loaded successfully. Shape: {df.shape}, Default rate: {df['default_label'].mean():.2%}")
