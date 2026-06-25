from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class MessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="User message text")


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionDetailOut(SessionOut):
    messages: List[MessageOut] = []
