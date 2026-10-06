"""
SHAP Explanation Engine & Ground-Truth Verification.
Generates local (waterfall) and global feature attribution values for credit predictions.
Performs ground-truth fidelity verification against synthetic simulator rules.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
import shap

class CreditSHAPExplainer:
    def __init__(self, model, feature_names: List[str]):
        self.model = model
        self.feature_names = feature_names
        self.explainer = None
        self.base_value = 0.0

    def fit(self, X_background: pd.DataFrame):
        X_bg = pd.DataFrame(X_background)
        # Use TreeExplainer for tree-based models or KernelExplainer as fallback
        try:
            underlying_model = getattr(self.model, 'model', self.model)
            self.explainer = shap.TreeExplainer(underlying_model)
            self.base_value = float(np.mean(self.explainer.expected_value)) if isinstance(self.explainer.expected_value, (list, np.ndarray)) else float(self.explainer.expected_value)
        except Exception:
            # Fallback to KernelExplainer with background summary sample
            X_summary = shap.sample(X_bg, 25)
            predict_fn = lambda x: self.model.predict_proba(pd.DataFrame(x, columns=self.feature_names))[:, 1]
            self.explainer = shap.KernelExplainer(predict_fn, X_summary)
            self.base_value = float(self.explainer.expected_value)
        return self

    def explain_single(self, applicant_vector: pd.DataFrame) -> Dict[str, Any]:
        """
        Generates local SHAP explanations for a single applicant vector.
        """
        X_single = pd.DataFrame(applicant_vector)
        shap_vals = self.explainer.shap_values(X_single)

        if isinstance(shap_vals, list):
            # Binary classifier: take positive class [1]
            vals = np.array(shap_vals[1])[0] if len(shap_vals) > 1 else np.array(shap_vals[0])[0]
        elif len(shap_vals.shape) == 3:
            vals = shap_vals[0, :, 1]
        else:
            vals = shap_vals[0]

        feature_values = X_single.iloc[0].to_dict()
        attribution_map = {}
        for feat, val in zip(self.feature_names, vals):
            attribution_map[feat] = round(float(val), 4)

        # Sort factors into positive (increasing default risk) vs negative (reducing default risk)
        sorted_factors = sorted(attribution_map.items(), key=lambda x: abs(x[1]), reverse=True)
        
        top_positive = [f"{k}: +{v:.3f} risk" for k, v in sorted_factors if v > 0][:3]
        top_negative = [f"{k}: {v:.3f} risk" for k, v in sorted_factors if v < 0][:3]

        return {
            "base_value": round(self.base_value, 4),
            "shap_attributions": attribution_map,
            "top_risk_drivers": top_positive,
            "top_protective_drivers": top_negative,
            "feature_values": {k: float(v) if isinstance(v, (int, float, np.number)) else str(v) for k, v in feature_values.items()}
        }

    def verify_ground_truth_fidelity(self, X_synthetic: pd.DataFrame) -> Dict[str, Any]:
        """
        Compares learned SHAP feature importance against known synthetic ground truth weights.
        """
        shap_vals = self.explainer.shap_values(X_synthetic)
        if isinstance(shap_vals, list):
            vals = np.array(shap_vals[1])
        else:
            vals = np.array(shap_vals)

        mean_abs_shap = np.mean(np.abs(vals), axis=0)
        shap_ranking = dict(zip(self.feature_names, mean_abs_shap))

        # Expected top synthetic drivers planted in simulator:
        # active_days_ratio, utility_punctuality_score, inflow_volatility, emergency_drawdown_count
        expected_top = ["active_days_ratio", "utility_punctuality_score", "inflow_volatility", "emergency_drawdown_count"]
        top_learned = sorted(shap_ranking.items(), key=lambda x: x[1], reverse=True)
        top_learned_names = [x[0] for x in top_learned[:5]]

        overlap = len(set(expected_top).intersection(set(top_learned_names)))
        fidelity_score = round(float(overlap / len(expected_top)) * 100.0, 1)

        return {
            "fidelity_score_pct": fidelity_score,
            "expected_top_drivers": expected_top,
            "learned_top_drivers": top_learned_names,
            "global_shap_importance": {k: round(float(v), 4) for k, v in top_learned}
        }
