# Hybrid Executable Malware Detection System — Backend

A FastAPI backend for safe, static analysis of Windows executable files using AI, YARA rules, and VirusTotal threat intelligence.

> **Phase 6** — YARA, VirusTotal hash lookup, MalConv AI scanner, risk scoring/verdict, and URL scanning are active.

---

## Tech Stack

| Component | Technology |
|---|---|
| Backend | FastAPI |
| Database | SQLite + SQLAlchemy |
| Authentication | JWT (python-jose) |
| Password Hashing | passlib + bcrypt |
| Environment | python-dotenv + pydantic-settings |
| File Analysis | Static analysis only (SHA256 hash, metadata) |

---

## Setup Instructions

### 1. Clone and navigate

```bash
cd backend
```

### 2. Create virtual environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
copy .env.example .env
```

Edit `.env` and set a strong `SECRET_KEY`:

```env
SECRET_KEY=your-random-secret-key-here
```

#### VirusTotal API key (optional — Phase 3)

VirusTotal is **optional**. If you omit the key, scans still complete using local YARA + SHA256.

1. Create a free account at [https://www.virustotal.com/gui/join-us](https://www.virustotal.com/gui/join-us)
2. Open your profile → **API key**
3. Add to `.env`:

```env
VIRUSTOTAL_API_KEY=your-virustotal-api-key-here
```

**Important:**
- Only the **SHA256 hash** is sent to VirusTotal (`GET /api/v3/files/{hash}`)
- Uploaded files are **never** sent to VirusTotal
- Free tier has rate limits; on `429` the scan continues with `virustotal_status: error`

### 5. Run the server

**Windows**: Use python.exe module command (avoids environment path issues with uvicorn.exe):
```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at: **http://127.0.0.1:8000**

**Note**: Do NOT use `.\.venv\Scripts\uvicorn.exe app.main:app` directly on Windows — it may pick the wrong environment path and cause "module not found" errors.

### 6. Open API docs

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Verify Phase 1 (automated)

With the server running from `backend/`:

```powershell
.\scripts\verify_phase1.ps1
```

This runs health, auth, scan upload, validation, and report tests against `http://127.0.0.1:8000`.

> After Phase 2, use `verify_phase1.ps1` only for auth/upload smoke tests; YARA match assertions are in `verify_phase2.ps1`.

## Verify Phase 2 — YARA (automated)

```powershell
pip install -r requirements.txt
.\scripts\verify_phase2.ps1
```

Expects `demo_pe_header_check` on `test_sample.bin` (starts with `MZ`).

## Verify Phase 3 — VirusTotal (automated)

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
.\scripts\verify_phase3.ps1
```

Tests missing-key skip, full scan flow, and (if `VIRUSTOTAL_API_KEY` is set) live `not_found` / EICAR hash lookups.

## Verify Phase 4 — MalConv AI Scanner (automated)

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
.\scripts\verify_phase4.ps1
```

Tests direct predict() call, full scan flow with AI label/confidence, and confirms YARA/VT still active.

**Important notes for Phase 4**:
- First run will download ~23 MB model weights from Hugging Face Hub
- On Windows, TensorFlow will warn: "TensorFlow GPU support is not available on native Windows…" — this is expected and safe, it will use CPU
- Model is loaded lazily: only when first `/scan/file` is called
- If model fails to load, `ai_label` will be `unavailable` (non‑blocking, scan still completes)

## Verify Phase 6 — URL Scanning (automated)

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
.\scripts\verify_url_scan.ps1
```

Tests direct URL check service, full URL scan flow, local indicators, VirusTotal lookup, risk scoring, and final verdict.

**Important notes for Phase 6**:
- URL AI is disabled by default (due to false positives in Hugging Face model tests)
- Local URL checks: invalid protocol, IP as hostname, too long, too many subdomains, @ symbol, suspicious keywords
- VirusTotal URL lookup: only if VIRUSTOTAL_API_KEY is configured

## Verify Phase 7 — Chatbot Integration (automated)

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
.\scripts\verify_chat.ps1
```

Tests report explainer (file and URL), guarded chat (allowed questions, unrelated questions, harmful question refusal).

**Important notes for Phase 7**:
- Groq chatbot uses `GROQ_API_KEY` if configured
- If Groq key is missing or API fails, uses local fallback responses
- Guardrails: refuses harmful questions, only answers project-related topics
- Report explainer: only sends safe report fields (no file content/bytes/paths)

### VirusTotal `virustotal_status` values

| Status | Meaning |
|---|---|
| `not_checked` | No API key configured — lookup skipped |
| `not_found` | Hash not in VirusTotal database |
| `found` | Hash known — see `virustotal_malicious_count` |
| `error` | Network failure, invalid key, rate limit, or parse error |

---

## Manual API tests (PowerShell)

Start the server, then run these from `backend/`:

