"""
Fairness Auditing Engine for Credit Risk Scoring.
Calculates Demographic Parity, Equal Opportunity, and Disparate Impact Ratio across protected groups.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any

def audit_credit_fairness(
    df: pd.DataFrame,
    protected_attribute: str,
    y_true_col: str = "default_label",
    y_pred_col: str = "prediction"
) -> Dict[str, Any]:
    """
    Audits credit decisions for bias across protected groups (e.g., Male vs Female).
    """
    groups = df[protected_attribute].unique()
    group_stats = {}

    for g in groups:
        sub = df[df[protected_attribute] == g]
        if len(sub) == 0:
            continue

        approval_rate = np.mean(sub[y_pred_col] == 0)  # 0 is APPROVED / Good borrower
        default_rate = np.mean(sub[y_true_col] == 1)

        # True Positive Rate (TPR) / Recall for default detection
        tp = np.sum((sub[y_true_col] == 1) & (sub[y_pred_col] == 1))
        actual_defaults = np.sum(sub[y_true_col] == 1)
        tpr = tp / float(actual_defaults) if actual_defaults > 0 else 0.0

        group_stats[str(g)] = {
            "sample_size": len(sub),
            "approval_rate": round(float(approval_rate), 4),
            "default_rate": round(float(default_rate), 4),
            "tpr_recall": round(float(tpr), 4)
        }

    # Calculate Demographic Parity Difference (max approval rate - min approval rate)
    app_rates = [v["approval_rate"] for v in group_stats.values()]
    tpr_rates = [v["tpr_recall"] for v in group_stats.values()]

    demographic_parity_diff = max(app_rates) - min(app_rates) if app_rates else 0.0
    equal_opportunity_diff = max(tpr_rates) - min(tpr_rates) if tpr_rates else 0.0

    min_app = min(app_rates) if app_rates else 1.0
    max_app = max(app_rates) if app_rates else 1.0
    disparate_impact_ratio = min_app / max_app if max_app > 0 else 1.0

    return {
        "protected_attribute": protected_attribute,
        "group_metrics": group_stats,
        "demographic_parity_difference": round(float(demographic_parity_diff), 4),
        "equal_opportunity_difference": round(float(equal_opportunity_diff), 4),
        "disparate_impact_ratio": round(float(disparate_impact_ratio), 4),
        "fairness_compliant_80_rule": disparate_impact_ratio >= 0.80
    }
