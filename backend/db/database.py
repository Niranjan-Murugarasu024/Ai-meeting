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

        # Check if DB is empty to seed initial demo meetings
        cursor.execute("SELECT COUNT(*) as cnt FROM meetings")
        if cursor.fetchone()["cnt"] == 0:
            seed_data_path = Path(__file__).parent / "seed_data.json"
            if seed_data_path.exists():
                with open(seed_data_path, "r") as f:
                    seed_data = json.load(f)

                # 1. Insert meetings
                for meeting in seed_data.get("meetings", []):
                    cursor.execute("""
                    INSERT INTO meetings (
                        id, title, uploaded_at, duration_seconds, status, recording_url,
                        host_name, participants_count, file_name, file_size_bytes, error_message
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        meeting.get("id"), meeting.get("title"), meeting.get("uploaded_at"),
                        meeting.get("duration_seconds", 0), meeting.get("status"),
                        meeting.get("recording_url"), meeting.get("host_name", "Alex Johnson"),
                        meeting.get("participants_count", 0), meeting.get("file_name"),
                        meeting.get("file_size_bytes", 0), meeting.get("error_message")
                    ))

                # 2. Insert speakers
                for m_id, m_speakers in seed_data.get("speakers", {}).items():
                    for speaker in m_speakers:
                        cursor.execute("""
                        INSERT INTO speakers (id, meeting_id, speaker_label, display_name, avatar_color, role)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """, (
                            speaker.get("id"), speaker.get("meeting_id"), speaker.get("speaker_label"),
                            speaker.get("display_name"), speaker.get("avatar_color"), speaker.get("role")
                        ))

                # 3. Insert transcript_segments
                for m_id, m_segments in seed_data.get("transcript_segments", {}).items():
                    for segment in m_segments:
                        cursor.execute("""
                        INSERT INTO transcript_segments (id, meeting_id, speaker_label, start_ms, end_ms, text, confidence_score)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (
                            segment.get("id"), segment.get("meeting_id"), segment.get("speaker_label"),
                            segment.get("start_ms"), segment.get("end_ms"), segment.get("text"), segment.get("confidence_score")
                        ))

                # 4. Insert summaries and decisions
                for m_id, summary in seed_data.get("summaries", {}).items():
                    cursor.execute("""
                    INSERT INTO summaries (id, meeting_id, executive_summary, topics_json, sentiment_score, ai_model_version, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        summary.get("id"), summary.get("meeting_id"), summary.get("executive_summary"),
                        json.dumps(summary.get("topics", [])), summary.get("sentiment_score", 0.0),
                        summary.get("ai_model_version"), summary.get("created_at")
                    ))

                    for decision in summary.get("key_decisions", []):
                        cursor.execute("""
                        INSERT INTO decisions (id, summary_id, meeting_id, text, context, timestamp_ms, agreed_by_json)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (
                            decision.get("id"), summary.get("id"), summary.get("meeting_id"),
                            decision.get("text"), decision.get("context"), decision.get("timestamp_ms"),
                            json.dumps(decision.get("agreed_by", []))
                        ))

                # 5. Insert action items
                for m_id, m_actions in seed_data.get("action_items", {}).items():
                    for action in m_actions:
                        cursor.execute("""
                        INSERT INTO action_items (id, summary_id, meeting_id, description, owner_name, due_date, status, priority, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            action.get("id"), action.get("summary_id"), action.get("meeting_id"),
                            action.get("description"), action.get("owner_name"), action.get("due_date"),
                            action.get("status", "open"), action.get("priority", "medium"), action.get("created_at")
                        ))

                conn.commit()
                print("Database seeded with initial demo data.")

init_db()
