import os
import joblib
import pandas as pd
import numpy as np


# ============================================================
# FEATURE INFORMATION
# ============================================================

FEATURE_NAMES = {
    "Attribute1": "Checking Account",
    "Attribute2": "Loan Duration",
    "Attribute3": "Credit History",
    "Attribute4": "Purpose of Loan",
    "Attribute5": "Credit Amount",
    "Attribute6": "Savings Account",
    "Attribute7": "Employment Duration",
    "Attribute8": "Installment Rate",
    "Attribute9": "Personal Status",
    "Attribute10": "Other Debtors / Guarantors",
    "Attribute11": "Years at Current Residence",
    "Attribute12": "Property",
    "Attribute13": "Age",
    "Attribute14": "Other Installment Plans",
    "Attribute15": "Housing",
    "Attribute16": "Existing Credits",
    "Attribute17": "Job Type",
    "Attribute18": "Dependents",
    "Attribute19": "Telephone",
    "Attribute20": "Foreign Worker",
}


# ============================================================
# INPUT OPTIONS
# ============================================================

OPTIONS = {
    "Attribute1": {
        "A11": "< 0 DM",
        "A12": "0 - 200 DM",
        "A13": ">= 200 DM",
        "A14": "No checking account",
    },

    "Attribute3": {
        "A30": "No credits / all paid",
        "A31": "All credits at this bank paid",
        "A32": "Existing credits paid duly",
        "A33": "Delay in paying previous credits",
        "A34": "Critical account / other credits",
    },

    "Attribute4": {
        "A40": "New car",
        "A41": "Used car",
        "A42": "Furniture/equipment",
        "A43": "Radio/television",
        "A44": "Domestic appliances",
        "A45": "Repairs",
        "A46": "Education",
        "A47": "Vacation",
        "A48": "Retraining",
        "A49": "Business",
        "A410": "Other",
    },

    "Attribute6": {
        "A61": "< 100 DM",
        "A62": "100 - 500 DM",
        "A63": "500 - 1000 DM",
        "A64": ">= 1000 DM",
        "A65": "Unknown / no savings",
    },

    "Attribute7": {
        "A71": "Unemployed",
        "A72": "< 1 year",
        "A73": "1 - 4 years",
        "A74": "4 - 7 years",
        "A75": ">= 7 years",
    },

    "Attribute9": {
        "A91": "Male, divorced/separated",
        "A92": "Female, divorced/separated/married",
        "A93": "Male, single",
        "A94": "Male, married/widowed",
        "A95": "Female, single",
    },

    "Attribute10": {
        "A101": "None",
        "A102": "Co-applicant",
        "A103": "Guarantor",
    },

    "Attribute12": {
        "A121": "Real estate",
        "A122": "Building society savings / life insurance",
        "A123": "Car or other property",
        "A124": "Unknown / no property",
    },

    "Attribute14": {
        "A141": "Bank",
        "A142": "Stores",
        "A143": "None",
    },

    "Attribute15": {
        "A151": "Rent",
        "A152": "Own",
        "A153": "For free",
    },

    "Attribute17": {
        "A171": "Unemployed / unskilled non-resident",
        "A172": "Unskilled resident",
        "A173": "Skilled employee / official",
        "A174": "Management / self-employed / highly qualified",
    },

    "Attribute19": {
        "A191": "None",
        "A192": "Yes",
    },

    "Attribute20": {
        "A201": "Yes",
        "A202": "No",
    },
}


# ============================================================
# MODEL LOADING
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "tuned_model.pkl")

print("=" * 60)
print("           EXPLAINABLE CREDIT SCORING SYSTEM")
print("=" * 60)
print()

print("Loading trained model...")

pipeline = joblib.load(MODEL_PATH)

print("Model loaded successfully.")
print()
print("Enter applicant information.")
print()


# ============================================================
# COLLECT INPUT
# ============================================================

values = {}

