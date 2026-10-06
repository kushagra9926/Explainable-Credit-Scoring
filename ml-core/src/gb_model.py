"""
Monotonic HistGradientBoosting Credit Scoring Engine.

Enforces regulatory monotonic constraints on key behavioral features
(e.g., active_days_ratio, utility_punctuality, inflow_volatility)
to guarantee explainable and compliant decision logic.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.base import BaseEstimator, ClassifierMixin

class MonotonicGradientBoostingScorer(BaseEstimator, ClassifierMixin):
    def __init__(
        self,
        learning_rate: float = 0.05,
        max_iter: int = 150,
        max_leaf_nodes: int = 31,
        min_samples_leaf: int = 20,
        l2_regularization: float = 0.1,
        use_monotonic_constraints: bool = True,
        random_state: int = 42
    ):
        self.learning_rate = learning_rate
        self.max_iter = max_iter
        self.max_leaf_nodes = max_leaf_nodes
        self.min_samples_leaf = min_samples_leaf
        self.l2_regularization = l2_regularization
        self.use_monotonic_constraints = use_monotonic_constraints
        self.random_state = random_state
        self.model = None
        self.feature_names_ = []

    def _build_monotonic_cst(self, feature_names: list) -> list:
        """
        Maps feature names to monotonic direction:
        -1 : Monotonically decreases risk (e.g., higher punctuality -> lower default risk)
        +1 : Monotonically increases risk (e.g., higher volatility -> higher default risk)
         0 : Unconstrained
        """
        cst = []
        for feat in feature_names:
            f = feat.lower()
            if any(k in f for k in ["active_days", "punctuality", "regularity", "inflow_outflow_ratio", "tenure", "pay_amt", "limit_bal"]):
                cst.append(-1)
            elif any(k in f for k in ["volatility", "drawdown", "zero_balance", "pay_0", "pay_2", "pay_3", "pay_4", "pay_5", "pay_6"]):
                cst.append(1)
            else:
                cst.append(0)
        return cst

    def fit(self, X: pd.DataFrame, y: pd.Series):
        X_df = pd.DataFrame(X)
        self.feature_names_ = list(X_df.columns)

        monotonic_cst = None
        if self.use_monotonic_constraints:
            monotonic_cst = self._build_monotonic_cst(self.feature_names_)

        self.model = HistGradientBoostingClassifier(
            learning_rate=self.learning_rate,
            max_iter=self.max_iter,
            max_leaf_nodes=self.max_leaf_nodes,
            min_samples_leaf=self.min_samples_leaf,
            l2_regularization=self.l2_regularization,
            monotonic_cst=monotonic_cst,
            random_state=self.random_state
        )
        self.model.fit(X_df, y)
        self.classes_ = self.model.classes_
        return self

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        X_df = pd.DataFrame(X)
        return self.model.predict_proba(X_df)

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        X_df = pd.DataFrame(X)
        return self.model.predict(X_df)

if __name__ == "__main__":
    X_dummy = pd.DataFrame({
        "active_days_ratio": [0.9, 0.2, 0.7, 0.3],
        "utility_punctuality_score": [0.95, 0.1, 0.8, 0.4],
        "inflow_volatility": [0.1, 0.8, 0.3, 0.6]
    })
    y_dummy = pd.Series([0, 1, 0, 1])
    clf = MonotonicGradientBoostingScorer()
    clf.fit(X_dummy, y_dummy)
    probs = clf.predict_proba(X_dummy)
    print("Fitted Monotonic HGB model. Probs:", probs)
