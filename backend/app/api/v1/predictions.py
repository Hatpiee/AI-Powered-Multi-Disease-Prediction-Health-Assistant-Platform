from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Request, UploadFile, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.prediction import (
    DiabetesInput, HeartInput, LiverInput, KidneyInput, PredictionListItem,
)
from app.services import audit_service, prediction_service, pdf_extraction_service, recommendation_service

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/predictions", tags=["predictions"])


def _fill_recommendations(prediction_id: int, disease_type: str, risk_score: float, risk_level: str, shap_values: list) -> None:
    from app.db.database import SessionLocal
    from app.models.prediction import Prediction
    db = SessionLocal()
    try:
        recs = recommendation_service.generate(disease_type, risk_score, risk_level, shap_values)
        if recs:
            record = db.query(Prediction).filter(Prediction.id == prediction_id).first()
            if record:
                record.recommendations = recs
                db.commit()
    except Exception as exc:
        print(f"[recommendations bg] failed for prediction {prediction_id}: {exc}")
    finally:
        db.close()


def _serialize(p) -> dict:
    return {
        "id": p.id,
        "disease_type": p.disease_type,
        "risk_score": p.risk_score,
        "risk_level": p.risk_level,
        "shap_values": p.shap_values or [],
        "recommendations": p.recommendations or [],
        "created_at": p.created_at.isoformat(),
    }


@router.post("/diabetes", status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
def predict_diabetes(
    request: Request,
    background_tasks: BackgroundTasks,
    body: DiabetesInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        record = prediction_service.run_diabetes(body.model_dump(), user, db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    ip = request.client.host if request.client else None
    audit_service.log(db, "predict_diabetes", user_id=user.id, resource_id=record.id, ip_address=ip)
    background_tasks.add_task(_fill_recommendations, record.id, record.disease_type, record.risk_score, record.risk_level, record.shap_values)
    return _serialize(record)


@router.post("/heart", status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
def predict_heart(
    request: Request,
    background_tasks: BackgroundTasks,
    body: HeartInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        record = prediction_service.run_heart(body.model_dump(), user, db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    ip = request.client.host if request.client else None
    audit_service.log(db, "predict_heart", user_id=user.id, resource_id=record.id, ip_address=ip)
    background_tasks.add_task(_fill_recommendations, record.id, record.disease_type, record.risk_score, record.risk_level, record.shap_values)
    return _serialize(record)


@router.post("/liver", status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
def predict_liver(
    request: Request,
    background_tasks: BackgroundTasks,
    body: LiverInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        record = prediction_service.run_liver(body.model_dump(), user, db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    ip = request.client.host if request.client else None
    audit_service.log(db, "predict_liver", user_id=user.id, resource_id=record.id, ip_address=ip)
    background_tasks.add_task(_fill_recommendations, record.id, record.disease_type, record.risk_score, record.risk_level, record.shap_values)
    return _serialize(record)


@router.post("/kidney", status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
def predict_kidney(
    request: Request,
    background_tasks: BackgroundTasks,
    body: KidneyInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        record = prediction_service.run_kidney(body.model_dump(), user, db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    ip = request.client.host if request.client else None
    audit_service.log(db, "predict_kidney", user_id=user.id, resource_id=record.id, ip_address=ip)
    background_tasks.add_task(_fill_recommendations, record.id, record.disease_type, record.risk_score, record.risk_level, record.shap_values)
    return _serialize(record)


@router.get("/history", response_model=List[PredictionListItem])
def prediction_history(
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = prediction_service.get_history(user, db, limit=limit)
    return [
        PredictionListItem(
            id=r.id,
            disease_type=r.disease_type,
            risk_score=r.risk_score,
            risk_level=r.risk_level,
            created_at=r.created_at.isoformat(),
        )
        for r in records
    ]


@router.post("/extract-from-pdf")
@limiter.limit("10/minute")
async def extract_report(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 10 MB.")
    try:
        result = pdf_extraction_service.extract_from_pdf(contents)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(exc)}")
    ip = request.client.host if request.client else None
    audit_service.log(db, "pdf_upload", user_id=user.id, ip_address=ip)
    return result


@router.get("/{prediction_id}")
def get_prediction(
    prediction_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = prediction_service.get_by_id(prediction_id, user, db)
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return _serialize(record)
