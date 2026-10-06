"""
Baseline Logistic Regression Credit Scorer.
Provides standard benchmark model for comparison against Monotonic Gradient Boosting & PSO tuning.
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.base import BaseEstimator, ClassifierMixin

class BaselineLogisticScorer(BaseEstimator, ClassifierMixin):
    def __init__(self, C: float = 1.0, max_iter: int = 500, random_state: int = 42):
        self.C = C
        self.max_iter = max_iter
        self.random_state = random_state
        self.model = LogisticRegression(C=self.C, max_iter=self.max_iter, random_state=self.random_state)

    def fit(self, X: pd.DataFrame, y: pd.Series):
        self.model.fit(X, y)
        self.classes_ = self.model.classes_
        return self

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        return self.model.predict_proba(X)

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return self.model.predict(X)
