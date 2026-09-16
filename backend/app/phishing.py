"""
phishing.py — Heuristic Phishing Email Analysis Module
Fully offline, regex + keyword based. No external APIs required.
"""
import re
from typing import List, Tuple

# ── Keyword dictionaries ──────────────────────────────────────────────────

URGENCY_KEYWORDS = [
    "urgent", "immediately", "act now", "within 24 hours", "your account will be",
    "suspended", "verify now", "confirm now", "limited time", "expires soon",
    "last chance", "action required", "account locked", "unauthorized access",
    "security alert", "critical", "warning", "final notice", "respond immediately",
    "failure to respond", "legal action", "your account has been", "restricted",
]

CREDENTIAL_KEYWORDS = [
    "enter your password", "confirm your password", "update your password",
    "verify your account", "sign in to", "log in to verify", "enter your details",
    "provide your", "banking details", "credit card", "social security",
    "date of birth", "mother's maiden name", "security question",
    "username and password", "enter credentials",
]

LURE_KEYWORDS = [
    "you have won", "congratulations", "lottery", "prize", "claim your reward",
    "bitcoin", "cryptocurrency", "investment opportunity", "wire transfer",
    "western union", "gift card", "itunes card", "paypal", "payroll",
    "inheritance", "overseas transfer", "million dollars",
]

IMPERSONATION_KEYWORDS = [
    "paypal", "amazon", "apple", "microsoft", "google", "facebook", "bank of",
    "irs", "hmrc", "tax refund", "fbi", "interpol", "customs", "fedex", "ups",
    "dhl", "netflix", "dropbox", "adobe", "docusign",
]

SUSPICIOUS_URL_PATTERNS = [
    r'http[s]?://\d+\.\d+\.\d+\.\d+',         # raw IP URL
    r'bit\.ly|tinyurl|goo\.gl|ow\.ly|t\.co',    # URL shorteners
    r'[a-z0-9]{20,}\.(xyz|top|click|loan|win)', # suspicious TLDs
    r'secure[-_]?login',                          # fake secure login
    r'account[-_]?verify',                        # fake account verify
    r'login[-_]?verify',                          # fake login verify
    r'update[-_]?account',                        # fake update
    r'paypal\.com[^\.]+\.com',                   # domain spoofing
    r'apple[-_]?support',
    r'microsoft[-_]?security',
]

ATTACHMENT_KEYWORDS = [
    "open the attachment", "see attached", "download the file", "click the link",
    "attached invoice", "attached document", "attached form", ".exe", ".zip attached",
    "macro enabled", "enable macros",
]


# ── Analysis engine ────────────────────────────────────────────────────────

def _count_matches(text_lower: str, keywords: List[str]) -> Tuple[int, List[str]]:
    found = []
    for kw in keywords:
        if kw in text_lower:
            found.append(kw)
    return len(found), found


def _find_urls(text: str) -> List[str]:
    return re.findall(r'https?://[^\s<>"{}|\\^`\[\]]+', text)


