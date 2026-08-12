"""
URL risk assessment service.
"""

import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


def calculate_risk(
    local_indicators: List[str],
    vt_result: Dict,
) -> float:
    """
    Calculate overall risk score for a URL.

    Args:
        local_indicators: List of local indicator strings.
        vt_result: VirusTotal lookup result dictionary.

    Returns:
        Risk score from 0.0 (safe) to 100.0 (critical).
    """
    logger.info("Starting URL risk calculation...")
    risk_score = 0.0

    # Local indicators
    local_points = 0.0
    indicator_count = len(local_indicators)
    if indicator_count == 1:
        local_points = 10.0
    elif 2 <= indicator_count <= 3:
        local_points = 25.0
    elif indicator_count > 3:
        local_points = 40.0
    logger.info(f"Local points: {local_points} (indicators: {indicator_count})")
    risk_score += local_points

    # VirusTotal
    vt_points = 0.0
    vt_status = vt_result.get("status", "not_checked")
    vt_malicious_count = vt_result.get("malicious_count", 0)

    if vt_status == "found":
        if vt_malicious_count == 0:
            vt_points = 0.0
        elif 1 <= vt_malicious_count <= 3:
            vt_points = 25.0
        elif 4 <= vt_malicious_count <= 10:
            vt_points = 45.0
        else:  # >10
            vt_points = 70.0
    logger.info(f"VirusTotal points: {vt_points} (status: {vt_status}, malicious: {vt_malicious_count})")
    risk_score += vt_points

    # Cap risk score at 100
    risk_score = min(risk_score, 100.0)

    logger.info(f"Final calculated URL risk score: {risk_score}")
    return risk_score


def determine_verdict(
    risk_score: float,
    local_indicators: List[str],
    vt_result: Dict,
) -> str:
    """
    Determine final verdict for a URL based on risk score.

    Args:
        risk_score: Calculated risk score.
        local_indicators: List of local indicator strings.
        vt_result: VirusTotal lookup result dictionary.

    Returns:
        Final verdict string: "Low Risk", "Medium Risk", "High Risk", or "Critical Risk".
    """
    logger.info(f"Determining URL verdict for risk score: {risk_score}")
    if risk_score <= 20:
        verdict = "Low Risk"
    elif risk_score <= 50:
        verdict = "Medium Risk"
    elif risk_score <= 75:
        verdict = "High Risk"
    else:  # >75
        verdict = "Critical Risk"

    logger.info(f"Final URL verdict determined: {verdict}")
    return verdict
