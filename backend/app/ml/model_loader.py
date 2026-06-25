from pathlib import Path
from typing import Any, Dict
import joblib

MODELS_DIR = Path(__file__).parents[3] / "ml" / "models"
_store: Dict[str, Any] = {}


def load_all_models() -> None:
    for disease in ("diabetes", "heart", "liver", "kidney"):
        _store[f"{disease}_model"]    = joblib.load(MODELS_DIR / f"{disease}_model.pkl")
        _store[f"{disease}_scaler"]   = joblib.load(MODELS_DIR / f"{disease}_scaler.pkl")
        _store[f"{disease}_features"] = joblib.load(MODELS_DIR / f"{disease}_features.pkl")
    _store["kidney_imputer"] = joblib.load(MODELS_DIR / "kidney_imputer.pkl")
    print(f"[ML] All models loaded from {MODELS_DIR}")


def get(key: str) -> Any:
    if not _store:
        load_all_models()
    return _store[key]
