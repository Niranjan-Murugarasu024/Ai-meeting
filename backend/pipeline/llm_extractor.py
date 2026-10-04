import os
import json
import requests
from typing import List, Dict, Any, Optional
from ..models.schemas import (
    TranscriptSegment, ActionItem, Decision, TopicSegment, KeyPhrase, ActionItemStatus
)

class LLMExtractor:
    """
    Real Structured LLM Extraction Engine using OpenRouter / OpenAI API.
    Performs one-pass structured extraction:
    - 1-page cohesive narrative executive summary
    - Discrete explicit decision log
    - Strict null-safe action items (never hallucinates unstated assignees or dates)
    - Dynamic topic segmentation (timeline chapters)
    - Key phrase entity extraction
    """

    def __init__(self):
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")

    def _get_api_client_details(self):
        key = os.getenv("OPENROUTER_API_KEY") or self.openrouter_key
        if key:
            return "https://openrouter.ai/api/v1/chat/completions", key, "openai/gpt-4o-mini"

        key = os.getenv("OPENAI_API_KEY") or self.openai_key
        if key:
            return "https://api.openai.com/v1/chat/completions", key, "gpt-4o-mini"

        raise ValueError(
            "Neither OPENROUTER_API_KEY nor OPENAI_API_KEY is configured. "
            "Please provide an API key in your .env file to enable meeting summarization."
        )

    def extract_meeting_intelligence(
        self,
        meeting_id: str,
        meeting_title: str,
        segments: List[TranscriptSegment]
    ) -> Dict[str, Any]:
        endpoint_url, api_key, model_name = self._get_api_client_details()

        # Format transcript into timeline text
        transcript_lines = []
        for s in segments:
            mins = s.start_ms // 60000
            secs = (s.start_ms % 60000) // 1000
            time_str = f"{mins:02d}:{secs:02d}"
            transcript_lines.append(f"[{time_str}] {s.speaker_label}: {s.text}")

        full_transcript = "\n".join(transcript_lines)

        system_prompt = (
            "You are an expert executive meeting intelligence assistant. "
            "Analyze the meeting transcript and extract structured meeting intelligence. "
            "You must return ONLY a valid JSON object matching the requested schema.\n\n"
            "STRICT RULES:\n"
            "1. executive_summary: A coherent, narrative synthesis paragraph (4-6 sentences) summarizing core discussions and outcomes. Do not use raw bullet points.\n"
            "2. key_decisions: A list of explicit agreements reached. Include the decision text, concise rationale/context, and agreed participants.\n"
            "3. action_items: Discrete tasks and commitments.\n"
            "   - CRITICAL NULL-SAFETY: If a task has no explicitly stated person assigned, set 'owner_name' to null. NEVER guess or fabricate assignees.\n"
            "   - If no explicit deadline or timeframe is stated, set 'due_date' to null.\n"
            "   - priority must be 'low', 'medium', or 'high'.\n"
            "4. topics: 2-5 thematic timeline chapters with approximate start_ms and end_ms, title, summary, and 2-3 key points.\n"
            "5. key_phrases: 4-8 salient domain/technical phrases with category ('Architecture', 'Business', 'Action', 'Metric') and importance_score (0.0 to 1.0).\n"
            "6. sentiment_score: float from -1.0 (very negative/conflict) to 1.0 (very positive/energized)."
        )

        user_prompt = f"Meeting Title: {meeting_title}\n\nTranscript:\n{full_transcript}"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }

        response = requests.post(endpoint_url, headers=headers, json=payload, timeout=60)
        if response.status_code != 200:
            raise RuntimeError(f"LLM API Error ({response.status_code}): {response.text}")

        resp_data = response.json()
        content = resp_data["choices"][0]["message"]["content"]
        extracted = json.loads(content)

        # Parse into typed objects
        # 1. Decisions
        raw_decisions = extracted.get("key_decisions", [])
        decisions: List[Decision] = []
        for idx, d in enumerate(raw_decisions):
            decisions.append(
                Decision(
                    id=f"dec-{meeting_id}-{idx + 1}",
                    text=d.get("text", ""),
                    context=d.get("context", ""),
                    timestamp_ms=d.get("timestamp_ms", 0),
                    agreed_by=d.get("agreed_by", [])
                )
            )

        # 2. Action Items
        raw_actions = extracted.get("action_items", [])
        action_items: List[ActionItem] = []
        for idx, a in enumerate(raw_actions):
            owner = a.get("owner_name")
            if owner and (owner.strip().lower() in ["none", "unassigned", "null"]):
                owner = None

            due = a.get("due_date")
            if due and (due.strip().lower() in ["none", "null"]):
                due = None

            action_items.append(
                ActionItem(
                    id=f"act-{meeting_id}-{idx + 1}",
                    summary_id=f"sum-{meeting_id}",
                    meeting_id=meeting_id,
                    description=a.get("description", ""),
                    owner_name=owner,
                    due_date=due,
                    status=ActionItemStatus.OPEN,
                    priority=a.get("priority", "medium"),
                    jira_issue_key=None,
                    linear_issue_url=None
                )
            )

        # 3. Topic Segments
        raw_topics = extracted.get("topics", [])
        topics: List[TopicSegment] = []
        for idx, t in enumerate(raw_topics):
            topics.append(
                TopicSegment(
                    id=f"topic-{meeting_id}-{idx + 1}",
                    meeting_id=meeting_id,
                    chapter_index=idx + 1,
                    title=t.get("title", f"Topic {idx + 1}"),
                    start_ms=t.get("start_ms", 0),
                    end_ms=t.get("end_ms", 0),
                    summary=t.get("summary", ""),
                    key_points=t.get("key_points", []),
                    primary_speakers=t.get("primary_speakers", [])
                )
            )

        # 4. Key Phrases
        raw_phrases = extracted.get("key_phrases", [])
        key_phrases: List[KeyPhrase] = []
        for p in raw_phrases:
            key_phrases.append(
                KeyPhrase(
                    phrase=p.get("phrase", ""),
                    category=p.get("category", "General"),
                    importance_score=float(p.get("importance_score", 0.8)),
                    occurrences=int(p.get("occurrences", 1))
                )
            )

        return {
            "executive_summary": extracted.get("executive_summary", "Summary not generated."),
            "decisions": decisions,
            "action_items": action_items,
            "topic_segments": topics,
            "key_phrases": key_phrases,
            "sentiment_score": float(extracted.get("sentiment_score", 0.0))
        }

llm_extractor = LLMExtractor()
