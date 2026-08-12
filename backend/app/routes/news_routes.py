"""
News routes: fetch cybersecurity news.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import NewsListResponse
from app.services.news_service import fetch_news

router = APIRouter(prefix="/news", tags=["News"])


@router.get("/", response_model=NewsListResponse)
async def get_news(db: Session = Depends(get_db)):
    """
    Get cybersecurity news.
    Uses GNews API if key is set, otherwise returns safe mock fallback.
    """
    news_items = await fetch_news()
    return NewsListResponse(total=len(news_items), news=news_items)
