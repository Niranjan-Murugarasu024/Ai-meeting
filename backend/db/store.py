import sqlite3
import json
import datetime
import uuid
from typing import Dict, List, Optional, Any
from pathlib import Path

from ..models.schemas import (
    Meeting, TranscriptSegment, Speaker, Summary, Decision, ActionItem,
    TopicSegment, KeyPhrase, EffectivenessScore, AudioDiagnostics,
    MeetingStatus, ActionItemStatus, PlatformType, IntegrationsConfig, DistributionRecord
)
from .database import get_db_connection, init_db
from ..pipeline.speech_engine import speech_engine
from ..pipeline.llm_extractor import llm_extractor
from ..pipeline.effectiveness_scorer import effectiveness_scorer

class SQLiteMeetingStore:
    """
    Production SQLite Meeting Store:
    Replaces volatile in-memory dictionaries with persistent ACID SQLite storage.
    All meetings, transcripts, decisions, and action items survive server restarts.
    """

    def __init__(self):
        init_db()

    def get_all_meetings(self, status: Optional[str] = None, search: Optional[str] = None) -> List[Meeting]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM meetings WHERE 1=1"
            params = []

            if status and status != "all":
                query += " AND status = ?"
                params.append(status)

            if search:
                query += " AND (title LIKE ? OR host_name LIKE ?)"
                params.extend([f"%{search}%", f"%{search}%"])

            query += " ORDER BY uploaded_at DESC"
            cursor.execute(query, params)
            rows = cursor.fetchall()

            meetings = []
            for r in rows:
                m_id = r["id"]
                # Get action items count
                cursor.execute("SELECT status, COUNT(*) as cnt FROM action_items WHERE meeting_id = ? GROUP BY status", (m_id,))
                counts_raw = cursor.fetchall()
                cnt_map = {row["status"]: row["cnt"] for row in counts_raw}
                total_actions = sum(cnt_map.values())
                open_actions = cnt_map.get("open", 0)
                in_prog_actions = cnt_map.get("in-progress", 0)
                done_actions = cnt_map.get("done", 0)

                # Get summary if exists
                summary = self.get_summary(m_id)

                meetings.append(
                    Meeting(
                        id=r["id"],
                        title=r["title"],
                        platform=PlatformType(r["platform"]) if r["platform"] in [p.value for p in PlatformType] else PlatformType.UPLOAD,
                        meeting_url=r["meeting_url"],
                        uploaded_at=r["uploaded_at"],
                        duration_seconds=r["duration_seconds"],
                        status=MeetingStatus(r["status"]) if r["status"] in [s.value for s in MeetingStatus] else MeetingStatus.READY,
                        recording_url=r["recording_url"] or "",
                        host_name=r["host_name"] or "Alex Johnson",
                        participants_count=r["participants_count"] or 1,
                        file_name=r["file_name"] or "recording.mp3",
                        file_size_bytes=r["file_size_bytes"] or 0,
                        error_message=r["error_message"],
                        summary=summary,
                        action_items_count={
                            "total": total_actions,
                            "open": open_actions,
                            "in_progress": in_prog_actions,
                            "done": done_actions
                        }
                    )
                )
            return meetings

    def get_meeting(self, meeting_id: str) -> Optional[Meeting]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,))
            r = cursor.fetchone()
            if not r:
                return None

            cursor.execute("SELECT status, COUNT(*) as cnt FROM action_items WHERE meeting_id = ? GROUP BY status", (meeting_id,))
            counts_raw = cursor.fetchall()
            cnt_map = {row["status"]: row["cnt"] for row in counts_raw}
            total_actions = sum(cnt_map.values())

            # Get speakers
            cursor.execute("SELECT * FROM speakers WHERE meeting_id = ?", (meeting_id,))
            spk_rows = cursor.fetchall()
            speakers = [
                Speaker(
                    id=s["id"],
                    meeting_id=s["meeting_id"],
                    subject_id=s["subject_id"],
                    speaker_label=s["speaker_label"],
                    display_name=s["display_name"],
                    avatar_color=s["avatar_color"],
                    role=s["role"],
                    detected_accent=s["detected_accent"]
                ) for s in spk_rows
            ]

            summary = self.get_summary(meeting_id)

            return Meeting(
                id=r["id"],
                title=r["title"],
                platform=PlatformType(r["platform"]) if r["platform"] in [p.value for p in PlatformType] else PlatformType.UPLOAD,
                meeting_url=r["meeting_url"],
                uploaded_at=r["uploaded_at"],
                duration_seconds=r["duration_seconds"],
                status=MeetingStatus(r["status"]) if r["status"] in [s.value for s in MeetingStatus] else MeetingStatus.READY,
                recording_url=r["recording_url"] or "",
                host_name=r["host_name"] or "Alex Johnson",
                participants_count=r["participants_count"] or len(speakers) or 1,
                file_name=r["file_name"] or "recording.mp3",
                file_size_bytes=r["file_size_bytes"] or 0,
                error_message=r["error_message"],
                speakers=speakers,
                summary=summary,
                action_items_count={
                    "total": total_actions,
                    "open": cnt_map.get("open", 0),
                    "in_progress": cnt_map.get("in-progress", 0),
                    "done": cnt_map.get("done", 0)
                }
            )

    def get_transcript(self, meeting_id: str) -> Dict[str, Any]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM speakers WHERE meeting_id = ?", (meeting_id,))
            spk_rows = cursor.fetchall()
            speakers = [
                Speaker(
                    id=s["id"],
                    meeting_id=s["meeting_id"],
                    subject_id=s["subject_id"],
                    speaker_label=s["speaker_label"],
                    display_name=s["display_name"],
                    avatar_color=s["avatar_color"],
                    role=s["role"],
                    detected_accent=s["detected_accent"]
                ) for s in spk_rows
            ]

            cursor.execute("SELECT * FROM transcript_segments WHERE meeting_id = ? ORDER BY start_ms ASC", (meeting_id,))
            seg_rows = cursor.fetchall()
            segments = [
                TranscriptSegment(
                    id=s["id"],
                    meeting_id=s["meeting_id"],
                    subject_id=s["subject_id"],
                    speaker_label=s["speaker_label"],
                    start_ms=s["start_ms"],
                    end_ms=s["end_ms"],
                    text=s["text"],
                    confidence_score=s["confidence_score"],
                    language_code=s["language_code"],
                    detected_accent=s["detected_accent"],
                    noise_reduced=bool(s["noise_reduced"]),
                    audio_snr_db=s["audio_snr_db"]
                ) for s in seg_rows
            ]

            return {
                "meeting_id": meeting_id,
                "speakers": [s.dict() for s in speakers],
                "total_segments": len(segments),
                "segments": [s.dict() for s in segments]
            }

    def get_summary(self, meeting_id: str) -> Optional[Summary]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM summaries WHERE meeting_id = ?", (meeting_id,))
            s = cursor.fetchone()
            if not s:
                return None

            sum_id = s["id"]
            # Decisions
            cursor.execute("SELECT * FROM decisions WHERE summary_id = ? OR meeting_id = ?", (sum_id, meeting_id))
            dec_rows = cursor.fetchall()
            decisions = [
                Decision(
                    id=d["id"],
                    text=d["text"],
                    context=d["context"],
                    timestamp_ms=d["timestamp_ms"],
                    agreed_by=json.loads(d["agreed_by_json"]) if d["agreed_by_json"] else []
                ) for d in dec_rows
            ]

            # Topic segments
            cursor.execute("SELECT * FROM topic_segments WHERE meeting_id = ? ORDER BY chapter_index ASC", (meeting_id,))
            top_rows = cursor.fetchall()
            topics = [
                TopicSegment(
                    id=t["id"],
                    meeting_id=t["meeting_id"],
                    chapter_index=t["chapter_index"],
                    title=t["title"],
                    start_ms=t["start_ms"],
                    end_ms=t["end_ms"],
                    summary=t["summary"],
                    key_points=json.loads(t["key_points_json"]) if t["key_points_json"] else [],
                    primary_speakers=json.loads(t["primary_speakers_json"]) if t["primary_speakers_json"] else []
                ) for t in top_rows
            ]

            # Key phrases
            cursor.execute("SELECT * FROM key_phrases WHERE meeting_id = ?", (meeting_id,))
            kp_rows = cursor.fetchall()
            key_phrases = [
                KeyPhrase(
                    phrase=k["phrase"],
                    category=k["category"] or "General",
                    importance_score=k["importance_score"] or 0.8,
                    occurrences=k["occurrences"] or 1
                ) for k in kp_rows
            ]

            topics_list = json.loads(s["topics_json"]) if s["topics_json"] else [t.title for t in topics]
            eff_data = json.loads(s["effectiveness_json"]) if s["effectiveness_json"] else None
            effectiveness = EffectivenessScore(**eff_data) if eff_data else None

            diag_data = json.loads(s["audio_diagnostics_json"]) if s["audio_diagnostics_json"] else None
            diagnostics = AudioDiagnostics(**diag_data) if diag_data else None

            return Summary(
                id=s["id"],
                meeting_id=meeting_id,
                executive_summary=s["executive_summary"],
                key_decisions=decisions,
                topics=topics_list,
                topic_segments=topics,
                key_phrases=key_phrases,
                effectiveness=effectiveness,
                audio_diagnostics=diagnostics,
                ai_model_version=s["ai_model_version"] or "gpt-4o-mini",
                sentiment_score=s["sentiment_score"] or 0.0,
                created_at=s["created_at"]
            )

    def get_action_items(self, meeting_id: str) -> List[ActionItem]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM action_items WHERE meeting_id = ?", (meeting_id,))
            rows = cursor.fetchall()
            return [
                ActionItem(
                    id=a["id"],
                    summary_id=a["summary_id"],
                    meeting_id=a["meeting_id"],
                    assignee_subject_id=a["assignee_subject_id"],
                    description=a["description"],
                    owner_name=a["owner_name"],
                    due_date=a["due_date"],
                    status=ActionItemStatus(a["status"]) if a["status"] in [s.value for s in ActionItemStatus] else ActionItemStatus.OPEN,
                    priority=a["priority"] or "medium",
                    jira_issue_key=a["jira_issue_key"],
                    linear_issue_url=a["linear_issue_url"],
                    created_at=a["created_at"],
                    updated_at=a["updated_at"]
                ) for a in rows
            ]

    def update_action_item_status(self, action_id: str, status: ActionItemStatus) -> Optional[ActionItem]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            now = datetime.datetime.utcnow().isoformat()
            cursor.execute("UPDATE action_items SET status = ?, updated_at = ? WHERE id = ?", (status.value, now, action_id))
            conn.commit()

            cursor.execute("SELECT * FROM action_items WHERE id = ?", (action_id,))
            a = cursor.fetchone()
            if not a:
                return None

            return ActionItem(
                id=a["id"],
                summary_id=a["summary_id"],
                meeting_id=a["meeting_id"],
                assignee_subject_id=a["assignee_subject_id"],
                description=a["description"],
                owner_name=a["owner_name"],
                due_date=a["due_date"],
                status=ActionItemStatus(a["status"]),
                priority=a["priority"],
                jira_issue_key=a["jira_issue_key"],
                linear_issue_url=a["linear_issue_url"],
                created_at=a["created_at"],
                updated_at=a["updated_at"]
            )

    def delete_meeting(self, meeting_id: str) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM meetings WHERE id = ?", (meeting_id,))
            if not cursor.fetchone():
                return False

            cursor.execute("DELETE FROM meetings WHERE id = ?", (meeting_id,))
            cursor.execute("DELETE FROM speakers WHERE meeting_id = ?", (meeting_id,))
            cursor.execute("DELETE FROM transcript_segments WHERE meeting_id = ?", (meeting_id,))
            cursor.execute("DELETE FROM summaries WHERE meeting_id = ?", (meeting_id,))
            cursor.execute("DELETE FROM decisions WHERE meeting_id = ?", (meeting_id,))
            cursor.execute("DELETE FROM action_items WHERE meeting_id = ?", (meeting_id,))
            cursor.execute("DELETE FROM topic_segments WHERE meeting_id = ?", (meeting_id,))
            cursor.execute("DELETE FROM key_phrases WHERE meeting_id = ?", (meeting_id,))
            conn.commit()
            return True

    def process_real_meeting(
        self,
        meeting_id: str,
        title: str,
        audio_path: str,
        file_name: str,
        file_size_bytes: int,
        host_name: str = "Alex Johnson",
        platform: PlatformType = PlatformType.UPLOAD,
        recording_url: str = ""
    ) -> Meeting:
        """
        Executes genuine end-to-end processing pipeline:
        1. Deepgram Nova-2 STT with Diarization
        2. Real LLM Analysis (Summary, Decisions, Null-safe Actions, Topics, Phrases)
        3. Quantitative Effectiveness Scoring
        4. ACID SQLite Persistence
        """
        # 1. Transcribe via Deepgram Nova-2
        speakers, segments, speech_diag, duration_sec = speech_engine.transcribe_file(
            audio_path=audio_path,
            meeting_id=meeting_id,
            meeting_title=title
        )

        # 2. Extract intelligence via OpenRouter / OpenAI
        nlp_res = llm_extractor.extract_meeting_intelligence(
            meeting_id=meeting_id,
            meeting_title=title,
            segments=segments
        )

        decisions = nlp_res["decisions"]
        action_items = nlp_res["action_items"]
        topic_segments = nlp_res["topic_segments"]
        key_phrases = nlp_res["key_phrases"]
        exec_summary = nlp_res["executive_summary"]
        sentiment_score = nlp_res["sentiment_score"]

        # 3. Calculate effectiveness
        effectiveness = effectiveness_scorer.calculate_effectiveness(
            segments=segments,
            speakers=speakers,
            decisions=decisions,
            action_items=action_items,
            duration_seconds=duration_sec
        )

        # 4. Save everything to SQLite
        sum_id = f"sum-{meeting_id}"
        now = datetime.datetime.utcnow().isoformat()

        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Insert meeting
            cursor.execute("""
            INSERT OR REPLACE INTO meetings (
                id, title, platform, meeting_url, uploaded_at, duration_seconds,
                status, recording_url, host_name, participants_count, file_name,
                file_size_bytes, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                meeting_id, title, platform.value, recording_url, now, duration_sec,
                MeetingStatus.READY.value, recording_url, host_name, len(speakers),
                file_name, file_size_bytes, None
            ))

            # Insert speakers
            for spk in speakers:
                cursor.execute("""
                INSERT OR REPLACE INTO speakers (
                    id, meeting_id, subject_id, speaker_label, display_name,
                    avatar_color, role, detected_accent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    spk.id, meeting_id, spk.subject_id, spk.speaker_label,
                    spk.display_name, spk.avatar_color, spk.role, spk.detected_accent
                ))

            # Insert transcript segments
            for seg in segments:
                cursor.execute("""
                INSERT OR REPLACE INTO transcript_segments (
                    id, meeting_id, subject_id, speaker_label, start_ms, end_ms,
                    text, confidence_score, language_code, detected_accent,
                    noise_reduced, audio_snr_db
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    seg.id, meeting_id, seg.subject_id, seg.speaker_label,
                    seg.start_ms, seg.end_ms, seg.text, seg.confidence_score,
                    seg.language_code or "en", seg.detected_accent,
                    1 if seg.noise_reduced else 0, seg.audio_snr_db
                ))

            # Insert summary
            cursor.execute("""
            INSERT OR REPLACE INTO summaries (
                id, meeting_id, executive_summary, topics_json, sentiment_score,
                ai_model_version, created_at, audio_diagnostics_json, effectiveness_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sum_id, meeting_id, exec_summary, json.dumps([t.title for t in topic_segments]),
                sentiment_score, "openai/gpt-4o-mini", now,
                json.dumps(speech_diag), json.dumps(effectiveness.dict())
            ))

            # Insert decisions
            for d in decisions:
                cursor.execute("""
                INSERT OR REPLACE INTO decisions (
                    id, summary_id, meeting_id, text, context, timestamp_ms, agreed_by_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    d.id, sum_id, meeting_id, d.text, d.context, d.timestamp_ms,
                    json.dumps(d.agreed_by or [])
                ))

            # Insert action items
            for a in action_items:
                cursor.execute("""
                INSERT OR REPLACE INTO action_items (
                    id, summary_id, meeting_id, assignee_subject_id, description,
                    owner_name, due_date, status, priority, jira_issue_key, linear_issue_url,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    a.id, sum_id, meeting_id, a.assignee_subject_id, a.description,
                    a.owner_name, a.due_date, a.status.value, a.priority,
                    a.jira_issue_key, a.linear_issue_url, now, now
                ))

            # Insert topic segments
            for t in topic_segments:
                cursor.execute("""
                INSERT OR REPLACE INTO topic_segments (
                    id, meeting_id, chapter_index, title, start_ms, end_ms, summary,
                    key_points_json, primary_speakers_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    t.id, meeting_id, t.chapter_index, t.title, t.start_ms, t.end_ms,
                    t.summary, json.dumps(t.key_points or []), json.dumps(t.primary_speakers or [])
                ))

            # Insert key phrases
            for k in key_phrases:
                cursor.execute("""
                INSERT OR REPLACE INTO key_phrases (
                    id, meeting_id, phrase, category, importance_score, occurrences
                ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    f"kp-{meeting_id}-{uuid.uuid4().hex[:6]}", meeting_id, k.phrase,
                    k.category, k.importance_score, k.occurrences
                ))

            conn.commit()

        return self.get_meeting(meeting_id)

    def get_integrations_config(self) -> IntegrationsConfig:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT value_json FROM integrations_config WHERE key = 'active_config'")
            row = cursor.fetchone()
            if row:
                return IntegrationsConfig(**json.loads(row["value_json"]))
            return IntegrationsConfig()

    def save_integrations_config(self, cfg: IntegrationsConfig):
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO integrations_config (key, value_json)
            VALUES ('active_config', ?)
            """, (json.dumps(cfg.dict()),))
            conn.commit()

    def process_live_meeting_end(
        self,
        meeting_id: str,
        title: str,
        platform: PlatformType = PlatformType.ZOOM,
        meeting_url: str = "",
        slack_channel: str = ""
    ) -> Meeting:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            now = datetime.datetime.utcnow().isoformat()

            cursor.execute("""
            INSERT OR REPLACE INTO meetings (
                id, title, platform, meeting_url, uploaded_at, duration_seconds,
                status, recording_url, host_name, participants_count, file_name,
                file_size_bytes, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                meeting_id, title, platform.value, meeting_url, now, 0,
                MeetingStatus.READY.value, None, "Live Bot", 0, None, 0, None
            ))
            conn.commit()

        m = self.get_meeting(meeting_id)
        if m:
            m.summary = Summary(
                id=f"sum-{meeting_id}",
                meeting_id=meeting_id,
                executive_summary="Mock live meeting summary.",
                key_decisions=[],
                ai_model_version="mock",
                created_at=now,
                distribution=DistributionRecord(
                    slack_channel=slack_channel,
                    slack_status="mock_delivered",
                    jira_tasks_created=[],
                    linear_tasks_created=[]
                )
            )
            return m
        return Meeting(
            id=meeting_id,
            title=title,
            platform=platform,
            meeting_url=meeting_url,
            uploaded_at=now,
            duration_seconds=0,
            status=MeetingStatus.READY,
            recording_url="",
            host_name="Live Bot",
            participants_count=0,
            file_name="",
            file_size_bytes=0,
            speakers=[],
            action_items_count={"total": 0, "open": 0, "in_progress": 0, "done": 0}
        )

    def get_subject_index(self) -> List[str]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT DISTINCT subject_id FROM speakers WHERE subject_id IS NOT NULL")
            rows = cursor.fetchall()
            return [r["subject_id"] for r in rows]

    def purge_subject_data(self, subject_id: str) -> Dict[str, Any]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM transcript_segments WHERE subject_id = ?", (subject_id,))
            cursor.execute("DELETE FROM speakers WHERE subject_id = ?", (subject_id,))
            cursor.execute("UPDATE action_items SET assignee_subject_id = NULL WHERE assignee_subject_id = ?", (subject_id,))
            conn.commit()
        return {"success": True, "message": f"Subject {subject_id} data purged successfully"}

py_store = SQLiteMeetingStore()
