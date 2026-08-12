# Malware Detection System - Frontend (Detailed)

## Overview

The frontend is a React + TypeScript + Vite application that provides a modern, responsive interface for the malware detection system. It uses shadcn/ui components, Tailwind CSS for styling, and React Query for data fetching.

## Project Structure

```
frontend/
├── public/                   # Static assets (favicon, etc.)
├── src/
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   └── ... (more shadcn components)
│   │   ├── Layout.tsx        # Main app layout
│   │   ├── Navbar.tsx        # Navigation bar
│   │   ├── FileUpload.tsx    # File upload component
│   │   ├── PrivateRoute.tsx  # Protected route wrapper
│   │   ├── ThemeProvider.tsx # Theme management (light/dark)
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.tsx   # Authentication state
│   ├── hooks/
│   │   └── use-toast.ts      # Toast notifications
│   ├── lib/
│   │   └── utils.ts          # Utility functions
│   ├── pages/
│   │   ├── Home.tsx          # Landing page
│   │   ├── Login.tsx         # Login page
│   │   ├── Signup.tsx        # Signup page
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   ├── Scan.tsx          # File scanner page
│   │   ├── UrlScanner.tsx    # URL scanner page
│   │   ├── Results.tsx       # Scan results page
│   │   ├── History.tsx       # Scan history page
│   │   ├── Reports.tsx       # Reports page
│   │   ├── Assistant.tsx     # Security assistant chat
│   │   ├── News.tsx          # Security news page
│   │   ├── Account.tsx       # Account settings
│   │   ├── Features.tsx      # Features showcase
│   │   └── About.tsx         # About page
│   ├── services/
│   │   └── api.ts            # API client functions
│   ├── App.tsx               # App router and layout
│   ├── main.tsx              # Entry point
│   ├── index.css             # Global styles (Tailwind)
│   └── App.css
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── ...
```

## Core Components and Workflows

### 1. Application Entry (`main.tsx`)
- Renders `<App />` inside `#root` element
- No providers here; see `App.tsx` for context setup

---

### 2. App Component (`App.tsx`)
Sets up all the providers and routing:

**Providers:**
- `QueryClientProvider` (React Query)
- `ThemeProvider` (shadcn)
- `AuthProvider` (custom auth context)
- `TooltipProvider` (shadcn)
- `BrowserRouter` (React Router)

**Routes:**

| Path | Component | Protected | Notes |
|------|-----------|-----------|-------|
| `/` | Home.tsx | No | Redirects to /dashboard if logged in |
| `/login` | Login.tsx | No | Redirects to /dashboard if logged in |
| `/signup` | Signup.tsx | No | Redirects to /dashboard if logged in |
| `/dashboard` | Dashboard.tsx | Yes | Main dashboard |
| `/scan` | Scan.tsx | Yes | File scanner |
| `/url-scanner` | UrlScanner.tsx | Yes | URL scanner |
| `/results` | Results.tsx | Yes | Scan results |
| `/history` | History.tsx | Yes | Scan history |
| `/reports` | Reports.tsx | Yes | Report management |
| `/assistant` | Assistant.tsx | Yes | Security chat |
| `/news` | News.tsx | Yes | News feed |
| `/account` | Account.tsx | Yes | Account settings |
| `/features` | Features.tsx | No | Features page |
| `/about` | About.tsx | No | About page |
| `*` | NotFound.tsx | No | 404 |

**PrivateRoute** (`components/PrivateRoute.tsx`)
- Checks `useAuth()` to see if user is logged in
- If not, redirects to `/login`
- Otherwise renders the protected component

---

### 3. Authentication Context (`context/AuthContext.tsx`)

**What it does:**
- Provides `AuthProvider` wrapper component
- Manages user and token state
- Stores token and user in localStorage
- Exposes `useAuth()` hook for easy access

**State:**
- `user`: User object or null
- `token`: JWT string or null

**Functions:**
- `login(email, full_name, token)`: Sets user and token in state and localStorage
- `logout()`: Clears state and localStorage

**Hook Usage:**
```tsx
const { user, token, login, logout } = useAuth();
```

**LocalStorage Keys:**
- `safescan_token`: JWT
- `safescan_user`: User object JSON

---

### 4. API Client (`services/api.ts`)

**Base URL:** `http://127.0.0.1:8000`

**Core Functions:**
- `getAuthToken()`: Retrieves token from localStorage
- `getErrorMessage(error)`: Parses API errors

**Auth:**
- `login(email, password)`: Calls `/auth/login`
- `signup(full_name, email, password)`: Calls `/auth/signup`

**File Scanning:**
- `scanFile(file)`: Calls `POST /scan/file` (multipart/form-data)

**URL Scanning:**
- `scanUrl(url)`: Calls `POST /scan/url`

