/*
    Demo YARA Rules for Malware Detection System

    Loaded by yara_service.py (Phase 2+).
    Reference: https://yara.readthedocs.io/
*/

rule demo_suspicious_string
{
    meta:
        description = "Demo rule - detects a placeholder suspicious string"
        author = "Malware Detection System"
        severity = "low"
        phase = "demo"

    strings:
        $demo_string = "THIS_IS_A_DEMO_DETECTION_STRING" ascii nocase

    condition:
        $demo_string
}

rule demo_pe_header_check
{
    meta:
        description = "Demo rule - checks for PE header magic bytes"
        author = "Malware Detection System"
        severity = "info"
        phase = "demo"

    condition:
        uint16(0) == 0x5A4D
}
