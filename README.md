# Explainable Credit Scoring

> **Explainable alternative-data credit scoring for gig workers ---
> current prototype validated on the UCI German Credit benchmark.**

## Overview

This project explores an explainable credit-scoring pipeline for gig
workers and other individuals who may have limited traditional credit
history but generate meaningful financial and behavioural signals.

The intended system will use alternative data such as:

* UPI transaction patterns
* income and cash-flow consistency
* mobile recharge behaviour
* utility-payment behaviour
* gig/platform earnings
* transaction regularity
* repayment behaviour

The key requirement is **explainability**: the system should not only
produce a risk prediction, but also show which features contributed to
that prediction.

### Current scope

The final goal is **not** to build a German Credit scoring system.

The current implementation uses the **UCI Statlog German Credit dataset
as a benchmark/proof of concept** because an appropriate real-world
gig-worker alternative-data dataset is not currently available.

The benchmark validates the technical pipeline:

```text
Benchmark Data
      ↓
Preprocessing
      ↓
Gradient Boosting
      ↓
PSO Hyperparameter Tuning
      ↓
Risk Prediction
      ↓
Creditworthiness Score
      ↓
SHAP Explanation
```

The next stage is to replace the benchmark data layer with appropriately
sourced alternative financial and behavioural data for gig workers.

---

## Project Goal

### Actual target

Build an explainable credit-risk assessment system for gig workers using
alternative financial and behavioural signals that can complement gaps
in traditional credit history.

### Current prototype

Validate the machine-learning and explainability pipeline using the
German Credit benchmark.

### Future direction

Move to an appropriate gig-worker dataset containing features derived
from sources such as:

* UPI activity
* platform earnings
* mobile recharges
* utility payments
* cash-flow patterns
* repayment outcomes

This transition requires not only new features, but also **credible
outcome labels** such as repayment/default behaviour.

---

## What Has Been Implemented

* UCI German Credit dataset preparation
* categorical and numerical feature preprocessing
* one-hot encoding
* Gradient Boosting baseline model
* Particle Swarm Optimization (PSO) for hyperparameter tuning
* validation/test separation for PSO evaluation
* SHAP-based model explanations
* model-generated creditworthiness score
* command-line prediction interface
* demonstration using naturally occurring benchmark records
* saved model and explainability artifacts

---

## Dataset

Property                       Value

---

Records                        1,000
Input features                    20
Categorical features              13
Numerical features                 7
Target                        Binary
Target `0`               Good Credit
Target `1`                Bad Credit

**Important:** this dataset contains traditional credit-related
attributes. It does **not** contain UPI history, recharge history,
utility payments, or gig-worker platform earnings.

Results from this benchmark demonstrate the technical pipeline, not the
performance of the eventual gig-worker application.

---

## Machine Learning Pipeline

### Baseline

The baseline uses a `GradientBoostingClassifier` with:

```text
n_estimators = 100
learning_rate = 0.1
max_depth = 3
random_state = 42
```

Categorical features are one-hot encoded using:

```text
OneHotEncoder(handle_unknown="ignore")
```

The baseline uses an 80/20 stratified train/test split.

### Baseline results

Metric        Result

---

Accuracy      79.50%
Precision     69.39%
Recall        56.67%
F1 Score      62.39%

Confusion matrix:

```text
[[125  15]
 [ 26  34]]
```

---

## PSO Hyperparameter Tuning

Particle Swarm Optimization was implemented to search for Gradient
Boosting hyperparameters.

### Search space

```text
n_estimators   : 50–200
learning_rate  : 0.01–0.30
max_depth      : 2–6
```

### Configuration

```text
Particles   : 8
Iterations  : 10
Objective   : Validation F1
```

The corrected evaluation workflow separates:

```text
600 samples → Training
200 samples → Validation / PSO objective
200 samples → Held-out Test
```

Selected configuration:

```text
n_estimators  = 69
learning_rate = 0.2826
max_depth     = 5
```

### Tuned test results

Metric        Result

---

Accuracy      75.50%
Precision     60.00%
Recall        55.00%
F1 Score      57.39%

PSO was successfully implemented and evaluated, but the selected
configuration **did not outperform the baseline** on the held-out test
set.

---

## Explainability with SHAP

The project uses **SHAP (SHapley Additive exPlanations)** with a
tree-based explainer to identify features contributing to individual
predictions.

Because categorical variables are one-hot encoded during preprocessing,
SHAP contributions are aggregated back to the original human-readable
features.

Example factors include:

```text
Credit Amount
Loan Duration
Savings Account
Purpose of Loan
Credit History
```

SHAP describes the model's contribution/association for a prediction. It
should **not** be interpreted as proof that a feature causally caused a
person's credit outcome.

---

## Creditworthiness Score

The prototype converts the predicted probability of bad credit into a
project-defined score:

```text
Creditworthiness Score =
round((1 - P(Bad Credit)) × 100)
```

Higher predicted bad-credit probability produces a lower score.

This is a **project-defined demonstration metric**. It is not a CIBIL
score, FICO score, official banking score, or regulatory credit rating.

---

## Prediction & Demo

### `predict.py`

The prediction interface:

1. accepts applicant feature values
2. loads the trained model
3. predicts credit risk
4. calculates the project-defined score
5. generates SHAP explanations
6. displays the top contributing features

### `demo.py`

The demo selects naturally occurring records from the benchmark dataset
whose model-generated scores are close to selected score ranges.

Demo case      Score Prediction

---

