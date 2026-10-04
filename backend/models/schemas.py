from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class MeetingStatus(str, Enum):
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    LIVE = "live"

class ActionItemStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in-progress"
    DONE = "done"

class PlatformType(str, Enum):
    ZOOM = "zoom"
    GOOGLE_MEET = "google_meet"
    MS_TEAMS = "ms_teams"
    WEBEX = "webex"
    UPLOAD = "upload"
    WEBRTC = "webrtc"

class IngressDiarizationMode(str, Enum):
    WEBRTC_SINGLE_MIC = "webrtc_single_mic"         # In-browser client: deterministic single speaker (0% DER)
    WEBRTC_SFU_TRACK = "webrtc_sfu_track"           # Multi-stream WebRTC: isolated per-speaker stream
    HEADLESS_BOT_MIXED = "headless_bot_mixed"       # Headless Chromium bot: acoustic diarization required
    PLATFORM_SDK_STREAM = "platform_sdk_stream"     # Zoom/Teams server SDK: speaker-tagged metadata

class Speaker(BaseModel):
    id: str
    meeting_id: str
    subject_id: Optional[str] = None  # Subject index for GDPR Art. 17 / DPDP Sec. 12 Erasure
    speaker_label: str  # e.g., "Speaker A"
    display_name: str   # e.g., "Niranjan S."
    avatar_color: Optional[str] = "#6366f1"
    role: Optional[str] = "Participant"
    detected_accent: Optional[str] = "General / Adaptive"

class TranscriptSegment(BaseModel):
    id: str
    meeting_id: str
    subject_id: Optional[str] = None  # Indexed to data subject for cascading erasure
    speaker_label: str
    start_ms: int
    end_ms: int
    text: str
    confidence_score: float = 0.95
    language_code: str = "en"  # Support multi-language switching (e.g., 'en', 'hi', 'es', 'fr')
    detected_accent: Optional[str] = None
    noise_reduced: bool = True
    audio_snr_db: Optional[float] = 24.5
    model_tier: str = "conformer-xl"  # 'conformer-xl' | 'conformer-medium' | 'conformer-nano' for audit honesty

class Decision(BaseModel):
    id: str
    text: str
    context: Optional[str] = None
    timestamp_ms: Optional[int] = None
    agreed_by: List[str] = Field(default_factory=list)
    agreed_subject_ids: List[str] = Field(default_factory=list)
    model_tier: str = "conformer-xl"  # 'conformer-xl' | 'conformer-medium' | 'conformer-nano'
    upstream_stt_fidelity: str = "full_precision"

class ActionItem(BaseModel):
    id: str
    summary_id: Optional[str] = None
    meeting_id: str
    assignee_subject_id: Optional[str] = None  # Subject ID for GDPR erasure/anonymization
    description: str = ""
    owner_name: Optional[str] = None  # Strictly None if unstated
    due_date: Optional[str] = None    # Strictly None if unstated
    status: ActionItemStatus = ActionItemStatus.OPEN
    priority: Optional[str] = "medium"
    jira_issue_key: Optional[str] = None
    linear_issue_url: Optional[str] = None
    model_tier: str = "conformer-xl"  # 'conformer-xl' | 'conformer-medium' | 'conformer-nano'
    upstream_stt_fidelity: str = "full_precision"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class TopicSegment(BaseModel):
    id: str
    meeting_id: str
    chapter_index: int
    title: str
    start_ms: int
    end_ms: int
    summary: str
    key_points: List[str] = Field(default_factory=list)
    primary_speakers: List[str] = Field(default_factory=list)

class KeyPhrase(BaseModel):
    phrase: str
    category: str  # 'Architecture' | 'Business' | 'Action' | 'Metric'
    importance_score: float  # 0.0 - 1.0
    occurrences: int

class TalkTimeShare(BaseModel):
    speaker_label: str
    display_name: str
    talk_time_seconds: int
    percentage: float
    avatar_color: str

