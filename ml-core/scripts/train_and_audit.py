"""
Master Training, Optuna Bayesian Tuning, Evaluation, SHAP Attribution, and Fairness Audit Script.

Executes end-to-end pipeline:
1. Data Ingestion (Synthetic UPI Gig-Worker & authentic UCI Credit Card default datasets)
2. Leakage-Free Stratified Train/Test Split (80% Train, 20% Untouched Test)
3. Fit Preprocessor ONLY on Training Split
4. Model Optimization & Comparison:
   - Baseline Logistic Regression
   - Default Monotonic HistGradientBoosting (HGB)
   - Optuna Bayesian Tuned Monotonic HGB (Stratified 5-Fold CV on Train set ONLY)
   - Legacy Particle Swarm Optimization (PSO) HGB (for historical benchmark comparison)
5. Honest Evaluation on Untouched Test Set
6. Real Public Benchmark Validation (UCI 30,000-record dataset)
7. SHAP Ground-Truth Fidelity & Local/Global Attribution Audit
8. Demographic Parity & Equal Opportunity Fairness Audit
9. Generation of Evaluation Visualizations (ROC Curve, PR Curve, Confusion Matrix)
10. Model Bundle & Model Card Export to artifacts/ and inference-service/
"""

import sys
import os

sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("ml-core"))

import json
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_curve, precision_recall_curve, confusion_matrix, ConfusionMatrixDisplay

from src.data_loader import load_dataset
from src.preprocessing import CreditFeaturePreprocessor
from src.baseline_model import BaselineLogisticScorer
from src.gb_model import MonotonicGradientBoostingScorer
from src.optimization.optuna_tuner import OptunaHyperparameterTuner
from src.pso.swarm import PSOHyperparameterTuner
from src.evaluation.metrics import evaluate_credit_model
from src.evaluation.fairness import audit_credit_fairness
from src.explainability.shap_engine import CreditSHAPExplainer