High          80/100 Good Credit Risk
Medium        49/100 Bad Credit Risk
Low           21/100 Bad Credit Risk

These examples demonstrate prototype behaviour; they are not real-world
credit decisions.

---

## From Benchmark to Gig-Worker Alternative Data

The eventual system can transform raw financial activity into
model-ready features.

### UPI / cash-flow

* monthly inflow/outflow
* transaction frequency
* average transaction amount
* income volatility
* inflow trend
* inflow/outflow ratio
* recurring transaction consistency
* balance trends

### Mobile recharge

* recharge frequency
* average recharge amount
* recharge regularity

### Utility payments

* payment consistency
* delayed/missed payments
* payment-cycle regularity

### Gig/platform activity

* monthly/weekly earnings
* earnings volatility
* active working days
* payout frequency
* platform tenure
* number of platforms

### Repayment behaviour

* on-time payments
* missed payments
* repayment consistency
* default/repayment outcome

The final feature set should depend on data that can be obtained
legitimately and with appropriate consent.

---

## Why Labels Matter

Alternative financial data alone is not sufficient for supervised
credit-risk modelling.

A real training dataset needs a meaningful outcome, such as:

```text
Repayment on time
Payment delayed
Default
Loan successfully repaid
```

The model can then learn relationships between financial behaviour and a
defined credit outcome.

Random or arbitrary labels would not provide credible evidence of
real-world credit risk.

---

## Privacy, Ethics & Responsible Use

A real-world version would require appropriate controls around financial
data, including:

* informed consent
* data minimization
* purpose limitation
* anonymization or pseudonymization where appropriate
* secure storage and access control
* transparent explanations
* fairness and bias evaluation
* appropriate governance and regulatory review

The current benchmark prototype does not claim production or regulatory
readiness.

---

## Repository Structure

```text
explainable-credit-scoring/
│
├── ml-core/
│   ├── data/                 # Dataset and data-related files
│   ├── models/               # Trained model artifacts
│   ├── artifacts/            # Metrics, plots and generated artifacts
│   ├── scripts/              # Training, tuning, SHAP and utility scripts
│   └── requirements.txt
│
├── inference-service/        # Prediction API service
├── backend/                  # Application backend
├── frontend/                 # User interface
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

The ML core handles model development and explainability. Application
services can consume the resulting model artifacts for inference.

---

## Getting Started

### 1. Create a Python environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python -m venv .venv
source .venv/bin/activate
```

### 2. Install ML dependencies

```bash
pip install -r ml-core/requirements.txt
```

### 3. Run the ML pipeline

```bash
cd ml-core

python scripts/train_baseline.py
python scripts/run_pso_tuning.py
python scripts/generate_shap_artifacts.py
```

---

## Current Status

```text
[✓] Benchmark dataset prepared
[✓] Data preprocessing
[✓] Gradient Boosting baseline
[✓] Baseline evaluation
[✓] PSO hyperparameter tuning
[✓] Held-out test evaluation
[✓] SHAP explainability
[✓] Creditworthiness score
[✓] CLI prediction
[✓] Demonstration workflow

[→] Alternative-data dataset design
[→] Gig-worker feature engineering
[→] Meaningful real-world outcome labels
[ ] Real gig-worker alternative-data model
[ ] Real-world validation and fairness evaluation
```

---

## Limitations

1. **Benchmark domain:** German Credit represents traditional credit
   attributes, not gig-worker alternative financial behaviour.
2. **No live financial data:** the current model does not use real UPI,
   recharge, utility, or platform-earnings data.
3. **Labels:** a future real-world dataset requires credible repayment
   or default outcomes.
4. **Score meaning:** the 0--100 score is project-defined and not an
   official credit score.
5. **Model performance:** PSO did not outperform the baseline in the
   current experiment.
6. **Generalization:** benchmark performance does not establish
   performance on Indian gig workers.
7. **Responsible deployment:** real financial-data usage would require
   appropriate consent, privacy, governance, fairness testing, and
   validation.

---

## Roadmap

### Phase 1 --- Benchmark validation

* [x] Prepare benchmark dataset
* [x] Train baseline model
* [x] Evaluate baseline
* [x] Implement PSO tuning
* [x] Evaluate tuned model
* [x] Add SHAP explanations
* [x] Build prediction/demo workflow

### Phase 2 --- Alternative-data prototype

* [ ] Identify an appropriate ethically sourced dataset
* [ ] Define gig-worker-specific features
* [ ] Build UPI/recharge/utility/platform feature engineering
* [ ] Define credible credit-outcome labels
* [ ] Retrain and evaluate the model
* [ ] Compare model performance across feature groups

### Phase 3 --- Responsible real-world system

* [ ] Validate generalization on appropriate populations
* [ ] Evaluate fairness and potential bias
* [ ] Implement privacy and consent controls
* [ ] Integrate inference/application services
* [ ] Conduct appropriate security, governance and compliance review

---

## Key Takeaway

This project is **not claiming that German Credit data solves gig-worker
credit assessment**.

Instead, the current work establishes a working and explainable ML
pipeline that can be adapted to the actual target problem:

```text
German Credit Benchmark
        ↓
Validate ML + PSO + SHAP Pipeline
        ↓
Alternative Financial Data
        ↓
Gig-Worker Feature Engineering
        ↓
Meaningful Credit Outcomes
        ↓
Explainable Credit Scoring
```

The benchmark validates the **technical foundation**; the next major
step is validating the approach on appropriate **gig-worker alternative
data**.

---

## License

This project is released under the MIT License.
