"""
Report routes: view scan history and individual reports.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ScanReport, UrlScanReport, User
from app.schemas import ScanReportListResponse, ScanReportResponse, UrlScanReportListResponse, UrlScanReportResponse
from app.security import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/", response_model=ScanReportListResponse)
def get_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all file scan reports for the authenticated user.

    Returns reports in descending order (newest first).
    Only returns reports owned by the current user.
    """
    reports = (
        db.query(ScanReport)
        .filter(ScanReport.user_id == current_user.id)
        .order_by(ScanReport.created_at.desc())
        .all()
    )

    return ScanReportListResponse(total=len(reports), reports=reports)


@router.get("/{report_id}", response_model=ScanReportResponse)
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a single file scan report by ID.

    Only returns the report if it belongs to the current user.
    Returns 404 if not found or not owned by the user.
    """
    report = (
        db.query(ScanReport)
        .filter(
            ScanReport.id == report_id,
            ScanReport.user_id == current_user.id,
        )
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    return report


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a single file scan report by ID.

    Only deletes the report if it belongs to the current user.
    Returns 404 if not found or not owned by the user.
    """
    report = (
        db.query(ScanReport)
        .filter(
            ScanReport.id == report_id,
            ScanReport.user_id == current_user.id,
        )
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    db.delete(report)
    db.commit()


class DeleteSelectedRequest(BaseModel):
    report_ids: list[int]


@router.post("/delete-selected", status_code=status.HTTP_204_NO_CONTENT)
def delete_selected_reports(
    request: DeleteSelectedRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete selected file scan reports.

    Only deletes reports that belong to the current user.
    """
    reports = (
        db.query(ScanReport)
        .filter(
            ScanReport.id.in_(request.report_ids),
            ScanReport.user_id == current_user.id,
        )
        .all()
    )

    for report in reports:
        db.delete(report)
    db.commit()


@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
def clear_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Clear all file scan reports for the current user.
    """
    reports = (
        db.query(ScanReport)
        .filter(ScanReport.user_id == current_user.id)
        .all()
    )

    for report in reports:
        db.delete(report)
    db.commit()


router_url = APIRouter(prefix="/url-reports", tags=["URL Reports"])


@router_url.get("/", response_model=UrlScanReportListResponse)
def get_url_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all URL scan reports for the authenticated user.

    Returns reports in descending order (newest first).
    Only returns reports owned by the current user.
    """
    reports = (
        db.query(UrlScanReport)
        .filter(UrlScanReport.user_id == current_user.id)
        .order_by(UrlScanReport.created_at.desc())
        .all()
    )

    return UrlScanReportListResponse(total=len(reports), reports=reports)


@router_url.get("/{report_id}", response_model=UrlScanReportResponse)
def get_url_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a single URL scan report by ID.

    Only returns the report if it belongs to the current user.
    Returns 404 if not found or not owned by the user.
    """
    report = (
        db.query(UrlScanReport)
        .filter(
            UrlScanReport.id == report_id,
            UrlScanReport.user_id == current_user.id,
        )
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    return report


@router_url.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_url_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a single URL scan report by ID.

    Only deletes the report if it belongs to the current user.
    Returns 404 if not found or not owned by the user.
    """
    report = (
        db.query(UrlScanReport)
        .filter(
            UrlScanReport.id == report_id,
            UrlScanReport.user_id == current_user.id,
        )
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    db.delete(report)
    db.commit()


@router_url.post("/delete-selected", status_code=status.HTTP_204_NO_CONTENT)
def delete_selected_url_reports(
    request: DeleteSelectedRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete selected URL scan reports.

    Only deletes reports that belong to the current user.
    """
    reports = (
        db.query(UrlScanReport)
        .filter(
            UrlScanReport.id.in_(request.report_ids),
            UrlScanReport.user_id == current_user.id,
        )
        .all()
    )

    for report in reports:
        db.delete(report)
    db.commit()


@router_url.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
def clear_url_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Clear all URL scan reports for the current user.
    """
    reports = (
        db.query(UrlScanReport)
        .filter(UrlScanReport.user_id == current_user.id)
        .all()
    )

    for report in reports:
        db.delete(report)
    db.commit()
