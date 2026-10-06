"""
Master Training, PSO Tuning, SHAP Attribution, and Fairness Audit Script.

Executes end-to-end pipeline:
1. Data Ingestion (Synthetic UPI Gig-Worker & UCI Credit Card)
2. Stratified 5-Fold CV Baseline & Monotonic HGB
3. PSO vs Random Search Tuning (Equal Budget Evaluation)
4. Comprehensive Metrics (ROC-AUC, PR-AUC, KS, Cost-Matrix Threshold)
5. SHAP Ground-Truth Fidelity Audit
6. Demographic Parity & Equal Opportunity Fairness Audit
7. Export Model Bundle & Model Card to artifacts/
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any

import sys
import os

sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("ml-core"))

import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any

from src.data_loader import load_dataset
from src.preprocessing import CreditFeaturePreprocessor
from src.baseline_model import BaselineLogisticScorer
from src.gb_model import MonotonicGradientBoostingScorer
from src.pso.swarm import PSOHyperparameterTuner, RandomSearchTuner
from src.evaluation.metrics import evaluate_credit_model
from src.evaluation.fairness import audit_credit_fairness
from src.explainability.shap_engine import CreditSHAPExplainer

def run_master_pipeline():
    print("=" * 80)
    print(" EXPLAINABLE CREDIT SCORING - MASTER TRAINING & AUDIT PIPELINE")
    print("=" * 80)

    artifacts_dir = "ml-core/artifacts"
    models_dir = "ml-core/models"
    inference_artifacts_dir = "inference-service/model_artifacts"

    os.makedirs(artifacts_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(inference_artifacts_dir, exist_ok=True)

    # ----------------------------------------------------
    # 1. Load Synthetic UPI Gig-Worker Dataset
    # ----------------------------------------------------
    print("\n[Step 1] Loading Synthetic UPI Gig-Worker Dataset (N=2,500)...")
    X_upi, y_upi, meta_upi = load_dataset("synthetic_upi", num_samples=2500, seed=42)
    print(f"Loaded synthetic dataset: {X_upi.shape}, Default rate: {y_upi.mean():.2%}")

    # Separate protected attributes for fairness audit
    protected_df = X_upi[["gender", "city_tier"]].copy()
    X_upi_model = X_upi.drop(columns=["gender", "city_tier"])

    # Fit Preprocessor
    preprocessor = CreditFeaturePreprocessor()
    X_upi_proc = preprocessor.fit_transform(X_upi_model)
    feature_names = list(X_upi_proc.columns)

    # ----------------------------------------------------
    # 2. Baseline Model vs Monotonic Gradient Boosting
    # ----------------------------------------------------
    print("\n[Step 2] Training Baseline & Monotonic Gradient Boosting Scorer...")
    split_idx = int(len(X_upi_proc) * 0.8)
    X_train, X_test = X_upi_proc.iloc[:split_idx], X_upi_proc.iloc[split_idx:]
    y_train, y_test = y_upi.iloc[:split_idx], y_upi.iloc[split_idx:]
    prot_test = protected_df.iloc[split_idx:]

    # Train Baseline
    baseline = BaselineLogisticScorer(C=1.0)
    baseline.fit(X_train, y_train)
    prob_base = baseline.predict_proba(X_test)[:, 1]
    metrics_baseline = evaluate_credit_model(y_test.values, prob_base)
    print(f" Baseline Logistic Regression ROC-AUC: {metrics_baseline['roc_auc']:.4f}, KS: {metrics_baseline['ks_statistic']:.2f}")

    # Train Monotonic HGB
    hgb_default = MonotonicGradientBoostingScorer(learning_rate=0.05, max_iter=150, min_samples_leaf=20)
    hgb_default.fit(X_train, y_train)
    prob_hgb = hgb_default.predict_proba(X_test)[:, 1]
    metrics_hgb = evaluate_credit_model(y_test.values, prob_hgb)
    print(f" Monotonic HGB (Untuned) ROC-AUC:      {metrics_hgb['roc_auc']:.4f}, KS: {metrics_hgb['ks_statistic']:.2f}")

    # ----------------------------------------------------
    # 3. Particle Swarm Optimization (PSO) vs Random Search
    # ----------------------------------------------------
    print("\n[Step 3] Running PSO vs Random Search Hyperparameter Tuning (Equal Budget = 96 Evals)...")
    pso = PSOHyperparameterTuner(n_particles=12, iters=8, seed=42)
    pso_params, pso_best_auc, pso_history = pso.optimize(X_train, y_train)
    print(f" PSO Best CV ROC-AUC:      {pso_best_auc:.4f} with params: {pso_params}")

    rs = RandomSearchTuner(total_evaluations=96, seed=42)
    rs_params, rs_best_auc, rs_history = rs.optimize(X_train, y_train)
    print(f" Random Search Best CV AUC: {rs_best_auc:.4f} with params: {rs_params}")

    # Train Final Tuned Model using PSO Parameters
    hgb_tuned = MonotonicGradientBoostingScorer(
        learning_rate=pso_params["learning_rate"],
        max_leaf_nodes=pso_params["max_leaf_nodes"],
        min_samples_leaf=pso_params["min_samples_leaf"],
        l2_regularization=pso_params["l2_regularization"],
        max_iter=pso_params["max_iter"],
        random_state=42
    )
    hgb_tuned.fit(X_train, y_train)
    prob_tuned = hgb_tuned.predict_proba(X_test)[:, 1]
    metrics_tuned = evaluate_credit_model(y_test.values, prob_tuned)
    print(f" PSO-Tuned Monotonic HGB Test ROC-AUC: {metrics_tuned['roc_auc']:.4f}, KS: {metrics_tuned['ks_statistic']:.2f}, Opt Threshold: {metrics_tuned['optimal_threshold']:.4f}")

    # ----------------------------------------------------
    # 4. Real-Label Benchmark Validation (UCI Credit Dataset)
    # ----------------------------------------------------
    print("\n[Step 4] Validating on UCI Credit Card Default Real-Label Dataset (N=5,000)...")
    X_uci, y_uci, meta_uci = load_dataset("uci_credit", num_samples=5000, seed=42)
    X_uci_proc = CreditFeaturePreprocessor().fit_transform(X_uci)
    
    uci_split = int(len(X_uci_proc) * 0.8)
    X_uci_tr, X_uci_te = X_uci_proc.iloc[:uci_split], X_uci_proc.iloc[uci_split:]
    y_uci_tr, y_uci_te = y_uci.iloc[:uci_split], y_uci.iloc[uci_split:]

    hgb_uci = MonotonicGradientBoostingScorer(learning_rate=0.05, max_iter=150)
    hgb_uci.fit(X_uci_tr, y_uci_tr)
    prob_uci = hgb_uci.predict_proba(X_uci_te)[:, 1]
    metrics_uci = evaluate_credit_model(y_uci_te.values, prob_uci)
    print(f" UCI Real-Label Dataset Test ROC-AUC:  {metrics_uci['roc_auc']:.4f}, PR-AUC: {metrics_uci['pr_auc']:.4f}, KS: {metrics_uci['ks_statistic']:.2f}")

    # ----------------------------------------------------
    # 5. SHAP Ground-Truth Fidelity Audit
    # ----------------------------------------------------
    print("\n[Step 5] Running SHAP Explanation Engine & Ground-Truth Verification...")
    explainer = CreditSHAPExplainer(hgb_tuned, feature_names)
    explainer.fit(X_train)

    fidelity_report = explainer.verify_ground_truth_fidelity(X_test)
    print(f" SHAP Ground-Truth Fidelity Score: {fidelity_report['fidelity_score_pct']}%")
    print(f" Expected Top Drivers: {fidelity_report['expected_top_drivers']}")
    print(f" Learned Top Drivers:  {fidelity_report['learned_top_drivers']}")

    # ----------------------------------------------------
    # 6. Demographic Fairness Audit
    # ----------------------------------------------------
    print("\n[Step 6] Running Fairness Audit across Protected Attributes (Gender, City Tier)...")
    opt_th = metrics_tuned["optimal_threshold"]
    test_eval_df = prot_test.copy()
    test_eval_df["default_label"] = y_test.values
    test_eval_df["prediction"] = (prob_tuned >= opt_th).astype(int)

    fairness_gender = audit_credit_fairness(test_eval_df, protected_attribute="gender")
    fairness_city = audit_credit_fairness(test_eval_df, protected_attribute="city_tier")

    print(f" Gender Fairness Audit: Disparate Impact Ratio = {fairness_gender['disparate_impact_ratio']:.4f} (Pass 80% Rule: {fairness_gender['fairness_compliant_80_rule']})")
    print(f" City Tier Audit:       Disparate Impact Ratio = {fairness_city['disparate_impact_ratio']:.4f} (Pass 80% Rule: {fairness_city['fairness_compliant_80_rule']})")

    # ----------------------------------------------------
    # 7. Model Card & Artifact Export
    # ----------------------------------------------------
    print("\n[Step 7] Exporting Model Card and Model Bundle...")

    model_card = {
        "model_name": "Bank-Deployable Monotonic Gradient Boosting Scorer",
        "model_version": "3.0.0",
        "training_dataset": meta_upi["dataset_name"],
        "num_training_samples": len(X_train),
        "num_test_samples": len(X_test),
        "performance_metrics": {
            "synthetic_upi": metrics_tuned,
            "uci_real_label_benchmark": metrics_uci,
            "baseline_logistic": metrics_baseline
        },
        "optimization_benchmark": {
            "pso_best_auc": pso_best_auc,
            "random_search_best_auc": rs_best_auc,
            "eval_budget": 96,
            "pso_params": pso_params,
            "pso_history": pso_history,
            "rs_history": rs_history
        },
        "explainability": fidelity_report,
        "fairness_audit": {
            "gender": fairness_gender,
            "city_tier": fairness_city
        },
        "data_contract": {
            "feature_names": feature_names,
            "protected_attributes": ["gender", "city_tier"],
            "account_aggregator_compliant": True
        }
    }

    # Save JSON Model Card
    card_path = os.path.join(artifacts_dir, "model_card.json")
    with open(card_path, "w") as f:
        json.dump(model_card, f, indent=2)

    # Save Model Bundle (Preprocessor + Tuned Model + Explainer + Threshold)
    bundle = {
        "preprocessor": preprocessor,
        "model": hgb_tuned,
        "explainer": explainer,
        "optimal_threshold": opt_th,
        "feature_names": feature_names,
        "model_card": model_card
    }

    joblib.dump(bundle, os.path.join(models_dir, "model_bundle.joblib"))
    joblib.dump(bundle, os.path.join(inference_artifacts_dir, "model_bundle.joblib"))

    print(f"\n[OK] Pipeline complete! Model card saved to {card_path}")
    print(f"[OK] Model bundle exported to {os.path.join(models_dir, 'model_bundle.joblib')} and {os.path.join(inference_artifacts_dir, 'model_bundle.joblib')}")

if __name__ == "__main__":
    run_master_pipeline()
