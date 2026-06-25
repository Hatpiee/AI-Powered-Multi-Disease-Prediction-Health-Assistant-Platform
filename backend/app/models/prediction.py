from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    disease_type = Column(String(20), nullable=False)  # diabetes | heart | liver | kidney
    input_features = Column(JSON, nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(10), nullable=False)   # low | medium | high
    shap_values = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="predictions")
    reports = relationship("Report", back_populates="prediction")
