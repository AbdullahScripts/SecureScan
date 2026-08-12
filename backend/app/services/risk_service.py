"""
Risk assessment service.

Phase 5: Real risk score and final verdict logic.
Combines YARA matches, VirusTotal results, and AI predictions with evidence-based approach.
"""

import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


def calculate_risk(
    yara_matches: List[Dict],
    vt_result: Dict,
    ai_result: Dict,
) -> float:
    """
    Calculate overall risk score from all analysis components with evidence-based approach.

    Args:
        yara_matches: List of YARA match dictionaries (each with rule, severity, description).
        vt_result: VirusTotal lookup result dictionary.
        ai_result: AI model prediction result dictionary.

    Returns:
        Risk score from 0.0 (safe) to 100.0 (critical).
    """
    logger.info("Starting evidence-based risk calculation...")
    risk_score = 0.0

    # ============================================================
    # YARA Scoring
    # ============================================================
    yara_points = 0.0
    if yara_matches and len(yara_matches) > 0:
        for match in yara_matches:
            rule_name = match.get("rule", "")
            severity = str(match.get("severity", "unknown")).lower()

            # Skip demo/info rules that just confirm PE structure
            if rule_name == "demo_pe_header_check" or severity == "info":
                logger.info(f"Skipping YARA rule {rule_name} (severity: {severity}) - adds 0 points")
                continue

            # Score based on severity
            if severity == "low":
                yara_points = max(yara_points, 10.0)
            elif severity == "medium":
                yara_points = max(yara_points, 20.0)
            elif severity == "high":
                yara_points = max(yara_points, 40.0)
            elif severity == "critical":
                yara_points = max(yara_points, 60.0)

    logger.info(f"YARA points: {yara_points} (matches: {len(yara_matches)})")
    risk_score += yara_points

    # ============================================================
    # VirusTotal Scoring
    # ============================================================
    vt_points = 0.0
    vt_status = vt_result.get("status", "not_checked")
    vt_malicious_count = vt_result.get("malicious_count", 0)

    if vt_status == "found":
        if vt_malicious_count == 0:
            vt_points = 0.0
        elif vt_malicious_count == 1:
            vt_points = 10.0
        elif 2 <= vt_malicious_count <= 3:
            vt_points = 25.0
        elif 4 <= vt_malicious_count <= 10:
            vt_points = 45.0
        else:  # >10
            vt_points = 70.0
    elif vt_status in ["not_checked", "not_found", "error"]:
        vt_points = 0.0

    logger.info(f"VirusTotal points: {vt_points} (status: {vt_status}, malicious: {vt_malicious_count})")
    risk_score += vt_points

    # ============================================================
    # AI Scoring (advisory only)
    # ============================================================
    ai_points = 0.0
    ai_label = ai_result.get("label", "unknown")

    if ai_label == "malicious":
        ai_points = 20.0
    elif ai_label == "suspicious":
        ai_points = 10.0
    # All other labels (benign, skipped, unavailable, unknown) add 0

    logger.info(f"AI points: {ai_points} (label: {ai_label})")
    risk_score += ai_points

    # Cap risk score at 100
    risk_score = min(risk_score, 100.0)

    logger.info(f"Final calculated risk score: {risk_score}")
    return risk_score


def determine_verdict(
    risk_score: float,
    yara_matches: List[Dict],
    vt_result: Dict,
    ai_result: Dict,
) -> str:
    """
    Determine final verdict based on combined analysis with evidence-based logic.

    Args:
        risk_score: Calculated risk score.
        yara_matches: List of YARA match dictionaries.
        vt_result: VirusTotal lookup result dictionary.
        ai_result: AI model prediction result dictionary.

    Returns:
        Final verdict string: "Low Risk", "Medium Risk", "High Risk", or "Critical Risk".
    """
    logger.info(f"Determining evidence-based verdict for risk score: {risk_score}")

    # Check for Critical Risk first (strongest evidence)
    vt_malicious_count = vt_result.get("malicious_count", 0)
    vt_status = vt_result.get("status", "not_checked")

    has_critical_yara = False
    has_high_yara = False
    if yara_matches and len(yara_matches) > 0:
        for match in yara_matches:
            rule_name = match.get("rule", "")
            severity = str(match.get("severity", "unknown")).lower()
            if rule_name != "demo_pe_header_check" and severity != "info":
                if severity == "critical":
                    has_critical_yara = True
                if severity == "high":
                    has_high_yara = True

    ai_label = ai_result.get("label", "unknown")

    # Critical Risk conditions
    if (vt_status == "found" and vt_malicious_count > 10) or has_critical_yara:
        verdict = "Critical Risk"
    # High Risk conditions
    elif (vt_status == "found" and 4 <= vt_malicious_count <= 10) or has_high_yara or (has_high_yara and ai_label == "malicious"):
        verdict = "High Risk"
    # Medium Risk conditions
    elif risk_score > 20:
        verdict = "Medium Risk"
    # Default to Low Risk
    else:
        verdict = "Low Risk"

    logger.info(f"Final verdict determined: {verdict}")
    return verdict
