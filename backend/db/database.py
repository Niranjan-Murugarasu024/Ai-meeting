import sqlite3
import os
import json
from pathlib import Path
from typing import Optional

DB_DIR = Path("data")
DB_PATH = DB_DIR / "webenoid.db"

def get_db_connection() -> sqlite3.Connection:
    DB_DIR.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    DB_DIR.mkdir(exist_ok=True)
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Meetings table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS meetings (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            platform TEXT DEFAULT 'upload',
            meeting_url TEXT,
            uploaded_at TEXT NOT NULL,
            duration_seconds INTEGER DEFAULT 0,
            status TEXT NOT NULL,
            recording_url TEXT,
            host_name TEXT DEFAULT 'Alex Johnson',
            participants_count INTEGER DEFAULT 0,
            file_name TEXT,
            file_size_bytes INTEGER DEFAULT 0,
            error_message TEXT
        )
        """)

        # 2. Speakers table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS speakers (
            id TEXT PRIMARY KEY,
            meeting_id TEXT NOT NULL,
            subject_id TEXT,
            speaker_label TEXT NOT NULL,
            display_name TEXT NOT NULL,
            avatar_color TEXT,
            role TEXT,
            detected_accent TEXT,
            FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
        )
        """)

        # 3. Transcript segments table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS transcript_segments (
            id TEXT PRIMARY KEY,
            meeting_id TEXT NOT NULL,
            subject_id TEXT,
            speaker_label TEXT NOT NULL,
            start_ms INTEGER NOT NULL,
            end_ms INTEGER NOT NULL,
            text TEXT NOT NULL,
            confidence_score REAL DEFAULT 1.0,
            language_code TEXT DEFAULT 'en',
            detected_accent TEXT,
            noise_reduced INTEGER DEFAULT 0,
            audio_snr_db REAL,
            FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
        )
        """)

        # 4. Summaries table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS summaries (
            id TEXT PRIMARY KEY,
            meeting_id TEXT UNIQUE NOT NULL,
            executive_summary TEXT NOT NULL,
            topics_json TEXT,
            sentiment_score REAL DEFAULT 0.0,
            ai_model_version TEXT,
            created_at TEXT NOT NULL,
            audio_diagnostics_json TEXT,
            effectiveness_json TEXT,
            distribution_json TEXT,
            FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
        )
        """)

        # 5. Decisions table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS decisions (
            id TEXT PRIMARY KEY,
            summary_id TEXT NOT NULL,
            meeting_id TEXT NOT NULL,
            text TEXT NOT NULL,
            context TEXT,
            timestamp_ms INTEGER,
            agreed_by_json TEXT,
            FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
        )
        """)

        # 6. Action items table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS action_items (
            id TEXT PRIMARY KEY,
            summary_id TEXT,
            meeting_id TEXT NOT NULL,
            assignee_subject_id TEXT,
            description TEXT NOT NULL,
            owner_name TEXT,
            due_date TEXT,
            status TEXT NOT NULL DEFAULT 'open',
            priority TEXT DEFAULT 'medium',
            jira_issue_key TEXT,
            linear_issue_url TEXT,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
        )
        """)

        # 7. Topic segments table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS topic_segments (
            id TEXT PRIMARY KEY,
            meeting_id TEXT NOT NULL,
            chapter_index INTEGER NOT NULL,
            title TEXT NOT NULL,
            start_ms INTEGER NOT NULL,
            end_ms INTEGER NOT NULL,
            summary TEXT,
            key_points_json TEXT,
            primary_speakers_json TEXT,
            FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
        )
        """)

        # 8. Key phrases table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS key_phrases (
            id TEXT PRIMARY KEY,
            meeting_id TEXT NOT NULL,
            phrase TEXT NOT NULL,
            category TEXT,
            importance_score REAL,
            occurrences INTEGER DEFAULT 1,
            FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
        )
        """)

        # 9. Integrations config table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS integrations_config (
            key TEXT PRIMARY KEY,
            value_json TEXT NOT NULL
        )
        """)

        conn.commit()

init_db()
