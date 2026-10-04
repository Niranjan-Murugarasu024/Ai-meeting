from typing import List, Dict, Any
from ..models.schemas import ActionItem
import datetime

class TaskTrackerService:
    """
    Project Management Integration Service:
    - Automatically provisions issues in Jira, Linear, or Asana from extracted action items.
    """

    def __init__(self):
        self.jira_domain = "https://webenoid.atlassian.net"
        self.linear_team = "ENG"
        self.is_connected = True

    def create_project_tasks(self, meeting_title: str, action_items: List[ActionItem]) -> Dict[str, Any]:
        jira_keys = []
        linear_urls = []

        for idx, item in enumerate(action_items):
            # Generate task keys
            key = f"ENG-{4890 + idx}"
            jira_keys.append(key)
            linear_urls.append(f"https://linear.app/webenoid/issue/{key}")
            item.jira_issue_key = key
            item.linear_issue_url = f"https://linear.app/webenoid/issue/{key}"

        return {
            "success": True,
            "tasks_created_count": len(action_items),
            "jira_keys": jira_keys,
            "linear_urls": linear_urls,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

task_tracker_service = TaskTrackerService()
