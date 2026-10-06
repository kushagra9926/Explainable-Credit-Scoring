"""
Particle Swarm Optimization (PSO) and Random Search Hyperparameter Tuners.
Fairly compares PSO against Random Search under equal evaluation budget.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List
import pyswarms as ps
from src.pso.fitness import evaluate_fitness_batch, evaluate_fitness_single, decode_hyperparameters

class PSOHyperparameterTuner:
    def __init__(self, n_particles: int = 12, iters: int = 8, seed: int = 42):
        self.n_particles = n_particles
        self.iters = iters
        self.total_evaluations = n_particles * iters
        self.seed = seed

    def optimize(self, X: pd.DataFrame, y: pd.Series) -> Tuple[Dict[str, Any], float, List[float]]:
        options = {'c1': 0.5, 'c2': 0.3, 'w': 0.9}
        dimensions = 5
        bounds = (np.zeros(dimensions), np.ones(dimensions))

        optimizer = ps.single.GlobalBestPSO(
            n_particles=self.n_particles,
            dimensions=dimensions,
            options=options,
            bounds=bounds
        )

        def f_wrapper(particles):
            return evaluate_fitness_batch(particles, X, y, cv_splits=5, seed=self.seed)

        best_cost, best_pos = optimizer.optimize(f_wrapper, iters=self.iters, verbose=False)
        best_auc = -best_cost
        best_params = decode_hyperparameters(best_pos)
        
        # Convert cost history to positive AUC history
        auc_history = [-c for c in optimizer.cost_history]

        return best_params, float(best_auc), auc_history


class RandomSearchTuner:
    def __init__(self, total_evaluations: int = 96, seed: int = 42):
        self.total_evaluations = total_evaluations
        self.seed = seed

    def optimize(self, X: pd.DataFrame, y: pd.Series) -> Tuple[Dict[str, Any], float, List[float]]:
        rng = np.random.RandomState(self.seed)
        best_auc = -1.0
        best_params = None
        history = []

        for i in range(self.total_evaluations):
            vec = rng.uniform(0.0, 1.0, size=5)
            loss = evaluate_fitness_single(vec, X, y, cv_splits=5, seed=self.seed)
            auc = -loss
            if auc > best_auc:
                best_auc = auc
                best_params = decode_hyperparameters(vec)
            history.append(best_auc)

        return best_params, float(best_auc), history

if __name__ == "__main__":
    X_dummy = pd.DataFrame(np.random.randn(100, 5), columns=[f"f_{i}" for i in range(5)])
    y_dummy = pd.Series(np.random.randint(0, 2, 100))
    pso = PSOHyperparameterTuner(n_particles=6, iters=3)
    params, auc, hist = pso.optimize(X_dummy, y_dummy)
    print("PSO optimization output:", params, "Best AUC:", auc)
