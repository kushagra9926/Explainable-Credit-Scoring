"""
Comprehensive Credit Risk Evaluation Metrics.
Calculates ROC-AUC, PR-AUC, KS Statistic, Calibration Error, and Cost-Matrix Thresholds.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.metrics import roc_auc_score, average_precision_score, confusion_matrix, precision_recall_curve, f1_score
from scipy.stats import ks_2samp

def calculate_ks_statistic(y_true: np.ndarray, y_prob: np.ndarray) -> Tuple[float, float]:
    """
    Calculates Kolmogorov-Smirnov (KS) statistic and optimal threshold.
    """
    df = pd.DataFrame({'y_true': y_true, 'y_prob': y_prob})
    defaults = df[df['y_true'] == 1]['y_prob']
    non_defaults = df[df['y_true'] == 0]['y_prob']

    if len(defaults) == 0 or len(non_defaults) == 0:
        return 0.0, 0.5

    stat, p_val = ks_2samp(defaults, non_defaults)
    
    # Calculate threshold where separation is maximum
    thresholds = np.linspace(0, 1, 101)
    ks_values = []
    for th in thresholds:
        tpr = np.mean(defaults >= th)
        fpr = np.mean(non_defaults >= th)
        ks_values.append(tpr - fpr)

    max_ks_idx = np.argmax(ks_values)
    best_threshold = float(thresholds[max_ks_idx])
    return float(stat * 100.0), best_threshold

def calculate_cost_matrix_optimal_threshold(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    cost_fn: float = 5.0,  # Cost of False Negative (Missed Default)
    cost_fp: float = 1.0   # Cost of False Positive (Rejected Good Borrower)
) -> Tuple[float, float]:
    """
    Finds decision threshold minimizing business loss.
    """
    thresholds = np.linspace(0.05, 0.95, 181)
    min_cost = float('inf')
    best_th = 0.5

    for th in thresholds:
        y_pred = (y_prob >= th).astype(int)
        cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
        if cm.shape == (2, 2):
            tn, fp, fn, tp = cm.ravel()
        else:
            tn, fp, fn, tp = 0, 0, 0, 0
        total_cost = fn * cost_fn + fp * cost_fp
        if total_cost < min_cost:
            min_cost = total_cost
            best_th = float(th)

    return best_th, float(min_cost)

def evaluate_credit_model(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    cost_fn: float = 5.0,
    cost_fp: float = 1.0
) -> Dict[str, Any]:
    """
    Evaluates complete suite of credit scoring metrics.
    """
    roc_auc = roc_auc_score(y_true, y_prob) if len(np.unique(y_true)) > 1 else 0.5
    pr_auc = average_precision_score(y_true, y_prob) if len(np.unique(y_true)) > 1 else 0.5
    ks_stat, ks_th = calculate_ks_statistic(y_true, y_prob)
    opt_th, min_cost = calculate_cost_matrix_optimal_threshold(y_true, y_prob, cost_fn, cost_fp)

    y_pred_opt = (y_prob >= opt_th).astype(int)
    cm = confusion_matrix(y_true, y_pred_opt, labels=[0, 1])
    if cm.shape == (2, 2):
        tn, fp, fn, tp = cm.ravel()
    else:
        tn, fp, fn, tp = 0, 0, 0, 0

    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    f1_opt = f1_score(y_true, y_pred_opt, zero_division=0)

    return {
        "roc_auc": round(float(roc_auc), 4),
        "pr_auc": round(float(pr_auc), 4),
        "ks_statistic": round(float(ks_stat), 2),
        "optimal_threshold": round(float(opt_th), 4),
        "f1_at_optimal_threshold": round(float(f1_opt), 4),
        "sensitivity_recall": round(float(sensitivity), 4),
        "specificity": round(float(specificity), 4),
        "business_cost": float(min_cost)
    }

if __name__ == "__main__":
    y_true = np.array([0, 0, 0, 0, 1, 1, 0, 1, 0, 1])
    y_prob = np.array([0.1, 0.2, 0.15, 0.4, 0.8, 0.9, 0.3, 0.7, 0.2, 0.85])
    metrics = evaluate_credit_model(y_true, y_prob)
    print("Metrics output:", metrics)
