"""
Local URL check service.
"""

import logging
import socket
from typing import List
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

SUSPICIOUS_KEYWORDS = [
    "login",
    "verify",
    "update",
    "free",
    "prize",
    "account",
    "password",
    "secure",
    "billing",
    "payment",
    "bank",
]


def check_url(url: str) -> List[str]:
    """
    Check a URL for suspicious indicators.

    Args:
        url: URL string to check.

    Returns:
        List of indicator strings.
    """
    indicators = []

    # Parse URL
    try:
        parsed = urlparse(url)
    except Exception as e:
        logger.warning(f"URL parsing failed for {url}: {e}")
        indicators.append("invalid_format")
        return indicators

    # Check protocol
    if parsed.scheme not in ["http", "https"]:
        indicators.append("invalid_protocol")

    # Check IP as hostname
    hostname = parsed.netloc.split(":")[0] if ":" in parsed.netloc else parsed.netloc
    try:
        socket.inet_aton(hostname)
        indicators.append("ip_as_hostname")
    except socket.error:
        pass

    # Check URL length
    if len(url) > 200:
        indicators.append("too_long")

    # Check number of subdomains
    parts = hostname.split(".")
    if len(parts) > 4:  # e.g., a.b.c.example.com has 4 subdomains (a, b, c)
        indicators.append("too_many_subdomains")

    # Check @ symbol
    if "@" in url:
        indicators.append("has_at_symbol")

    # Check suspicious keywords
    lower_url = url.lower()
    for keyword in SUSPICIOUS_KEYWORDS:
        if keyword in lower_url:
            indicators.append(f"suspicious_keyword_{keyword}")

    logger.info(f"URL check for {url} found indicators: {indicators}")
    return indicators


def extract_domain(url: str) -> str:
    """
    Extract domain from URL.

    Args:
        url: URL string.

    Returns:
        Domain string.
    """
    try:
        parsed = urlparse(url)
        hostname = parsed.netloc.split(":")[0] if ":" in parsed.netloc else parsed.netloc
        return hostname
    except Exception as e:
        logger.warning(f"Domain extraction failed for {url}: {e}")
        return "unknown"
