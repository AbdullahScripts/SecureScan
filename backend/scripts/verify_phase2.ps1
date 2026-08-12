# Phase 2 YARA verification
# Run from backend/ with server up:  .\scripts\verify_phase2.ps1

$ErrorActionPreference = "Stop"
$base = if ($env:API_BASE_URL) { $env:API_BASE_URL } else { "http://127.0.0.1:8000" }

Write-Host "Phase 2 YARA verification against $base`n"

# Direct YARA service test (no HTTP)
.venv\Scripts\python.exe -c @"
from app.services.yara_service import scan_file
from pathlib import Path
p = Path('test_sample.bin').resolve()
m = scan_file(str(p))
assert len(m) >= 1, m
assert any(x['rule'] == 'demo_pe_header_check' for x in m), m
print('YARA direct scan OK:', m)
"@

$email = "yara_$(Get-Random)@example.com"
$signup = Invoke-WebRequest -Uri "$base/auth/signup" -Method POST `
    -Body (@{ full_name = "YARA Test"; email = $email; password = "securepass123" } | ConvertTo-Json) `
    -ContentType "application/json" -UseBasicParsing
$token = ($signup.Content | ConvertFrom-Json).access_token

$boundary = [guid]::NewGuid().ToString()
$bytes = [IO.File]::ReadAllBytes("test_sample.bin")
$enc = [Text.Encoding]::GetEncoding("iso-8859-1")
$body = @(
    "--$boundary",
    'Content-Disposition: form-data; name="file"; filename="test_sample.bin"',
    "Content-Type: application/octet-stream",
    "",
    $enc.GetString($bytes),
    "--$boundary--"
) -join "`r`n"

$scan = Invoke-WebRequest -Uri "$base/scan/file" -Method POST `
    -Headers @{ Authorization = "Bearer $token" } `
    -ContentType "multipart/form-data; boundary=$boundary" -Body $body -UseBasicParsing
$report = $scan.Content | ConvertFrom-Json
$matches = $report.yara_matches | ConvertFrom-Json

if ($scan.StatusCode -ne 201) { throw "Expected 201, got $($scan.StatusCode)" }
if ($matches.Count -lt 1) { throw "Expected YARA matches, got: $($report.yara_matches)" }
$pe = $matches | Where-Object { $_.rule -eq "demo_pe_header_check" }
if (-not $pe) { throw "demo_pe_header_check not in matches: $($report.yara_matches)" }

Write-Host "PASS: POST /scan/file returned YARA matches"
Write-Host "yara_matches: $($report.yara_matches)"
Write-Host "`nPhase 2 verification complete." -ForegroundColor Green
