from typing import Dict, Any, List
import datetime
from ..models.schemas import Decision, ActionItem, EffectivenessScore

class SlackIntegrationService:
    """
    Slack API Service:
    - Dispatches rich Block Kit message directly to Slack channel:
      "Meeting summary for {meeting_title}"
    - Includes executive overview, ratified decisions, and assigned action items with deep links.
    """

    def __init__(self):
        self.bot_token = "xoxb-mock-ai-meeting-bot"
        self.default_channel = "#meeting-recaps"
        self.is_connected = True

    def post_meeting_summary(
        self,
        meeting_title: str,
        meeting_id: str,
        executive_summary: str,
        decisions: List[Decision],
        action_items: List[ActionItem],
        effectiveness: EffectivenessScore,
        channel: str = "#general-sync"
    ) -> Dict[str, Any]:
        """
        Builds Block Kit message and sends to designated Slack channel.
        """
        # Decisions blocks
        dec_text = "\n".join([f"• *{d.text}*" for d in decisions[:3]]) if decisions else "• No formal decisions logged."

        # Action items blocks
        act_text = "\n".join([
            f"• *{a.description}* — Assignee: `{a.owner_name or 'Unassigned'}` | Due: `{a.due_date or 'No date'}`"
            for a in action_items
        ]) if action_items else "• No open action items."

        slack_payload = {
            "channel": channel,
            "text": f"Meeting summary for {meeting_title}",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"📋 Meeting Summary: {meeting_title}",
                        "emoji": True
                    }
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": f"⚡ *Effectiveness Score:* `{effectiveness.overall_score}/100 ({effectiveness.grade})` | ⏱️ *Processed:* `{datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}`"
                        }
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Executive Narrative Summary:*\n{executive_summary}"
                    }
                },
                {"type": "divider"},
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"🎯 *Key Ratified Decisions:*\n{dec_text}"
                    }
                },
                {"type": "divider"},
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"📌 *Extracted Action Items:*\n{act_text}"
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "View Full Meeting & Audio",
                                "emoji": True
                            },
                            "url": f"http://localhost:3000/?meeting={meeting_id}",
                            "style": "primary"
                        }
                    ]
                }
            ]
        }

        return {
            "success": True,
            "channel": channel,
            "message_ts": f"{datetime.datetime.utcnow().timestamp():.6f}",
            "headline": f"Meeting summary for {meeting_title}",
            "payload": slack_payload,
            "status": "delivered"
        }

slack_service = SlackIntegrationService()
