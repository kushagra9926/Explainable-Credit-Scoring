"""
Inference Service Configuration.
"""
import os

MODEL_BUNDLE_PATH = os.getenv("MODEL_BUNDLE_PATH", "inference-service/model_artifacts/model_bundle.joblib")
FALLBACK_BUNDLE_PATH = os.getenv("FALLBACK_BUNDLE_PATH", "ml-core/models/model_bundle.joblib")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