class EffectivenessScore(BaseModel):
    overall_score: int  # 0 to 100
    grade: str          # 'A+', 'A', 'B', 'C'
    talk_balance_score: int
    decision_clarity_score: int
    action_momentum_score: int
    engagement_sentiment_score: int
    talk_time_breakdown: List[TalkTimeShare] = Field(default_factory=list)
    ai_recommendations: List[str] = Field(default_factory=list)

class AudioDiagnostics(BaseModel):
    noise_cancellation_applied: bool = True
    noise_db_reduction: float = 18.5  # e.g. -18.5 dB noise floor lowered
    accent_adaptive_mode: str = "Active (Multi-Dialect Conformer)"
    primary_languages_detected: Dict[str, float] = Field(default_factory=dict)  # e.g. {"English": 0.85, "Hindi": 0.15}
    code_switching_occurrences: int = 0
    speech_clarity_index: float = 0.94

class DistributionRecord(BaseModel):
    slack_channel: Optional[str] = None
    slack_status: str = "sent"  # 'sent' | 'pending' | 'skipped'
    slack_message_preview: Optional[str] = None
    jira_tasks_created: List[str] = Field(default_factory=list)
    linear_tasks_created: List[str] = Field(default_factory=list)
    dispatched_at: Optional[str] = None

class Summary(BaseModel):
    id: str
    meeting_id: str
    executive_summary: str
    key_decisions: List[Decision] = Field(default_factory=list)
    topics: List[str] = Field(default_factory=list)
    topic_segments: List[TopicSegment] = Field(default_factory=list)
    key_phrases: List[KeyPhrase] = Field(default_factory=list)
    effectiveness: Optional[EffectivenessScore] = None
    distribution: Optional[DistributionRecord] = None
    audio_diagnostics: Optional[AudioDiagnostics] = None
    model_tier: str = "conformer-xl"  # Reflects upstream STT backpressure state
    upstream_stt_fidelity: str = "full_precision"  # 'full_precision' | 'mixed_shedding' | 'degraded_shedding'
    ai_model_version: str = "gemini-1.5-pro-nlp-v2"
    sentiment_score: float = 0.85
    created_at: str

class ActionItemStats(BaseModel):
    total: int = 0
    open: int = 0
    in_progress: int = 0
    done: int = 0

class Meeting(BaseModel):
    id: str
    title: str
    platform: PlatformType = PlatformType.UPLOAD
    meeting_url: Optional[str] = None
    uploaded_at: str
    duration_seconds: int = 0
    status: MeetingStatus = MeetingStatus.PROCESSING
    recording_url: str
    host_name: str
    participants_count: int = 2
    file_name: str
    file_size_bytes: int = 0
    error_message: Optional[str] = None
    speakers: List[Speaker] = Field(default_factory=list)
    summary: Optional[Summary] = None
    action_items_count: Optional[ActionItemStats] = None

class LiveBotJoinRequest(BaseModel):
    platform: PlatformType
    meeting_url: str
    meeting_title: Optional[str] = None
    bot_name: str = "Webenoid AI Meeting Bot"
    enable_noise_cancellation: bool = True
    enable_accent_adaptation: bool = True
    auto_post_slack: bool = True
    slack_channel: str = "#general-sync"
    auto_create_jira_tasks: bool = True
    project_key: str = "ENG"

class IntegrationsConfig(BaseModel):
    slack_webhook_url: Optional[str] = "https://hooks.slack.com/services/MOCK/TOKEN/AI_MEET"
    slack_bot_token: Optional[str] = "xoxb-mock-ai-meeting-bot"
    default_slack_channel: str = "#meeting-recaps"
    zoom_client_id: Optional[str] = "zm_mock_client_9942"
    google_meet_service_account: Optional[str] = "ai-bot@webenoid-meet.iam.gserviceaccount.com"
    ms_teams_tenant_id: Optional[str] = "tenant-webenoid-msft"
    webex_access_token: Optional[str] = "webex_mock_bearer_token"
    jira_domain: Optional[str] = "https://webenoid.atlassian.net"
    jira_project_key: str = "PROJ"
    linear_team_id: Optional[str] = "team_linear_eng"

class SearchResult(BaseModel):
    meeting: Meeting
    similarity_score: float
    matched_chunk_text: str
    matched_segment: Optional[Dict[str, Any]] = None
