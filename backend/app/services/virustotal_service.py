"""
VirusTotal threat intelligence service.

Uses VirusTotal API v3 file hash lookup only (GET /files/{sha256}).
Never uploads user files — only the SHA256 hash computed locally.
"""

import logging
from typing import Dict

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

VT_API_BASE = "https://www.virustotal.com/api/v3"


def lookup_hash(sha256_hash: str) -> Dict:
    """
    Look up a file hash on VirusTotal.

    Args:
        sha256_hash: SHA256 hash of the file (hex, 64 characters).

    Returns:
        Dictionary with:
          - status: not_checked | found | not_found | error
          - malicious_count: int (engines reporting malicious)
    """
    api_key = (settings.VIRUSTOTAL_API_KEY or "").strip()
    if not api_key:
        logger.info("VirusTotal skipped: VIRUSTOTAL_API_KEY not configured")
        return {"status": "not_checked", "malicious_count": 0}

    file_id = sha256_hash.strip().lower()
    url = f"{VT_API_BASE}/files/{file_id}"
    headers = {
        "x-apikey": api_key,
        "Accept": "application/json",
    }

    try:
        with httpx.Client(timeout=settings.VIRUSTOTAL_TIMEOUT_SECONDS) as client:
            response = client.get(url, headers=headers)
    except httpx.HTTPError as exc:
        logger.error("VirusTotal request failed for hash %s...: %s", file_id[:16], exc)
        return {"status": "error", "malicious_count": 0}

    if response.status_code == 404:
        logger.info("VirusTotal hash not found: %s...", file_id[:16])
        return {"status": "not_found", "malicious_count": 0}

    if response.status_code == 429:
        logger.warning("VirusTotal rate limit exceeded for hash %s...", file_id[:16])
        return {"status": "error", "malicious_count": 0}

    if response.status_code != 200:
        logger.error(
            "VirusTotal API error %s for hash %s...: %s",
            response.status_code,
            file_id[:16],
            response.text[:300],
        )
        return {"status": "error", "malicious_count": 0}

    try:
        payload = response.json()
        stats = payload["data"]["attributes"]["last_analysis_stats"]
        malicious_count = int(stats.get("malicious", 0))
    except (KeyError, TypeError, ValueError) as exc:
        logger.error("VirusTotal response parse error: %s", exc)
        return {"status": "error", "malicious_count": 0}

    logger.info(
        "VirusTotal hash found: %s... malicious_count=%s",
        file_id[:16],
        malicious_count,
    )
    return {"status": "found", "malicious_count": malicious_count}


def lookup_url(url: str) -> Dict:
    """
    Look up a URL on VirusTotal (report only, no submission).

    Args:
        url: URL to look up.

    Returns:
        Dictionary with:
          - status: not_checked | found | not_found | rate_limited | error
          - malicious_count: int (engines reporting malicious)
    """
    import base64

    api_key = (settings.VIRUSTOTAL_API_KEY or "").strip()
    if not api_key:
        logger.info("VirusTotal URL lookup skipped: VIRUSTOTAL_API_KEY not configured")
        return {"status": "not_checked", "malicious_count": 0}

    # Compute URL ID (base64 encode URL, strip trailing '=')
    url_encoded = base64.urlsafe_b64encode(url.encode("utf-8")).decode("utf-8").rstrip("=")
    vt_url = f"{VT_API_BASE}/urls/{url_encoded}"
    headers = {
        "x-apikey": api_key,
        "Accept": "application/json",
    }

    try:
        with httpx.Client(timeout=settings.VIRUSTOTAL_TIMEOUT_SECONDS) as client:
            response = client.get(vt_url, headers=headers)
    except httpx.HTTPError as exc:
        logger.error("VirusTotal URL request failed...: %s", exc)
        return {"status": "error", "malicious_count": 0}

    if response.status_code == 404:
        logger.info("VirusTotal URL not found")
        return {"status": "not_found", "malicious_count": 0}

    if response.status_code == 429:
        logger.warning("VirusTotal rate limit exceeded for URL lookup")
        return {"status": "rate_limited", "malicious_count": 0}

    if response.status_code != 200:
        logger.error(
            "VirusTotal URL API error %s: %s",
            response.status_code,
            response.text[:300],
        )
        return {"status": "error", "malicious_count": 0}

    try:
        payload = response.json()
        stats = payload["data"]["attributes"]["last_analysis_stats"]
        malicious_count = int(stats.get("malicious", 0))
    except (KeyError, TypeError, ValueError) as exc:
        logger.error("VirusTotal URL response parse error: %s", exc)
        return {"status": "error", "malicious_count": 0}

    logger.info(
        "VirusTotal URL found: malicious_count=%s",
        malicious_count,
    )
    return {"status": "found", "malicious_count": malicious_count}
