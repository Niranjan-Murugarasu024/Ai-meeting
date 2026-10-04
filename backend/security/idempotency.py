import hashlib
from typing import Dict, Any, Optional

class IdempotencyManager:
    """
    Idempotency Manager:
    Prevents duplicate webhook deliveries or retry attempts from double-creating
    Jira/Linear tickets or duplicate action items by keying each action on:
    hash(meeting_id + segment_hash + action_description).
    """

    def __init__(self):
        # Cache of action_key -> task_result
        self._action_cache: Dict[str, Dict[str, Any]] = {}
        # Cache of webhook_event_id -> status
        self._webhook_event_cache: Dict[str, Dict[str, Any]] = {}

    def generate_action_key(self, meeting_id: str, description: str, owner_name: Optional[str]) -> str:
        """
        Generates deterministic SHA-256 idempotency key for an action item.
        """
        raw_key = f"{meeting_id}:{description.strip().lower()}:{owner_name or 'none'}"
        return hashlib.sha256(raw_key.encode('utf-8')).hexdigest()

    def is_action_processed(self, action_key: str) -> Optional[Dict[str, Any]]:
        """
        Returns cached task info if already provisioned.
        """
        return self._action_cache.get(action_key)

    def record_action_processed(self, action_key: str, jira_key: str, linear_url: str):
        """
        Records the provisioned task against the idempotency key.
        """
        self._action_cache[action_key] = {
            "jira_key": jira_key,
            "linear_url": linear_url,
            "timestamp": "recorded"
        }

    def check_and_record_webhook(self, event_id: str, event_type: str) -> bool:
        """
        Returns True if event is NEW (not duplicate), False if already processed.
        """
        if event_id in self._webhook_event_cache:
            return False  # Duplicate event
        self._webhook_event_cache[event_id] = {
            "type": event_type,
            "received_at": "now"
        }
        return True

idempotency_manager = IdempotencyManager()
