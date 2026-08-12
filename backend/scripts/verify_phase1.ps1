# Phase 1 API verification script
# Run from backend/:  .\scripts\verify_phase1.ps1
# Requires server at http://127.0.0.1:8000

$ErrorActionPreference = "Stop"
$base = if ($env:API_BASE_URL) { $env:API_BASE_URL } else { "http://127.0.0.1:8000" }
$passed = 0
$failed = 0

function Test-Result {
    param([string]$Name, [bool]$Condition, [string]$Detail = "")
    if ($Condition) {
        Write-Host "PASS: $Name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "FAIL: $Name - $Detail" -ForegroundColor Red
        $script:failed++
    }
}

Write-Host "Phase 1 API verification against $base`n"

# Health
$r = Invoke-WebRequest -Uri "$base/" -UseBasicParsing
$health = $r.Content | ConvertFrom-Json
Test-Result "GET /" ($r.StatusCode -eq 200 -and $health.status -eq "healthy")

# Auth
$email = "verify_$(Get-Random)@example.com"
$signup = Invoke-WebRequest -Uri "$base/auth/signup" -Method POST `
    -Body (@{ full_name = "Verify User"; email = $email; password = "securepass123" } | ConvertTo-Json) `
    -ContentType "application/json" -UseBasicParsing
Test-Result "POST /auth/signup" ($signup.StatusCode -eq 201)

$login = Invoke-WebRequest -Uri "$base/auth/login" -Method POST `
    -Body (@{ email = $email; password = "securepass123" } | ConvertTo-Json) `
    -ContentType "application/json" -UseBasicParsing
$token = ($login.Content | ConvertFrom-Json).access_token
Test-Result "POST /auth/login" ($login.StatusCode -eq 200 -and $token.Length -gt 10)

$me = Invoke-WebRequest -Uri "$base/auth/me" -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing
$meData = $me.Content | ConvertFrom-Json
Test-Result "GET /auth/me" ($me.StatusCode -eq 200 -and $meData.is_admin -eq $false)

try {
    Invoke-WebRequest -Uri "$base/auth/me" -UseBasicParsing -ErrorAction Stop | Out-Null
    Test-Result "GET /auth/me no token" $false "expected 401"
} catch {
    Test-Result "GET /auth/me no token" ($_.Exception.Response.StatusCode.value__ -eq 401)
}

try {
    Invoke-WebRequest -Uri "$base/auth/signup" -Method POST `
        -Body '{"full_name":"X","email":"short@test.com","password":"short"}' `
        -ContentType "application/json" -UseBasicParsing -ErrorAction Stop | Out-Null
    Test-Result "short password" $false
} catch {
    Test-Result "short password 422" ($_.Exception.Response.StatusCode.value__ -eq 422)
}

try {
    Invoke-WebRequest -Uri "$base/auth/signup" -Method POST `
        -Body (@{ full_name = "Verify User"; email = $email; password = "securepass123" } | ConvertTo-Json) `
        -ContentType "application/json" -UseBasicParsing -ErrorAction Stop | Out-Null
    Test-Result "duplicate signup" $false
} catch {
    Test-Result "duplicate signup 400" ($_.Exception.Response.StatusCode.value__ -eq 400)
}

# Ensure test sample exists
$samplePath = Join-Path $PSScriptRoot "..\test_sample.bin"
if (-not (Test-Path $samplePath)) {
    [System.IO.File]::WriteAllText($samplePath, "MZ`nSafe Phase 1 test stub for API verification only.`n")
}

function Send-MultipartFile {
    param([string]$Token, [string]$FilePath, [string]$Filename)
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
    $enc = [System.Text.Encoding]::GetEncoding("iso-8859-1")
    $body = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$Filename`"",
        "Content-Type: application/octet-stream",
        "",
        $enc.GetString($fileBytes),
        "--$boundary--"
    ) -join "`r`n"
    return Invoke-WebRequest -Uri "$base/scan/file" -Method POST `
        -Headers @{ Authorization = "Bearer $Token" } `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $body -UseBasicParsing
}

$scan = Send-MultipartFile -Token $token -FilePath $samplePath -Filename "test_sample.bin"
$report = $scan.Content | ConvertFrom-Json
Test-Result "POST /scan/file" ($scan.StatusCode -eq 201 -and $report.sha256_hash.Length -eq 64)
Test-Result "scan placeholders" (
    $report.yara_matches -eq "[]" -and
    $report.virustotal_status -eq "not_checked" -and
    $report.ai_label -eq "unknown" -and
    $report.final_verdict -eq "pending"
)

# Bad extension
$badPath = Join-Path $env:TEMP "phase1_bad.txt"
"hello" | Set-Content -Path $badPath -NoNewline
try {
    Send-MultipartFile -Token $token -FilePath $badPath -Filename "bad.txt" | Out-Null
    Test-Result "bad extension" $false
} catch {
    Test-Result "bad extension 400" ($_.Exception.Response.StatusCode.value__ -eq 400)
}

# Oversize file (>50 MB)
$bigPath = Join-Path $env:TEMP "phase1_oversize.bin"
$fs = [System.IO.File]::Create($bigPath)
try {
    $fs.SetLength(51 * 1024 * 1024)
} finally {
    $fs.Close()
}
try {
    Send-MultipartFile -Token $token -FilePath $bigPath -Filename "big.bin" | Out-Null
    Test-Result "oversize file" $false
} catch {
    Test-Result "oversize file 400" ($_.Exception.Response.StatusCode.value__ -eq 400)
}
Remove-Item $bigPath, $badPath -ErrorAction SilentlyContinue

# Reports
$reports = Invoke-WebRequest -Uri "$base/reports/" -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing
$repList = $reports.Content | ConvertFrom-Json
Test-Result "GET /reports/" ($reports.StatusCode -eq 200 -and $repList.total -ge 1)

$rid = $report.id
$one = Invoke-WebRequest -Uri "$base/reports/$rid" -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing
Test-Result "GET /reports/{id}" ($one.StatusCode -eq 200)

$email2 = "verify_other_$(Get-Random)@example.com"
Invoke-WebRequest -Uri "$base/auth/signup" -Method POST `
    -Body (@{ full_name = "Other"; email = $email2; password = "securepass123" } | ConvertTo-Json) `
    -ContentType "application/json" -UseBasicParsing | Out-Null
$login2 = Invoke-WebRequest -Uri "$base/auth/login" -Method POST `
    -Body (@{ email = $email2; password = "securepass123" } | ConvertTo-Json) `
    -ContentType "application/json" -UseBasicParsing
$token2 = ($login2.Content | ConvertFrom-Json).access_token
try {
    Invoke-WebRequest -Uri "$base/reports/$rid" -Headers @{ Authorization = "Bearer $token2" } -UseBasicParsing -ErrorAction Stop | Out-Null
    Test-Result "wrong user report" $false
} catch {
    Test-Result "wrong user report 404" ($_.Exception.Response.StatusCode.value__ -eq 404)
}

Write-Host "`nResults: $passed passed, $failed failed"
if ($failed -gt 0) { exit 1 }
Write-Host "Phase 1 verification complete." -ForegroundColor Green
