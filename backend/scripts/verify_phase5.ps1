# Phase 5 risk scoring and final verdict verification
# Run from backend/:  .\scripts\verify_phase5.ps1
# Requires: Windows PowerShell 5.1+

$ErrorActionPreference = "Stop"

$script:HttpTimeoutSec = 300
$base = if ($env:API_BASE_URL) { $env:API_BASE_URL.TrimEnd('/') } else { "http://127.0.0.1:8000" }

function Write-Step {
    param([string]$Message)
    Write-Host ("[{0:HH:mm:ss}] {1}" -f (Get-Date), $Message)
    try { [Console]::Out.Flush() } catch { }
}

function Write-WebFailure {
    param(
        [string]$Label,
        [System.Exception]$Exception,
        [System.Management.Automation.ErrorRecord]$ErrorRecord = $null
    )
    Write-Host "" 
    Write-Host "REQUEST FAILED: $Label" -ForegroundColor Red
    Write-Host ("Exception: {0}" -f $Exception.Message) -ForegroundColor Red
    if ($null -ne $ErrorRecord -and $ErrorRecord.ErrorDetails -and $ErrorRecord.ErrorDetails.Message) {
        Write-Host "Response body (ErrorDetails):" -ForegroundColor Red
        Write-Host $ErrorRecord.ErrorDetails.Message -ForegroundColor Red
    }
    $resp = $Exception.Response
    if ($null -ne $resp) {
        try {
            $code = [int]$resp.StatusCode
            Write-Host "HTTP Status: $code" -ForegroundColor Red
            $stream = $resp.GetResponseStream()
            if ($null -ne $stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
                Write-Host "Response body (stream):" -ForegroundColor Red
                Write-Host $body -ForegroundColor Red
            }
        } catch {
            Write-Host ("Could not read error response: {0}" -f $_.Exception.Message) -ForegroundColor Red
        }
    }
}

function Invoke-SafeWebRequest {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [hashtable]$Headers = $null,
        [string]$Body = $null,
        [string]$ContentType = $null,
        [int]$TimeoutSec = $script:HttpTimeoutSec
    )
    $params = @{
        Uri             = $Uri
        Method          = $Method
        UseBasicParsing = $true
        TimeoutSec      = $TimeoutSec
    }
    if ($null -ne $Headers -and $Headers.Count -gt 0) {
        $params.Headers = $Headers
    }
    if (-not [string]::IsNullOrWhiteSpace($Body)) {
        $params.Body = $Body
    }
    if (-not [string]::IsNullOrWhiteSpace($ContentType)) {
        $params.ContentType = $ContentType
    }
    try {
        Write-Step "HTTP $Method $Uri (timeout ${TimeoutSec}s) - sending..."
        $result = Invoke-WebRequest @params
        Write-Step "HTTP $Method $Uri - response received (status $($result.StatusCode))."
        return $result
    } catch {
        Write-WebFailure -Label "$Method $Uri" -Exception $_.Exception -ErrorRecord $_
        throw
    }
}

function Send-MultipartScanFile {
    param(
        [string]$BaseUrl,
        [string]$BearerToken,
        [string]$FilePath,
        [int]$TimeoutSec = $script:HttpTimeoutSec
    )

    $uri = "$BaseUrl/scan/file"
    Write-Step "Multipart upload: POST $uri (timeout ${TimeoutSec}s)"

    Add-Type -AssemblyName System.Net.Http -ErrorAction Stop

    $handler = New-Object System.Net.Http.HttpClientHandler
    $client = New-Object System.Net.Http.HttpClient($handler)
    $multipart = $null
    $fileStream = $null

    try {
        $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSec)
        $client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", "Bearer $BearerToken") | Out-Null

        Write-Step "Multipart: building form (HttpClient + MultipartFormDataContent)..."
        $multipart = New-Object System.Net.Http.MultipartFormDataContent

        Write-Step "Multipart: opening file for read: $FilePath"
        $fileStream = [System.IO.File]::OpenRead($FilePath)
        Write-Step "Multipart: file stream open OK."

        $streamContent = New-Object System.Net.Http.StreamContent($fileStream)
        $streamContent.Headers.ContentType = New-Object System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream")
        $fileName = [System.IO.Path]::GetFileName($FilePath)
        $multipart.Add($streamContent, "file", $fileName)
        Write-Step "Multipart: form field 'file' added (filename=$fileName)."

        Write-Step "Multipart: POSTing to server (server may run MalConv; wait up to ${TimeoutSec}s)..."
        try {
            $task = $client.PostAsync($uri, $multipart)
            $response = $task.GetAwaiter().GetResult()
            Write-Step ("Multipart: HTTP response received (status {0})." -f [int]$response.StatusCode)
        } catch {
            Write-Host "" 
            Write-Host "REQUEST FAILED: POST $uri (multipart)" -ForegroundColor Red
            Write-Host $_.Exception.ToString() -ForegroundColor Red
            if ($_.Exception.InnerException) {
                Write-Host "Inner: $($_.Exception.InnerException.Message)" -ForegroundColor Red
            }
            throw
        }
        Write-Step "Multipart: reading response body..."
        $bodyText = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        Write-Step ("Multipart: response body read OK ({0} chars)." -f $bodyText.Length)

        if (-not $response.IsSuccessStatusCode) {
            Write-Host "" 
            Write-Host "REQUEST FAILED: POST $uri" -ForegroundColor Red
            Write-Host ("HTTP Status: {0}" -f [int]$response.StatusCode) -ForegroundColor Red
            Write-Host "Response body:" -ForegroundColor Red
            Write-Host $bodyText -ForegroundColor Red
            throw ("POST /scan/file failed with HTTP {0}" -f [int]$response.StatusCode)
        }

        return @{
            StatusCode = [int]$response.StatusCode
            Content    = $bodyText
        }
    } finally {
        if ($null -ne $multipart) { $multipart.Dispose() }
        if ($null -ne $client) { $client.Dispose() }
    }
}

