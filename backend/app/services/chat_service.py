# """
# Chat service: report explainer and guarded chatbot with Groq and local fallbacks.
# """

# import json
# import logging
# from typing import Dict, Optional, Tuple
# from urllib.parse import urlparse

# import httpx

# from app.config import settings

# logger = logging.getLogger(__name__)

# GROQ_API_BASE = "https://api.groq.com/openai/v1"
# SAFETY_KEYWORDS = [
#     "create malware",
#     "make virus",
#     "build trojan",
#     "malware creation",
#     "evade antivirus",
#     "bypass antivirus",
#     "antivirus bypass",
#     "credential theft",
#     "steal passwords",
#     "exploit steps",
#     "how to hack",
#     "phishing tutorial",
#     "how to make a virus",
#     "how to create malware",
#     "how to hack someone",
# ]
# OFF_TOPIC_KEYWORDS = [
#     "president",
#     "capital of",
#     "who is",
#     "trump",
#     "biden",
#     "politics",
#     "election",
#     "football",
#     "soccer",
#     "cricket",
#     "tennis",
#     "sports",
#     "movie",
#     "film",
#     "actor",
#     "actress",
#     "celebrity",
#     "music",
#     "song",
#     "weather",
#     "geography",
#     "history",
# ]
# LOCAL_GUARDRAIL_ANSWER = (
#     "I can only help with security-related questions, malware detection, URL scanning, scan reports, "
#     "file safety, and this SafeScan project. Please ask a security or computer-related question."
# )
# LOCAL_HARMFUL_REFUSAL = (
#     "I'm sorry, I can't assist with that. My purpose is to help with malware "
#     "detection and security analysis to keep users safe."
# )


# def is_harmful_question(question: str) -> bool:
#     lower_q = question.lower()
#     for keyword in SAFETY_KEYWORDS:
#         if keyword in lower_q:
#             return True
#     return False


# def is_off_topic_question(question: str) -> bool:
#     lower_q = question.lower()
#     for keyword in OFF_TOPIC_KEYWORDS:
#         if keyword in lower_q:
#             return True
#     return False


# def get_local_fallback_report_explanation(
#     report_type: str, final_verdict: str
# ) -> Tuple[str, str]:
#     verdict_lower = final_verdict.lower()
#     explanation = ""
#     recommended_action = ""

#     if "low risk" in verdict_lower:
#         explanation = f"This {report_type} scan returned {final_verdict}. No immediate threats detected."
#         recommended_action = "No action needed at this time. Continue monitoring."
#     elif "medium risk" in verdict_lower:
#         explanation = f"This {report_type} scan returned {final_verdict}. Review the scan details carefully."
#         if report_type == "file":
#             recommended_action = "Investigate further and do not execute unless you trust the source."
#         else:
#             recommended_action = "Investigate further and do not visit unless you trust the source."
#     elif "high risk" in verdict_lower:
#         explanation = f"This {report_type} scan returned {final_verdict}. This is a significant threat."
#         if report_type == "file":
#             recommended_action = "Do not execute this file. Delete it if you do not trust the source and run a full security scan."
#         else:
#             recommended_action = "Do not visit this URL unless you trust the source. Avoid entering passwords or personal information."
#     elif "critical risk" in verdict_lower:
#         explanation = f"This {report_type} scan returned {final_verdict}. This is a severe threat."
#         if report_type == "file":
#             recommended_action = "Do not execute this file. Delete it immediately and run a full security scan."
#         else:
#             recommended_action = "Do not visit this URL. Avoid entering any personal information and run a full security scan."
#     else:
#         explanation = f"This {report_type} scan returned {final_verdict}."
#         recommended_action = "Review the scan report carefully."

#     return explanation, recommended_action


# def get_local_fallback_chat_answer(question: str) -> str:
#     lower_q = question.lower()

#     if "yara" in lower_q:
#         return "YARA is used for pattern matching to detect known malicious patterns in files."
#     elif "virustotal" in lower_q:
#         return "VirusTotal is used to look up file hashes or URLs against multiple antivirus engines."
#     elif "malconv" in lower_q:
#         return "MalConv is a machine learning model used to detect malicious executable files from raw bytes."
#     elif "risk score" in lower_q:
#         return "Risk score combines YARA matches, VirusTotal results, and AI analysis to quantify threat level."
#     elif "final verdict" in lower_q:
#         return "Final verdict is based on the calculated risk score (Low/Medium/High/Critical Risk)."
#     else:
#         return "I can help with malware detection, scanning, and security analysis. How can I assist you?"


