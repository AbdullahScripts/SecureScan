"""
SQLAlchemy ORM models for the application.
Defines User and ScanReport tables.
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    """User account for authentication and report ownership."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to scan reports
    scan_reports = relationship("ScanReport", back_populates="user")
    url_scan_reports = relationship("UrlScanReport", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"


class ScanReport(Base):
    """Scan report storing analysis results for an uploaded file."""

    __tablename__ = "scan_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # File metadata
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    file_extension = Column(String(10), nullable=False)
    file_type = Column(String(100), nullable=False)
    sha256_hash = Column(String(64), nullable=False, index=True)

    # YARA results (JSON string)
    yara_matches = Column(Text, default="[]", nullable=False)

    # VirusTotal results
    virustotal_status = Column(String(50), default="not_checked", nullable=False)
    virustotal_malicious_count = Column(Integer, default=0, nullable=False)

    # AI model results
    ai_label = Column(String(50), default="unknown", nullable=False)
    ai_confidence = Column(Float, default=0.0, nullable=False)
    ai_note = Column(Text, nullable=True)

    # Risk assessment
    risk_score = Column(Float, default=0.0, nullable=False)
    final_verdict = Column(String(50), default="pending", nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to user
    user = relationship("User", back_populates="scan_reports")

    def __repr__(self):
        return f"<ScanReport(id={self.id}, file='{self.file_name}', verdict='{self.final_verdict}')>"


class UrlScanReport(Base):
    """URL scan report storing analysis results for a URL."""

    __tablename__ = "url_scan_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # URL metadata
    url = Column(Text, nullable=False)
    domain = Column(String(255), nullable=False)

    # Local indicators (JSON string)
    local_indicators = Column(Text, default="[]", nullable=False)

    # VirusTotal results
    virustotal_status = Column(String(50), default="not_checked", nullable=False)
    virustotal_malicious_count = Column(Integer, default=0, nullable=False)

    # URL AI results (disabled)
    url_ai_label = Column(String(50), default="disabled", nullable=False)
    url_ai_confidence = Column(Float, default=0.0, nullable=False)
    url_ai_note = Column(Text, nullable=True)

    # Risk assessment
    risk_score = Column(Float, default=0.0, nullable=False)
    final_verdict = Column(String(50), default="pending", nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to user
    user = relationship("User", back_populates="url_scan_reports")

    def __repr__(self):
        return f"<UrlScanReport(id={self.id}, url='{self.url[:30]}...', verdict='{self.final_verdict}')>"