```powershell
$base = "http://127.0.0.1:8000"

# Health
(Invoke-WebRequest -Uri "$base/" -UseBasicParsing).Content

# Signup
$signup = Invoke-WebRequest -Uri "$base/auth/signup" -Method POST `
  -Body '{"full_name":"Demo User","email":"demo@example.com","password":"securepass123"}' `
  -ContentType "application/json" -UseBasicParsing
$token = ($signup.Content | ConvertFrom-Json).access_token

# Login (alternative to signup token)
$login = Invoke-WebRequest -Uri "$base/auth/login" -Method POST `
  -Body '{"email":"demo@example.com","password":"securepass123"}' `
  -ContentType "application/json" -UseBasicParsing
$token = ($login.Content | ConvertFrom-Json).access_token

# Current user
Invoke-WebRequest -Uri "$base/auth/me" -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing | Select-Object -ExpandProperty Content

# Scan file (uses included test_sample.bin)
$boundary = [guid]::NewGuid().ToString()
$bytes = [IO.File]::ReadAllBytes("test_sample.bin")
$enc = [Text.Encoding]::GetEncoding("iso-8859-1")
$body = @("--$boundary","Content-Disposition: form-data; name=`"file`"; filename=`"test_sample.bin`"","Content-Type: application/octet-stream","",$enc.GetString($bytes),"--$boundary--") -join "`r`n"
$scan = Invoke-WebRequest -Uri "$base/scan/file" -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "multipart/form-data; boundary=$boundary" -Body $body -UseBasicParsing
$scan.Content

# List reports
Invoke-WebRequest -Uri "$base/reports/" -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## Verify Phase 5 — Risk Scoring and Final Verdict (automated)

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
.\scripts\verify_phase5.ps1
```

Tests direct risk_service calls, full scan flow, and confirms risk_score 70 and final verdict High Risk for test_sample.bin (YARA match + AI malicious).

## FYP demo checklist

1. Copy `.env.example` to `.env` and set a unique `SECRET_KEY`.
2. Run **`.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000`** from `backend/` (**do NOT use uvicorn.exe directly on Windows** — it may use the wrong environment path).
3. Open Swagger at http://localhost:8000/docs.
4. **Signup** → copy `access_token` → click **Authorize** → paste `Bearer <token>`.
5. **POST /scan/file** → upload `test_sample.bin` (safe stub, not real malware).
6. **GET /reports/** → show saved scan with SHA256 hash, YARA matches, MalConv AI results, risk score, and final verdict.

---

## API Endpoints

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | No | Health check |

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | No | Register new user |
| POST | `/auth/login` | No | Login and get JWT token |
| GET | `/auth/me` | JWT | Get current user profile |

### Scanning

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/scan/file` | JWT | Upload and scan an executable file |

### Reports

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/reports/` | JWT | List all scan reports for current user |
| GET | `/reports/{report_id}` | JWT | Get a specific scan report |

---

## File Upload Rules

- **Allowed extensions**: `.exe`, `.dll`, `.bin`
- **Maximum file size**: 50 MB
- **Files are NEVER executed** — only saved and analyzed statically
- **Uploaded files are stored in `uploads/`** — this directory is gitignored

> **Note**: A file cleanup or retention policy can be added in a future phase to manage storage of uploaded files.

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # SQLAlchemy setup
│   ├── models.py            # ORM models (User, ScanReport)
│   ├── schemas.py           # Pydantic schemas
│   ├── config.py            # Settings from .env
│   ├── security.py          # JWT & password utilities
│   ├── routes/
│   │   ├── auth_routes.py   # Authentication endpoints
│   │   ├── scan_routes.py   # File scanning endpoint
│   │   └── report_routes.py # Report viewing endpoints
│   ├── services/
│   │   ├── file_service.py        # File handling & hashing
│   │   ├── yara_service.py        # YARA scanning
│   │   ├── virustotal_service.py  # VT hash lookup (API v3)
│   │   ├── ai_scanner_service.py  # MalConv AI model (placeholder)
│   │   └── risk_service.py        # Risk scoring (placeholder)
│   └── yara_rules/
│       └── demo_rules.yar         # Demo YARA rules
├── uploads/                 # Uploaded files (contents gitignored)
├── scripts/
│   ├── verify_phase1.ps1    # Phase 1 API tests
│   ├── verify_phase2.ps1    # Phase 2 YARA tests
│   └── verify_phase3.ps1    # Phase 3 VirusTotal tests
├── test_sample.bin          # Safe stub for scan demos
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

## Phase Roadmap

| Phase | Features | Status |
|---|---|---|
| Phase 1 | Auth, file upload, SHA256 hash, scan reports | ✅ Complete |
| Phase 2 | YARA rule integration (`demo_rules.yar`) | ✅ Complete |
| Phase 3 | VirusTotal API hash lookup | ✅ Complete |
| Phase 4 | MalConv AI model integration | ✅ Complete |
| Phase 5 | Risk scoring engine, final verdicts | ✅ Complete |
| Phase 6 | URL scanning (local checks + VirusTotal) | ✅ Complete |
| Phase 7 | Chatbot integration (report explainer + guarded chat) | ✅ Current |
| Phase 8 | Frontend integration (React/Lovable) | 🔜 Planned |

---

## Safety Rules

1. ❌ Never execute uploaded files
2. ❌ Never run uploaded files
3. ❌ Never download real malware
4. ❌ Never upload user files to VirusTotal
5. ✅ Only calculate SHA256 hash locally
6. ✅ Use VirusTotal hash lookup only (no file upload to VT)
7. ✅ Keep uploaded files in controlled `uploads/` folder
8. ✅ Enforce file size limits
9. ✅ Allow only `.exe`, `.dll`, `.bin` files
