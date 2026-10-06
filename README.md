# Explainable Credit Scoring Engine for Gig & Informal Workers

[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-3.0.0-emerald.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](https://reactjs.org/)
[![Optuna](https://img.shields.io/badge/Optuna-Bayesian_Tuning-orange.svg)](https://optuna.org/)
[![SHAP](https://img.shields.io/badge/SHAP-Explainable_AI-purple.svg)](https://shap.readthedocs.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Project Overview

The **Explainable Credit Scoring Engine** is an academic research and software system designed to assess credit risk for informal gig-economy workers (such as ride-hailing drivers, delivery partners, micro-vendors, and freelancers) using alternative behavioral and financial data. 

Traditional credit scoring models rely heavily on formal credit bureau histories (e.g., CIBIL or FICO scores) and payslips. Informal workers frequently lack formal credit histories, resulting in credit invisibility. This project bridges that gap by evaluating non-traditional financial signals—such as cash-flow consistency, UPI transaction frequency, mobile recharge regularity, utility payment punctuality, and platform income stability—to produce explainable risk probabilities and creditworthiness scores.

---

## 2. Problem Statement

Informal and gig workers represent over 70% of the workforce in developing economies like India. However, they face systemic exclusion from formal banking credit due to:
1. **Lack of Credit Bureau Records**: Absence of prior loan history leads to automated credit rejection.
2. **Volatile Cash Flows**: Daily or weekly platform earnings fluctuate dynamically, making static income criteria unviable.
3. **Black-Box AI Risk**: Modern machine learning models often act as opaque black boxes, violating consumer rights to receive transparent explanations for credit decisions.

---

## 3. Motivation

Developing an alternative data-driven credit risk assessment model allows financial institutions to extend credit safely to underbanked populations. By embedding **Monotonic Constraints** and **SHAP (SHapley Additive exPlanations)** directly into the model, financial institutions can explain every credit approval, review, or rejection to applicants while guaranteeing domain-consistent decision logic.

---

## 4. Research Question

> *"Can alternative behavioral indicators (e.g., transaction frequency, income volatility, utility payment punctuality) modeled through monotonic gradient boosting deliver high predictive accuracy for gig-worker default risk while maintaining rigorous mathematical explainability and demographic fairness?"*

---

## 5. Important Scope Clarification

To ensure full academic integrity and real-world compliance during evaluation:

> [!IMPORTANT]
> **Data Provenance Disclaimer**:
> 1. **Synthetic Gig-Worker Data**: Reliably obtaining private banking/UPI data from real financial institutions is constrained by bank privacy regulations. Therefore, all gig-worker UPI data used in this project is synthesized using a physics-grounded daily transaction simulator (`UPIGigWorkerSimulator`). We NEVER claim synthetic data is real bank data.
> 2. **Authentic Benchmark Data**: The project is validated against the authentic 30,000-record **UCI Default of Credit Card Clients** dataset (Dataset ID 350) downloaded directly from the official UCI Machine Learning Repository.
> 3. **Project Score vs Bureau Scores**: The generated **Creditworthiness Score (0–100 scale)** is a project-defined mathematical transformation (`(1 - P(default)) × 100`). It is NOT a CIBIL or FICO score.
> 4. **SHAP Interpretation**: SHAP feature attributions describe feature contribution to the model's prediction, NOT causal proof of applicant default behavior.

---

## 6. System Architecture

The system supports a bank-adaptable deployment architecture where raw customer data stays inside the bank's internal environment:

```
+-------------------------------------------------------------------------------+
|                             BANK INTERNAL ENVIRONMENT                         |
|                                                                               |
|   +-----------------------+           +----------------------------------+   |
|   | Raw Bank Customer Data|  -------> |   Bank Specific Feature Adapter  |   |
|   | (UPI / Savings Logs)  |           | (Bank Alpha / Bank Beta Config)  |   |
|   +-----------------------+           +----------------------------------+   |
+-------------------------------------------------------|-----------------------+
                                                        v
                                        +----------------------------------+
                                        | Canonical Credit Feature Schema  |
                                        +----------------------------------+
                                                        |
                                                        v
                                        +----------------------------------+
                                        |  Credit Feature Preprocessor     |
                                        |   (Fit on Training Data Only)    |
                                        +----------------------------------+
                                                        |
                                                        v
                                        +----------------------------------+
                                        | Monotonic HistGradientBoosting   |
                                        |       Scoring Classifier         |
                                        +----------------------------------+
                                                        |
                                       +----------------+----------------+
                                       |                                 |
                                       v                                 v
                        +----------------------------+   +-------------------------------+
                        |   P(Default) Probability   |   |   SHAP Attribution Engine     |
                        |            &               |   |   (Local & Global Drivers)    |
                        | Project Score (0-100 scale)|   |                               |
                        +----------------------------+   +-------------------------------+
                                       \                                 /
                                        \                               /
                                         v                             v
                                     +-------------------------------------+
                                     |  Prediction + Explanation Response  |
                                     +-------------------------------------+
```

---

## 7. End-to-End Pipeline

1. **Schema Translation**: `BankFeatureAdapter` maps internal bank columns to `CanonicalCreditFeatures`.
2. **Preprocessing**: Missing values filled, continuous features standard-scaled, categorical features one-hot encoded (fitted strictly on training split).
3. **Model Scoring**: Monotonic Gradient Boosting Classifier computes default probability $P(\text{default})$.
4. **Score Calculation**: $P(\text{default})$ is converted to a 0–100 Creditworthiness Score and a 300–900 Credit Score.
5. **Decision & Risk Tier**: Thresholded into `APPROVED`, `MANUAL_REVIEW`, or `REJECTED`.
6. **SHAP Explanation**: `CreditSHAPExplainer` calculates exact feature contributions for positive (risk-increasing) and negative (protective) factors.
7. **Fairness Audit**: Computes Demographic Parity and Disparate Impact Ratio across protected groups.

---

## 8. Dataset

### Public Real Benchmark Dataset
- **Name**: UCI Default of Credit Card Clients Dataset (ID: 350)
- **Source**: [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients)
- **Dimensions**: 30,000 records × 24 features (+ target)
- **Target**: `default_label` (1 = default next month, 0 = on-time)
- **Provenance**: Downloaded directly via `UCIDefaultLoader` and saved to `ml-core/data/uci/`.

### Synthetic Gig-Worker / UPI Dataset
- **Dimensions**: 2,500 applicants (6–12 months of daily simulated transaction streams)
- **Location**: `ml-core/data/synthetic/synthetic_upi_gig_workers.csv`
- **Metadata**: Saved to `ml-core/data/synthetic/metadata.json`
- **Class Balance**: ~13.0% default rate, 87.0% non-default rate.

---

## 9. Feature Engineering

The canonical alternative credit feature contract comprises:

| Feature Name | Type | Description |
| :--- | :--- | :--- |
| `monthly_inflow_avg` | Float | Average monthly total credits/inflows (INR) |
| `monthly_outflow_avg` | Float | Average monthly total debits/outflows (INR) |
| `inflow_volatility` | Float | Coefficient of variation of monthly income ($\sigma / \mu$) |
| `inflow_outflow_ratio` | Float | Coverage ratio of monthly inflow over outflow |
| `active_days_ratio` | Float | Fraction of days with positive earnings ($[0, 1]$) |
| `utility_punctuality_score` | Float | Ratio of on-time utility/rent payments ($[0, 1]$) |
| `recharge_regularity_index` | Float | Index of mobile data recharge regularity ($[0, 1]$) |
| `avg_transaction_value` | Float | Mean transaction ticket size (INR) |
| `peak_daily_inflow` | Float | Highest single-day earnings (INR) |
| `emergency_drawdown_count` | Int | Frequency of rapid balance drains post-payout |
| `zero_balance_days` | Int | Count of days account balance dropped to near zero |
| `platform_diversity` | Int | Number of distinct gig platforms sending payouts |
| `tenure_months` | Int | Total account observation history in months |

---

## 10. Model

### Baseline Model
- **Logistic Regression**: Standard benchmark fitted on preprocessed features with $L_2$ regularization.

### Production Model
- **Monotonic HistGradientBoostingClassifier**: Enforces domain-specific monotonic constraints:
  - **Negative Constraint ($-1$)**: Higher `active_days_ratio`, `utility_punctuality_score`, `recharge_regularity_index` monotonically **decreases** predicted default risk.
  - **Positive Constraint ($+1$)**: Higher `inflow_volatility`, `emergency_drawdown_count`, `zero_balance_days` monotonically **increases** predicted default risk.

---

## 11. Optimization

The project previously experimented with **Particle Swarm Optimization (PSO)** during earlier review iterations. For Review 3, PSO is retained purely for historical comparison.

### Primary Optimization Method
- **Optuna Bayesian Optimization**:
  - **Strategy**: Tree-structured Parzen Estimator (TPE) sampler.
  - **Cross-Validation**: Stratified 5-Fold CV conducted **strictly on the 80% training split** to prevent test-set leakage.
  - **Objective**: Maximize Stratified CV ROC-AUC.
  - **Search Space**:
    - `learning_rate`: Log-uniform $[0.01, 0.20]$
    - `max_leaf_nodes`: Int $[15, 63]$
    - `min_samples_leaf`: Int $[10, 50]$
    - `l2_regularization`: Log-uniform $[10^{-3}, 10.0]$
    - `max_iter`: Int $[50, 250]$

---

## 12. Model Comparison

Evaluated on the **held-out untouched test set (N=500)**:

| Model Architecture | Optimization Technique | Test ROC-AUC | Test KS Statistic | Deployed Status |
| :--- | :--- | :---: | :---: | :---: |
| Baseline Logistic Scorer | Standard $L_2$ | **0.9785** | 86.51% | Benchmark |
| **Monotonic HistGradientBoosting** | **Default Hyperparameters** | **0.9885** | **91.41%** | **Production Deployed** |
| Monotonic HistGradientBoosting | Optuna Bayesian Search | **0.9871** | 89.32% | Candidate |
| Monotonic HistGradientBoosting | Legacy PSO Search | **0.9883** | 91.18% | Historical Legacy |

---

## 13. SHAP Explainability

Local feature attribution is powered by `shap.TreeExplainer`. For every applicant, SHAP values are extracted for class 1 (default risk).

### Example Explanation Output
- **Applicant Risk Probability**: `0.78`
- **Creditworthiness Score**: `22 / 100`
- **Top Risk Drivers (+)**:
  - `inflow_volatility: +0.245 risk` (High volatility increases predicted default probability)
  - `emergency_drawdown_count: +0.120 risk` (Frequent post-payout cash drains)
- **Top Protective Drivers (-)**:
  - `utility_punctuality_score: -0.180 risk` (95% on-time utility payment record)

---

## 14. Creditworthiness Score

The project-defined creditworthiness score is calculated as:

$$\text{Creditworthiness Score} = \text{round}\left(\max\left(0, \min\left(100, (1 - P(\text{default})) \times 100\right)\right)\right)$$

Additionally, a standard 300–900 credit scale score is calculated:

$$\text{Credit Score}_{300-900} = \text{round}\left(\max\left(300, \min\left(900, 300 + 600 \times (1 - P(\text{default}))\right)\right)\right)$$

---

## 15. Fairness Audit

Evaluated using **Disparate Impact Ratio (80% Rule)** across demographic attributes:

$$\text{Disparate Impact Ratio} = \frac{\min_{g} \text{Approval Rate}(g)}{\max_{g} \text{Approval Rate}(g)}$$

- **Gender Audit**: Disparate Impact Ratio = **0.9858** (Passes 80% Rule)
- **City Tier Audit**: Disparate Impact Ratio = **0.8576** (Passes 80% Rule)

---

## 16. Bank Integration

Partner banks interface with the system via `POST /api/v1/bank-score`:

1. Bank keeps customer database inside internal secure perimeter.
2. Bank applies mapping JSON config (e.g., `bank_feature_mapping.json`).
3. `BankFeatureAdapter` standardizes field names to canonical schema.
4. Inference service returns prediction, score, and SHAP drivers.

---

## 17. API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Healthcheck returning `{"status": "healthy"}` |
| `POST` | `/api/v1/score` | Scores single applicant payload |
| `POST` | `/api/v1/batch-score` | Scores array of applicant payloads |
| `POST` | `/api/v1/bank-score` | Accepts bank raw data + mapping config & scores |
| `POST` | `/api/v1/simulate-upi` | Simulates live UPI transaction feed for demo |
| `GET` | `/api/v1/model-info` | Returns complete JSON Model Card |

---

## 18. Frontend Dashboard

Built with **React 18**, **TypeScript**, and **Vite**:
- **Single Applicant Scorer**: Interactive slider controls for real-time risk scoring and SHAP waterfall chart.
- **Bank Feature Adapter**: Live editor to test Bank Alpha vs Bank Beta raw payload translation.
- **Bank Batch Scoring**: CSV file dropzone for batch scoring.
- **Model Card & Fairness Hub**: Live visualization of ROC curves, PR curves, confusion matrices, and fairness audits.
- **AA UPI Simulator**: Live simulation of informal worker daily transaction feeds.

---

## 19. Project Structure

```
Explainable-Credit-Scoring/
├── backend/                        # Backend helper configurations
├── frontend/                       # React 18 + TypeScript + Vite Dashboard
│   ├── src/
│   │   ├── components/             # React UI Components (SingleScorerTab, BankAdapterTab, etc.)
│   │   ├── App.tsx                 # Main Application Container
│   │   └── types.ts                # TypeScript Interfaces
│   └── package.json
├── inference-service/              # FastAPI Microservice
│   ├── app/
│   │   ├── routes/                 # FastAPI Router Endpoints (/score, /bank-score, etc.)
│   │   ├── services/               # ScoringService & Model Bundle Loader
│   │   └── main.py                 # FastAPI Application Entrypoint
│   ├── model_artifacts/            # Exported production model bundle
│   └── tests/                      # Pytest API integration tests
├── ml-core/                        # Core ML Engine & Pipeline
│   ├── data/
│   │   ├── uci/                    # Authentic 30,000-record UCI Credit Dataset
│   │   ├── synthetic/              # Synthetic UPI Gig-Worker Dataset & metadata.json
│   │   └── bank_interface/         # Bank adapter example payloads & schemas
│   ├── src/
│   │   ├── data/                   # uci_loader.py, upi_simulator.py, bank_adapter.py
│   │   ├── optimization/           # optuna_tuner.py
│   │   ├── explainability/         # shap_engine.py
│   │   ├── evaluation/             # metrics.py, fairness.py
│   │   ├── preprocessing.py        # CreditFeaturePreprocessor
│   │   ├── baseline_model.py       # BaselineLogisticScorer
│   │   └── gb_model.py             # MonotonicGradientBoostingScorer
│   ├── scripts/
│   │   └── train_and_audit.py      # Master training & audit pipeline script
│   └── tests/                      # Pytest unit test suite
├── README.md                       # Comprehensive Project Documentation
└── REVIEW3_PRESENTATION_GUIDE.md   # Presentation script and marking rubric guide
```

---

## 20. Installation

### 1. Clone Repository & Setup Python
```bash
git clone https://github.com/kushagra9926/Explainable-Credit-Scoring.git
cd Explainable-Credit-Scoring

# Install Python requirements
python -m pip install -r ml-core/requirements.txt
python -m pip install optuna openpyxl requests pytest httpx
```

### 2. Setup Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 21. Training Pipeline

To execute the complete data ingestion, Optuna Bayesian tuning, UCI benchmark evaluation, SHAP audit, fairness audit, plot generation, and model export:

```bash
python ml-core/scripts/train_and_audit.py
```

---

## 22. Running API Service

Start the FastAPI inference service:

```bash
uvicorn inference-service.app.main:app --reload --port 8000
```
Open interactive Swagger API docs at `http://localhost:8000/docs`.

---

## 23. Running Frontend Dashboard

Start the React development server:

```bash
cd frontend
npm run dev
```
Open dashboard in browser at `http://localhost:5173`.

---

## 24. Running Tests

Execute the full automated pytest suite across ML core and API services:

```bash
python -m pytest ml-core/tests inference-service/tests
```

---

## 25. Demo Instructions (3–5 Minute Evaluation Sequence)

1. **Step 1: Start Services**
   - Run FastAPI backend on port 8000.
   - Run React dashboard on port 5173.
2. **Step 2: Bank Feature Adapter Demonstration**
   - Click **"Bank Feature Adapter"** in top navbar.
   - Select **"Bank Alpha"** preset, click **"Run Adapter & Execute Scoring"**.
   - Show how raw bank columns (`upi_credit_total_avg`) map seamlessly into canonical schema (`monthly_inflow_avg`) and produce an instant SHAP explanation.
3. **Step 3: Single Applicant Scoring**
   - Click **"Single Applicant Scorer"**.
   - Adjust `Inflow Volatility` slider from `0.20` to `0.75`.
   - Observe real-time shift in risk probability, decision (`APPROVED` -> `REJECTED`), and top SHAP risk drivers.
4. **Step 4: Model Card & Benchmark Review**
   - Click **"Model Card & Fairness Hub"**.
   - Demonstrate the authentic **UCI 30,000-record benchmark comparison**, held-out test ROC-AUC curve, and Demographic Fairness compliance (Passes 80% rule).

---

## 26. Results Summary

- **Synthetic Gig-Worker Dataset (Held-out test ROC-AUC)**: **0.9885**
- **Authentic UCI Credit Card Default Benchmark (30,000 records)**: **0.7757 ROC-AUC**, **0.5525 PR-AUC**, **42.34% KS Statistic**
- **SHAP Ground-Truth Fidelity**: **75.0%** correlation with planted synthetic risk rules
- **Gender Disparate Impact Ratio**: **0.9858** (Compliant with 80% Rule)
- **City Tier Disparate Impact Ratio**: **0.8576** (Compliant with 80% Rule)

---

## 27. Limitations & Future Scope

### Limitations
1. **Synthetic Gig-Worker Data**: Due to banking privacy restrictions, gig-worker UPI transaction feeds are simulated rather than sourced from live banking production feeds.
2. **Domain Mismatch**: UCI credit card default dataset serves as a public benchmark for credit risk, but reflects traditional credit card holders rather than informal gig workers.

### Future Scope
1. **Account Aggregator (AA) Sandbox Integration**: Direct integration with operational Account Aggregator AA sandbox APIs (e.g., Sahamati framework).
2. **Dynamic Online Learning**: Continuous model updates using streaming transaction logs.
3. **Federated Learning Deployment**: Multi-bank privacy-preserving model training without raw data centralization.
