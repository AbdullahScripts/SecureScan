"""Add ai_note column to scan_reports table."""

import sqlite3
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings

db_path = settings.DATABASE_URL.replace("sqlite:///", "")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE scan_reports ADD COLUMN ai_note TEXT;")
    print("✅ Added ai_note column successfully!")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("ℹ️ ai_note column already exists, skipping.")
    else:
        raise e

conn.commit()
conn.close()
