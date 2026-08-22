```
 _______  __   __  _______  ___      _______  ___   __    _  _______  _______  ___      _______ 
|       ||  |_|  ||       ||   |    |   _   ||   | |  |  | ||   _   ||       ||   |    |       |
|    ___||       ||    _  ||   |    |  |_|  ||   | |   |_| ||  |_|  ||    _  ||   |    |    ___|
|   |___ |       ||   |_| ||   |    |       ||   | |       ||       ||   |_| ||   |    |   |___ 
|    ___||       ||    ___||   |___ |       ||   | |  _    ||       ||    ___||   |___ |    ___|
|   |___ | ||_|| ||   |    |       ||   _   ||   | | | |   ||   _   ||   |    |       ||   |___ 
|_______||_|   |_||___|    |_______||__| |__||___| |_|  |__||__| |__||___|    |_______||_______|

    _______  ______    _______  ______   ___   _______    _______  _______  _______  ______   ___   __    _  _______ 
   |       ||    _ |  |       ||      | |   | |       |  |       ||       ||       ||    _ |  |   | |  |  | ||       |
   |       ||   | ||  |    ___||  _    ||   | |_     _|  |  _____||       ||    _  ||   | ||  |   | |   |_| ||    ___|
   |       ||   |_||_ |   |___ | | |   ||   |   |   |    | |_____ |       ||   |_| ||   |_||_ |   | |       ||   | __ 
   |      _||    __  ||    ___|| |_|   ||   |   |   |    |_____  ||      _||    ___||    __  ||   | |  _    ||   ||  |
   |     |_ |   |  | ||   |___ |       ||   |   |   |     _____| ||     |_ |   |    |   |  | ||   | | | |   ||   |_| |
   |_______||___|  |_||_______||______| |___|   |___|    |_______||_______||___|    |___|  |_||___| |_|  |__||_______|
```

<div align="center">

### An interpretable, PSO-tuned Gradient Boosting credit scoring system with SHAP-based explainability

`Status: In Development`&nbsp;&nbsp;|&nbsp;&nbsp;`Dataset: UCI German Credit (Benchmark Phase)`&nbsp;&nbsp;|&nbsp;&nbsp;`License: MIT`

