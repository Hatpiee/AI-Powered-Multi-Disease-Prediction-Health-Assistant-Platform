from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.services import audit_service

router = APIRouter(prefix="/audit-logs", tags=["audit"])


class AuditLogItem(BaseModel):
    id: int
    action: str
    resource_id: Optional[int]
    ip_address: Optional[str]
    created_at: str

    model_config = {"from_attributes": True}


@router.get("", response_model=List[AuditLogItem])
def get_audit_logs(
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = audit_service.get_for_user(user.id, db, limit=limit)
    return [
        AuditLogItem(
            id=r.id,
            action=r.action,
            resource_id=r.resource_id,
            ip_address=r.ip_address,
            created_at=r.created_at.isoformat(),
        )
        for r in records
    ]