# def call_groq(prompt: str) -> Optional[str]:
#     return call_groq_with_system("", prompt)


# def call_groq_with_system(system_prompt: str, user_prompt: str) -> Optional[str]:
#     api_key = (settings.GROQ_API_KEY or "").strip()
#     if not api_key:
#         logger.info("Groq API key not configured - skipping external call")
#         return None

#     url = f"{GROQ_API_BASE}/chat/completions"
#     headers = {
#         "Authorization": f"Bearer {api_key}",
#         "Content-Type": "application/json",
#     }
    
#     messages = []
#     if system_prompt and system_prompt.strip():
#         messages.append({"role": "system", "content": system_prompt})
#     messages.append({"role": "user", "content": user_prompt})
    
#     payload = {
#         "model": settings.GROQ_MODEL,
#         "messages": messages,
#         "temperature": 0.3,
#         "max_tokens": 1024,
#     }

#     try:
#         with httpx.Client(timeout=settings.GROQ_TIMEOUT_SECONDS) as client:
#             response = client.post(url, headers=headers, json=payload)
#         response.raise_for_status()
#         data = response.json()
#         return data["choices"][0]["message"]["content"].strip()
#     except httpx.HTTPError as e:
#         logger.warning(f"Groq request failed: {e}")
#         return None
#     except (KeyError, IndexError, TypeError) as e:
#         logger.warning(f"Groq response parse failed: {e}")
#         return None


# def build_report_explanation_prompt(report_data: Dict) -> str:
#     prompt = "Please explain the following scan report in simple terms and recommend an action.\n\n"
#     prompt += "Important notes to include:\n"
#     prompt += "- The 'demo_pe_header_check' YARA rule only confirms PE structure and is not a malware indicator.\n"
#     prompt += "- AI (MalConv) results are advisory signals, not final proof of malware.\n"
#     prompt += "- VirusTotal and strong YARA rules are stronger evidence than AI alone.\n"
#     prompt += "- The final verdict is based on combined signals from YARA, VirusTotal, and AI.\n\n"
#     prompt += "Scan Report Details:\n"
#     for key, value in report_data.items():
#         if value is not None and value != "":
#             prompt += f"- {key}: {value}\n"
#     prompt += "\nReturn your answer in JSON format with two keys: explanation and recommended_action."
#     return prompt


# def parse_groq_report_response(groq_answer: str) -> Tuple[str, str]:
#     try:
#         cleaned = groq_answer.strip()
#         # Remove markdown ```json blocks if present
#         if cleaned.startswith("```json"):
#             cleaned = cleaned[7:]
#         if cleaned.startswith("```"):
#             cleaned = cleaned[3:]
#         if cleaned.endswith("```"):
#             cleaned = cleaned[:-3]
#         cleaned = cleaned.strip()

#         data = json.loads(cleaned)
#         return data.get("explanation", ""), data.get("recommended_action", "")
#     except json.JSONDecodeError:
#         logger.warning("Failed to parse Groq report response as JSON - using freeform text")
#         explanation = groq_answer
#         recommended_action = "Review the explanation and act accordingly."
#         return explanation, recommended_action


# def explain_report(
#     report_type: str,
#     report: Dict,
# ) -> Tuple[str, str, str]:
#     report_type = report_type.lower().strip()

#     safe_report_data = {}
#     if report_type == "file":
#         safe_report_data = {
#             "file_name": report.get("file_name"),
#             "sha256_hash": report.get("sha256_hash"),
#             "scan_type": "file",
#             "yara_matches": report.get("yara_matches"),
#             "virustotal_status": report.get("virustotal_status"),
#             "virustotal_malicious_count": report.get("virustotal_malicious_count"),
#             "ai_label": report.get("ai_label"),
#             "ai_confidence": report.get("ai_confidence"),
#             "risk_score": report.get("risk_score"),
#             "final_verdict": report.get("final_verdict"),
#             "created_at": str(report.get("created_at", "")),
#         }
#     elif report_type == "url":
#         safe_report_data = {
#             "url": report.get("url"),
#             "domain": report.get("domain"),
#             "scan_type": "url",
#             "local_indicators": report.get("local_indicators"),
#             "virustotal_status": report.get("virustotal_status"),
#             "virustotal_malicious_count": report.get("virustotal_malicious_count"),
#             "url_ai_label": report.get("url_ai_label"),
#             "url_ai_confidence": report.get("url_ai_confidence"),
#             "risk_score": report.get("risk_score"),
#             "final_verdict": report.get("final_verdict"),
#             "created_at": str(report.get("created_at", "")),
#         }

