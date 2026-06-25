from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class AppointmentCreate(BaseModel):
    doctor_name: str = Field(..., min_length=2, max_length=100)
    specialization: str = Field(..., min_length=2, max_length=100)
    appointment_date: date
    time_slot: str = Field(..., description="e.g. '10:00 AM'")
    notes: Optional[str] = Field(None, max_length=500)


class AppointmentOut(BaseModel):
    id: int
    doctor_name: str
    specialization: str
    appointment_date: date
    time_slot: str
    status: str
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class AppointmentUpdate(BaseModel):
    status: Literal["pending", "confirmed", "cancelled"]
