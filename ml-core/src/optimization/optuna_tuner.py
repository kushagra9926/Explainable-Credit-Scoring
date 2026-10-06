import sys
import os

sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("ml-core"))

import optuna
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score
from src.preprocessing import CreditFeaturePreprocessor
from src.gb_model import MonotonicGradientBoostingScorer

# Suppress verbose Optuna logging
optuna.logging.set_verbosity(optuna.logging.WARNING)

class OptunaHyperparameterTuner:
    def __init__(self, n_trials: int = 30, seed: int = 42):
        self.n_trials = n_trials
        self.seed = seed

    def optimize(self, X_train_raw: pd.DataFrame, y_train: pd.Series) -> Tuple[Dict[str, Any], float]:
        """
        Runs Bayesian optimization over hyperparameter search space using Stratified 5-Fold CV.
        Fits preprocessor ONLY within training fold of each split to prevent leakage.
        """
        def objective(trial: optuna.Trial) -> float:
            params = {
                "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.20, log=True),
                "max_leaf_nodes": trial.suggest_int("max_leaf_nodes", 15, 63),
                "min_samples_leaf": trial.suggest_int("min_samples_leaf", 10, 50),
                "l2_regularization": trial.suggest_float("l2_regularization", 0.001, 10.0, log=True),
                "max_iter": trial.suggest_int("max_iter", 50, 250, step=25)
            }

            skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=self.seed)
            cv_scores = []

            for train_idx, val_idx in skf.split(X_train_raw, y_train):
                X_tr = X_train_raw.iloc[train_idx]
                y_tr = y_train.iloc[train_idx]
                X_val = X_train_raw.iloc[val_idx]
                y_val = y_train.iloc[val_idx]

                # Preprocessing fitted strictly on train fold
                prep = CreditFeaturePreprocessor()
                X_tr_proc = prep.fit_transform(X_tr)
                X_val_proc = prep.transform(X_val)

                model = MonotonicGradientBoostingScorer(
                    learning_rate=params["learning_rate"],
                    max_leaf_nodes=params["max_leaf_nodes"],
                    min_samples_leaf=params["min_samples_leaf"],
                    l2_regularization=params["l2_regularization"],
                    max_iter=params["max_iter"],
                    random_state=self.seed
                )
                model.fit(X_tr_proc, y_tr)
                preds = model.predict_proba(X_val_proc)[:, 1]
                auc = roc_auc_score(y_val, preds)
                cv_scores.append(auc)

            return float(np.mean(cv_scores))

        sampler = optuna.samplers.TPESampler(seed=self.seed)
        study = optuna.create_study(direction="maximize", sampler=sampler)
        study.optimize(objective, n_trials=self.n_trials, show_progress_bar=False)

        best_params = study.best_params
        best_cv_auc = study.best_value

        return best_params, best_cv_auc

if __name__ == "__main__":
    from src.data_loader import load_dataset
    X, y, meta = load_dataset("synthetic_upi", num_samples=1000, seed=42)
    X_model = X.drop(columns=["gender", "city_tier"])
    tuner = OptunaHyperparameterTuner(n_trials=5, seed=42)
    params, score = tuner.optimize(X_model, y)
    print(f"Optuna Tuner test: Best CV ROC-AUC = {score:.4f}")
    print("Best params:", params)
