from typing import Dict, Any, List
from ..models.schemas import (
    Summary, Decision, ActionItem, EffectivenessScore, DistributionRecord
)
from ..integrations.slack_service import slack_service
from ..integrations.task_tracker_service import task_tracker_service
import datetime

class DistributionManager:
    """
    Automated Distribution Manager:
    Orchestrates post-meeting delivery:
    1. Posts structured recap to Slack channel: "Meeting summary for {meeting_title}"
    2. Provisions tasks in Jira / Linear from extracted action items
    """

    def execute_distribution(
        self,
        meeting_id: str,
        meeting_title: str,
        executive_summary: str,
        decisions: List[Decision],
        action_items: List[ActionItem],
        effectiveness: EffectivenessScore,
        slack_channel: str = "#general-sync"
    ) -> DistributionRecord:
        # 1. Dispatch Slack broadcast
        slack_res = slack_service.post_meeting_summary(
            meeting_title=meeting_title,
            meeting_id=meeting_id,
            executive_summary=executive_summary,
            decisions=decisions,
            action_items=action_items,
            effectiveness=effectiveness,
            channel=slack_channel
        )

        # 2. Provision Jira & Linear tasks
        task_res = task_tracker_service.create_project_tasks(
            meeting_title=meeting_title,
            action_items=action_items
        )

        return DistributionRecord(
            slack_channel=slack_channel,
            slack_status="sent",
            slack_message_preview=slack_res["headline"],
            jira_tasks_created=task_res["jira_keys"],
            linear_tasks_created=task_res["linear_urls"],
            dispatched_at=datetime.datetime.utcnow().isoformat()
        )

distribution_manager = DistributionManager()