def analyze_email(email_text: str) -> dict:
    """
    Run heuristic phishing analysis on email text.
    Returns a structured result with risk score, category, and detailed findings.
    """
    if not email_text or not email_text.strip():
        return {"error": "No email text provided."}

    text_lower = email_text.lower()
    findings = []
    score = 0

    # ── Urgency language ──────────────────────────────────────────────
    urgency_count, urgency_found = _count_matches(text_lower, URGENCY_KEYWORDS)
    if urgency_count > 0:
        pts = min(25, urgency_count * 5)
        score += pts
        findings.append({
            "category": "Urgency / Pressure Language",
            "severity": "HIGH" if urgency_count >= 3 else "MEDIUM",
            "detail": f"Detected {urgency_count} urgency phrase(s): {', '.join(f'\"{k}\"' for k in urgency_found[:4])}",
            "score_contribution": pts,
        })

    # ── Credential harvesting ─────────────────────────────────────────
    cred_count, cred_found = _count_matches(text_lower, CREDENTIAL_KEYWORDS)
    if cred_count > 0:
        pts = min(30, cred_count * 8)
        score += pts
        findings.append({
            "category": "Credential Request",
            "severity": "HIGH",
            "detail": f"Email requests sensitive information: {', '.join(f'\"{k}\"' for k in cred_found[:3])}",
            "score_contribution": pts,
        })

    # ── Financial lure ─────────────────────────────────────────────────
    lure_count, lure_found = _count_matches(text_lower, LURE_KEYWORDS)
    if lure_count > 0:
        pts = min(20, lure_count * 5)
        score += pts
        findings.append({
            "category": "Financial Lure / Scam Indicators",
            "severity": "MEDIUM",
            "detail": f"Potential financial scam language detected: {', '.join(f'\"{k}\"' for k in lure_found[:3])}",
            "score_contribution": pts,
        })

    # ── Brand impersonation ────────────────────────────────────────────
    imp_count, imp_found = _count_matches(text_lower, IMPERSONATION_KEYWORDS)
    if imp_count > 0 and (urgency_count > 0 or cred_count > 0):
        pts = min(20, imp_count * 5)
        score += pts
        findings.append({
            "category": "Brand Impersonation",
            "severity": "HIGH",
            "detail": f"Email references trusted brands alongside suspicious content: {', '.join(imp_found[:3])}",
            "score_contribution": pts,
        })

    # ── Suspicious URLs ────────────────────────────────────────────────
    urls = _find_urls(email_text)
    sus_urls = []
    for url in urls:
        for pattern in SUSPICIOUS_URL_PATTERNS:
            if re.search(pattern, url, re.IGNORECASE):
                sus_urls.append(url)
                break
    if sus_urls:
        pts = min(30, len(sus_urls) * 10)
        score += pts
        findings.append({
            "category": "Suspicious URLs",
            "severity": "CRITICAL",
            "detail": f"Found {len(sus_urls)} suspicious URL(s): {'; '.join(sus_urls[:3])}",
            "score_contribution": pts,
        })
    elif urls:
        findings.append({
            "category": "Links Present",
            "severity": "LOW",
            "detail": f"{len(urls)} URL(s) detected. Verify each destination carefully.",
            "score_contribution": 0,
        })

    # ── Attachment lures ───────────────────────────────────────────────
    att_count, att_found = _count_matches(text_lower, ATTACHMENT_KEYWORDS)
    if att_count > 0:
        pts = min(15, att_count * 5)
        score += pts
        findings.append({
            "category": "Suspicious Attachment Reference",
            "severity": "MEDIUM",
            "detail": f"Email encourages opening attachments or clicking links: {', '.join(f'\"{k}\"' for k in att_found[:3])}",
            "score_contribution": pts,
        })

    # ── Clamp & categorise ─────────────────────────────────────────────
    final_score = min(100, score)

    if final_score >= 70:
        verdict = "HIGH RISK"
        verdict_color = "red"
        recommended = "Do NOT click any links or open attachments. Report to your IT/security team immediately. Mark as phishing and delete."
    elif final_score >= 35:
        verdict = "SUSPICIOUS"
        verdict_color = "orange"
        recommended = "Exercise caution. Verify the sender through an independent channel before taking any action. Do not enter credentials."
    else:
        verdict = "LIKELY SAFE"
        verdict_color = "green"
        recommended = "No obvious phishing indicators detected. However, always verify sender identity for sensitive requests."

    # Always add a note if no indicators found
    if not findings:
        findings.append({
            "category": "Analysis Complete",
            "severity": "INFO",
            "detail": "No phishing indicators detected in the provided text.",
            "score_contribution": 0,
        })

    return {
        "risk_score": final_score,
        "verdict": verdict,
        "verdict_color": verdict_color,
        "findings": findings,
        "total_findings": len(findings),
        "urls_detected": len(urls),
        "suspicious_urls": len(sus_urls),
        "recommended_action": recommended,
        "disclaimer": "This analysis is heuristic-based and may not catch all phishing attempts. Always use human judgment."
    }
