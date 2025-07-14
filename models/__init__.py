# PromptOne - models/__init__.py
import os
from sqlalchemy import Column, Integer, String, JSON, UniqueConstraint, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class VoiceLocale(Base):
    __tablename__ = "voice_locales"

    id = Column(Integer, primary_key=True)
    voiceId = Column(String, nullable=False)
    locale = Column(String, nullable=False)  # e.g., "en-US"
    displayName = Column(String, nullable=True)
    displayLanguage = Column(String, nullable=True)  # e.g., "English (US & Canada)"
    accent = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    description = Column(String, nullable=True)
    availableStyles = Column(JSON, nullable=True)  # e.g., ["Conversational", "Promo"]
    rawdata = Column(JSON, nullable=True)  # 원본 전체 저장

    __table_args__ = (
        UniqueConstraint('voiceId', 'locale', name='uq_voice_locale'),
    )

def init_db(db_url="sqlite:///db/promptone_voices.db"):
    os.makedirs("db", exist_ok=True)
    engine = create_engine(db_url)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    return Session()
