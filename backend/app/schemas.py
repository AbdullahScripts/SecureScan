"""
Pydantic schemas for request validation and response serialization.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


# ============================================================
# Auth Schemas
# ============================================================

class UserCreate(BaseModel):
    """Schema for user registration."""
    full_name: str = Field(..., min_length=1, max_length=150, examples=["John Doe"])
    email: EmailStr = Field(..., examples=["john@example.com"])
    password: str = Field(..., min_length=8, max_length=128, examples=["securepass123"])


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr = Field(..., examples=["john@example.com"])
    password: str = Field(..., min_length=1, examples=["securepass123"])


class UserResponse(BaseModel):
    """Schema for user profile response."""
    id: int
    full_name: str
    email: str
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"


# ============================================================
# Scan Report Schemas
# ============================================================

class ScanReportResponse(BaseModel):
    """Schema for a single scan report response."""
    id: int
    user_id: int
    file_name: str
    file_size: int
    file_extension: str
    file_type: str
    sha256_hash: str
    yara_matches: str
    virustotal_status: str
    virustotal_malicious_count: int
    ai_label: str
    ai_confidence: float
    ai_note: Optional[str] = None
    risk_score: float
    final_verdict: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ScanReportListResponse(BaseModel):
    """Schema for paginated list of scan reports."""
    total: int
    reports: List[ScanReportResponse]


# ============================================================
# Generic Schemas
# ============================================================

class MessageResponse(BaseModel):
    """Generic message response."""
    message: str


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    message: str


# ============================================================
# URL Scan Schemas
# ============================================================

class UrlScanRequest(BaseModel):
    """Schema for URL scan request."""
    url: str = Field(..., examples=["https://example.com"])


class UrlScanReportResponse(BaseModel):
    """Schema for a single URL scan report response."""
    id: int
    user_id: int
    scan_type: str = "url"
    url: str
    domain: str
    local_indicators: str
    url_ai_label: str
    url_ai_confidence: float
    url_ai_note: Optional[str] = None
    virustotal_status: str
    virustotal_malicious_count: int
    risk_score: float
    final_verdict: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UrlScanReportListResponse(BaseModel):
    """Schema for paginated list of URL scan reports."""
    total: int
    reports: List[UrlScanReportResponse]


# ============================================================
# Chat Schemas
# ============================================================

class ChatReportExplainRequest(BaseModel):
    """Schema for report explainer request (via path params)."""
    report_type: str
    report_id: int


class ChatReportExplainResponse(BaseModel):
    """Schema for report explainer response."""
    report_id: int
    report_type: str
    source: str
    explanation: str
    recommended_action: str


class ChatAskRequest(BaseModel):
    """Schema for guarded chat request."""
    question: str
    report_id: Optional[int] = None
    report_type: Optional[str] = None


class ChatAskResponse(BaseModel):
    """Schema for guarded chat response."""
    source: str
    answer: str


# ============================================================
# News Schemas
# ============================================================

class NewsItemResponse(BaseModel):
    """Schema for a single news item."""
    title: str
    description: str
    source: str
    url: str
    image: Optional[str] = None
    published_at: datetime
    category: str
    severity: str  # "Low", "Medium", "High", "Critical"


class NewsListResponse(BaseModel):
    """Schema for list of news items."""
    total: int
    news: List[NewsItemResponse]
