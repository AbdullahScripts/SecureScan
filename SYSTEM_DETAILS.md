# SafeScan - Hybrid Malware Detection System - Detailed Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Core Features](#core-features)
3. [What It Detects](#what-it-detects)
4. [AI Models Used](#ai-models-used)
5. [External APIs](#external-apis)
6. [How It Works](#how-it-works)
7. [Risk Scoring System](#risk-scoring-system)
8. [Architecture](#architecture)
9. [Security Measures](#security-measures)

---

## Introduction

**SafeScan** is a comprehensive, hybrid malware detection system that combines multiple detection techniques to provide accurate and reliable threat analysis. It features both file scanning and URL scanning capabilities, all wrapped in a modern, user-friendly React frontend with a FastAPI backend.

The system employs a multi-layered approach using:
- AI/ML-based detection (MalConv)
- Pattern matching (YARA rules)
- Threat intelligence (VirusTotal)
- Local heuristics (URL indicators)

---

## Core Features

### 1. File Scanning
- **Supported File Types**: `.exe`, `.dll`, `.bin`, `.com` (Windows executable files)
- **Maximum File Size**: 50 MB (configurable)
- **Analysis Methods**:
  - SHA256 hash calculation
  - YARA rule pattern matching
  - MalConv AI model analysis
  - VirusTotal hash lookup
  - PE (Portable Executable) structure validation

### 2. URL Scanning
- **Protocol Support**: HTTP and HTTPS
- **Analysis Methods**:
  - Local indicator checks (suspicious keywords, URL structure)
  - VirusTotal URL lookup
  - Domain extraction and analysis
  - URL length validation
  - Subdomain count analysis

### 3. Dashboard
- Real-time scan statistics
- Visual charts and graphs
- Recent scan history overview
- Risk distribution visualization

### 4. History & Reports
- Complete scan history tracking
- Detailed individual scan reports
- Report deletion and management
- Export capabilities

### 5. Security Assistant Chatbot
- AI-powered chatbot (Groq LLM)
- Report explanation and recommendations
- Security-related question answering
- Guardrails to prevent harmful requests

### 6. Threat News
- Latest cybersecurity news updates
- Powered by GNews API
- Real-time threat intelligence

### 7. User Management
- Secure authentication with JWT
- User registration and login
- Personal scan history
- Account management

### 8. UI Features
- Dark/Light theme support
- Responsive design
- Smooth animations
- Modern component library

---

## What It Detects

### File-Based Threats
1. **Known Malware Signatures**: Detected via YARA rules matching known malicious patterns
2. **AI-Identified Malicious Files**: MalConv model analyzes raw byte patterns to detect potentially malicious executables
3. **VirusTotal-Reported Threats**: Cross-references file hashes against 70+ antivirus engines
4. **Suspicious PE Structures**: Validates Windows executable file formats
5. **Risk Patterns**: Combines multiple signals to identify high-risk files

### URL-Based Threats
1. **Phishing Indicators**: Detects suspicious keywords like "login", "verify", "update", "password"
2. **Malicious Domains**: Cross-references URLs with VirusTotal's database
3. **Suspicious URL Structure**:
   - IP addresses used as hostnames
   - Excessively long URLs (>200 characters)
   - Too many subdomains (>4 levels)
   - Presence of "@" symbol (potential redirection)
4. **Invalid Protocols**: Rejects non-HTTP/HTTPS protocols

---

## AI Models Used

### MalConv - Deep Learning for Malware Detection

**Model Details**:
- **Architecture**: 1D Convolutional Neural Network (CNN)
- **Input**: Raw file bytes (up to 2,000,000 bytes)
- **Embedding**: 256-byte embedding layer
- **Convolution**: Two parallel 1D convolution layers with gated activation
- **Pooling**: Global max pooling
- **Output**: Sigmoid activation for binary classification (benign/malicious)
- **Source**: `cycloevan/malconv` from Hugging Face Hub
- **Weights File**: `models/malconv_model.h5`

**How It Works**:
1. Reads raw binary file data
2. Converts bytes to numerical embeddings
3. Applies convolutional filters to detect patterns
4. Uses gating mechanism to focus on relevant features
5. Outputs a confidence score between 0 and 1
6. Maps scores to labels:
   - Score > 0.5 → "benign"
   - Score < 0.1 → "malicious" (high confidence)
   - 0.1 ≤ Score < 0.5 → "suspicious" (medium confidence)

**Special Features**:
- Includes DeCorrelation Loss for better generalization
- Lazy loading (only loads when first needed)
- Falls back gracefully if model fails to load
- Only processes valid PE executable files

---

## External APIs

### 1. VirusTotal API (v3)

**Purpose**: Threat intelligence and cross-referencing

**Endpoints Used**:
- `GET /files/{sha256}` - File hash lookup
- `GET /urls/{url_id}` - URL lookup

**What It Provides**:
- Number of antivirus engines detecting the file/URL as malicious
- Last analysis statistics
- Community reputation scores

**Security Measures**:
- **Never uploads user files** - only SHA256 hashes
- Optional API key (system works without it)
- Configurable timeout (default: 30 seconds)
- Rate limiting handling

### 2. Groq API

**Purpose**: AI chatbot and report explanations

**Model Used**: `llama-3.1-8b-instant`

**Features**:
- Explains scan reports in simple terms
- Provides actionable recommendations
- Answers security-related questions
- Guardrails to prevent harmful/off-topic requests

**Guardrails**:
- Blocks requests about malware creation, evasion, hacking, etc.
- Restricts to security/computer-related topics only
- Local fallbacks if API is unavailable

### 3. GNews API

**Purpose**: Cybersecurity news aggregation

**Features**:
- Fetches latest security news
- Provides real-time threat intelligence
- Optional API key

---

## How It Works

### File Scanning Workflow

```
1. User uploads file
   ↓
2. Validate file extension (.exe/.dll/.bin/.com)
   ↓
3. Validate file size (≤ 50 MB)
   ↓
4. Save file to uploads directory
   ↓
5. Calculate SHA256 hash
   ↓
6. Extract file metadata
   ↓
7. Run YARA pattern matching
   ↓
8. Look up hash on VirusTotal (if API key configured)
   ↓
9. Run MalConv AI analysis (if valid PE file)
   ↓
10. Calculate risk score (combines all signals)
    ↓
11. Determine final verdict
    ↓
12. Save report to database
    ↓
13. Return results to user
```

### URL Scanning Workflow

```
1. User enters URL
   ↓
2. Parse and validate URL format
   ↓
3. Extract domain
   ↓
4. Check local indicators:
   - Protocol (HTTP/HTTPS)
   - IP as hostname
   - URL length
   - Subdomain count
   - @ symbol presence
   - Suspicious keywords
   ↓
5. Look up URL on VirusTotal (if API key configured)
   ↓
6. Calculate risk score
   ↓
7. Determine final verdict
   ↓
8. Save report to database
   ↓
9. Return results to user
```

---

## Risk Scoring System

### Risk Score Calculation (0.0 - 100.0)

The system uses an **evidence-based approach** where different components contribute varying points to the final risk score.

#### 1. YARA Rules (0 - 60 points)
- **Low severity**: +10 points
- **Medium severity**: +20 points
- **High severity**: +40 points
- **Critical severity**: +60 points
- **Info/demo rules**: 0 points (skipped)
- *Note: Only the highest severity match contributes (not cumulative)*

#### 2. VirusTotal (0 - 70 points)
- **0 malicious engines**: 0 points
- **1 malicious engine**: +10 points
- **2-3 malicious engines**: +25 points
- **4-10 malicious engines**: +45 points
- **>10 malicious engines**: +70 points

#### 3. AI (MalConv) (0 - 20 points)
- **"malicious" label**: +20 points
- **"suspicious" label**: +10 points
- **All other labels**: 0 points
- *Note: AI is advisory only, not the primary signal*

### Final Verdict Determination

The verdict is determined by both the risk score and specific evidence conditions:

| Verdict | Conditions |
|---------|------------|
| **Critical Risk** | - VirusTotal > 10 malicious engines<br>- OR any critical YARA match |
| **High Risk** | - VirusTotal 4-10 malicious engines<br>- OR any high YARA match<br>- OR high YARA + AI malicious |
| **Medium Risk** | - Risk score > 20 (and not meeting above conditions) |
| **Low Risk** | - All other cases |

---

## Architecture

### Technology Stack

#### Backend
- **Framework**: FastAPI (modern, high-performance Python web framework)
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT (JSON Web Tokens)
- **AI/ML**: TensorFlow/Keras, Hugging Face Hub
- **Pattern Matching**: YARA
- **HTTP Client**: httpx
- **Configuration**: pydantic-settings

#### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Build Tool**: Vite
- **Testing**: Vitest

### Project Structure

```
Malware-Detection/
├── backend/
│   ├── app/
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth_routes.py   # Authentication
│   │   │   ├── scan_routes.py   # File scanning
│   │   │   ├── url_scan_routes.py # URL scanning
│   │   │   ├── report_routes.py # Report management
│   │   │   ├── chat_routes.py   # Chatbot
│   │   │   └── news_routes.py   # News
│   │   ├── services/            # Business logic
│   │   │   ├── ai_scanner_service.py    # MalConv AI
│   │   │   ├── yara_service.py          # YARA scanning
│   │   │   ├── virustotal_service.py    # VirusTotal API
│   │   │   ├── risk_service.py          # Risk scoring
│   │   │   ├── chat_service.py          # Chatbot
│   │   │   ├── url_check_service.py     # URL heuristics
│   │   │   ├── file_service.py          # File handling
│   │   │   └── news_service.py          # News API
│   │   ├── yara_rules/          # YARA rule files
│   │   ├── config.py            # Configuration
│   │   ├── database.py          # Database setup
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   └── security.py          # JWT security
│   ├── scripts/                 # Testing/verification scripts
│   ├── uploads/                 # Uploaded files (gitignored)
│   ├── .env.example             # Environment template
│   ├── requirements.txt         # Python dependencies
│   └── main.py                  # FastAPI entry point
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   └── Layout.tsx, Navbar.tsx, etc.
│   │   ├── pages/               # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Scan.tsx
│   │   │   ├── UrlScanner.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── History.tsx
│   │   │   ├── Assistant.tsx
│   │   │   └── ...
│   │   ├── services/            # API client
│   │   ├── context/             # React context
│   │   └── App.tsx, main.tsx
│   ├── public/
│   │   └── favicon.ico
│   ├── package.json
│   └── vite.config.ts
├── images/                      # Screenshots
├── README.md                    # Quick start guide
└── SYSTEM_DETAILS.md            # This document
```

---

## Security Measures

### 1. No File Execution
- **Critical**: Uploaded files are **never executed**
- All analysis is performed statically (reading bytes only)
- Files are stored in a dedicated uploads directory

### 2. Privacy Protection
- Files are never sent to external services
- Only SHA256 hashes are sent to VirusTotal
- No personal data extraction from files

### 3. Authentication & Authorization
- JWT-based authentication for all protected endpoints
- Users can only access their own scan reports
- Secure password hashing (not stored in plaintext)

### 4. Input Validation
- Strict file extension validation
- File size limits (50 MB max)
- URL format validation
- SQL injection protection via SQLAlchemy ORM

### 5. Chatbot Guardrails
- Safety keyword filtering to block harmful requests
- Off-topic detection to stay focused on security
- Local fallbacks if external API fails
- No markdown/formatting that could be exploited

### 6. Rate Limiting & Timeouts
- Configurable timeouts for all external API calls
- VirusTotal rate limit handling
- Prevents hanging on slow external services

### 7. Configuration Security
- Environment variables for secrets (never committed)
- .env.example template provided
- Secret key required for JWT signing

---

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user profile

### Scanning
- `POST /scan/file` - Upload and scan a file
- `POST /scan/url` - Scan a URL

### Reports
- `GET /reports/` - List file scan reports
- `GET /reports/{id}` - Get specific file report
- `DELETE /reports/{id}` - Delete file report
- `POST /reports/delete-selected` - Delete multiple file reports
- `DELETE /reports/clear` - Clear all file reports
- `GET /url-reports/` - List URL scan reports
- `GET /url-reports/{id}` - Get specific URL report
- `DELETE /url-reports/{id}` - Delete URL report
- `POST /url-reports/delete-selected` - Delete multiple URL reports
- `DELETE /url-reports/clear` - Clear all URL reports

### Chatbot
- `POST /chat/report/file/{id}` - Explain file report
- `POST /chat/report/url/{id}` - Explain URL report
- `POST /chat/guard` - Guarded chat

### News
- `GET /news` - Get latest cybersecurity news

### Health
- `GET /` - Health check endpoint

---

## Configuration Options

All configuration is done via environment variables in the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT signing key (required) | `your-secret-key-change-this` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration | `60` |
| `DATABASE_URL` | SQLite database path | `sqlite:///./malware_detection.db` |
| `VIRUSTOTAL_API_KEY` | VirusTotal API key (optional) | `""` |
| `VIRUSTOTAL_TIMEOUT_SECONDS` | VirusTotal timeout | `30.0` |
| `YARA_RULES_PATH` | Path to YARA rules | `app/yara_rules/demo_rules.yar` |
| `MAX_FILE_SIZE_MB` | Max upload size | `50` |
| `ALLOWED_EXTENSIONS` | Allowed file types | `.exe,.dll,.bin,.com` |
| `UPLOAD_DIR` | Upload directory | `uploads` |
| `MALCONV_MODEL_REPO` | Hugging Face repo | `cycloevan/malconv` |
| `MALCONV_WEIGHTS_FILE` | Model weights file | `models/malconv_model.h5` |
| `MALCONV_MAX_BYTES` | Max file bytes for AI | `2000000` |
| `ENABLE_AI_SCANNER` | Enable/disable AI | `true` |
| `GROQ_API_KEY` | Groq API key (optional) | `""` |
| `GROQ_MODEL` | Groq model to use | `llama-3.1-8b-instant` |
| `GROQ_TIMEOUT_SECONDS` | Groq timeout | `30.0` |
| `GNEWS_API_KEY` | GNews API key (optional) | `""` |
| `GNEWS_TIMEOUT_SECONDS` | GNews timeout | `10.0` |

---

## Conclusion

SafeScan represents a modern approach to malware detection, combining traditional signature-based methods with cutting-edge AI and threat intelligence. Its hybrid approach provides more accurate detection than any single method alone, while maintaining strong privacy and security guarantees.

The system is designed with extensibility in mind, allowing for easy addition of new YARA rules, AI models, or threat intelligence sources as they become available.
