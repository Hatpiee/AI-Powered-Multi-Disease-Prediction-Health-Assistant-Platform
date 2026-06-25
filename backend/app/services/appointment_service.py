from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.user import User
from app.schemas.appointment import AppointmentCreate


def create_appointment(body: AppointmentCreate, user: User, db: Session) -> Appointment:
    appointment = Appointment(
        user_id=user.id,
        doctor_name=body.doctor_name,
        specialization=body.specialization,
        appointment_date=body.appointment_date,
        time_slot=body.time_slot,
        notes=body.notes,
        status="pending",
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def get_appointments(user: User, db: Session) -> List[Appointment]:
    return (
        db.query(Appointment)
        .filter(Appointment.user_id == user.id)
        .order_by(Appointment.appointment_date.desc(), Appointment.time_slot)
        .all()
    )


def cancel_appointment(appointment_id: int, user: User, db: Session) -> Optional[Appointment]:
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id, Appointment.user_id == user.id)
        .first()
    )
    if not appointment:
        return None
    appointment.status = "cancelled"
    db.commit()
    db.refresh(appointment)
    return appointment