#     final_verdict = safe_report_data.get("final_verdict", "pending")

#     prompt = build_report_explanation_prompt(safe_report_data)
#     groq_answer = call_groq(prompt)

#     if groq_answer:
#         explanation, recommended_action = parse_groq_report_response(groq_answer)
#         return "groq", explanation, recommended_action
#     else:
#         explanation, recommended_action = get_local_fallback_report_explanation(report_type, final_verdict)
#         return "local_fallback", explanation, recommended_action


# def guarded_chat(
#     question: str,
#     report_context: Optional[Dict] = None,
# ) -> Tuple[str, str]:
#     if is_harmful_question(question):
#         return "local_guardrail", LOCAL_HARMFUL_REFUSAL

#     if is_off_topic_question(question):
#         return "local_guardrail", LOCAL_GUARDRAIL_ANSWER

#     system_prompt = """You are SafeScan Security Assistant, a helpful AI specialized in cybersecurity, malware detection, and computer security.

# Rules:
# 1. Only answer questions related to:
#    - Cybersecurity
#    - Malware detection
#    - File/URL scanning
#    - Computer security
#    - SafeScan project
#    - General computer/software questions

# 2. Keep answers concise and clear (max 2-3 sentences)
# 3. Do NOT use any markdown formatting (no **, *, #, etc.)
# 4. Do NOT use bullet points or numbered lists
# 5. Be friendly and helpful
# 6. If unsure, ask the user to clarify

# Always be safe and do not assist with harmful activities."""

#     prompt = question
#     if report_context:
#         prompt += "\n\nAdditional context (scan report):\n"
#         for key, value in report_context.items():
#             if value is not None and value != "":
#                 prompt += f"- {key}: {value}\n"

#     groq_answer = call_groq_with_system(system_prompt, prompt)
#     if groq_answer:
#         return "groq", groq_answer
#     else:
#         local_answer = get_local_fallback_chat_answer(question)
#         return "local_fallback", local_answer
"""
Chat service: report explainer and guarded chatbot with Groq and local fallbacks.
"""

import json
import logging
from typing import Dict, Optional, Tuple
from urllib.parse import urlparse

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

GROQ_API_BASE = "https://api.groq.com/openai/v1"
SAFETY_KEYWORDS = [
    "create malware",
    "make virus",
    "build trojan",
    "malware creation",
    "evade antivirus",
    "bypass antivirus",
    "antivirus bypass",
    "credential theft",
    "steal passwords",
    "exploit steps",
    "how to hack",
    "phishing tutorial",
    "how to make a virus",
    "how to create malware",
    "how to hack someone",
]
OFF_TOPIC_KEYWORDS = [
    "president",
    "capital of",
    "who is",
    "trump",
    "biden",
    "politics",
    "election",
    "football",
    "soccer",
    "cricket",
    "tennis",
    "sports",
    "movie",
    "film",
    "actor",
    "actress",
    "celebrity",
    "music",
    "song",
    "weather",
    "geography",
    "history",
]
LOCAL_GUARDRAIL_ANSWER = (
    "I can only help with security-related questions, malware detection, URL scanning, scan reports, "
    "file safety, and this SafeScan project. Please ask a security or computer-related question."
)
LOCAL_HARMFUL_REFUSAL = (
    "I'm sorry, I can't assist with that. My purpose is to help with malware "
    "detection and security analysis to keep users safe."
)


def is_harmful_question(question: str) -> bool:
    lower_q = question.lower()
    for keyword in SAFETY_KEYWORDS:
        if keyword in lower_q:
            return True
    return False


def is_off_topic_question(question: str) -> bool:
    lower_q = question.lower()
    for keyword in OFF_TOPIC_KEYWORDS:
        if keyword in lower_q:
            return True
    return False


