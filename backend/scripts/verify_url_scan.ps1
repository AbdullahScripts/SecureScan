# Phase 6 URL scanning verification
# Run from backend/:  .\scripts\verify_url_scan.ps1
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

# Resolve backend root (parent of scripts/)
$backendRoot = Split-Path -Parent $PSScriptRoot
Set-Location $backendRoot

Write-Host "Phase 6 URL scanning verification"
Write-Step "API base: $base"
Write-Step "Working directory: $backendRoot"
Write-Host ""

# --- 1. Health check ---
Write-Host "[1] Health check"
Write-Step "Health check: GET $base/"
try {
    $health = Invoke-SafeWebRequest -Uri "$base/" -Method GET -TimeoutSec 30
    Write-Step ("Health OK - HTTP {0}" -f $health.StatusCode)
} catch {
    throw
}
Write-Host ""

# --- 2. Signup and token ---
Write-Host "[2] Signup and token"
$email = "urlscan_{0}_{1}@example.com" -f ([guid]::NewGuid().ToString("N").Substring(0, 12)), (Get-Random -Maximum 999999)
Write-Step "Signup: unique email = $email"

Write-Step "Before POST /auth/signup (building JSON body)..."
$signupBody = (@{ full_name = "URL Scan Test"; email = $email; password = "securepass123" } | ConvertTo-Json -Compress)
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
Write-Host ""

# --- 3. Test URLs ---
Write-Host "[3] URL scanning tests"
$testUrls = @(
    "https://google.com",
    "https://www.microsoft.com",
    "http://example.com/verify-account-password"
)

foreach ($url in $testUrls) {
    Write-Step "Testing URL: $url"
    $scanBody = (@{ url = $url } | ConvertTo-Json -Compress)
    $scan = Invoke-SafeWebRequest -Uri "$base/scan/url" -Method POST -Body $scanBody -ContentType "application/json; charset=utf-8" -Headers @{ Authorization = "Bearer $token" } -TimeoutSec $script:HttpTimeoutSec
    $report = $scan.Content | ConvertFrom-Json
    Write-Host ""
    Write-Host "  scan_type=$($report.scan_type)"
    Write-Host "  domain=$($report.domain)"
    Write-Host "  local_indicators=$($report.local_indicators)"
    Write-Host "  url_ai_label=$($report.url_ai_label)"
    Write-Host "  url_ai_note=$($report.url_ai_note)"
    Write-Host "  virustotal_status=$($report.virustotal_status)"
    Write-Host "  virustotal_malicious_count=$($report.virustotal_malicious_count)"
    Write-Host "  risk_score=$($report.risk_score)"
    Write-Host "  final_verdict=$($report.final_verdict)"
    Write-Host ""
}

Write-Host ""
Write-Host "Phase 6 URL scanning verification complete." -ForegroundColor Green
