"""
Hybrid Executable Malware Detection System - FastAPI Backend

Main application entry point.
Configures CORS, includes routers, and creates database tables on startup.
"""

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routes.auth_routes import router as auth_router
from app.routes.report_routes import router as report_router, router_url as url_report_router
from app.routes.scan_routes import router as scan_router
from app.routes.url_scan_routes import router as url_scan_router
from app.routes.chat_routes import router as chat_router
from app.routes.news_routes import router as news_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Hybrid Executable Malware Detection System",
    description=(
        "AI-powered malware detection backend using static analysis, "
        "YARA rules, VirusTotal threat intelligence, and MalConv deep learning model. "
        "Designed for safe analysis of Windows executable files."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration (allow all origins for FYP project)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(scan_router)
app.include_router(url_scan_router)
app.include_router(chat_router)
app.include_router(report_router)
app.include_router(url_report_router)
app.include_router(news_router)


@app.on_event("startup")
def on_startup():
    """
    Runs on application startup:
    - Creates all database tables if they don't exist.
    - Ensures the uploads directory exists.
    """
    logger.info("Starting Hybrid Executable Malware Detection System...")

    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified.")

    # Ensure uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"Uploads directory ready: {os.path.abspath(settings.UPLOAD_DIR)}")

    logger.info("Application startup complete.")


@app.get("/", tags=["Health"])
async def health_check():
    """
    Health check endpoint — must stay fast (no DB, YARA, VirusTotal, or AI).
    """
    logger.info("GET / health")
    return {"status": "healthy"}
