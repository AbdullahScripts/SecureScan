"""
Chat routes: report explainer and guarded project chatbot.
"""

import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import ScanReport, UrlScanReport, User
from app.schemas import ChatReportExplainResponse, ChatAskRequest, ChatAskResponse
from app.security import get_current_user
from app.services.chat_service import explain_report, guarded_chat

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/report/{report_type}/{report_id}", response_model=ChatReportExplainResponse)
async def explain_report_endpoint(
    report_type: str,
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Explain a file or URL scan report.
    """
    report_type = report_type.lower().strip()

    if report_type == "file":
        report = db.query(ScanReport).filter(
            ScanReport.id == report_id,
            ScanReport.user_id == current_user.id,
        ).first()
    elif report_type == "url":
        report = db.query(UrlScanReport).filter(
            UrlScanReport.id == report_id,
            UrlScanReport.user_id == current_user.id,
        ).first()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="report_type must be 'file' or 'url'",
        )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{report_type.capitalize()} report not found or you don't own it",
        )

    report_dict = {}
    for column in report.__table__.columns:
        report_dict[column.name] = getattr(report, column.name)

    source, explanation, recommended_action = explain_report(report_type, report_dict)

    return ChatReportExplainResponse(
        report_id=report_id,
        report_type=report_type,
        source=source,
        explanation=explanation,
        recommended_action=recommended_action,
    )


@router.post("/ask", response_model=ChatAskResponse)
async def guarded_chat_endpoint(
    request: ChatAskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Guarded project chatbot.
    """
    report_context = None

    if request.report_id is not None and request.report_type is not None:
        report_type = request.report_type.lower().strip()
        if report_type == "file":
            report = db.query(ScanReport).filter(
                ScanReport.id == request.report_id,
                ScanReport.user_id == current_user.id,
            ).first()
        elif report_type == "url":
            report = db.query(UrlScanReport).filter(
                UrlScanReport.id == request.report_id,
                UrlScanReport.user_id == current_user.id,
            ).first()
        else:
            report = None

        if report:
            report_context = {}
            for column in report.__table__.columns:
                report_context[column.name] = getattr(report, column.name)

    source, answer = guarded_chat(request.question, report_context)

    return ChatAskResponse(source=source, answer=answer)