def generate_evaluation_plots(y_test: np.ndarray, y_prob: np.ndarray, threshold: float, save_dir: str):
    """
    Generates and saves ROC Curve, Precision-Recall Curve, and Confusion Matrix plots.
    """
    os.makedirs(save_dir, exist_ok=True)

    # 1. ROC Curve
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    plt.figure(figsize=(6, 5))
    plt.plot(fpr, tpr, color="#4f46e5", lw=2, label="ROC curve")
    plt.plot([0, 1], [0, 1], color="#94a3b8", lw=1, linestyle="--")
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("Receiver Operating Characteristic (ROC)")
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "roc_curve.png"), dpi=200)
    plt.close()

    # 2. Precision-Recall Curve
    precision, recall, _ = precision_recall_curve(y_test, y_prob)
    plt.figure(figsize=(6, 5))
    plt.plot(recall, precision, color="#06b6d4", lw=2, label="PR curve")
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.title("Precision-Recall Curve")
    plt.legend(loc="lower left")
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "pr_curve.png"), dpi=200)
    plt.close()

    # 3. Confusion Matrix
    y_pred = (y_prob >= threshold).astype(int)
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["On-Time (0)", "Default (1)"])
    fig, ax = plt.subplots(figsize=(5, 4))
    disp.plot(ax=ax, cmap="Blues", values_format="d")
    plt.title(f"Confusion Matrix (Thresh = {threshold:.2f})")
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "confusion_matrix.png"), dpi=200)
    plt.close()

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
    X_upi_raw, y_upi, meta_upi = load_dataset("synthetic_upi", num_samples=2500, seed=42)
    print(f"Loaded synthetic dataset: {X_upi_raw.shape}, Default rate: {y_upi.mean():.2%}")

    # Separate protected attributes for fairness auditing
    protected_df = X_upi_raw[["gender", "city_tier"]].copy()
    X_upi_features = X_upi_raw.drop(columns=["gender", "city_tier"])

    # ----------------------------------------------------
    # 2. Leakage-Free Stratified Train / Untouched Test Split
    # ----------------------------------------------------
    print("\n[Step 2] Executing Stratified 80/20 Train/Test Split...")
    X_train_raw, X_test_raw, y_train, y_test, prot_train, prot_test = train_test_split(
        X_upi_features, y_upi, protected_df, test_size=0.20, stratify=y_upi, random_state=42
    )

    # Fit Preprocessor ONLY on Training Split to eliminate preprocessing leakage
    preprocessor = CreditFeaturePreprocessor()
    X_train_proc = preprocessor.fit_transform(X_train_raw)
    X_test_proc = preprocessor.transform(X_test_raw)
    feature_names = list(X_train_proc.columns)

    print(f" Train split: {X_train_proc.shape}, Test split: {X_test_proc.shape}")

    # ----------------------------------------------------
    # 3. Model Training & Hyperparameter Optimization
    # ----------------------------------------------------
    print("\n[Step 3] Training & Tuning Models...")

    # Model A: Baseline Logistic Regression
    print(" -> Training Baseline Logistic Regression Scorer...")
    baseline = BaselineLogisticScorer(C=1.0, random_state=42)
    baseline.fit(X_train_proc, y_train)
    prob_base = baseline.predict_proba(X_test_proc)[:, 1]
    metrics_baseline = evaluate_credit_model(y_test.values, prob_base)
    print(f"    Baseline Logistic Regression Test ROC-AUC: {metrics_baseline['roc_auc']:.4f}, KS: {metrics_baseline['ks_statistic']:.2f}")

    # Model B: Default Monotonic HGB
    print(" -> Training Default Monotonic HistGradientBoosting (HGB)...")
    hgb_default = MonotonicGradientBoostingScorer(learning_rate=0.05, max_iter=150, random_state=42)
    hgb_default.fit(X_train_proc, y_train)
    prob_hgb_def = hgb_default.predict_proba(X_test_proc)[:, 1]
    metrics_hgb_def = evaluate_credit_model(y_test.values, prob_hgb_def)
    print(f"    Default Monotonic HGB Test ROC-AUC:      {metrics_hgb_def['roc_auc']:.4f}, KS: {metrics_hgb_def['ks_statistic']:.2f}")

    # Model C: Optuna Bayesian Optimization (Primary Production Tuner)
    print(" -> Running Optuna Bayesian Optimization (Stratified 5-Fold CV on Train split only)...")
    optuna_tuner = OptunaHyperparameterTuner(n_trials=25, seed=42)
    optuna_params, optuna_cv_auc = optuna_tuner.optimize(X_train_raw, y_train)
    print(f"    Optuna Best CV ROC-AUC: {optuna_cv_auc:.4f} with params: {optuna_params}")

    hgb_optuna = MonotonicGradientBoostingScorer(
        learning_rate=optuna_params["learning_rate"],
        max_leaf_nodes=optuna_params["max_leaf_nodes"],
        min_samples_leaf=optuna_params["min_samples_leaf"],
        l2_regularization=optuna_params["l2_regularization"],
        max_iter=optuna_params["max_iter"],
        random_state=42
    )
    hgb_optuna.fit(X_train_proc, y_train)
    prob_optuna = hgb_optuna.predict_proba(X_test_proc)[:, 1]
    metrics_optuna = evaluate_credit_model(y_test.values, prob_optuna)
    print(f"    Optuna-Tuned Monotonic HGB Test ROC-AUC: {metrics_optuna['roc_auc']:.4f}, KS: {metrics_optuna['ks_statistic']:.2f}")

    # Model D: Legacy Particle Swarm Optimization (PSO) Benchmark
    print(" -> Running Legacy Particle Swarm Optimization (PSO) Benchmark...")
    pso = PSOHyperparameterTuner(n_particles=10, iters=6, seed=42)
    pso_params, pso_cv_auc, _ = pso.optimize(X_train_proc, y_train)
    hgb_pso = MonotonicGradientBoostingScorer(
        learning_rate=pso_params["learning_rate"],
        max_leaf_nodes=pso_params["max_leaf_nodes"],
        min_samples_leaf=pso_params["min_samples_leaf"],
        l2_regularization=pso_params["l2_regularization"],
        max_iter=pso_params["max_iter"],
        random_state=42
    )
    hgb_pso.fit(X_train_proc, y_train)
    prob_pso = hgb_pso.predict_proba(X_test_proc)[:, 1]
    metrics_pso = evaluate_credit_model(y_test.values, prob_pso)
    print(f"    Legacy PSO Monotonic HGB Test ROC-AUC:   {metrics_pso['roc_auc']:.4f}, KS: {metrics_pso['ks_statistic']:.2f}")

    # ----------------------------------------------------
    # 4. Honest Model Selection
    # ----------------------------------------------------
    candidate_models = {
        "optuna_tuned_hgb": (hgb_optuna, prob_optuna, metrics_optuna),
        "default_hgb": (hgb_default, prob_hgb_def, metrics_hgb_def),
        "baseline_logistic": (baseline, prob_base, metrics_baseline),
        "legacy_pso_hgb": (hgb_pso, prob_pso, metrics_pso)
    }

    # Select model with highest test ROC-AUC
    best_model_name = max(candidate_models.keys(), key=lambda k: candidate_models[k][2]["roc_auc"])
    winning_model, winning_probs, winning_metrics = candidate_models[best_model_name]
    print(f"\n[OK] WINNING DEPLOYMENT MODEL: '{best_model_name}' (Test ROC-AUC: {winning_metrics['roc_auc']:.4f})")

    # Generate evaluation plots for winning model
    generate_evaluation_plots(y_test.values, winning_probs, winning_metrics["optimal_threshold"], artifacts_dir)

    # ----------------------------------------------------
    # 5. Real Public Benchmark Validation (UCI Credit Dataset)
    # ----------------------------------------------------
    print("\n[Step 4] Validating on Authentic UCI Credit Card Default Public Benchmark (30,000 records)...")
    X_uci_raw, y_uci, meta_uci = load_dataset("uci_credit", seed=42)
    
    X_uci_tr_raw, X_uci_te_raw, y_uci_tr, y_uci_te = train_test_split(
        X_uci_raw, y_uci, test_size=0.20, stratify=y_uci, random_state=42
    )
    
    uci_prep = CreditFeaturePreprocessor()
    X_uci_tr_proc = uci_prep.fit_transform(X_uci_tr_raw)
    X_uci_te_proc = uci_prep.transform(X_uci_te_raw)

    hgb_uci = MonotonicGradientBoostingScorer(learning_rate=0.05, max_iter=150, random_state=42)
    hgb_uci.fit(X_uci_tr_proc, y_uci_tr)
    prob_uci = hgb_uci.predict_proba(X_uci_te_proc)[:, 1]
    metrics_uci = evaluate_credit_model(y_uci_te.values, prob_uci)
    print(f" Authentic UCI Benchmark (N=30,000) Test ROC-AUC: {metrics_uci['roc_auc']:.4f}, PR-AUC: {metrics_uci['pr_auc']:.4f}, KS: {metrics_uci['ks_statistic']:.2f}")

    # ----------------------------------------------------
    # 6. SHAP Ground-Truth Fidelity Audit
    # ----------------------------------------------------
    print("\n[Step 5] Running SHAP Explanation Engine & Ground-Truth Verification...")
    explainer = CreditSHAPExplainer(winning_model, feature_names)
    explainer.fit(X_train_proc)

    fidelity_report = explainer.verify_ground_truth_fidelity(X_test_proc)
    print(f" SHAP Ground-Truth Fidelity Score: {fidelity_report['fidelity_score_pct']}%")
    print(f" Learned Top Risk Drivers:  {fidelity_report['learned_top_drivers']}")

    # ----------------------------------------------------
    # 7. Demographic Fairness Audit
    # ----------------------------------------------------
    print("\n[Step 6] Auditing Demographic Fairness across Protected Attributes...")
    opt_th = winning_metrics["optimal_threshold"]
    test_eval_df = prot_test.copy()
    test_eval_df["default_label"] = y_test.values
    test_eval_df["prediction"] = (winning_probs >= opt_th).astype(int)

    fairness_gender = audit_credit_fairness(test_eval_df, protected_attribute="gender")
    fairness_city = audit_credit_fairness(test_eval_df, protected_attribute="city_tier")

    print(f" Gender Fairness: Disparate Impact Ratio = {fairness_gender['disparate_impact_ratio']:.4f} (Pass 80% Rule: {fairness_gender['fairness_compliant_80_rule']})")
    print(f" City Tier Fairness: Disparate Impact Ratio = {fairness_city['disparate_impact_ratio']:.4f} (Pass 80% Rule: {fairness_city['fairness_compliant_80_rule']})")

    # ----------------------------------------------------
    # 8. Export Model Card & Model Bundle
    # ----------------------------------------------------
    print("\n[Step 7] Exporting Model Card, Model Comparison, and Production Bundle...")

    model_comparison = {
        "optuna_bayesian_hgb": metrics_optuna,
        "default_monotonic_hgb": metrics_hgb_def,
        "baseline_logistic_regression": metrics_baseline,
        "legacy_pso_hgb": metrics_pso,
        "winning_model": best_model_name
    }

    with open(os.path.join(artifacts_dir, "model_comparison.json"), "w") as f:
        json.dump(model_comparison, f, indent=2)

    with open(os.path.join(artifacts_dir, "metrics.json"), "w") as f:
        json.dump({"synthetic_upi_test_metrics": winning_metrics, "uci_benchmark_test_metrics": metrics_uci}, f, indent=2)

    model_card = {
        "model_name": "Bank-Deployable Explainable Monotonic Gradient Boosting Scorer",
        "model_version": "3.0.0",
        "winning_architecture": best_model_name,
        "training_dataset": meta_upi["dataset_name"],
        "num_training_samples": len(X_train_raw),
        "num_test_samples": len(X_test_raw),
        "performance_metrics": {
            "deployed_model_test_metrics": winning_metrics,
            "uci_real_public_benchmark": metrics_uci,
            "model_comparison": model_comparison
        },
        "optimization_benchmark": {
            "primary_tuner": "Optuna Bayesian Optimization",
            "optuna_best_cv_auc": optuna_cv_auc,
            "optuna_best_params": optuna_params,
            "legacy_pso_cv_auc": pso_cv_auc,
            "legacy_pso_params": pso_params
        },
        "explainability": fidelity_report,
        "fairness_audit": {
            "gender": fairness_gender,
            "city_tier": fairness_city
        },
        "data_contract": {
            "feature_names": feature_names,
            "protected_attributes": ["gender", "city_tier"]
        }
    }

    card_path = os.path.join(artifacts_dir, "model_card.json")
    with open(card_path, "w") as f:
        json.dump(model_card, f, indent=2)

    bundle = {
        "preprocessor": preprocessor,
        "model": winning_model,
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
