export type MeetingStatus = 'processing' | 'ready' | 'failed' | 'live';
export type ActionItemStatus = 'open' | 'in-progress' | 'done';
export type PlatformType = 'zoom' | 'google_meet' | 'ms_teams' | 'webex' | 'upload' | 'webrtc';

export type IngressDiarizationMode = 'webrtc_single_mic' | 'webrtc_sfu_track' | 'headless_bot_mixed' | 'platform_sdk_stream';

export interface Speaker {
  id: string;
  meeting_id: string;
  subject_id?: string; // Subject index for GDPR Art. 17 / DPDP Sec. 12 Erasure
  speaker_label: string; // e.g., "Speaker A"
  display_name: string;  // e.g., "Niranjan S."
  avatar_color?: string;
  role?: string;
  detected_accent?: string;
}

export interface TranscriptSegment {
  id: string;
  meeting_id: string;
  subject_id?: string; // Indexed to data subject for cascading erasure
  speaker_label: string;
  start_ms: number;
  end_ms: number;
  text: string;
  confidence_score: number;
  language_code?: string;
  detected_accent?: string;
  noise_reduced?: boolean;
  audio_snr_db?: number;
  model_tier?: 'conformer-xl' | 'conformer-medium' | 'conformer-nano'; // Model tier annotation for audit honesty
}

export interface Decision {
  id: string;
  text: string;
  context?: string;
  timestamp_ms?: number;
  agreed_by?: string[];
  agreed_subject_ids?: string[];
  model_tier?: 'conformer-xl' | 'conformer-medium' | 'conformer-nano';
  upstream_stt_fidelity?: 'full_precision' | 'mixed_shedding' | 'degraded_shedding';
}

export interface ActionItem {
  id: string;
  summary_id?: string;
  meeting_id: string;
  assignee_subject_id?: string | null; // Subject index for GDPR erasure/anonymization
  description: string;
  owner_name: string | null;
  due_date: string | null;
  status: ActionItemStatus;
  priority?: 'low' | 'medium' | 'high';
  jira_issue_key?: string;
  linear_issue_url?: string;
  model_tier?: 'conformer-xl' | 'conformer-medium' | 'conformer-nano';
  upstream_stt_fidelity?: 'full_precision' | 'mixed_shedding' | 'degraded_shedding';
  created_at?: string;
  updated_at?: string;
}

export interface TranscriptEmbedding {
  id: string;
  meeting_id: string;
  chunk_index: number;
  chunk_text: string;
  start_ms: number;
  end_ms: number;
  speaker_label?: string;
  embedding: number[];
}

export interface TopicSegment {
  id: string;
  meeting_id: string;
  chapter_index: number;
  title: string;
  start_ms: number;
  end_ms: number;
  summary: string;
  key_points: string[];
  primary_speakers: string[];
}

export interface KeyPhrase {
  phrase: string;
  category: 'Architecture' | 'Business' | 'Action' | 'Metric' | string;
  importance_score: number;
  occurrences: number;
}

export interface TalkTimeShare {
  speaker_label: string;
  display_name: string;
  talk_time_seconds: number;
  percentage: number;
  avatar_color: string;
}

export interface EffectivenessScore {
  overall_score: number; // 0 to 100
  grade: string;         // 'A+', 'A', 'B', 'C'
  talk_balance_score: number;
  decision_clarity_score: number;
  action_momentum_score: number;
  engagement_sentiment_score: number;
  talk_time_breakdown: TalkTimeShare[];
  ai_recommendations: string[];
}

export interface AudioDiagnostics {
  noise_cancellation_applied: boolean;
  noise_db_reduction: number;
  accent_adaptive_mode: string;
  primary_languages_detected: Record<string, number>;
  code_switching_occurrences: number;
  speech_clarity_index: number;
}

export interface DistributionRecord {
  slack_channel?: string;
  slack_status: string;
  slack_message_preview?: string;
  jira_tasks_created: string[];
  linear_tasks_created: string[];
  crm_record_id?: string;
  calendar_event_id?: string;
  dispatched_at?: string;
}

export interface Summary {
  id: string;
  meeting_id: string;
  executive_summary: string;
  key_decisions: Decision[];
  topics?: string[];
  topic_segments?: TopicSegment[];
  key_phrases?: KeyPhrase[];
  effectiveness?: EffectivenessScore;
  distribution?: DistributionRecord;
  audio_diagnostics?: AudioDiagnostics;
  model_tier?: 'conformer-xl' | 'conformer-medium' | 'conformer-nano';
  upstream_stt_fidelity?: 'full_precision' | 'mixed_shedding' | 'degraded_shedding';
  ai_model_version: string;
  sentiment_score?: number;
  created_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  platform?: PlatformType;
  meeting_url?: string;
  uploaded_at: string;
  duration_seconds: number;
  status: MeetingStatus;
  recording_url: string;
  host_name: string;
  participants_count: number;
  file_name: string;
  file_size_bytes: number;
  error_message?: string;
  speakers?: Speaker[];
  summary?: Summary;
  action_items_count?: {
    total: number;
    open: number;
    in_progress: number;
    done: number;
  };
}

export interface SearchResult {
  meeting: Meeting;
  similarity_score: number;
  matched_chunk_text: string;
  matched_segment?: {
    start_ms: number;
    end_ms: number;
    speaker_label: string;
  };
}

export interface MeetingStats {
  total_meetings: number;
  total_minutes_processed: number;
  total_action_items: number;
  total_decisions_logged: number;
  open_action_items: number;
  completed_action_items: number;
  avg_processing_time_seconds: number;
  slack_dispatches_count?: number;
  jira_tasks_provisioned?: number;
}