**File Reports:**
- `getFileReports()`: Gets list of file reports
- `getFileReport(id)`: Gets single file report
- `deleteFileReport(id)`: Deletes file report
- `deleteSelectedFileReports(ids)`: Deletes multiple
- `clearFileReports()`: Clears all

**URL Reports:**
- `getUrlReports()`: Gets list of URL reports
- `getUrlReport(id)`: Gets single URL report
- `deleteUrlReport(id)`: Deletes URL report
- `deleteSelectedUrlReports(ids)`: Deletes multiple
- `clearUrlReports()`: Clears all

**Chat:**
- `explainFileReport(id)`: Explains file report
- `explainUrlReport(id)`: Explains URL report
- `askChat(question)`: Asks security assistant

**News:**
- `getNews()`: Gets news feed

---

### 5. Key Pages and Components

#### Landing Page (`pages/Home.tsx`)
- Hero section with call to action
- Features grid showcasing capabilities
- Stats section
- Footer
- Uses Framer Motion for animations
- Links to `/scan` and `/signup`

#### Login Page (`pages/Login.tsx`)
- Email and password inputs
- Password visibility toggle
- Remember me checkbox (UI only, not implemented yet)
- Form validation (email format, required fields)
- On success: calls `api.login()`, `auth.login()`, navigates to `/dashboard`
- Shows errors via toast notifications

#### Signup Page (`pages/Signup.tsx`)
- Full name, email, password, confirm password inputs
- Form validation (password match, length, email)
- On success: calls `api.signup()`, `auth.login()`, navigates to `/dashboard`

#### Dashboard Page (`pages/Dashboard.tsx`)
- Shows overview of user's scans
- **Quick actions**: Scan file, Scan URL, View history, Ask assistant
- **Stats cards**: Total scans, File scans, URL scans, High risk, Critical, Avg time
- **Charts**: Weekly scan activity (LineChart), Detection ratio (PieChart) (from Recharts)
- **Recent high-risk findings**: Table of recent high/critical scans
- Fetches data on mount using `getFileReports()` and `getUrlReports()`

#### File Scan Page (`pages/Scan.tsx`)
- File dropzone/select component (`FileUpload`)
- Info cards: Supported files, Max size, Privacy first
- When file selected and scanned, navigates to `/results` with state

#### File Upload Component (`components/FileUpload.tsx`)
- Drag-and-drop or click to select
- Validates file type and size
- Calls `api.scanFile()`
- Shows loading state while scanning
- On success, navigates to `/results` with the result

#### Results Page (`pages/Results.tsx`)
- Receives scan result via `location.state`
- Shows verdict (safe/threat) with icon and confidence
- File details and scan information
- Feature importance analysis (accordion)
- Detailed reasoning (accordion)
- Back to scanner and view history buttons

#### History Page (`pages/History.tsx`)
- Search bar for filtering
- Status filter (all/safe/malware)
- Table showing scan records
- Pagination (10 items per page)
- Clicking row opens detail dialog
- Currently uses mock data (50 generated records) - can be updated to use real API

#### Layout Component (`components/Layout.tsx`)
- Wraps all pages with consistent layout
- Includes `Navbar` and sidebar on desktop
- Mobile responsive
- Uses `ThemeProvider` for dark/light mode

---

### 6. Styling and UI

**Tailwind CSS:**
- Global styles in `index.css`
- `tailwind.config.ts` has theme configuration
- Uses shadcn/ui components styled with Tailwind

**Animations:**
- Framer Motion for page transitions and micro-animations
- Used in: Home.tsx, Login.tsx, Signup.tsx, Dashboard.tsx, Results.tsx

**Icons:**
- Lucide React icon library (FileCheck, Shield, AlertTriangle, Search, etc.)

---

### 7. Dependencies

**Key packages from `package.json`:**
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "@tanstack/react-query": "^5.83.0",
  "framer-motion": "^12.27.0",
  "lucide-react": "^0.462.0",
  "recharts": "^2.15.4",
  "react-hook-form": "^7.61.1",
  "react-dropzone": "^14.3.8",
  "sonner": "^1.7.4",
  "class-variance-authority": "^0.7.1",
  "tailwind-merge": "^2.6.0",
  "tailwindcss": "^3.4.17",
  "typescript": "^5.8.3",
  "vite": "^5.4.19",
  "vitest": "^3.2.4"
}
```

---

### 8. Running the Frontend

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Open browser at http://localhost:5173
```

**Build for production:**
```powershell
npm run build
```

---

## Notes for Developers

- **API Base URL**: Hardcoded to `http://127.0.0.1:8000` in `api.ts`
- **Theme Support**: Light/Dark mode implemented via `ThemeProvider`
- **Mobile Responsiveness**: All pages are fully responsive
- **Error Handling**: API errors caught and shown via toast notifications
- **LocalStorage**: Token and user info persist across sessions
