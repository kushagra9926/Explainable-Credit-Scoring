"""
Search space boundaries for PSO and Random Search Hyperparameter Tuning.
"""

PARAM_BOUNDS = {
    # Continuous / Discrete parameters mapped to normalized vector [0, 1]
    # 0: learning_rate (0.01 to 0.3)
    # 1: max_leaf_nodes (15 to 127)
    # 2: min_samples_leaf (10 to 100)
    # 3: l2_regularization (0.001 to 10.0)
    # 4: max_iter (50 to 300)
    "learning_rate": (0.01, 0.3),
    "max_leaf_nodes": (15, 127),
    "min_samples_leaf": (10, 100),
    "l2_regularization": (0.001, 10.0),
    "max_iter": (50, 300)
}
