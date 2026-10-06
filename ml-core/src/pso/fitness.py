"""
Fitness Function for Particle Swarm Optimization & Random Search.
Evaluates candidate hyperparameter vectors via 5-Fold Stratified Cross Validation.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score
from src.gb_model import MonotonicGradientBoostingScorer
from src.pso.config import PARAM_BOUNDS

def decode_hyperparameters(vector: np.ndarray) -> Dict[str, Any]:
    """
    Decodes normalized array [x0, x1, x2, x3, x4] in range [0, 1]
    to valid HistGradientBoosting hyperparameters.
    """
    lr_min, lr_max = PARAM_BOUNDS["learning_rate"]
    leaf_min, leaf_max = PARAM_BOUNDS["max_leaf_nodes"]
    min_samp_min, min_samp_max = PARAM_BOUNDS["min_samples_leaf"]
    l2_min, l2_max = PARAM_BOUNDS["l2_regularization"]
    iter_min, iter_max = PARAM_BOUNDS["max_iter"]

    # Clamp vector
    v = np.clip(vector, 0.0, 1.0)

    learning_rate = float(lr_min + v[0] * (lr_max - lr_min))
    max_leaf_nodes = int(round(leaf_min + v[1] * (leaf_max - leaf_min)))
    min_samples_leaf = int(round(min_samp_min + v[2] * (min_samp_max - min_samp_min)))
    l2_reg = float(l2_min + v[3] * (l2_max - l2_min))
    max_iter = int(round(iter_min + v[4] * (iter_max - iter_min)))

    return {
        "learning_rate": learning_rate,
        "max_leaf_nodes": max_leaf_nodes,
        "min_samples_leaf": min_samples_leaf,
        "l2_regularization": l2_reg,
        "max_iter": max_iter
    }

def evaluate_fitness_single(vector: np.ndarray, X: pd.DataFrame, y: pd.Series, cv_splits: int = 5, seed: int = 42) -> float:
    """
    Returns negative mean ROC-AUC across 5-fold CV (lower is better for minimization).
    """
    params = decode_hyperparameters(vector)
    skf = StratifiedKFold(n_splits=cv_splits, shuffle=True, random_state=seed)
    scores = []

    for train_idx, val_idx in skf.split(X, y):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]

        model = MonotonicGradientBoostingScorer(
            learning_rate=params["learning_rate"],
            max_leaf_nodes=params["max_leaf_nodes"],
            min_samples_leaf=params["min_samples_leaf"],
            l2_regularization=params["l2_regularization"],
            max_iter=params["max_iter"],
            random_state=seed
        )
        try:
            model.fit(X_train, y_train)
            probs = model.predict_proba(X_val)[:, 1]
            auc = roc_auc_score(y_val, probs)
            scores.append(auc)
        except Exception:
            scores.append(0.5)

    mean_auc = float(np.mean(scores))
    return -mean_auc  # PySwarms minimizes fitness function

def evaluate_fitness_batch(particles: np.ndarray, X: pd.DataFrame, y: pd.Series, cv_splits: int = 5, seed: int = 42) -> np.ndarray:
    """
    Evaluates a batch of particles for PySwarms API.
    """
    n_particles = particles.shape[0]
    losses = np.zeros(n_particles)
    for i in range(n_particles):
        losses[i] = evaluate_fitness_single(particles[i], X, y, cv_splits=cv_splits, seed=seed)
    return losses