def get_local_fallback_report_explanation(
    report_type: str, final_verdict: str
) -> Tuple[str, str]:
    verdict_lower = final_verdict.lower()
    explanation = ""
    recommended_action = ""

    if "low risk" in verdict_lower:
        explanation = f"This {report_type} scan returned {final_verdict}. No immediate threats detected."
        recommended_action = "No action needed at this time. Continue monitoring."
    elif "medium risk" in verdict_lower:
        explanation = f"This {report_type} scan returned {final_verdict}. Review the scan details carefully."
        if report_type == "file":
            recommended_action = "Investigate further and do not execute unless you trust the source."
        else:
            recommended_action = "Investigate further and do not visit unless you trust the source."
    elif "high risk" in verdict_lower:
        explanation = f"This {report_type} scan returned {final_verdict}. This is a significant threat."
        if report_type == "file":
            recommended_action = "Do not execute this file. Delete it if you do not trust the source and run a full security scan."
        else:
            recommended_action = "Do not visit this URL unless you trust the source. Avoid entering passwords or personal information."
    elif "critical risk" in verdict_lower:
        explanation = f"This {report_type} scan returned {final_verdict}. This is a severe threat."
        if report_type == "file":
            recommended_action = "Do not execute this file. Delete it immediately and run a full security scan."
        else:
            recommended_action = "Do not visit this URL. Avoid entering any personal information and run a full security scan."
    else:
        explanation = f"This {report_type} scan returned {final_verdict}."
        recommended_action = "Review the scan report carefully."

    return explanation, recommended_action


def get_local_fallback_chat_answer(question: str) -> str:
    lower_q = question.lower()

    if "yara" in lower_q:
        return "YARA is used for pattern matching to detect known malicious patterns in files."
    elif "virustotal" in lower_q:
        return "VirusTotal is used to look up file hashes or URLs against multiple antivirus engines."
    elif "malconv" in lower_q:
        return "MalConv is a machine learning model used to detect malicious executable files from raw bytes."
    elif "risk score" in lower_q:
        return "Risk score combines YARA matches, VirusTotal results, and AI analysis to quantify threat level."
    elif "final verdict" in lower_q:
        return "Final verdict is based on the calculated risk score (Low/Medium/High/Critical Risk)."
    else:
        return "I can help with malware detection, scanning, and security analysis. How can I assist you?"


def call_groq(prompt: str) -> Optional[str]:
    return call_groq_with_system("", prompt)


def call_groq_with_system(system_prompt: str, user_prompt: str) -> Optional[str]:
    api_key = (settings.GROQ_API_KEY or "").strip()
    if not api_key:
        logger.info("Groq API key not configured - skipping external call")
        return None

    url = f"{GROQ_API_BASE}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    messages = []
    if system_prompt and system_prompt.strip():
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})
    
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 1024,
    }

    try:
        with httpx.Client(timeout=settings.GROQ_TIMEOUT_SECONDS) as client:
            response = client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except httpx.HTTPError as e:
        logger.warning(f"Groq request failed: {e}")
        return None
    except (KeyError, IndexError, TypeError) as e:
        logger.warning(f"Groq response parse failed: {e}")
        return None


def build_report_explanation_prompt(report_data: Dict) -> str:
    prompt = "Please explain the following scan report in simple terms and recommend an action.\n\n"
    prompt += "Important notes to include:\n"
    prompt += "- The 'demo_pe_header_check' YARA rule only confirms PE structure and is not a malware indicator.\n"
    prompt += "- AI (MalConv) results are advisory signals, not final proof of malware.\n"
    prompt += "- VirusTotal and strong YARA rules are stronger evidence than AI alone.\n"
    prompt += "- The final verdict is based on combined signals from YARA, VirusTotal, and AI.\n\n"
    prompt += "Scan Report Details:\n"
    for key, value in report_data.items():
        if value is not None and value != "":
            prompt += f"- {key}: {value}\n"
    prompt += (
        "\nRespond with ONLY a raw JSON object with exactly two string keys: "
        "\"explanation\" and \"recommended_action\". "
        "Do not include markdown code fences, backticks, or any text before or after the JSON object."
    )
    return prompt


