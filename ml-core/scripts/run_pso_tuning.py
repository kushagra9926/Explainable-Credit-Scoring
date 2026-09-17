import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)

import pyswarms as ps


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_PATH = os.path.join(
    BASE_DIR, "data", "raw", "german_credit.csv"
)

MODEL_DIR = os.path.join(BASE_DIR, "models")
ARTIFACT_DIR = os.path.join(BASE_DIR, "artifacts")

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)


# --------------------------------------------------
# Load dataset
# --------------------------------------------------

print("Loading dataset...")

df = pd.read_csv(DATA_PATH)

X = df.drop(columns=["class"])
y = df["class"].map({1: 0, 2: 1})


# --------------------------------------------------
# Feature types
# --------------------------------------------------

categorical_columns = X.select_dtypes(
    include=["object"]
).columns.tolist()

numerical_columns = X.select_dtypes(
    exclude=["object"]
).columns.tolist()


# --------------------------------------------------
# Preprocessor
# --------------------------------------------------

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_columns,
        ),
        (
            "numerical",
            "passthrough",
            numerical_columns,
        ),
    ]
)


# --------------------------------------------------
# Train / validation / test
# --------------------------------------------------

X_temp, X_test, y_temp, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

X_train, X_val, y_train, y_val = train_test_split(
    X_temp,
    y_temp,
    test_size=0.25,
    random_state=42,
    stratify=y_temp,
)

print(f"Training samples   : {len(X_train)}")
print(f"Validation samples : {len(X_val)}")
print(f"Testing samples    : {len(X_test)}")


# --------------------------------------------------
# Fitness function
# --------------------------------------------------

def fitness_function(particles):

    scores = []

    for particle in particles:

        n_estimators = int(round(particle[0]))
        learning_rate = float(particle[1])
        max_depth = int(round(particle[2]))

        model = GradientBoostingClassifier(
            n_estimators=n_estimators,
            learning_rate=learning_rate,
            max_depth=max_depth,
            random_state=42,
        )

        pipeline = Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("model", model),
            ]
        )

        pipeline.fit(X_train, y_train)

        predictions = pipeline.predict(X_val)

        f1 = f1_score(y_val, predictions)

        scores.append(-f1)

    return np.array(scores)


# --------------------------------------------------
# PSO
# --------------------------------------------------

print("\nStarting PSO optimization...")

options = {
    "c1": 0.5,
    "c2": 0.3,
    "w": 0.9,
}

lower_bounds = np.array([
    50,
    0.01,
    2,
])

upper_bounds = np.array([
    200,
    0.30,
    6,
])

bounds = (lower_bounds, upper_bounds)


optimizer = ps.single.GlobalBestPSO(
    n_particles=8,
    dimensions=3,
    options=options,
    bounds=bounds,
)


best_cost, best_position = optimizer.optimize(
    fitness_function,
    iters=10,
)


best_n_estimators = int(round(best_position[0]))
best_learning_rate = float(best_position[1])
best_max_depth = int(round(best_position[2]))


print("\n==============================")
print("PSO OPTIMIZATION COMPLETE")
print("==============================")

print(f"Best n_estimators : {best_n_estimators}")
print(f"Best learning_rate: {best_learning_rate:.4f}")
print(f"Best max_depth    : {best_max_depth}")
print(f"Validation F1     : {-best_cost:.4f}")


# --------------------------------------------------
# Train final model on train + validation
# --------------------------------------------------

print("\nTraining final tuned model...")

X_final_train = pd.concat([X_train, X_val])
y_final_train = pd.concat([y_train, y_val])


final_model = GradientBoostingClassifier(
    n_estimators=best_n_estimators,
    learning_rate=best_learning_rate,
    max_depth=best_max_depth,
    random_state=42,
)


final_pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", final_model),
    ]
)


final_pipeline.fit(
    X_final_train,
    y_final_train,
)


# --------------------------------------------------
# Final test evaluation
# --------------------------------------------------

print("\n==============================")
print("TUNED MODEL TEST RESULTS")
print("==============================")


test_predictions = final_pipeline.predict(X_test)


tuned_metrics = {
    "model": "PSO-Tuned Gradient Boosting",
    "accuracy": accuracy_score(y_test, test_predictions),
    "precision": precision_score(y_test, test_predictions),
    "recall": recall_score(y_test, test_predictions),
    "f1_score": f1_score(y_test, test_predictions),
}


print(f"Accuracy : {tuned_metrics['accuracy']:.4f}")
print(f"Precision: {tuned_metrics['precision']:.4f}")
print(f"Recall   : {tuned_metrics['recall']:.4f}")
print(f"F1 Score : {tuned_metrics['f1_score']:.4f}")


# --------------------------------------------------
# Save model
# --------------------------------------------------

model_path = os.path.join(
    MODEL_DIR,
    "tuned_model.pkl",
)

joblib.dump(final_pipeline, model_path)

print("\nTuned model saved to:")
print(model_path)


# --------------------------------------------------
# Save metrics
# --------------------------------------------------

metrics_path = os.path.join(
    ARTIFACT_DIR,
    "tuned_metrics.json",
)

with open(metrics_path, "w") as f:
    json.dump(tuned_metrics, f, indent=4)


print("\nMetrics saved to:")
print(metrics_path)

print("\nDONE.")