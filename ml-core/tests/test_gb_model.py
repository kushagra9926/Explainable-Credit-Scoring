import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("ml-core"))

import pandas as pd
import numpy as np
from src.gb_model import MonotonicGradientBoostingScorer

def test_monotonic_gradient_boosting_scorer():
    X = pd.DataFrame({
        "active_days_ratio": [0.9, 0.2, 0.7, 0.3, 0.8, 0.1],
        "utility_punctuality_score": [0.95, 0.1, 0.8, 0.4, 0.9, 0.2],
        "inflow_volatility": [0.1, 0.8, 0.3, 0.6, 0.2, 0.9]
    })
    y = pd.Series([0, 1, 0, 1, 0, 1])

    clf = MonotonicGradientBoostingScorer(learning_rate=0.1, max_iter=20, random_state=42)
    clf.fit(X, y)

    preds = clf.predict(X)
    probs = clf.predict_proba(X)

    assert len(preds) == 6
    assert probs.shape == (6, 2)
    assert np.all(probs >= 0.0) and np.all(probs <= 1.0)
