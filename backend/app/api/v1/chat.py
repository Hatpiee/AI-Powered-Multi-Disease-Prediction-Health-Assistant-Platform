from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.chat import MessageOut, MessageRequest, SessionDetailOut, SessionOut
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/sessions", response_model=SessionOut, status_code=201)
def create_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return chat_service.create_session(current_user, db)


@router.post("/sessions/{session_id}/messages", response_model=MessageOut)
def send_message(
    session_id: int,
    body: MessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return chat_service.send_message(session_id, body.content, current_user, db)


@router.get("/sessions", response_model=List[SessionOut])
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return chat_service.get_sessions(current_user, db)


@router.get("/sessions/{session_id}/messages", response_model=List[MessageOut])
def get_session_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return chat_service.get_session_messages(session_id, current_user, db)
