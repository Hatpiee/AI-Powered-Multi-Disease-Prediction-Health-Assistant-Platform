from fastapi import APIRouter

from app.api.v1 import appointments, audit_logs, auth, chat, predictions, reports

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(predictions.router)
api_router.include_router(chat.router)
api_router.include_router(reports.router)
api_router.include_router(appointments.router)
api_router.include_router(audit_logs.router)
