from sqlalchemy.orm import Session

from app.ml import diabetes_predictor, heart_predictor, liver_predictor, kidney_predictor
from app.models.prediction import Prediction
from app.models.user import User


def _save(db: Session, user: User, result: dict, input_features: dict) -> Prediction:
    record = Prediction(
        user_id=user.id,
        disease_type=result["disease_type"],
        input_features=input_features,
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        shap_values=result["shap_values"],
        recommendations=[],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def run_diabetes(data: dict, user: User, db: Session) -> Prediction:
    result = diabetes_predictor.predict(data)
    return _save(db, user, result, data)


def run_heart(data: dict, user: User, db: Session) -> Prediction:
    result = heart_predictor.predict(data)
    return _save(db, user, result, data)


def run_liver(data: dict, user: User, db: Session) -> Prediction:
    result = liver_predictor.predict(data)
    return _save(db, user, result, data)


def run_kidney(data: dict, user: User, db: Session) -> Prediction:
    result = kidney_predictor.predict(data)
    return _save(db, user, result, data)


def get_history(user: User, db: Session, limit: int = 20) -> list:
    return (
        db.query(Prediction)
        .filter(Prediction.user_id == user.id)
        .order_by(Prediction.created_at.desc())
        .limit(limit)
        .all()
    )


def get_by_id(prediction_id: int, user: User, db: Session) -> Prediction | None:
    return (
        db.query(Prediction)
        .filter(Prediction.id == prediction_id, Prediction.user_id == user.id)
        .first()
    )
