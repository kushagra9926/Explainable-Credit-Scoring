# Explainable Credit Scoring Engine for Gig-Worker & Informal Banking

[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-emerald.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.2-indigo.svg)](https://react.dev/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.9-orange.svg)](https://scikit-learn.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An end-to-end, bank-deployable credit scoring system designed for informal gig-workers (delivery partners, ride-hail drivers, freelancers, micro-vendors) using India's Account Aggregator (AA) consent framework, Monotonic HistGradientBoosting, Particle Swarm Optimization (PSO), SHAP attributions, and Demographic Fairness Auditing.

---

## 🌟 Key Architecture & Highlights

1. **Bank-Deployable Data Engine**: Bank trains the model locally on transaction data. Raw transaction data never leaves the bank's boundary.
2. **Account Aggregator (AA) Data Contract**: Ingests consent-based bank statement payloads (`AccountAggregatorPayload`) and derives behavioral features (inflow volatility, active days ratio, utility punctuality, emergency drawdowns).
3. **Monotonic Risk Constraints**: Regulatory-compliant HistGradientBoosting model guaranteeing that positive behaviors (higher active days, on-time utility payments) monotonically decrease default risk.
4. **PSO vs. Random Search Benchmarking**: Evaluates Particle Swarm Optimization hyperparameter search against Random Search under equal evaluation budget (96 evaluations across 5-fold Stratified CV).
5. **Real-Label Validation & Synthetic Ground-Truth Fidelity**: Benchmarked against the UCI Credit Card Default Dataset (N=30,000) alongside a 6-12 month transaction-level Synthetic UPI Gig-Worker Simulator.
6. **Demographic Fairness Audit**: Audits decisions across protected attributes (`gender`, `city_tier`) guaranteeing compliance with the 80% Disparate Impact Rule.
7. **Interactive React 19 Web Dashboard**: Live UI featuring Single Applicant Scorer with Preset Personas, Bank Batch CSV Ingestion, Model Card & Fairness Hub, and AA UPI Transaction Simulator.

---

## 📂 Repository Structure

```
Explainable-Credit-Scoring/
├── backend/                  # Legacy node proxy placeholder (Simplified for FastAPI direct architecture)
├── frontend/                 # React 19 + TypeScript + Vite + TailwindCSS Web Dashboard
│   ├── src/
│   │   ├── components/       # SingleScorer, BatchScoring, ModelCardTab, SimulatorTab
│   │   ├── types/            # TypeScript data contracts & interfaces
│   │   ├── App.tsx           # Main application dashboard container
│   │   └── index.css         # Custom glassmorphism design tokens & styles
│   └── package.json
├── inference-service/        # FastAPI REST API Service
│   ├── app/
│   │   ├── routes/           # REST endpoints (/score, /batch-score, /simulate-upi, /model-info)
│   │   ├── services/         # ScoringService loading model_bundle.joblib
│   │   ├── config.py         # Service configuration
│   │   └── main.py           # FastAPI entrypoint
│   └── model_artifacts/      # Exported trained model bundle & SHAP explainer
├── ml-core/                  # Core ML Training, Optimization & Audit Engine
│   ├── artifacts/            # Generated model_card.json, metrics, & SHAP plots
│   ├── models/               # Serialized model_bundle.joblib
│   ├── scripts/
│   │   └── train_and_audit.py # Master end-to-end training, PSO tuning, SHAP & fairness script
│   └── src/
│       ├── data/             # Synthetic UPI Simulator & UCI Dataset Loader
│       ├── evaluation/       # Metrics (ROC-AUC, PR-AUC, KS, Cost-Matrix) & Fairness Audit
│       ├── explainability/   # SHAP Explanation Engine & Ground-Truth Verification
│       ├── pso/              # Particle Swarm Optimization & Random Search Tuners
│       ├── baseline_model.py # Logistic Regression baseline
│       ├── gb_model.py       # Monotonic HistGradientBoosting scorer
│       ├── preprocessing.py  # Sklearn ColumnTransformer preprocessor
│       └── data_loader.py    # Unified dataset loader interface
└── REVIEW3_PRESENTATION_GUIDE.md # Review 3 presentation script & rubric alignment guide
```

---

## 🚀 Quick Start Guide

### 1. Run Master ML Training, PSO Tuning & Fairness Pipeline
```bash
python ml-core/scripts/train_and_audit.py
```
*Outputs `ml-core/artifacts/model_card.json` and `ml-core/models/model_bundle.joblib`.*

### 2. Start FastAPI Inference Backend Server
```bash
python inference-service/app/main.py
```
*API running at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.*

### 3. Start React Frontend Web Application
```bash
cd frontend
npm install
npm run dev
```
*Web dashboard running at `http://localhost:5173`.*

---

## 📑 Review 3 Presentation & Submission Notes
Refer to [`REVIEW3_PRESENTATION_GUIDE.md`](file:///d:/Explainable-Credit-Scoring/REVIEW3_PRESENTATION_GUIDE.md) for the 60-mark rubric alignment table, "What Changed and Why" evolution slide breakdown, and bank integration story.
