"""
News service: fetch cybersecurity news from GNews API.
"""

import httpx
from datetime import datetime
from typing import List
from app.config import settings
from app.schemas import NewsItemResponse

# Mock news fallback
MOCK_NEWS = [
    {
        "title": "New Ransomware Campaign Targets Healthcare Organizations",
        "description": "A new sophisticated ransomware strain is actively targeting hospitals and clinics worldwide.",
        "source": "Security Daily",
        "url": "https://example.com/news/ransomware-healthcare",
        "image": None,
        "published_at": datetime.utcnow(),
        "category": "ransomware",
        "severity": "High",
    },
    {
        "title": "Zero-Day Vulnerability Discovered in Popular Software",
        "description": "Security researchers have identified a critical zero-day vulnerability affecting millions of users.",
        "source": "Threat Intel",
        "url": "https://example.com/news/zero-day-vulnerability",
        "image": None,
        "published_at": datetime.utcnow(),
        "category": "zero day vulnerability",
        "severity": "Critical",
    },
    {
        "title": "Phishing Attacks Surge Amid Holiday Season",
        "description": "Phishing campaigns are on the rise, targeting online shoppers with fake deals and discounts.",
        "source": "Cyber Alert",
        "url": "https://example.com/news/phishing-surge",
        "image": None,
        "published_at": datetime.utcnow(),
        "category": "phishing",
        "severity": "Medium",
    },
    {
        "title": "Major Data Breach Affects Tech Company",
        "description": "A leading tech company has reported a data breach potentially affecting millions of customer records.",
        "source": "Tech News",
        "url": "https://example.com/news/data-breach-tech",
        "image": None,
        "published_at": datetime.utcnow(),
        "category": "data breach",
        "severity": "High",
    },
]


def get_severity_for_category(category: str) -> str:
    """Map news category to severity level."""
    severity_map = {
        "ransomware": "High",
        "zero day vulnerability": "Critical",
        "data breach": "High",
        "phishing": "Medium",
        "malware": "Medium",
        "cybersecurity": "Low",
    }
    return severity_map.get(category.lower(), "Low")


async def fetch_news() -> List[NewsItemResponse]:
    """
    Fetch cybersecurity news from GNews API, return fallback mock data on failure.
    """
    if not settings.GNEWS_API_KEY:
        return [NewsItemResponse(**item) for item in MOCK_NEWS]

    queries = [
        "cybersecurity",
        "malware",
        "phishing",
        "ransomware",
        "data breach",
        "zero day vulnerability",
    ]

    all_news = []

    for query in queries:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://gnews.io/api/v4/search",
                    params={
                        "q": query,
                        "lang": "en",
                        "country": "us",
                        "max": 5,
                        "apikey": settings.GNEWS_API_KEY,
                    },
                    timeout=settings.GNEWS_TIMEOUT_SECONDS,
                )
                response.raise_for_status()
                data = response.json()

                for article in data.get("articles", []):
                    try:
                        all_news.append(
                            NewsItemResponse(
                                title=article.get("title", ""),
                                description=article.get("description", ""),
                                source=article.get("source", {}).get("name", "Unknown"),
                                url=article.get("url", ""),
                                image=article.get("image"),
                                published_at=datetime.fromisoformat(
                                    article.get("publishedAt", "").replace("Z", "+00:00")
                                ),
                                category=query,
                                severity=get_severity_for_category(query),
                            )
                        )
                    except Exception:
                        pass

        except Exception:
            continue

    if not all_news:
        return [NewsItemResponse(**item) for item in MOCK_NEWS]

    seen_titles = set()
    unique_news = []
    for item in sorted(all_news, key=lambda x: x.published_at, reverse=True):
        if item.title not in seen_titles:
            seen_titles.add(item.title)
            unique_news.append(item)
            if len(unique_news) >= 20:
                break

    return unique_news
