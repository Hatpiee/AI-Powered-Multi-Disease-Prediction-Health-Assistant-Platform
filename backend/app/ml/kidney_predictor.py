import numpy as np
import shap
from typing import Any, Dict, List

from app.ml.model_loader import get
from app.ml.feature_mapper import map_kidney


def _risk_level(score: float) -> str:
    if score < 0.30:
        return "low"
    if score < 0.60:
        return "medium"
    return "high"


def _shap_explanation(model: Any, X_scaled: np.ndarray, feature_names: List[str]) -> List[Dict]:
    explainer = shap.TreeExplainer(model)
    raw = explainer.shap_values(X_scaled)
    arr = np.array(raw)
    if arr.ndim == 3:
        if arr.shape[-1] == 2:
            sv = arr[0, :, 1]
        else:
            sv = arr[1, 0]
    else:
        sv = arr[0]
    return [
        {"feature": name, "value": round(float(v), 4), "direction": "positive" if v > 0 else "negative"}
        for name, v in zip(feature_names, sv.tolist())
    ]


def predict(data: Dict[str, Any]) -> Dict:
    model         = get("kidney_model")
    scaler        = get("kidney_scaler")
    feature_names = get("kidney_features")
    imputer       = get("kidney_imputer")

    mapped = map_kidney(data)
    X = np.array([mapped.get(f) for f in feature_names], dtype=object)
    X = np.where(X == None, np.nan, X).astype(float).reshape(1, -1)  # noqa: E711
    X_imputed = imputer.transform(X)
    X_scaled  = scaler.transform(X_imputed)

    risk_score = float(model.predict_proba(X_scaled)[0, 1])
    shap_vals  = _shap_explanation(model, X_scaled, feature_names)

    return {
        "disease_type": "kidney",
        "risk_score":   round(risk_score, 4),
        "risk_level":   _risk_level(risk_score),
        "shap_values":  shap_vals,
    }
