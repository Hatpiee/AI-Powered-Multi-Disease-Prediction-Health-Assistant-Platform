from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentOut
from app.services import appointment_service

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(
    body: AppointmentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return appointment_service.create_appointment(body, user, db)


@router.get("", response_model=List[AppointmentOut])
def list_appointments(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return appointment_service.get_appointments(user, db)


@router.patch("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(
    appointment_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = appointment_service.cancel_appointment(appointment_id, user, db)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment
