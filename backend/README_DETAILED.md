# Malware Detection System - Backend (Detailed)

## Overview

The backend is a FastAPI application that provides a RESTful API for malware detection and analysis. It supports file scanning, URL scanning, report generation, and AI-powered security assistance.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Settings from environment variables
│   ├── database.py             # SQLAlchemy database setup
│   ├── models.py               # ORM models
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── security.py             # JWT and password utilities
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth_routes.py      # Authentication endpoints
│   │   ├── scan_routes.py      # File scanning endpoint
│   │   ├── url_scan_routes.py  # URL scanning endpoint
│   │   ├── report_routes.py    # File/URL report management
│   │   ├── chat_routes.py      # Chat/explain endpoints
│   │   └── news_routes.py      # News feed endpoint
│   ├── services/
│   │   ├── __init__.py
│   │   ├── file_service.py     # File handling and validation
│   │   ├── yara_service.py     # YARA rule scanning
│   │   ├── virustotal_service.py # VirusTotal API integration
│   │   ├── ai_scanner_service.py # MalConv AI model
│   │   ├── risk_service.py     # Risk scoring and verdict
│   │   ├── url_check_service.py # Local URL analysis
│   │   ├── url_risk_service.py # URL risk scoring
│   │   ├── chat_service.py     # Chat with Groq or fallback
│   │   └── news_service.py     # News feed (GNews or mock)
│   └── yara_rules/
│       └── demo_rules.yar      # Demo YARA rules
├── scripts/                     # Test and verification scripts
├── uploads/                     # Uploaded files (gitignored)
├── requirements.txt             # Python dependencies
└── .env.example                 # Environment variable template
```

## Core Components and Workflows

### 1. Application Startup (`app/main.py`)

**What it does:**
- Creates and configures the FastAPI app
- Sets up CORS middleware with allowed origins
- Includes all route modules
- Initializes the database (creates tables) on startup

**Accessing:**
- API: `http://127.0.0.1:8000`
- Swagger docs: `http://127.0.0.1:8000/docs`
- Redoc: `http://127.0.0.1:8000/redoc`

---

### 2. Configuration (`app/config.py`)

**What it does:**
- Loads and validates environment variables using Pydantic
- Provides singleton settings instance

**Key Settings:**
| Setting | Default | Description |
|---------|---------|-------------|
| SECRET_KEY | change-me | JWT secret key |
| ALGORITHM | HS256 | JWT algorithm |
| ACCESS_TOKEN_EXPIRE_MINUTES | 60 | Token expiration time |
| DATABASE_URL | sqlite:///./malware_detection.db | Database connection string |
| VIRUSTOTAL_API_KEY | - | VirusTotal API key |
| YARA_RULES_PATH | app/yara_rules/demo_rules.yar | Path to YARA rules file |
| MAX_FILE_SIZE_MB | 50 | Max upload file size |
| ALLOWED_EXTENSIONS | .exe,.dll,.bin,.com | Allowed file extensions |
| UPLOAD_DIR | uploads | Directory to store uploaded files |
| MALCONV_MODEL_REPO | cycloevan/malconv | Hugging Face repo for MalConv |
| MALCONV_WEIGHTS_FILE | models/malconv_model.h5 | Weights filename |
| ENABLE_AI_SCANNER | True | Enables/disables AI scanner |
| GROQ_API_KEY | - | Groq API key for chat |
| GROQ_MODEL | llama-3.1-8b-instant | Groq model name |

---

### 3. Database Layer (`app/database.py`, `app/models.py`, `app/schemas.py`)

#### Database Setup (`database.py`)
- Creates SQLAlchemy engine using DATABASE_URL
- Creates session factory
- Provides `get_db()` dependency for FastAPI routes

#### ORM Models (`models.py`)

##### User
- `id`: Integer, PK, auto-increment
- `full_name`: String(150), required
- `email`: String(255), unique, required, indexed
- `hashed_password`: String(255), required
- `is_admin`: Boolean, default=False, required
- `created_at`: DateTime, default=datetime.utcnow(), required
- Relationships: `scan_reports`, `url_scan_reports` (one-to-many)

##### ScanReport (File Scans)
- `id`: Integer, PK, auto-increment
- `user_id`: Integer, FK(User.id), required, indexed
- `file_name`: String(255), required
- `file_size`: Integer (bytes), required
- `file_extension`: String(10), required
- `file_type`: String(100), required
- `sha256_hash`: String(64), required, indexed
- `yara_matches`: Text (JSON string), default="[]", required
- `virustotal_status`: String(50), default="not_checked", required
- `virustotal_malicious_count`: Integer, default=0, required
- `ai_label`: String(50), default="unknown", required
- `ai_confidence`: Float, default=0.0, required
- `ai_note`: Text, nullable
- `risk_score`: Float, default=0.0, required
- `final_verdict`: String(50), default="pending", required
- `notes`: Text, nullable
- `created_at`: DateTime, default=datetime.utcnow(), required
- Relationship: `user` (many-to-one)

##### UrlScanReport
- `id`: Integer, PK, auto-increment
- `user_id`: Integer, FK(User.id), required, indexed
- `url`: Text, required
- `domain`: String(255), required
- `local_indicators`: Text (JSON string), default="[]", required
- `virustotal_status`: String(50), default="not_checked", required
- `virustotal_malicious_count`: Integer, default=0, required
- `url_ai_label`: String(50), default="disabled", required
- `url_ai_confidence`: Float, default=0.0, required
- `url_ai_note`: Text, nullable
- `risk_score`: Float, default=0.0, required
- `final_verdict`: String(50), default="pending", required
- `notes`: Text, nullable
- `created_at`: DateTime, default=datetime.utcnow(), required
- Relationship: `user` (many-to-one)

#### Pydantic Schemas (`schemas.py`)
Define request and response models for API validation and serialization:
- UserCreate, UserLogin, UserResponse
- Token
- ScanReportResponse, ScanReportListResponse
- UrlScanReportResponse, UrlScanReportListResponse
- ChatReportExplainResponse, ChatAskResponse
- NewsItemResponse, NewsListResponse

---

### 4. Authentication & Security (`app/security.py`)

**What it does:**
- Hashes passwords using bcrypt
- Creates and verifies JWT tokens
- Provides `get_current_user` dependency to protect routes

**Key Functions:**
- `hash_password(password)` → Returns bcrypt-hashed string
- `verify_password(plain_password, hashed_password)` → Returns bool
- `create_access_token(data, expires_delta)` → Returns JWT string
- `get_current_user(token, db)` → Dependency that returns User object or 401

**Token Payload:**
```json
{"sub": "user@example.com", "exp": 1718268800}
```

---

### 5. Routes / API Endpoints

#### Public Routes
- `GET /` → Health check (no auth)
- `POST /auth/signup` → Register new user
- `POST /auth/login` → Authenticate user and return JWT

#### Protected Routes (require JWT in Authorization header: `Bearer <token>`)
- `GET /auth/me` → Get current user's profile
- `POST /scan/file` → Upload and scan a file
- `POST /scan/url` → Scan a URL
- `GET /reports/` → List all file reports (current user)
- `GET /reports/{id}` → Get single file report
- `DELETE /reports/{id}` → Delete single file report
- `POST /reports/delete-selected` → Delete multiple file reports
- `DELETE /reports/clear` → Clear all file reports
- `GET /url-reports/` → List all URL reports
- `GET /url-reports/{id}` → Get single URL report
- `DELETE /url-reports/{id}` → Delete single URL report
- `POST /url-reports/delete-selected` → Delete multiple URL reports
- `DELETE /url-reports/clear` → Clear all URL reports
- `POST /chat/report/{type}/{id}` → Get AI explanation of a report
- `POST /chat/ask` → Ask security assistant a question
- `GET /news/` → Get cybersecurity news (no auth)

---

### 6. Services

#### File Service (`app/services/file_service.py`)
Handles file-related operations:
- `validate_file_extension(filename)` → Checks if file extension is allowed
- `validate_file_size(file_size_bytes)` → Checks if size within limit
- `save_upload(filename, content_bytes)` → Saves file to uploads dir with UUID prefix
- `calculate_sha256(content_bytes)` → Computes SHA256 hash
- `get_file_metadata(filename, size)` → Returns extension and MIME type
- `is_valid_pe_file(file_path)` → Checks for valid PE file signature (MZ + PE header)

#### YARA Service (`app/services/yara_service.py`)
- `_compile_rules()` → Compiles rules from configured file, caches result
- `scan_file(file_path)` → Scans file, returns list of matches with rule name, severity, description

#### VirusTotal Service (`app/services/virustotal_service.py`)
- `lookup_hash(sha256_hash)` → Looks up hash on VirusTotal, returns status and malicious count
- `lookup_url(url)` → Looks up URL on VirusTotal, returns status and malicious count

#### AI Scanner Service (`app/services/ai_scanner_service.py`)
- `_load_model()` → Downloads weights from Hugging Face Hub, builds MalConv model, caches result
- `_preprocess_file(file_path)` → Reads file, converts to MalConv input format (uint8 array)
- `predict(file_path)` → Runs model inference, returns label, confidence, score

**MalConv Labels:**
- `"benign"`: Score > 0.5
- `"malicious"`: Score ≤ 0.5 and confidence ≥ 0.9
- `"suspicious`: Score ≤ 0.5 and confidence < 0.9
- `"skipped`: Not a valid PE file
- `"unavailable`: Model failed to load or inference error

#### Risk Service (`app/services/risk_service.py`)
- `calculate_risk(yara_matches, vt_result, ai_result)` → Computes risk score (0-100)
- `determine_verdict(risk_score, yara_matches, vt_result, ai_result)` → Returns final verdict ("Low Risk", "Medium Risk", "High Risk", "Critical Risk")

**Risk Scoring:**
- YARA: Low → 10, Medium → 20, High →40, Critical →60
- VirusTotal: 1 engine →10, 2-3→25, 4-10→45, >10→70
- AI: Malicious→20, Suspicious→10
- Total capped at 100

**Verdict Logic:**
- Critical: VirusTotal >10 or critical YARA match
- High: VirusTotal 4-10 or high YARA or (high YARA and AI malicious)
- Medium: Risk score > 20
- Low: Else

#### URL Check Service (`app/services/url_check_service.py`)
- `check_url(url)` → Analyzes URL for suspicious indicators
- `extract_domain(url)` → Extracts domain name from URL

**Local Indicators Checked:**
- Invalid protocol (not http/https)
- IP address used as hostname
- URL length > 200 characters
- Too many subdomains (>4)
- Contains `@` symbol
- Contains suspicious keywords (login, verify, update, free, prize, account, password, secure, billing, payment, bank)

#### URL Risk Service (`app/services/url_risk_service.py`)
- `calculate_risk(local_indicators, vt_result)` → Computes URL risk score
- `determine_verdict(risk_score, ...)` → Determines final verdict

#### Chat Service (`app/services/chat_service.py`)
- `is_harmful_question(question)` → Checks for malicious requests
- `is_off_topic_question(question)` → Checks for unrelated questions
- `get_local_fallback_report_explanation(report_type, final_verdict)` → Local fallback for report explain
- `get_local_fallback_chat_answer(question)` → Local fallback for chat
- `call_groq_with_system(system_prompt, user_prompt)` → Calls Groq API
- `explain_report(report_type, report_dict)` → Generates report explanation
- `guarded_chat(question, report_context)` → Handles chat with safety checks

#### News Service (`app/services/news_service.py`)
- `get_severity_for_category(category)` → Maps category to severity
- `fetch_news()` → Fetches news from GNews API, or returns mock data if no API key

---

### 7. File Scanning Workflow (POST /scan/file)

1. **Validate Request:**
   - Extract file from multipart form
   - Validate file extension using `file_service.validate_file_extension`
   - Validate file size using `file_service.validate_file_size`

2. **Save and Hash:**
   - Save file to `UPLOAD_DIR` with UUID prefix (`file_service.save_upload`)
   - Compute SHA256 hash (`file_service.calculate_sha256`)

3. **Run Analysis Pipeline:**
   - **YARA Scan**: `yara_service.scan_file()`
   - **VirusTotal Lookup**: `virustotal_service.lookup_hash()` (if API key set)
   - **AI MalConv Scan**: `ai_scanner_service.predict()`
     - First checks `file_service.is_valid_pe_file()`
     - Skips if not valid PE

4. **Calculate Risk and Verdict:**
   - `risk_service.calculate_risk()`
   - `risk_service.determine_verdict()`

5. **Save Report:**
   - Create `ScanReport` ORM object
   - Commit to database
   - Return `ScanReportResponse`

---

### 8. URL Scanning Workflow (POST /scan/url)

1. **Validate and Check:**
   - Extract URL from request body
   - Run local checks with `url_check_service.check_url()`
   - Extract domain with `url_check_service.extract_domain()`

2. **VirusTotal Lookup:**
   - `virustotal_service.lookup_url()` (if API key set)

3. **Risk and Verdict:**
   - `url_risk_service.calculate_risk()`
   - `url_risk_service.determine_verdict()`

4. **Save Report:**
   - Create `UrlScanReport` ORM object
   - Commit to database
   - Return `UrlScanReportResponse`

---

### 9. Dependencies

All dependencies are listed in `requirements.txt`. Key packages:
```
fastapi==0.115.0          # Web framework
uvicorn[standard]==0.30.6 # ASGI server
sqlalchemy==2.0.35       # ORM
python-jose[cryptography]==3.3.0 # JWT
passlib[bcrypt]==1.7.4   # Password hashing
bcrypt>=3.2.0,<4.0.0     # bcrypt implementation
email-validator==2.3.0   # Email validation
python-dotenv==1.0.1     # Env var loading
python-multipart==0.0.12 # Multipart form data
pydantic-settings==2.5.2 # Settings management
yara-python==4.5.4       # YARA rules
httpx==0.27.2            # HTTP client
tensorflow==2.21.0       # MalConv model
keras==3.14.1            # MalConv architecture
huggingface-hub==1.15.0  # Download model weights
numpy==2.4.6             # Preprocessing
```

---

## Running the Backend

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate
.\.venv\Scripts\
# Install dependencies
pip install -r requirements.txt

# Copy .env.example to .env and edit
copy .env.example .env

cd backend
# Run the server (use this exact command on Windows)
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## Notes for Developers

- **Never run untrusted files**: All files are stored in `uploads/` but never executed
- **CORS**: Allowed origins configured in `main.py` include `localhost:3000`, `127.0.0.1:3000`, `localhost:5173`, etc.
- **Error handling**: All endpoints return appropriate HTTP status codes with error details
- **Rate limiting**: Not implemented in the current version, but recommended for production
