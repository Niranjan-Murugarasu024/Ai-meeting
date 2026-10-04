import {
  Meeting,
  TranscriptSegment,
  Speaker,
  Summary,
  ActionItem,
  SearchResult,
  MeetingStats,
  ActionItemStatus,
  LiveBotJoinRequest,
  IntegrationsConfig,
} from '../../types/index.ts';

const BASE_URL = '/api';

export async function fetchStats(): Promise<MeetingStats> {
  const res = await fetch(`${BASE_URL}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchMeetings(status?: string, search?: string): Promise<{ total: number; meetings: Meeting[] }> {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  if (search) params.append('search', search);

  const res = await fetch(`${BASE_URL}/meetings?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch meetings');
  return res.json();
}

export async function fetchMeetingById(id: string): Promise<Meeting> {
  const res = await fetch(`${BASE_URL}/meetings/${id}`);
  if (!res.ok) throw new Error('Failed to fetch meeting');
  return res.json();
}

export async function fetchTranscript(meetingId: string): Promise<{
  meeting_id: string;
  speakers: Speaker[];
  total_segments: number;
  segments: TranscriptSegment[];
}> {
  const res = await fetch(`${BASE_URL}/meetings/${meetingId}/transcript`);
  if (!res.ok) throw new Error('Failed to fetch transcript');
  return res.json();
}

export async function fetchSummary(meetingId: string): Promise<Summary> {
  const res = await fetch(`${BASE_URL}/meetings/${meetingId}/summary`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}

export async function fetchActionItems(meetingId: string): Promise<{
  meeting_id: string;
  total: number;
  action_items: ActionItem[];
}> {
  const res = await fetch(`${BASE_URL}/meetings/${meetingId}/actions`);
  if (!res.ok) throw new Error('Failed to fetch action items');
  return res.json();
}

export async function updateActionItemStatus(actionId: string, status: ActionItemStatus): Promise<ActionItem> {
  const res = await fetch(`${BASE_URL}/actions/${actionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update action item');
  const data = await res.json();
  return data.action_item;
}

export async function searchMeetings(query: string, limit: number = 8): Promise<{
  query: string;
  total_matches: number;
  results: SearchResult[];
}> {
  const res = await fetch(`${BASE_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function uploadMeeting(formData: FormData): Promise<{ success: boolean; meeting: Meeting }> {
  const res = await fetch(`${BASE_URL}/meetings/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export async function deleteMeeting(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/meetings/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete meeting');
}

export async function retryMeeting(id: string): Promise<{ success: boolean; meeting: Meeting }> {
  const res = await fetch(`${BASE_URL}/meetings/${id}/retry`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to retry meeting');
  return res.json();
}

// --- Live Bot & Integration Endpoints ---

export async function joinLiveBot(req: LiveBotJoinRequest): Promise<any> {
  const res = await fetch(`${BASE_URL}/integrations/join-live-bot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('Failed to join live meeting bot');
  return res.json();
}

export async function endLiveMeeting(payload: {
  meeting_title: string;
  platform: string;
  meeting_url: string;
  slack_channel: string;
}): Promise<{ success: boolean; meeting: Meeting; slack_delivery: any; effectiveness_score: any }> {
  const res = await fetch(`${BASE_URL}/integrations/end-live-meeting`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to end live meeting');
  return res.json();
}

export async function fetchIntegrationsConfig(): Promise<IntegrationsConfig> {
  const res = await fetch(`${BASE_URL}/integrations/config`);
  if (!res.ok) throw new Error('Failed to fetch integrations config');
  return res.json();
}

export async function saveIntegrationsConfig(cfg: IntegrationsConfig): Promise<void> {
  const res = await fetch(`${BASE_URL}/integrations/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cfg),
  });
  if (!res.ok) throw new Error('Failed to save integrations config');
}

export async function testSlackDispatch(channel: string, title: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/integrations/test-slack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, meeting_title: title }),
  });
  if (!res.ok) throw new Error('Failed to send test Slack recap');
  return res.json();
}

// --- Golden-Set Evaluation Benchmark ---

export async function fetchEvalBenchmark(): Promise<import('../../types/index.ts').EvalBenchmarkScorecard> {
  const res = await fetch(`${BASE_URL}/eval/benchmark`);
  if (!res.ok) throw new Error('Failed to run evaluation benchmark harness');
  return res.json();
}

// --- Compliance & Retention Engine ---

export async function fetchCompliancePolicy(): Promise<import('../../types/index.ts').CompliancePolicy> {
  const res = await fetch(`${BASE_URL}/compliance/policy`);
  if (!res.ok) throw new Error('Failed to fetch compliance policy');
  return res.json();
}

export async function updateCompliancePolicy(payload: {
  ttl_policy: string;
  auto_purge_raw_audio: boolean;
  recording_consent_required: boolean;
}): Promise<import('../../types/index.ts').CompliancePolicy> {
  const res = await fetch(`${BASE_URL}/compliance/policy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update compliance policy');
  return res.json();
}

export async function fetchComplianceAuditLogs(): Promise<{ total: number; logs: import('../../types/index.ts').ComplianceAuditLog[] }> {
  const res = await fetch(`${BASE_URL}/compliance/audit-logs`);
  if (!res.ok) throw new Error('Failed to fetch compliance audit logs');
  return res.json();
}

// --- Security & KMS Vault ---

export async function fetchSecurityStatus(): Promise<import('../../types/index.ts').SecurityStatus> {
  const res = await fetch(`${BASE_URL}/security/status`);
  if (!res.ok) throw new Error('Failed to fetch security status');
  return res.json();
}

// --- Durable Task Queue & Dead-Letter Queue (DLQ) ---

export async function fetchQueueMetrics(): Promise<import('../../types/index.ts').QueueMetrics> {
  const res = await fetch(`${BASE_URL}/queue/metrics`);
  if (!res.ok) throw new Error('Failed to fetch queue metrics');
  return res.json();
}

export async function retryDlqJob(taskId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/queue/retry-dlq/${taskId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to retry DLQ job');
  return res.json();
}

// --- V1 Tier-Stratified Evaluation & Subject Erasure ---

export async function fetchAccentTierBenchmark(): Promise<any> {
  const res = await fetch('/v1/eval/accent-tiers');
  if (!res.ok) throw new Error('Failed to fetch accent tier benchmark');
  return res.json();
}

export async function fetchComplianceSubjects(): Promise<any> {
  const res = await fetch('/v1/compliance/subjects');
  if (!res.ok) throw new Error('Failed to fetch compliance subjects');
  return res.json();
}

export async function purgeComplianceSubject(subjectId: string): Promise<any> {
  const res = await fetch('/v1/compliance/purge-subject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject_id: subjectId }),
  });
  if (!res.ok) throw new Error('Failed to purge subject data');
  return res.json();
}


