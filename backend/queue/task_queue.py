import time
import datetime
from typing import Dict, Any, List, Optional, Tuple
from enum import Enum

class TaskStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DEAD_LETTER = "dead_letter"

class TaskItem:
    def __init__(self, task_id: str, task_type: str, payload: Dict[str, Any], max_retries: int = 3):
        self.task_id = task_id
        self.task_type = task_type  # 'slack_broadcast' | 'jira_provision' | 'audio_transcribe'
        self.payload = payload
        self.max_retries = max_retries
        self.retry_count = 0
        self.status = TaskStatus.QUEUED
        self.last_error = None
        self.created_at = datetime.datetime.utcnow().isoformat()
        self.updated_at = self.created_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "task_type": self.task_type,
            "status": self.status.value,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "last_error": self.last_error,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "payload_preview": {
                "meeting_title": self.payload.get("meeting_title", "N/A"),
                "channel": self.payload.get("slack_channel", self.payload.get("channel", "N/A"))
            }
        }

class DurableTaskQueue:
    """
    Durable Async Job Queue with:
    - Exponential Backoff Retries
    - Dead-Letter Queue (DLQ) state preservation
    - Outage protection for Slack, Jira, and external webhooks
    """

    def __init__(self):
        self._tasks: Dict[str, TaskItem] = {}
        self.seed_sample_tasks()

    def seed_sample_tasks(self):
        t1 = TaskItem("task-q-001", "slack_broadcast", {"meeting_title": "Project Alpha Sync", "channel": "#project-alpha-sync"})
        t1.status = TaskStatus.COMPLETED
        self._tasks[t1.task_id] = t1

        t2 = TaskItem("task-q-002", "jira_provision", {"meeting_title": "Project Alpha Sync", "task_count": 3})
        t2.status = TaskStatus.COMPLETED
        self._tasks[t2.task_id] = t2

    def enqueue_task(self, task_type: str, payload: Dict[str, Any], max_retries: int = 3) -> TaskItem:
        task_id = f"task-q-{len(self._tasks) + 1:04d}"
        task = TaskItem(task_id, task_type, payload, max_retries)
        self._tasks[task_id] = task
        return task

    def execute_with_retry(self, task_id: str, worker_fn) -> Tuple[bool, Any]:
        task = self._tasks.get(task_id)
        if not task:
            return False, "Task not found"

        task.status = TaskStatus.PROCESSING
        task.updated_at = datetime.datetime.utcnow().isoformat()

        while task.retry_count < task.max_retries:
            try:
                res = worker_fn(task.payload)
                task.status = TaskStatus.COMPLETED
                task.updated_at = datetime.datetime.utcnow().isoformat()
                return True, res
            except Exception as e:
                task.retry_count += 1
                task.last_error = str(e)
                # Exponential backoff simulation
                time.sleep(0.05 * (2 ** task.retry_count))

        # Exhausted retries -> Route to Dead-Letter Queue (DLQ)
        task.status = TaskStatus.DEAD_LETTER
        task.updated_at = datetime.datetime.utcnow().isoformat()
        return False, f"Job moved to Dead-Letter Queue after {task.max_retries} failed attempts."

    def retry_dlq_task(self, task_id: str) -> bool:
        task = self._tasks.get(task_id)
        if task and task.status == TaskStatus.DEAD_LETTER:
            task.status = TaskStatus.QUEUED
            task.retry_count = 0
            task.last_error = None
            task.updated_at = datetime.datetime.utcnow().isoformat()
            return True
        return False

    def get_queue_metrics(self) -> Dict[str, Any]:
        tasks_list = list(self._tasks.values())
        return {
            "total_tasks": len(tasks_list),
            "completed": sum(1 for t in tasks_list if t.status == TaskStatus.COMPLETED),
            "queued": sum(1 for t in tasks_list if t.status == TaskStatus.QUEUED),
            "processing": sum(1 for t in tasks_list if t.status == TaskStatus.PROCESSING),
            "dead_letter_queue_count": sum(1 for t in tasks_list if t.status == TaskStatus.DEAD_LETTER),
            "tasks": [t.to_dict() for t in tasks_list[-15:]]
        }

durable_queue = DurableTaskQueue()
