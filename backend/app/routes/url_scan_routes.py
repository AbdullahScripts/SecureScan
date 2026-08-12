"""
URL scanning route: scan URLs for suspicious indicators.
"""

import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import UrlScanReport, User
from app.schemas import UrlScanRequest, UrlScanReportResponse
from app.security import get_current_user
from app.services.url_check_service import check_url, extract_domain
from app.services.url_risk_service import calculate_risk, determine_verdict
from app.services.virustotal_service import lookup_url

router = APIRouter(prefix="/scan", tags=["URL Scanning"])


@router.post("/url", response_model=UrlScanReportResponse, status_code=status.HTTP_201_CREATED)
async def scan_url(
    request: UrlScanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Scan a URL for suspicious indicators.

    Process:
    1. Validate URL format
    2. Run local URL checks
    3. Look up on VirusTotal (if API key configured)
    4. Calculate risk score and verdict
    5. Save and return URL scan report
    """
    url = request.url.strip()
    if not url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL cannot be empty",
        )

    # Step 1: Run local checks and extract domain
    local_indicators = check_url(url)
    domain = extract_domain(url)

    # Step 2: Run VirusTotal URL lookup
    vt_result = lookup_url(url)

    # Step 3: Calculate risk score and determine verdict
    risk_score = calculate_risk(local_indicators, vt_result)
    final_verdict = determine_verdict(risk_score, local_indicators, vt_result)

    # Step 4: Create and save URL scan report
    url_ai_note = "Disabled because isolated Hugging Face URL model tests produced false positives on known benign URLs."
    scan_report = UrlScanReport(
        user_id=current_user.id,
        url=url,
        domain=domain,
        local_indicators=json.dumps(local_indicators),
        url_ai_label="disabled",
        url_ai_confidence=0.0,
        url_ai_note=url_ai_note,
        virustotal_status=vt_result["status"],
        virustotal_malicious_count=vt_result["malicious_count"],
        risk_score=risk_score,
        final_verdict=final_verdict,
        notes="Phase 6: Local URL checks and VirusTotal URL lookup active. URL AI disabled.",
    )

    db.add(scan_report)
    db.commit()
    db.refresh(scan_report)

    return scan_report
