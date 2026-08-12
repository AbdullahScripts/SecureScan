"""
YARA scanning service.

Loads rules from app/yara_rules/demo_rules.yar and scans files statically.
Files are never executed — yara.match reads bytes from disk only.
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import yara

logger = logging.getLogger(__name__)

_RULES_DIR = Path(__file__).resolve().parent.parent / "yara_rules"
_DEFAULT_RULES_FILE = _RULES_DIR / "demo_rules.yar"

_compiled_rules: Optional[yara.Rules] = None


def _resolve_rules_path() -> Path:
    from app.config import settings

    configured = getattr(settings, "YARA_RULES_PATH", "") or ""
    if configured.strip():
        path = Path(configured.strip())
        if not path.is_absolute():
            path = Path.cwd() / path
        return path
    return _DEFAULT_RULES_FILE


def _compile_rules() -> yara.Rules:
    global _compiled_rules
    if _compiled_rules is not None:
        return _compiled_rules

    rules_path = _resolve_rules_path()
    if not rules_path.is_file():
        raise FileNotFoundError(f"YARA rules file not found: {rules_path}")

    logger.info("Compiling YARA rules from: %s", rules_path)
    _compiled_rules = yara.compile(filepath=str(rules_path))
    return _compiled_rules


def scan_file(file_path: str) -> List[Dict[str, Any]]:
    """
    Scan a file using compiled YARA rules.

    Args:
        file_path: Absolute path to the file to scan.

    Returns:
        List of match dicts: rule, severity, description.
    """
    if not os.path.isfile(file_path):
        logger.warning("YARA scan skipped, file not found: %s", file_path)
        return []

    try:
        rules = _compile_rules()
        matches = rules.match(filepath=file_path, timeout=60)
    except yara.Error as exc:
        logger.error("YARA scan error for %s: %s", file_path, exc)
        return []

    results: List[Dict[str, Any]] = []
    for match in matches:
        meta = match.meta or {}
        results.append(
            {
                "rule": match.rule,
                "severity": str(meta.get("severity", "unknown")),
                "description": str(meta.get("description", "")),
            }
        )

    logger.info("YARA scan complete for %s: %d match(es)", file_path, len(results))
    return results