# Resolve backend root (parent of scripts/)
$backendRoot = Split-Path -Parent $PSScriptRoot
Set-Location $backendRoot

Write-Host "Phase 5 risk scoring and final verdict verification"
Write-Step "API base: $base"
Write-Step "Working directory: $backendRoot"
Write-Host ""

# --- 0. Ensure test_sample.bin exists ---
$samplePath = Join-Path $backendRoot "test_sample.bin"
Write-Step "Checking test_sample.bin at: $samplePath"
if (-not (Test-Path -LiteralPath $samplePath)) {
    Write-Step "test_sample.bin missing - creating safe stub (MZ prefix)"
    $stub = "MZ`r`nSafe Phase 5 test stub for YARA/VT/MalConv/risk API verification only.`r`n"
    [System.IO.File]::WriteAllText($samplePath, $stub, (New-Object System.Text.UTF8Encoding $false))
    Write-Step "Created: $samplePath"
} else {
    Write-Step "test_sample.bin found."
}
Write-Host ""

$pythonExe = Join-Path $backendRoot ".venv\Scripts\python.exe"

# --- 1. Direct service test (risk and verdict functions) ---
Write-Host "[1] Direct risk_service call (Python in-process)"
Write-Step "Starting Python in-process check..."
$pyStep1 = @'
from app.services.risk_service import calculate_risk, determine_verdict

# Test with expected inputs: YARA match, VT not_checked, AI malicious
yara_matches = [{'rule': 'test_rule', 'tags': [], 'meta': {}}]
vt_result = {'status': 'not_checked', 'malicious_count': 0}
ai_result = {'label': 'malicious', 'confidence': 0.85, 'score': 0.15}

risk_score = calculate_risk(yara_matches, vt_result, ai_result)
print('OK: calculate_risk returned', risk_score)
assert risk_score == 70.0, 'Expected risk_score 70, got %s' % risk_score

final_verdict = determine_verdict(risk_score, yara_matches, vt_result, ai_result)
print('OK: determine_verdict returned', final_verdict)
assert final_verdict == 'High Risk', 'Expected High Risk, got %s' % final_verdict

print('OK: all risk_service tests passed!')
'@
& $pythonExe -c $pyStep1
Write-Step "Python step [1] finished."
Write-Host ""

# --- 2. HTTP scan test ---
Write-Host "[2] POST /scan/file (risk scoring active)"
Write-Step "Step 2a: health check (before signup)"

Write-Step "Health check: GET $base/"
try {
    $health = Invoke-SafeWebRequest -Uri "$base/" -Method GET -TimeoutSec 30
    Write-Step ("Health OK - HTTP {0}" -f $health.StatusCode)
} catch {
    throw
}

Write-Step "Step 2b: signup and token"
$email = "risk_{0}_{1}@example.com" -f ([guid]::NewGuid().ToString("N").Substring(0, 12)), (Get-Random -Maximum 999999)
Write-Step "Signup: unique email = $email"

Write-Step "Before POST /auth/signup (building JSON body)..."
$signupBody = (@{ full_name = "Risk Test"; email = $email; password = "securepass123" } | ConvertTo-Json -Compress)
Write-Step "Signup JSON body ready; calling Invoke-WebRequest next..."
$signup = Invoke-SafeWebRequest -Uri "$base/auth/signup" -Method POST -Body $signupBody -ContentType "application/json; charset=utf-8" -TimeoutSec $script:HttpTimeoutSec
Write-Step ("After POST /auth/signup - HTTP {0}" -f $signup.StatusCode)

Write-Step "Before access_token extraction (parsing JSON)..."
$signupJson = $signup.Content | ConvertFrom-Json
$token = $signupJson.access_token
if ([string]::IsNullOrWhiteSpace($token)) {
    throw "Signup response missing access_token."
}
Write-Step ("After access_token extraction - OK (token length {0})." -f $token.Length)

Write-Step "Step 2c: resolve upload file on disk"
Write-Step "Before reading upload file metadata (Get-Item)..."
$fileInfo = Get-Item -LiteralPath $samplePath
Write-Step ("After Get-Item - file ready: {0} ({1} bytes)" -f $fileInfo.FullName, $fileInfo.Length)

Write-Step "Step 2d: scan upload (multipart)"
Write-Step "Before POST /scan/file (multipart via HttpClient)..."
$scanResult = Send-MultipartScanFile -BaseUrl $base -BearerToken $token -FilePath $fileInfo.FullName -TimeoutSec $script:HttpTimeoutSec
Write-Step ("After POST /scan/file - HTTP {0}" -f $scanResult.StatusCode)

$report = $scanResult.Content | ConvertFrom-Json

if ($scanResult.StatusCode -ne 201) {
    throw "Expected HTTP 201 from /scan/file, got $($scanResult.StatusCode)"
}

$validAiLabels = @("benign", "malicious", "unavailable")
if ($report.ai_label -notin $validAiLabels) {
    throw "Unexpected ai_label: $($report.ai_label)"
}

$yara = $report.yara_matches | ConvertFrom-Json
if ($yara.Count -lt 1) { throw "YARA should still be active; got: $($report.yara_matches)" }

if (-not ($report.risk_score -gt 0)) { throw "Expected risk_score > 0" }

Write-Step "OK: ai_label=$($report.ai_label) ai_confidence=$($report.ai_confidence)"
Write-Step "OK: risk_score=$($report.risk_score) final_verdict=$($report.final_verdict)"
Write-Host ""

Write-Host "Phase 5 verification complete." -ForegroundColor Green
