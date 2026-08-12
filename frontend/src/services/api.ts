const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

interface UrlScanRequest {
  url: string;
}

interface AuthRequest {
  email: string;
  password: string;
}

interface SignupRequest extends AuthRequest {
  full_name: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UrlScanReport {
  id: number;
  scan_type: "url";
  url: string;
  domain: string;
  local_indicators: string[];
  url_ai_label: string;
  url_ai_confidence: number;
  url_ai_note: string;
  virustotal_status: string;
  virustotal_malicious_count: number;
  risk_score: number;
  final_verdict: string;
  created_at: string;
}

export interface FileScanReport {
  id: number;
  scan_type?: string;
  file_name: string;
  file_size: number;
  file_extension: string;
  sha256_hash: string;
  yara_matches: any;
  virustotal_status: string;
  virustotal_malicious_count: number;
  ai_label: string;
  ai_confidence: number;
  ai_note?: string;
  risk_score: number;
  final_verdict: string;
  created_at: string;
}

export interface ApiError {
  detail: string | Array<{ type: string; msg: string }>;
}

export interface FileReportExplainResponse {
  report_id: number;
  report_type: "file" | "url";
  source: "groq" | "local_fallback" | "local_guardrail";
  explanation: string;
  recommended_action: string;
}

export interface NewsItem {
  title: string;
  description: string;
  source: string;
  url: string;
  image?: string;
  published_at: string;
  category: string;
  severity: "Low" | "Medium" | "High" | "Critical";
}

function getAuthToken(): string | null {
  return localStorage.getItem("safescan_token");
}

export function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} bytes`;
  } else if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

export async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password } as AuthRequest),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }

  const data: TokenResponse = await response.json();
  return data.access_token;
}

export async function signup(
  fullName: string,
  email: string,
  password: string
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
    } as SignupRequest),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }

  const data: TokenResponse = await response.json();
  return data.access_token;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "detail" in error) {
    const err = error as ApiError;
    if (Array.isArray(err.detail)) {
      return err.detail[0].msg;
    }
    return err.detail;
  }
  return "An unexpected error occurred. Please try again.";
}

export async function scanUrl(url: string): Promise<UrlScanReport> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/scan/url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ url } as UrlScanRequest),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }

  const data = await response.json();

  let localIndicators: string[] = [];
  if (typeof data.local_indicators === "string") {
    try {
      localIndicators = JSON.parse(data.local_indicators);
    } catch {
      localIndicators = [];
    }
  } else if (Array.isArray(data.local_indicators)) {
    localIndicators = data.local_indicators;
  }

  return {
    ...data,
    local_indicators: localIndicators,
  };
}

export async function scanFile(file: File): Promise<FileScanReport> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/scan/file`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }

  const data = await response.json();

  let yaraMatches: any[] = [];
  if (typeof data.yara_matches === "string") {
    try {
      yaraMatches = JSON.parse(data.yara_matches);
    } catch {
      yaraMatches = [];
    }
  } else if (Array.isArray(data.yara_matches)) {
    yaraMatches = data.yara_matches;
  }

  return {
    ...data,
    yara_matches: yaraMatches,
  };
}

export async function explainFileReport(
  reportId: number
): Promise<FileReportExplainResponse> {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/chat/report/file/${reportId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }

  return await response.json();
}

export async function explainUrlReport(
  reportId: number
): Promise<FileReportExplainResponse> {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/chat/report/url/${reportId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }

  return await response.json();
}

export async function getFileReports(): Promise<{ total: number; reports: FileScanReport[] }> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/reports/`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }

  const data = await response.json();
  const reports = data.reports.map((report: any) => {
    let yaraMatches: any[] = [];
    if (typeof report.yara_matches === "string") {
      try {
        yaraMatches = JSON.parse(report.yara_matches);
      } catch {
        yaraMatches = [];
      }
    } else if (Array.isArray(report.yara_matches)) {
      yaraMatches = report.yara_matches;
    }
    return { ...report, yara_matches: yaraMatches };
  });
  return { ...data, reports };
}

export async function getFileReport(reportId: number): Promise<FileScanReport> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }

  const report = await response.json();
  let yaraMatches: any[] = [];
  if (typeof report.yara_matches === "string") {
    try {
      yaraMatches = JSON.parse(report.yara_matches);
    } catch {
      yaraMatches = [];
    }
  } else if (Array.isArray(report.yara_matches)) {
    yaraMatches = report.yara_matches;
  }
  return { ...report, yara_matches: yaraMatches };
}

export async function getUrlReports(): Promise<{ total: number; reports: UrlScanReport[] }> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/url-reports/`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }

  const data = await response.json();
  const reports = data.reports.map((report: any) => {
    let localIndicators: any[] = [];
    if (typeof report.local_indicators === "string") {
      try {
        localIndicators = JSON.parse(report.local_indicators);
      } catch {
        localIndicators = [];
      }
    } else if (Array.isArray(report.local_indicators)) {
      localIndicators = report.local_indicators;
    }
    return { ...report, local_indicators: localIndicators };
  });
  return { ...data, reports };
}

export async function getUrlReport(reportId: number): Promise<UrlScanReport> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/url-reports/${reportId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }

  const report = await response.json();
  let localIndicators: any[] = [];
  if (typeof report.local_indicators === "string") {
    try {
      localIndicators = JSON.parse(report.local_indicators);
    } catch {
      localIndicators = [];
    }
  } else if (Array.isArray(report.local_indicators)) {
    localIndicators = report.local_indicators;
  }
  return { ...report, local_indicators: localIndicators };
}

export async function deleteFileReport(reportId: number): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }
}

export async function deleteSelectedFileReports(reportIds: number[]): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/reports/delete-selected`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ report_ids: reportIds }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }
}

export async function clearFileReports(): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/reports/clear`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }
}

export async function deleteUrlReport(reportId: number): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/url-reports/${reportId}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }
}

export async function deleteSelectedUrlReports(reportIds: number[]): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/url-reports/delete-selected`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ report_ids: reportIds }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }
}

export async function clearUrlReports(): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/url-reports/clear`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }
}

export async function getNews(): Promise<NewsItem[]> {
  const response = await fetch(`${API_BASE_URL}/news/`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }

  const data = await response.json();
  return data.news;
}

export interface ChatAskResponse {
  source: string;
  answer: string;
}

export async function askChat(question: string): Promise<ChatAskResponse> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/chat/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData));
  }

  return await response.json();
}
