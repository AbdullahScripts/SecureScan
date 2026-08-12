"""
File scanning route: upload executable files for analysis.
"""

import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import ScanReport, User
from app.schemas import ScanReportResponse
from app.security import get_current_user
from app.services.ai_scanner_service import predict
from app.services.file_service import (
    calculate_sha256,
    get_file_metadata,
    save_upload,
    validate_file_extension,
    validate_file_size,
)
from app.services.risk_service import calculate_risk, determine_verdict
from app.services.virustotal_service import lookup_hash
from app.services.yara_service import scan_file

router = APIRouter(prefix="/scan", tags=["Scanning"])


@router.post("/file", response_model=ScanReportResponse, status_code=status.HTTP_201_CREATED)
async def scan_file_upload(
    file: UploadFile = File(..., description="Executable file to scan (.exe, .dll, .bin)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload an executable file for malware analysis.

    Process:
    1. Validate file extension (.exe, .dll, .bin only)
    2. Validate file size (within configured limit)
    3. Save file to uploads directory
    4. Calculate SHA256 hash
    5. Extract file metadata
    6. Run analysis services (YARA + VirusTotal hash lookup; AI placeholder)
    7. Calculate risk score and verdict
    8. Save and return scan report

    **Important**: The uploaded file is NEVER executed.
    """
    # Step 1: Validate file extension
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided",
        )

    if not validate_file_extension(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Accepted types: {', '.join(settings.allowed_extensions_list)}",
        )

    # Step 2: Read file content and validate size
    file_content = await file.read()

    if not validate_file_size(len(file_content)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE_MB} MB",
        )

    # Step 3: Save file to uploads directory
    saved_path = save_upload(file.filename, file_content)

    # Step 4: Calculate SHA256 hash
    sha256_hash = calculate_sha256(file_content)

    # Step 5: Extract file metadata
    metadata = get_file_metadata(file.filename, len(file_content))

    # Step 6: Run analysis services
    yara_matches = scan_file(saved_path)
    vt_result = lookup_hash(sha256_hash)
    ai_result = predict(saved_path)

    # Step 7: Calculate risk score and determine verdict
    risk_score = calculate_risk(yara_matches, vt_result, ai_result)
    final_verdict = determine_verdict(risk_score, yara_matches, vt_result, ai_result)

    # Step 8: Create and save scan report
    scan_report = ScanReport(
        user_id=current_user.id,
        file_name=file.filename,
        file_size=len(file_content),
        file_extension=metadata["extension"],
        file_type=metadata["file_type"],
        sha256_hash=sha256_hash,
        yara_matches=json.dumps(yara_matches),
        virustotal_status=vt_result["status"],
        virustotal_malicious_count=vt_result["malicious_count"],
        ai_label=ai_result["label"],
        ai_confidence=ai_result["confidence"],
        ai_note=ai_result.get("note"),
        risk_score=risk_score,
        final_verdict=final_verdict,
        notes="Phase 5: YARA, VirusTotal hash lookup, MalConv AI scanner, and risk scoring/verdict active.",
    )

    db.add(scan_report)
    db.commit()
    db.refresh(scan_report)

    return scan_report
