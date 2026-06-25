from typing import List

from fastapi import HTTPException
from langchain_core.messages import AIMessage, HumanMessage
from sqlalchemy.orm import Session

from app.models.chat import ChatMessage, ChatSession
from app.models.user import User
from app.rag.chain import get_chain


def create_session(user: User, db: Session) -> ChatSession:
    session = ChatSession(user_id=user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def send_message(session_id: int, content: str, user: User, db: Session) -> ChatMessage:
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # Build LangChain-compatible history from DB
    history_records: List[ChatMessage] = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    chat_history = []
    for msg in history_records:
        if msg.role == "user":
            chat_history.append(HumanMessage(content=msg.content))
        else:
            chat_history.append(AIMessage(content=msg.content))

    # Run RAG chain
    chain = get_chain()
    result = chain.invoke({"input": content, "chat_history": chat_history})
    answer: str = result["answer"]

    # Persist both turns
    user_msg = ChatMessage(session_id=session_id, role="user", content=content)
    assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=answer)
    db.add(user_msg)
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)
    return assistant_msg


def get_sessions(user: User, db: Session) -> List[ChatSession]:
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )


def get_session_messages(session_id: int, user: User, db: Session) -> List[ChatMessage]:
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
        .all()
    )
