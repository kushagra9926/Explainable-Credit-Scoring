"""
FastAPI Main Application Entrypoint.
Serves Explainable Credit Scoring REST API & Interactive Endpoints.
"""

import sys
import os

# Add paths for cross-directory imports
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("ml-core"))
sys.path.insert(0, os.path.abspath("inference-service"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.score_routes import router as score_router

app = FastAPI(
    title="Explainable Credit Scoring Engine API",
    description="Bank-Deployable UPI & Account Aggregator Credit Scoring API with Monotonic HGB & SHAP Explanations",
    version="3.0.0"
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(score_router)

@app.get("/")
def read_root():
    return {
        "engine": "Explainable Credit Scoring Engine",
        "version": "3.0.0",
        "docs_url": "/docs",
        "health": "OK"
    }

@app.get("/health")
def healthcheck():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("inference-service.app.main:app", host="0.0.0.0", port=8000, reload=True)
