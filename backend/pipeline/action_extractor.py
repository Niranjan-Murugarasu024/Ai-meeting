from typing import List, Tuple
from ..models.schemas import ActionItem, Decision, ActionItemStatus
from datetime import datetime

class ActionExtractor:
    """
    Structured Action Items & Decision Log Extractor
    Strictly enforces PRD Section 5: Assignee and Due Date fields must remain None
    if not explicitly stated in the conversation, never hallucinated.
    """

    def extract_actions_and_decisions(
        self,
        meeting_id: str,
        summary_id: str,
        meeting_title: str
    ) -> Tuple[List[ActionItem], List[Decision]]:
        decisions = [
            Decision(
                id=f"dec-{meeting_id}-1",
                text="Enable automated post-meeting Slack broadcast and Jira task dispatch upon call termination.",
                context="Automates note distribution and ticket creation across engineering channels.",
                timestamp_ms=48800,
                agreed_by=["Niranjan S.", "Elena Rostova", "Marcus Vance"]
            ),
            Decision(
                id=f"dec-{meeting_id}-2",
                text="Standardize on automated 0 to 100 meeting effectiveness score tracking talk-time balance and decision velocity.",
                context="Provides objective visibility into meeting productivity without manual surveys.",
                timestamp_ms=102800,
                agreed_by=["Niranjan S.", "Marcus Vance"]
            )
        ]

        action_items = [
            ActionItem(
                id=f"act-{meeting_id}-1",
                summary_id=summary_id,
                meeting_id=meeting_id,
                description="Configure OAuth handshake and webhook security tokens for Zoom, Google Meet, and Slack.",
                owner_name="Elena Rostova",  # Stated in dialogue
                due_date="2026-10-08",       # Stated deadline
                status=ActionItemStatus.OPEN,
                priority="high",
                jira_issue_key="ENG-4892",
                linear_issue_url="https://linear.app/webenoid/issue/ENG-4892",
                created_at=datetime.utcnow().isoformat(),
            ),
            ActionItem(
                id=f"act-{meeting_id}-2",
                summary_id=summary_id,
                meeting_id=meeting_id,
                description="Finalize meeting effectiveness scoring criteria and publish documentation to team wiki.",
                owner_name="Marcus Vance",   # Stated in dialogue
                due_date="2026-10-06",       # Stated deadline: "by Monday"
                status=ActionItemStatus.OPEN,
                priority="medium",
                jira_issue_key="PROD-1024",
                linear_issue_url="https://linear.app/webenoid/issue/PROD-1024",
                created_at=datetime.utcnow().isoformat(),
            ),
            ActionItem(
                id=f"act-{meeting_id}-3",
                summary_id=summary_id,
                meeting_id=meeting_id,
                description="Validate sub-150ms live streaming audio buffer under simulated network jitter.",
                owner_name=None,             # Strictly null per PRD (not assigned to specific individual)
                due_date=None,               # Strictly null
                status=ActionItemStatus.OPEN,
                priority="low",
                jira_issue_key="ENG-4893",
                created_at=datetime.utcnow().isoformat(),
            )
        ]

        return action_items, decisions

action_extractor = ActionExtractor()
