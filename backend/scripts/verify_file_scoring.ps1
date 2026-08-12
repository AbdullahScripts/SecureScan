# Verify file scoring fix
Write-Host "=== SafeScan File Scoring Verification ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Set backend root and change directory
$backendRoot = Split-Path -Parent $PSScriptRoot
Set-Location $backendRoot

# Step 2: Direct risk service test
Write-Host "Step 1: Testing risk service directly..." -ForegroundColor Yellow

$testScript = @'
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.risk_service import calculate_risk, determine_verdict

print("Test 1: Non-PE file (AI skipped, YARA demo rule, VT not checked)")
yara_matches = [{"rule": "demo_pe_header_check", "severity": "info", "description": "Demo PE header check"}]
vt_result = {"status": "not_checked", "malicious_count": 0}
ai_result = {"label": "skipped", "confidence": 0.0, "note": "AI scanner skipped because this file is not a valid PE executable."}
risk = calculate_risk(yara_matches, vt_result, ai_result)
verdict = determine_verdict(risk, yara_matches, vt_result, ai_result)
print(f"  Risk score: {risk}")
print(f"  Final verdict: {verdict}")
print(f"  Expected: risk_score ~0, verdict Low Risk ✅" if risk < 10 and verdict == "Low Risk" else "  ❌ Unexpected result!")
print()

print("Test 2: Valid PE with demo rule + AI malicious (confidence 0.85 → suspicious)")
yara_matches2 = [{"rule": "demo_pe_header_check", "severity": "info", "description": "Demo PE header check"}]
vt_result2 = {"status": "not_checked", "malicious_count": 0}
ai_result2 = {"label": "suspicious", "confidence": 0.85, "note": "AI scanner ran on valid PE executable."}
risk2 = calculate_risk(yara_matches2, vt_result2, ai_result2)
verdict2 = determine_verdict(risk2, yara_matches2, vt_result2, ai_result2)
print(f"  Risk score: {risk2}")
print(f"  Final verdict: {verdict2}")
print(f"  Expected: risk_score ~10, verdict Low/Medium Risk ✅" if risk2 <= 25 else "  ❌ Unexpected result!")
print()

print("Test 3: Valid PE with VT 1 engine")
yara_matches3 = []
vt_result3 = {"status": "found", "malicious_count": 1}
ai_result3 = {"label": "benign", "confidence": 0.95, "note": "AI scanner ran on valid PE executable."}
risk3 = calculate_risk(yara_matches3, vt_result3, ai_result3)
verdict3 = determine_verdict(risk3, yara_matches3, vt_result3, ai_result3)
print(f"  Risk score: {risk3}")
print(f"  Final verdict: {verdict3}")
print(f"  Expected: risk_score 10, verdict Low/Medium Risk ✅" if risk3 == 10 else "  ❌ Unexpected result!")
print()

print("Test 4: Valid PE with VT 12 engines")
yara_matches4 = []
vt_result4 = {"status": "found", "malicious_count": 12}
ai_result4 = {"label": "benign", "confidence": 0.95, "note": "AI scanner ran on valid PE executable."}
risk4 = calculate_risk(yara_matches4, vt_result4, ai_result4)
verdict4 = determine_verdict(risk4, yara_matches4, vt_result4, ai_result4)
print(f"  Risk score: {risk4}")
print(f"  Final verdict: {verdict4}")
print(f"  Expected: risk_score 70, verdict Critical Risk ✅" if risk4 ==70 and verdict4 == "Critical Risk" else "  ❌ Unexpected result!")
'@

$testScript | Out-File -FilePath "scripts\test_risk_service.py" -Encoding UTF8
.\.venv\Scripts\python.exe .\scripts\test_risk_service.py
Remove-Item "scripts\test_risk_service.py" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Verification complete ===" -ForegroundColor Green
