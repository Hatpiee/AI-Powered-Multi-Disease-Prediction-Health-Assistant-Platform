from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log(
    db: Session,
    action: str,
    user_id: int | None = None,
    resource_id: int | None = None,
    ip_address: str | None = None,
) -> None:
    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_id=resource_id,
        ip_address=ip_address,
    )
    db.add(entry)
    db.commit()


def get_for_user(user_id: int, db: Session, limit: int = 50) -> list[AuditLog]:
    return (
        db.query(AuditLog)
        .filter(AuditLog.user_id == user_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
