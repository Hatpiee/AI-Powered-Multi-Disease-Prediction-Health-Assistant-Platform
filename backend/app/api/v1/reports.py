import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.services import prediction_service, report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{prediction_id}")
def download_report(
    prediction_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = prediction_service.get_by_id(prediction_id, user, db)
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found")

    pdf_bytes = report_service.generate_prediction_report(
        prediction_id=record.id,
        disease_type=record.disease_type,
        risk_score=record.risk_score,
        risk_level=record.risk_level,
        shap_values=record.shap_values or [],
        user_name=user.full_name,
        created_at=record.created_at,
    )

    filename = f"health-report-{record.disease_type}-{record.id}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
