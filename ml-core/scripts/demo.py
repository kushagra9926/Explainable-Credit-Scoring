import os
import joblib
import pandas as pd
import numpy as np
import shap

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "tuned_model.pkl")
DATA_PATH = os.path.join(BASE_DIR, "data", "raw", "german_credit.csv")

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


def original_feature(name):
    for attribute, friendly in FEATURE_NAMES.items():
        if attribute.lower() in name.lower():
            return friendly
    return name


def describe(feature, value, contribution):
    direction = "higher" if contribution > 0 else "lower"

    descriptions = {
        "Checking Account": {
            "A11": "The applicant has a checking account balance below 0 DM.",
            "A12": "The applicant has between 0 and 200 DM in the checking account.",
            "A13": "The applicant has at least 200 DM in the checking account.",
            "A14": "The applicant has no checking account."
        },
        "Credit History": {
            "A30": "The applicant has no credits or all previous credits were paid.",
            "A31": "Previous credits at this bank were paid.",
            "A32": "Existing credits have been paid duly.",
            "A33": "There were delays in paying previous credits.",
            "A34": "The applicant has a critical credit history."
        },
        "Savings Account": {
            "A61": "The applicant has less than 100 DM in savings.",
            "A62": "The applicant has between 100 and 500 DM in savings.",
            "A63": "The applicant has between 500 and 1000 DM in savings.",
            "A64": "The applicant has at least 1000 DM in savings.",
            "A65": "Savings information is unknown or unavailable."
        },
        "Employment Duration": {
            "A71": "The applicant is unemployed.",
            "A72": "The applicant has been employed for less than one year.",
            "A73": "The applicant has been employed for 1–4 years.",
            "A74": "The applicant has been employed for 4–7 years.",
            "A75": "The applicant has been employed for at least 7 years."
        },
        "Purpose of Loan": {
            "A40": "The loan is for a new car.",
            "A41": "The loan is for a used car.",
            "A42": "The loan is for furniture or equipment.",
            "A43": "The loan is for a radio or television.",
            "A44": "The loan is for domestic appliances.",
            "A45": "The loan is for repairs.",
            "A46": "The loan is for education.",
            "A47": "The loan is for vacation.",
            "A48": "The loan is for retraining.",
            "A49": "The loan is for business.",
            "A410": "The loan has another purpose."
        },
        "Personal Status": {
            "A91": "The applicant is male and divorced or separated.",
            "A92": "The applicant is female and divorced or married.",
            "A93": "The applicant is male and single.",
            "A94": "The applicant is male and married or widowed.",
            "A95": "The applicant is female and single."
        },
        "Housing": {
            "A151": "The applicant rents their home.",
            "A152": "The applicant owns their home.",
            "A153": "The applicant lives in housing provided for free."
        },
        "Property": {
            "A121": "The applicant owns real estate.",
            "A122": "The applicant has building-society savings or life insurance.",
            "A123": "The applicant owns a car or other property.",
            "A124": "Property information is unknown."
        },
    }

    if feature == "Loan Duration":
        text = f"The requested loan duration is {value} months."
    elif feature == "Credit Amount":
        text = f"The requested credit amount is {value} DM."
    elif feature == "Age":
        text = f"The applicant is {value} years old."
    elif feature == "Installment Rate":
        text = f"The installment rate is {value}."
    elif feature == "Years at Current Residence":
        text = f"The applicant has lived at the current residence for {value} years."
    elif feature == "Existing Credits":
        text = f"The applicant has {value} existing credit(s) at this bank."
    elif feature == "Dependents":
        text = f"The applicant has {value} dependent(s)."
    elif feature in descriptions and value in descriptions[feature]:
        text = descriptions[feature][value]
    else:
        text = f"The applicant's {feature.lower()} category was {value}."

    return f"{text} The model associated this factor with {direction} predicted risk."


def explain(pipeline, applicant):
    df = pd.DataFrame([applicant])

    prediction = int(pipeline.predict(df)[0])
    probability = float(pipeline.predict_proba(df)[0][1])
    score = round((1 - probability) * 100)

    preprocessor = pipeline.named_steps["preprocessor"]
    model = pipeline.named_steps["model"]

    transformed = preprocessor.transform(df)
    explainer = shap.TreeExplainer(model)
    values = explainer.shap_values(transformed)

    if isinstance(values, list):
        values = values[1][0]
    elif np.ndim(values) == 3:
        values = values[0, :, 1]
    else:
        values = values[0]

    names = preprocessor.get_feature_names_out()

    aggregated = {}

    for name, value in zip(names, values):
        feature = original_feature(name)
        aggregated[feature] = aggregated.get(feature, 0) + float(value)

    important = sorted(
        aggregated.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )

    return prediction, score, important


print("=" * 68)
print("              EXPLAINABLE CREDIT SCORING")
print("                    PRESENTATION DEMO")
print("=" * 68)
print()

print("Loading trained model...")
pipeline = joblib.load(MODEL_PATH)
data = pd.read_csv(DATA_PATH)
X = data.drop(columns=["class"])

print("Model loaded successfully.")
print()

# Find naturally occurring examples from the real dataset
scores = pipeline.predict_proba(X)[:, 0] * 100

targets = [
    ("HIGH CREDITWORTHINESS", 80),
    ("MEDIUM CREDITWORTHINESS", 50),
    ("LOW CREDITWORTHINESS", 20)
]

selected = []
available = set(range(len(X)))

for label, target in targets:
    index = min(
        available,
        key=lambda i: abs(scores[i] - target)
    )
    selected.append((label, index))
    available.remove(index)

print("Choose a demonstration:")
print()
print("1. High creditworthiness")
print("2. Medium creditworthiness")
print("3. Low creditworthiness")
print("4. Run all three")
print()

choice = input("Enter choice (1-4): ").strip()

if choice == "1":
    demos = [selected[0]]
elif choice == "2":
    demos = [selected[1]]
elif choice == "3":
    demos = [selected[2]]
elif choice == "4":
    demos = selected
else:
    print("Invalid choice.")
    raise SystemExit

for label, index in demos:

    applicant = X.iloc[index].to_dict()
    prediction, score, important = explain(pipeline, applicant)

    print()
    print()
    print("=" * 68)
    print(f"              {label}")
    print("=" * 68)
    print()

    if prediction == 1:
        print("Prediction            : BAD CREDIT RISK")
    else:
        print("Prediction            : GOOD CREDIT RISK")

    print(f"Creditworthiness Score : {score}/100")

    print()
    print("-" * 68)
    print("WHY DID THE MODEL MAKE THIS PREDICTION?")
    print("-" * 68)

    shown = 0

    for feature, contribution in important:

        if abs(contribution) < 0.05:
            continue

        value = applicant.get(
            next(
                (a for a, n in FEATURE_NAMES.items() if n == feature),
                ""
            ),
            ""
        )

        print()
        print(f"• {feature}")
        print("  " + describe(feature, value, contribution))

        shown += 1

        if shown == 5:
            break

    print()
    print("-" * 68)
    print("Explanation generated using SHAP feature contributions.")
    print("Creditworthiness Score is project-defined and is not")
    print("an official CIBIL or credit-bureau score.")
    print("-" * 68)

print()
print("=" * 68)
print("                       DEMO COMPLETE")
print("=" * 68)