for i in range(1, 21):

    attribute = f"Attribute{i}"

    if attribute in OPTIONS:

        print(f"{i}. {FEATURE_NAMES[attribute]}:")

        for code, description in OPTIONS[attribute].items():
            print(f"  {code}: {description}")

        value = input("\nEnter choice: ").strip()

    elif attribute == "Attribute2":

        value = input("2. Loan duration (months): ").strip()
        value = int(value)

    elif attribute == "Attribute5":

        value = input("5. Credit amount: ").strip()
        value = int(value)

    elif attribute == "Attribute8":

        value = input("8. Installment rate (1-4): ").strip()
        value = int(value)

    elif attribute == "Attribute11":

        value = input("11. Years at current residence (1-4): ").strip()
        value = int(value)

    elif attribute == "Attribute13":

        value = input("13. Age: ").strip()
        value = int(value)

    elif attribute == "Attribute16":

        value = input("16. Number of existing credits at this bank: ").strip()
        value = int(value)

    elif attribute == "Attribute18":

        value = input("18. Number of dependents: ").strip()
        value = int(value)

    else:

        value = input(f"{i}. {FEATURE_NAMES[attribute]}: ").strip()

    values[attribute] = value


# ============================================================
# CREATE DATAFRAME
# ============================================================

input_df = pd.DataFrame([values])


# ============================================================
# PREDICTION
# ============================================================

prediction = pipeline.predict(input_df)[0]

probabilities = pipeline.predict_proba(input_df)[0]

bad_probability = probabilities[1]

creditworthiness_score = round((1 - bad_probability) * 100)


print()
print("=" * 60)
print("                    CREDIT ASSESSMENT")
print("=" * 60)

if prediction == 1:
    print("Prediction   : BAD CREDIT RISK")
else:
    print("Prediction   : GOOD CREDIT RISK")

print(f"Creditworthiness Score : {creditworthiness_score}/100")

print("=" * 60)


# ============================================================
# SHAP EXPLANATION
# ============================================================

print()
print("WHY DID THE MODEL MAKE THIS PREDICTION?")
print("-" * 60)

try:

    import shap

    # The model is a pipeline:
    # preprocessing -> GradientBoostingClassifier

    preprocessor = pipeline.named_steps["preprocessor"]
    model = pipeline.named_steps["model"]

    transformed_input = preprocessor.transform(input_df)

    explainer = shap.TreeExplainer(model)

    shap_values = explainer.shap_values(transformed_input)

    # Handle SHAP output format
    if isinstance(shap_values, list):
        shap_values = shap_values[1][0]
    elif len(np.shape(shap_values)) == 3:
        shap_values = shap_values[0, :, 1]
    else:
        shap_values = shap_values[0]

    # Get transformed feature names
    transformed_names = preprocessor.get_feature_names_out()

    # --------------------------------------------------------
    # AGGREGATE ONE-HOT ENCODED FEATURES
    # --------------------------------------------------------

    aggregated = {}

    for feature_name, shap_value in zip(
        transformed_names,
        shap_values
    ):

        original_feature = None

        # Find which original Attribute produced this column
        for attribute, friendly_name in FEATURE_NAMES.items():

            if attribute.lower() in feature_name.lower():

                original_feature = friendly_name
                break

        # Fallback
        if original_feature is None:
            original_feature = feature_name

        if original_feature not in aggregated:
            aggregated[original_feature] = 0.0

        aggregated[original_feature] += float(shap_value)


    # --------------------------------------------------------
    # SORT BY ABSOLUTE IMPACT
    # --------------------------------------------------------

    sorted_features = sorted(
        aggregated.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )


    # --------------------------------------------------------
    # DISPLAY TOP 5
    # --------------------------------------------------------

    for feature, contribution in sorted_features[:5]:

        if contribution > 0:
            effect = "INCREASED RISK"
        else:
            effect = "DECREASED RISK"

        print(
            f"{feature:<35}"
            f"{effect:<18}"
            f"SHAP: {contribution:+.2f}"
        )

except Exception as e:

    print("SHAP explanation could not be generated.")
    print(f"Reason: {e}")


print("-" * 60)
print()
print("Note: This is an academic demonstration model.")
print("The Creditworthiness Score is project-defined and")
print("is not an official CIBIL or credit-bureau score.")
print()