def parse_groq_report_response(groq_answer: str) -> Tuple[str, str]:
    cleaned = groq_answer.strip()

    # Remove markdown ```json / ``` fences if present, wherever they appear
    if "```" in cleaned:
        # Grab the content of the first fenced block, if one exists
        parts = cleaned.split("```")
        for part in parts:
            part_stripped = part.strip()
            if part_stripped.lower().startswith("json"):
                part_stripped = part_stripped[4:].strip()
            if part_stripped.startswith("{"):
                cleaned = part_stripped
                break

    # Fallback: extract the substring between the first '{' and the last '}'
    if not cleaned.strip().startswith("{"):
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            cleaned = cleaned[start:end + 1]

    try:
        data = json.loads(cleaned)
        explanation = data.get("explanation", "").strip()
        recommended_action = data.get("recommended_action", "").strip()
        if explanation:
            return explanation, recommended_action or "Review the explanation and act accordingly."
    except (json.JSONDecodeError, AttributeError):
        pass

    logger.warning("Failed to parse Groq report response as JSON - using freeform text")
    # Strip stray backticks/fences from the freeform fallback too
    explanation = groq_answer.strip().strip("`").strip()
    recommended_action = "Review the explanation and act accordingly."
    return explanation, recommended_action


def explain_report(
    report_type: str,
    report: Dict,
) -> Tuple[str, str, str]:
    report_type = report_type.lower().strip()

    safe_report_data = {}
    if report_type == "file":
        safe_report_data = {
            "file_name": report.get("file_name"),
            "sha256_hash": report.get("sha256_hash"),
            "scan_type": "file",
            "yara_matches": report.get("yara_matches"),
            "virustotal_status": report.get("virustotal_status"),
            "virustotal_malicious_count": report.get("virustotal_malicious_count"),
            "ai_label": report.get("ai_label"),
            "ai_confidence": report.get("ai_confidence"),
            "risk_score": report.get("risk_score"),
            "final_verdict": report.get("final_verdict"),
            "created_at": str(report.get("created_at", "")),
        }
    elif report_type == "url":
        safe_report_data = {
            "url": report.get("url"),
            "domain": report.get("domain"),
            "scan_type": "url",
            "local_indicators": report.get("local_indicators"),
            "virustotal_status": report.get("virustotal_status"),
            "virustotal_malicious_count": report.get("virustotal_malicious_count"),
            "url_ai_label": report.get("url_ai_label"),
            "url_ai_confidence": report.get("url_ai_confidence"),
            "risk_score": report.get("risk_score"),
            "final_verdict": report.get("final_verdict"),
            "created_at": str(report.get("created_at", "")),
        }

    final_verdict = safe_report_data.get("final_verdict", "pending")

    prompt = build_report_explanation_prompt(safe_report_data)
    groq_answer = call_groq(prompt)

    if groq_answer:
        explanation, recommended_action = parse_groq_report_response(groq_answer)
        return "groq", explanation, recommended_action
    else:
        explanation, recommended_action = get_local_fallback_report_explanation(report_type, final_verdict)
        return "local_fallback", explanation, recommended_action


def guarded_chat(
    question: str,
    report_context: Optional[Dict] = None,
) -> Tuple[str, str]:
    if is_harmful_question(question):
        return "local_guardrail", LOCAL_HARMFUL_REFUSAL

    if is_off_topic_question(question):
        return "local_guardrail", LOCAL_GUARDRAIL_ANSWER

    system_prompt = """You are SafeScan Security Assistant, a helpful AI specialized in cybersecurity, malware detection, and computer security.

Rules:
1. Only answer questions related to:
   - Cybersecurity
   - Malware detection
   - File/URL scanning
   - Computer security
   - SafeScan project
   - General computer/software questions

2. Keep answers concise and clear (max 2-3 sentences)
3. Do NOT use any markdown formatting (no **, *, #, etc.)
4. Do NOT use bullet points or numbered lists
5. Be friendly and helpful
6. If unsure, ask the user to clarify

Always be safe and do not assist with harmful activities."""

    prompt = question
    if report_context:
        prompt += "\n\nAdditional context (scan report):\n"
        for key, value in report_context.items():
            if value is not None and value != "":
                prompt += f"- {key}: {value}\n"

    groq_answer = call_groq_with_system(system_prompt, prompt)
    if groq_answer:
        return "groq", groq_answer
    else:
        local_answer = get_local_fallback_chat_answer(question)
        return "local_fallback", local_answer