[Overview](#overview) •
[Architecture](#architecture) •
[Pipeline Flow](#pipeline-flow) •
[Tech Stack](#tech-stack) •
[Folder Structure](#folder-structure) •
[Getting Started](#getting-started) •
[API Contract](#api-contract) •
[Roadmap](#roadmap) •
[Contributing](#contributing)

</div>

---

<a id="overview"></a>
## Overview

> Formal credit bureaus in India assess creditworthiness using bank loans, credit cards, and repayment
> history. This excludes an estimated 200 million+ gig workers who transact daily through UPI, prepaid
> recharges, and utility payments — yet remain "credit invisible" to the formal system.

This project explores whether an **explainable-by-design** scoring pipeline — Gradient Boosting tuned
via **Particle Swarm Optimization (PSO)**, explained via **SHAP** — can produce both accurate *and*
transparent credit decisions.

<details>
<summary><strong>Click to expand: Why explainability matters here</strong></summary>

<br>

Most alternative-credit fintech models optimize purely for predictive accuracy and treat the model as
a black box. That's a problem in lending: a rejected applicant deserves to know *why*, and a regulator
auditing the model needs to verify it isn't encoding bias. This project treats explainability as a
first-class requirement, not an afterthought bolted on at the end.

</details>

<details>
<summary><strong>Click to expand: Current scope and honesty note</strong></summary>

<br>

The current phase validates the **methodology** (PSO-tuned GB + SHAP) on the **UCI German Credit**
dataset as a benchmark proof-of-concept. Real UPI / recharge / utility-payment data for Indian gig
workers is not publicly available and would require RBI-compliant data-sharing partnerships — this
is explicitly scoped as **future work**, not something the current experiment claims to solve.

</details>

---

<a id="architecture"></a>
## Architecture

The system is split into four independent boxes, each doing only what it is best at, connected over
clean HTTP boundaries.

```
                                   ┌────────────────────────────────────────┐
                                   │              ML CORE (Python)          │
                                   │  ┌──────────┐  ┌───────┐  ┌─────────┐  │
                                   │  │ Data Prep│─▶│  PSO  │─▶│   GB    │  │
                                   │  └──────────┘  └───────┘  └────┬────┘  │
                                   │                                │       │
                                   │                          ┌─────▼────┐  │
                                   │                          │   SHAP   │  │
                                   │                          └─────┬────┘  │
                                   └────────────────────────────────┼───────┘
                                                                     │
                                                        model.pkl + explainer.pkl
                                                                     │
                                                                     ▼
   ┌───────────────┐   HTTP    ┌────────────────────────────┐  loads artifacts
   │   FRONTEND    │◀─────────▶│         BACKEND            │◀───────────────┐
   │  React + TS   │  JSON     │      Express (Node.js)     │                │
   │   Tailwind    │           │  Auth · Validation · Proxy │                │
   └───────────────┘           └─────────────┬──────────────┘                │
                                              │ HTTP                         │
                                              ▼                              │
                                 ┌─────────────────────────────┐            │
                                 │      INFERENCE SERVICE       │◀───────────┘
                                 │         FastAPI (Python)     │
                                 │   /predict → score + SHAP    │
                                 └───────────────────────────────┘
```

<details>
<summary><strong>Click to expand: Why four boxes instead of one</strong></summary>

<br>

| Box | Language | Responsibility | Why isolated |
|---|---|---|---|
| `ml-core` | Python | Train, tune, explain | Runs offline; never touches live traffic |
| `inference-service` | Python (FastAPI) | Serve predictions | Only needs `.pkl` files, not the full training pipeline |
| `backend` | Node.js (Express) | Auth, validation, orchestration | Familiar MERN pattern, reused from prior projects |
| `frontend` | React + TypeScript | User interface | Talks only to the backend, never directly to the ML service |

No single language is forced to do a job it's bad at — Python owns the ML, JavaScript owns the app.

</details>

---

<a id="pipeline-flow"></a>
## Pipeline Flow

### Model development flow (offline, one-time / iterative)

```
 ┌───────────┐    ┌────────────┐    ┌───────────┐    ┌──────────────┐    ┌────────────┐
 │  Raw Data │───▶│Preprocess &│───▶│  Baseline │───▶│  PSO Tuning  │───▶│    SHAP    │
 │ (German   │    │   Split    │    │    GB     │    │ (hyperparams)│    │Explainer   │
 │  Credit)  │    │            │    │           │    │              │    │            │
 └───────────┘    └────────────┘    └───────────┘    └──────────────┘    └─────┬──────┘
                                                                                 │
                                                                                 ▼
                                                                    ┌────────────────────────┐
                                                                    │ Export: model.pkl       │
                                                                    │ + shap_explainer.pkl    │
                                                                    └────────────────────────┘
```

### Live request flow (runtime, every prediction)

```
  User                React               Express              FastAPI            Model + SHAP
   │                    │                    │                    │                    │
   │  Fill 20 features  │                    │                    │                    │
   ├───────────────────▶│                    │                    │                    │
   │                    │  POST /predict     │                    │                    │
   │                    ├───────────────────▶│                    │                    │
   │                    │                    │  POST /predict     │                    │
   │                    │                    ├───────────────────▶│                    │
   │                    │                    │                    │  predict + explain │
   │                    │                    │                    ├───────────────────▶│
   │                    │                    │                    │◀───────────────────┤
   │                    │                    │◀───────────────────┤  score + shap_vals │
   │                    │◀───────────────────┤ {score, shap_vals} │                    │
   │◀───────────────────┤  render UI         │                    │                    │
   │  See score + chart │                    │                    │                    │
```

<details>
<summary><strong>Click to expand: Step-by-step description</strong></summary>

<br>

1. User fills the 20-feature form (or loads a sample applicant) in the React UI.
2. React sends a `POST` request with the feature payload to the Express backend.
3. Express validates the request, checks auth (if enabled), and forwards it to FastAPI.
4. FastAPI loads the serialized model and SHAP explainer, runs `predict()` and `shap_values()`.
5. FastAPI returns `{ score, shap_values, top_factors }` as JSON.
6. Express relays the response back to React.
7. React renders the score (0–100) alongside a signed, per-feature SHAP bar chart.

</details>

---

<a id="tech-stack"></a>
## Tech Stack

<table>
<tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr>
<tr><td rowspan="4"><strong>ML Core</strong></td><td>scikit-learn</td><td>Gradient Boosting classifier</td></tr>
<tr><td>pyswarms</td><td>Particle Swarm Optimization for hyperparameter tuning</td></tr>
<tr><td>shap</td><td>Post-hoc explainability (TreeExplainer)</td></tr>
<tr><td>pandas / numpy</td><td>Data loading and preprocessing</td></tr>
<tr><td rowspan="2"><strong>Inference Service</strong></td><td>FastAPI</td><td>Async prediction API</td></tr>
<tr><td>Pydantic</td><td>Request/response schema validation</td></tr>
<tr><td rowspan="4"><strong>Backend</strong></td><td>Express (Node.js)</td><td>Auth, validation, proxying</td></tr>
<tr><td>MongoDB + Mongoose</td><td>Prediction history / user data</td></tr>
<tr><td>JWT</td><td>Authentication</td></tr>
<tr><td>Axios</td><td>Inter-service HTTP calls</td></tr>
<tr><td rowspan="3"><strong>Frontend</strong></td><td>React + TypeScript</td><td>User interface</td></tr>
<tr><td>Tailwind CSS v4</td><td>Styling</td></tr>
<tr><td>Recharts</td><td>SHAP contribution bar chart</td></tr>
<tr><td rowspan="2"><strong>Deployment</strong></td><td>Vercel</td><td>Frontend hosting</td></tr>
<tr><td>Render</td><td>Backend + inference service hosting</td></tr>
</table>

---

<a id="folder-structure"></a>
## Folder Structure

<details>
<summary><strong>Click to expand full directory tree</strong></summary>

```
explainable-credit-scoring/
├── ml-core/                  # Training, tuning, explainability (offline)
│   ├── data/                 # raw / processed / schema
│   ├── src/                  # preprocessing, GB model, PSO, SHAP, evaluation
│   ├── notebooks/            # EDA, training, tuning, SHAP analysis
│   ├── models/                # exported .pkl artifacts
│   ├── artifacts/             # plots, metrics reports
│   ├── tests/
│   └── scripts/               # CLI entry points for each pipeline stage
│
├── inference-service/         # FastAPI microservice serving the trained model
│   ├── app/
│   │   ├── routes/            # /predict, /health
│   │   ├── services/          # model loading, prediction, explanation
│   │   └── core/              # logging, exceptions
│   ├── model_artifacts/       # copied .pkl files from ml-core
│   └── tests/
│
├── backend/                   # Express API — auth, validation, orchestration
│   └── src/
│       ├── config/
│       ├── models/            # Mongoose schemas
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       ├── services/           # mlServiceClient.js → calls inference-service
│       └── utils/
│
├── frontend/                   # React + TypeScript + Tailwind UI
│   └── src/
│       ├── components/         # ScoreForm, ScoreDisplay, ExplanationChart, Layout
│       ├── pages/
│       ├── hooks/
│       ├── services/           # api.ts
│       ├── types/
│       └── context/
│
├── .gitignore
├── docker-compose.yml
└── README.md
```

</details>

---

<a id="getting-started"></a>
## Getting Started

<details>
<summary><strong>1. Clone and set up the Python environment (ml-core + inference-service)</strong></summary>

<br>

```bash
git clone <repo-url>
cd explainable-credit-scoring

python -m venv .venv
.venv\Scripts\Activate.ps1        # Windows PowerShell
# source .venv/bin/activate       # macOS / Linux

pip install -r ml-core/requirements.txt
```

</details>

<details>
<summary><strong>2. Run the ML training pipeline</strong></summary>

<br>

```bash
cd ml-core
python scripts/train_baseline.py
python scripts/run_pso_tuning.py
python scripts/generate_shap_artifacts.py
python scripts/export_models.py
```

This produces `tuned_model.pkl` and `shap_explainer.pkl` inside `ml-core/models/`.
Copy both into `inference-service/model_artifacts/` before starting the API.

</details>

<details>
<summary><strong>3. Start the inference service</strong></summary>

<br>

```bash
cd inference-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

</details>

<details>
<summary><strong>4. Start the backend</strong></summary>

<br>

```bash
cd backend
npm install
npm run dev
```

</details>

<details>
<summary><strong>5. Start the frontend</strong></summary>

<br>

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`.

</details>

---

<a id="api-contract"></a>
## API Contract

<details>
<summary><strong>POST /predict</strong></summary>

<br>

**Request**

```json
{
  "checking_account_status": "A11",
  "duration_months": 24,
  "credit_history": "A34",
  "purpose": "A43",
  "credit_amount": 5000,
  "...": "...remaining German Credit features..."
}
```

**Response**

```json
{
  "score": 72,
  "shap_values": {
    "checking_account_status": 15.2,
    "credit_history": 8.7,
    "duration_months": -6.4
  },
  "top_factors": [
    { "feature": "checking_account_status", "impact": "positive", "magnitude": 15.2 },
    { "feature": "duration_months", "impact": "negative", "magnitude": 6.4 }
  ]
}
```

</details>

---

<a id="roadmap"></a>
## Roadmap

```
[ COMPLETE ]  Architecture design
[ COMPLETE ]  Folder scaffolding across all four services
[ IN PROGRESS ]  Baseline Gradient Boosting model
[ PLANNED ]  PSO hyperparameter tuning + convergence analysis
[ PLANNED ]  SHAP explainability layer
[ PLANNED ]  FastAPI inference service wiring
[ PLANNED ]  React scoring UI + SHAP visualization
[ FUTURE WORK ]  RBI-compliant alternative-data integration for gig workers
```

---

<a id="limitations"></a>
## Limitations

- UCI German Credit reflects **formal banking attributes**, not informal/alternative digital signals —
  the current experiment validates methodology, not the gig-worker application directly.
- PSO is compared against baseline GB; a grid-search / Bayesian-tuning comparison is recommended before
  claiming PSO as the primary contribution.
- SHAP explanations are post-hoc, not intrinsic to the model — this is a deliberate accuracy/interpretability
  tradeoff, not an oversight.

---

<a id="contributing"></a>
## Contributing

This is currently a solo academic project built for a college project exhibition and an IEEE-style paper.
External contributions aren't being accepted at this stage, but issues/suggestions are welcome.

---

<div align="center">

```
  ____                          _   _              _   _
 / ___|___  _ __  _ __   ___ ___| |_| |_ __   __ _  | |_| |___
| |   / _ \| '_ \| '_ \ / _ \_  / __| __/ __| / _` | | __| / __|
| |__| (_) | | | | | | |  __// /| |_| |_\__ \ (_| | | |_| \__ \
 \____\___/|_| |_|_| |_|\___/___|\__|\__|___/_\__,_|  \__|_|___/
```

**GitHub:** kushagra9926 &nbsp;|&nbsp; **LinkedIn:** kushagra-joshi-9b9497258

</div>