export interface LiveBotJoinRequest {
  platform: PlatformType;
  meeting_url: string;
  meeting_title?: string;
  bot_name?: string;
  enable_noise_cancellation?: boolean;
  enable_accent_adaptation?: boolean;
  auto_post_slack?: boolean;
  slack_channel?: string;
  auto_create_jira_tasks?: boolean;
  project_key?: string;
}

export interface IntegrationsConfig {
  slack_webhook_url?: string;
  slack_bot_token?: string;
  default_slack_channel: string;
  zoom_client_id?: string;
  google_meet_service_account?: string;
  ms_teams_tenant_id?: string;
  webex_access_token?: string;
  jira_domain?: string;
  jira_project_key: string;
  linear_team_id?: string;
  salesforce_domain?: string;
  hubspot_api_key?: string;
  google_calendar_token?: string;
  outlook_calendar_token?: string;
}

export interface MeetingEvalMetric {
  sample_id: string;
  title: string;
  accent: string;
  noise_level: string;
  is_adversarial?: boolean;
  adversarial_type?: string;
  wer_percent: number;
  action_precision: number;
  action_recall: number;
  decision_accuracy: number;
  status: string;
}

export interface AccentStatMetric {
  sample_size_n: number;
  mean_wer_percent: number;
  confidence_interval_95: number;
  formatted: string;
}

export interface FailureTaxonomyItem {
  category: string;
  frequency_percent: number;
  description: string;
  mitigation: string;
}

export interface FailingCaseDissection {
  sample_id: string;
  title: string;
  accent: string;
  audio_snr_db: number;
  reference_transcript: string;
  ground_truth_actions: any[];
  model_hypothesis_actions: any[];
  ground_truth_decisions: string[];
  model_hypothesis_decisions: string[];
  root_cause_analysis: string;
  remediation_applied: string;
}

export interface TwoFailureLedgerItem {
  sample_id: string;
  title: string;
  accent: string;
  noise_level: string;
  audio_snr_db: number;
  failure_type: string;
  reference_transcript: string;
  ground_truth_actions: any[];
  model_hypothesis_actions: any[];
  root_cause: string;
  remediation: string;
}

export interface PROperatingCurvePoint {
  threshold: number;
  precision: number;
  recall: number;
  f1_score: number;
  operating_notes: string;
}

export interface EvalBenchmarkScorecard {
  evaluation_timestamp: string;
  dataset_split_summary: {
    total_corpus_meetings: number;
    dev_tuning_meetings_n: number;
    held_out_test_meetings_n: number;
    split_ratio: string;
  };
  threshold_calibration_summary: {
    dev_selected_optimal_threshold: number;
    dev_tuning_f1_score: number;
    held_out_evaluation_f1_score: number;
    calibration_delta_note?: string;
    calibration_stability_delta?: string;
  };
  total_golden_meetings_evaluated: number;
  passed_meetings_count: number;
  failed_meetings_count: number;
  stratified_accent_buckets_count: number;
  samples_per_bucket_n?: number;
  overall_wer_metrics: {
    mean_wer_percent: number;
    confidence_interval_95: number;
    formatted: string;
  };
  diarization_error_rate_der: number;
  action_items_metrics: {
    total_ground_truth_actions: number;
    total_detected_actions: number;
    total_correct_actions: number;
    precision: number;
    recall: number;
    f1_score: number;
    null_safety_strictness: string;
  };
  decision_extraction_metrics: {
    total_ground_truth_decisions: number;
    total_detected_decisions: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  pre_vs_post_remediation_comparison: {
    pre_remediation_baseline: {
      precision: number;
      recall: number;
      f1_score: number;
      false_positives_count: number;
    };
    post_remediation_calibrated: {
      precision: number;
      recall: number;
      f1_score: number;
      false_positives_count: number;
    };
    f1_improvement_delta: string;
  };
  precision_recall_operating_curve: PROperatingCurvePoint[];
  calibrated_operating_point: {
    threshold_theta: number;
    precision: number;
    recall: number;
    f1_score: number;
    rationale: string;
  };
  noise_suppression_metrics: {
    average_snr_improvement_db: number;
    clarity_retention_index: number;
  };
  wer_by_accent_breakdown: Record<string, AccentStatMetric>;
  failure_taxonomy: FailureTaxonomyItem[];
  two_failure_ledger: TwoFailureLedgerItem[];
  failing_case_dissection?: FailingCaseDissection | null;
  individual_meeting_results: MeetingEvalMetric[];
  production_readiness_verdict: string;
}

export interface SubProcessorInfo {
  name: string;
  role: string;
  data_residency: string;
  certifications: string[];
  dpa_status: string;
}

export interface CompliancePolicy {
  ttl_policy: string;
  auto_purge_raw_audio: boolean;
  recording_consent_required: boolean;
  data_residency_region: string;
  signed_dpa_reference: string;
  consent_disclaimer_text: string;
  supported_regulations: string[];
  data_retention_days: number;
  encryption_status: string;
  sub_processors: SubProcessorInfo[];
  audit_ledger_type: string;
}

export interface ComplianceAuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  regulation: string;
  details: string;
  prev_hash?: string;
  block_hash?: string;
  is_tamper_verified?: boolean;
}

export interface SecurityStatus {
  kms_encryption_active: boolean;
  algorithm: string;
  keys_managed: number;
  stored_credentials_encrypted: string[];
  vault_fingerprint: string;
  in_transit_tls_version: string;
}

export interface DurableTaskItem {
  task_id: string;
  task_type: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'dead_letter';
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  payload_preview: {
    meeting_title: string;
    channel: string;
  };
}

export interface QueueMetrics {
  total_tasks: number;
  completed: number;
  queued: number;
  processing: number;
  dead_letter_queue_count: number;
  tasks: DurableTaskItem[];
}

