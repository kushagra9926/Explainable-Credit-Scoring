import os
import joblib
import pandas as pd
import shap
import matplotlib.pyplot as plt


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_PATH = os.path.join(
    BASE_DIR, "data", "raw", "german_credit.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR, "models", "tuned_model.pkl"
)

MODEL_DIR = os.path.join(BASE_DIR, "models")
ARTIFACT_DIR = os.path.join(BASE_DIR, "artifacts")

os.makedirs(ARTIFACT_DIR, exist_ok=True)


# --------------------------------------------------
# Load data and model
# --------------------------------------------------

print("Loading dataset...")

df = pd.read_csv(DATA_PATH)

X = df.drop(columns=["class"])

print("Loading tuned model...")

pipeline = joblib.load(MODEL_PATH)


# --------------------------------------------------
# Transform the data
# --------------------------------------------------

preprocessor = pipeline.named_steps["preprocessor"]
model = pipeline.named_steps["model"]

X_transformed = preprocessor.transform(X)

feature_names = preprocessor.get_feature_names_out()

X_transformed_df = pd.DataFrame(
    X_transformed,
    columns=feature_names
)


# --------------------------------------------------
# Create SHAP explainer
# --------------------------------------------------

print("Creating SHAP explainer...")

explainer = shap.TreeExplainer(model)

# Explain a small sample rather than all 1000 rows
X_sample = X_transformed_df.iloc[:100]

shap_values = explainer.shap_values(X_sample)


# --------------------------------------------------
# Save SHAP explainer
# --------------------------------------------------

explainer_path = os.path.join(
    MODEL_DIR,
    "shap_explainer.pkl"
)

joblib.dump(explainer, explainer_path)

print(f"SHAP explainer saved to:")
print(explainer_path)


# --------------------------------------------------
# Generate summary plot
# --------------------------------------------------

print("Generating SHAP summary plot...")

plt.figure()

shap.summary_plot(
    shap_values,
    X_sample,
    show=False
)

plt.tight_layout()

plot_path = os.path.join(
    ARTIFACT_DIR,
    "shap_summary_plot.png"
)

plt.savefig(
    plot_path,
    dpi=200,
    bbox_inches="tight"
)

plt.close()

print(f"SHAP summary plot saved to:")
print(plot_path)

print("\nDONE.")