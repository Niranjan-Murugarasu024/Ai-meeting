import { Meeting, TranscriptSegment, Speaker, Summary, ActionItem, TranscriptEmbedding } from '../../types/index.ts';
import { computeEmbedding } from '../pipeline/vectorSearch.ts';
import { chunkTranscript } from '../pipeline/chunker.ts';

export interface SeedDataset {
  meetings: Meeting[];
  transcript_segments: Record<string, TranscriptSegment[]>;
  speakers: Record<string, Speaker[]>;
  summaries: Record<string, Summary>;
  action_items: Record<string, ActionItem[]>;
  transcript_embeddings: Record<string, TranscriptEmbedding[]>;
}

export function generateSeedData(): SeedDataset {
  // 1. Meeting 1: AI Roadmap & LLM Architecture
  const m1Id = 'meet-ai-roadmap-01';
  const m1Speakers: Speaker[] = [
    { id: 'spk-1', meeting_id: m1Id, speaker_label: 'Speaker A', display_name: 'Niranjan S.', avatar_color: '#6366f1', role: 'Head of Engineering' },
    { id: 'spk-2', meeting_id: m1Id, speaker_label: 'Speaker B', display_name: 'Priya Patel', avatar_color: '#ec4899', role: 'Staff AI Engineer' },
    { id: 'spk-3', meeting_id: m1Id, speaker_label: 'Speaker C', display_name: 'Marcus Vance', avatar_color: '#10b981', role: 'Product Lead' },
  ];

  const m1Segments: TranscriptSegment[] = [
    {
      id: 'seg-1-1',
      meeting_id: m1Id,
      speaker_label: 'Speaker A',
      start_ms: 0,
      end_ms: 14500,
      text: "Good morning everyone. Thanks for jumping on. Today we need to finalize our dual LLM strategy for the Webenoid platform and lock down the transcription pipeline architecture before sprint planning on Friday.",
      confidence_score: 0.98,
    },
    {
      id: 'seg-1-2',
      meeting_id: m1Id,
      speaker_label: 'Speaker C',
      start_ms: 15200,
      end_ms: 28400,
      text: "Right. From the product perspective, latency is the number one concern for users. When customers upload a 45-minute recording, they expect the transcript and executive summary within three to four minutes maximum.",
      confidence_score: 0.96,
    },
    {
      id: 'seg-1-3',
      meeting_id: m1Id,
      speaker_label: 'Speaker B',
      start_ms: 29000,
      end_ms: 48500,
      text: "We benchmarked Deepgram Nova-2 against AssemblyAI Conformer-2. Deepgram achieved a word error rate of under 7.8% on noisy conference audio with sub-300ms stream latency, whereas AssemblyAI was great at entity diarization.",
      confidence_score: 0.94,
    },
    {
      id: 'seg-1-4',
      meeting_id: m1Id,
      speaker_label: 'Speaker A',
      start_ms: 49200,
      end_ms: 66000,
      text: "Let's make the decision then: we will adopt Deepgram as our primary STT provider with AssemblyAI as the automated fallback if error rates spike. Priya, can you set up the dual-provider SDK adapter by next Wednesday?",
      confidence_score: 0.97,
    },
    {
      id: 'seg-1-5',
      meeting_id: m1Id,
      speaker_label: 'Speaker B',
      start_ms: 66800,
      end_ms: 78200,
      text: "Yes, I will have the adapter and circuit-breaker wrapper ready by October 8th with full unit test coverage.",
      confidence_score: 0.95,
    },
    {
      id: 'seg-1-6',
      meeting_id: m1Id,
      speaker_label: 'Speaker C',
      start_ms: 79000,
      end_ms: 96000,
      text: "What about the structured extraction for action items? We noticed that standard prompt engineering occasionally missed due dates or hallucinated assignees when speakers were ambiguous.",
      confidence_score: 0.91,
    },
    {
      id: 'seg-1-7',
      meeting_id: m1Id,
      speaker_label: 'Speaker A',
      start_ms: 96800,
      end_ms: 118400,
      text: "We are strictly enforcing JSON schema validation with Pydantic and TypeScript types. If a speaker or due date isn't explicitly mentioned in the audio, the field must remain null rather than guessed. Marcus, please document these strict schema constraints in the team wiki by Monday.",
      confidence_score: 0.99,
    },
    {
      id: 'seg-1-8',
      meeting_id: m1Id,
      speaker_label: 'Speaker B',
      start_ms: 119200,
      end_ms: 135000,
      text: "For long meetings exceeding sixty minutes, I designed a chunking pipeline with fifty-word sliding windows to ensure no context boundary is lost during summary synthesis.",
      confidence_score: 0.76, // Flagged low confidence segment
    },
    {
      id: 'seg-1-9',
      meeting_id: m1Id,
      speaker_label: 'Speaker C',
      start_ms: 135800,
      end_ms: 148000,
      text: "Sounds great. Let's reconvene on Friday to review the staging dashboard and run end-to-end audio tests.",
      confidence_score: 0.96,
    }
  ];

  const m1Summary: Summary = {
    id: 'sum-1',
    meeting_id: m1Id,
    executive_summary: "The engineering and product team finalized the core architectural decisions for the AI Meeting platform's speech-to-text and structured intelligence pipeline. Deepgram Nova-2 was selected as the primary STT provider due to superior latency and WER benchmarks, with AssemblyAI configured as the automatic circuit-breaker fallback. The team mandated strict JSON schema validation for action item extraction to prevent hallucinated owners or dates, and approved a sliding-window chunking algorithm to seamlessly handle 1hr+ meeting recordings.",
    key_decisions: [
      {
        id: 'dec-1-1',
        text: 'Adopt Deepgram Nova-2 as primary STT engine with AssemblyAI as automatic fallback provider.',
        context: 'Benchmarked sub-300ms stream latency and <7.8% word error rate on noisy test audio.',
        timestamp_ms: 49200,
        agreed_by: ['Niranjan S.', 'Priya Patel', 'Marcus Vance']
      },
      {
        id: 'dec-1-2',
        text: 'Enforce strict schema validation rules leaving unstated action item fields null instead of guessing.',
        context: 'Prevents LLM hallucinations on ambiguous speaker attributions or unspecified deadlines.',
        timestamp_ms: 96800,
        agreed_by: ['Niranjan S.', 'Marcus Vance']
      },
      {
        id: 'dec-1-3',
        text: 'Implement 50-word sliding window chunking for meeting recordings exceeding 60 minutes.',
        context: 'Maintains cross-chunk conversational coherence during long-form map-reduce summarization.',
        timestamp_ms: 119200,
        agreed_by: ['Priya Patel', 'Niranjan S.']
      }
    ],
    ai_model_version: 'gpt-4o-structured-v2',
    created_at: '2026-09-28T10:15:00Z',
    sentiment_score: 0.82,
    topics: ['STT Benchmarks', 'Dual Provider Fallback', 'Schema Validation', 'Long-Meeting Chunking']
  };

  const m1ActionItems: ActionItem[] = [
    {
      id: 'act-1-1',
      summary_id: 'sum-1',
      meeting_id: m1Id,
      description: 'Implement dual-provider STT adapter with Deepgram and AssemblyAI circuit-breaker.',
      owner_name: 'Priya Patel',
      due_date: '2026-10-08',
      status: 'in-progress',
      priority: 'high',
      created_at: '2026-09-28T10:15:00Z',
    },
    {
      id: 'act-1-2',
      summary_id: 'sum-1',
      meeting_id: m1Id,
      description: 'Document strict null-safety JSON extraction constraints in team wiki.',
      owner_name: 'Marcus Vance',
      due_date: '2026-10-06',
      status: 'open',
      priority: 'medium',
      created_at: '2026-09-28T10:15:00Z',
    },
    {
      id: 'act-1-3',
      summary_id: 'sum-1',
      meeting_id: m1Id,
      description: 'Schedule staging dashboard review and end-to-end audio ingestion tests for Friday.',
      owner_name: 'Niranjan S.',
      due_date: '2026-10-03',
      status: 'done',
      priority: 'medium',
      created_at: '2026-09-28T10:15:00Z',
    }
  ];

  // 2. Meeting 2: PostgreSQL pgvector & Database Migration
  const m2Id = 'meet-pgvector-migration-02';
  const m2Speakers: Speaker[] = [
    { id: 'spk-4', meeting_id: m2Id, speaker_label: 'Speaker A', display_name: 'Elena Rostova', avatar_color: '#3b82f6', role: 'Principal Architect' },
    { id: 'spk-5', meeting_id: m2Id, speaker_label: 'Speaker B', display_name: 'David Chen', avatar_color: '#f59e0b', role: 'Database Engineer' },
    { id: 'spk-6', meeting_id: m2Id, speaker_label: 'Speaker C', display_name: 'Sarah Miller', avatar_color: '#8b5cf6', role: 'Backend Lead' },
  ];

  const m2Segments: TranscriptSegment[] = [
    {
      id: 'seg-2-1',
      meeting_id: m2Id,
      speaker_label: 'Speaker A',
      start_ms: 0,
      end_ms: 18000,
      text: "Welcome team. Today we are addressing our vector search layer for historical meetings. We need to decide between running standalone Pinecone/Qdrant vs embedding pgvector inside our core PostgreSQL cluster.",
      confidence_score: 0.98,
    },
    {
      id: 'seg-2-2',
      meeting_id: m2Id,
      speaker_label: 'Speaker B',
      start_ms: 18800,
      end_ms: 38000,
      text: "I strongly recommend pgvector with HNSW indexing. It keeps our operational footprint lean, enables ACID joins between meetings, transcripts, and embeddings, and eliminates dual-write synchronization failure modes.",
      confidence_score: 0.97,
    },
    {
      id: 'seg-2-3',
      meeting_id: m2Id,
      speaker_label: 'Speaker C',
      start_ms: 38800,
      end_ms: 55000,
      text: "Agreed. For our search queries, HNSW with m=16 and ef_construction=64 gave us sub-12ms response times across 500,000 meeting transcript chunks.",
      confidence_score: 0.95,
    },
    {
      id: 'seg-2-4',
      meeting_id: m2Id,
      speaker_label: 'Speaker A',
      start_ms: 55800,
      end_ms: 72000,
      text: "Decision approved: we will use PostgreSQL 16 with the official pgvector extension. David, please create the migration scripts and schema definitions by Thursday.",
      confidence_score: 0.98,
    },
    {
      id: 'seg-2-5',
      meeting_id: m2Id,
      speaker_label: 'Speaker B',
      start_ms: 72800,
      end_ms: 85000,
      text: "Understood. I will submit the pull request with schema migrations and seed scripts by October 5th.",
      confidence_score: 0.96,
    }
  ];

  const m2Summary: Summary = {
    id: 'sum-2',
    meeting_id: m2Id,
    executive_summary: "The data architecture team evaluated vector store solutions and unanimously approved adopting PostgreSQL with the pgvector extension and HNSW indexing over external managed vector services. This consolidated architecture provides ACID transactional consistency, eliminates dual-write sync bugs, and delivers sub-12ms vector similarity queries across transcript embeddings.",
    key_decisions: [
      {
        id: 'dec-2-1',
        text: 'Consolidate semantic search embeddings into PostgreSQL using the pgvector extension.',
        context: 'Avoids multi-system sync complexity and guarantees ACID compliance with meeting metadata.',
        timestamp_ms: 55800,
        agreed_by: ['Elena Rostova', 'David Chen', 'Sarah Miller']
      },
      {
        id: 'dec-2-2',
        text: 'Standardize on HNSW index parameters with m=16 and ef_construction=64.',
        context: 'Achieved <12ms query latencies on 500k benchmark vectors with 98.4% recall.',
        timestamp_ms: 38800,
        agreed_by: ['Sarah Miller', 'David Chen']
      }
    ],
    ai_model_version: 'gpt-4o-structured-v2',
    created_at: '2026-09-27T14:30:00Z',
    sentiment_score: 0.91,
    topics: ['PostgreSQL', 'pgvector', 'HNSW Indexing', 'ACID Transactions']
  };

  const m2ActionItems: ActionItem[] = [
    {
      id: 'act-2-1',
      summary_id: 'sum-2',
      meeting_id: m2Id,
      description: 'Author PostgreSQL pgvector schema migration scripts and HNSW index definitions.',
      owner_name: 'David Chen',
      due_date: '2026-10-05',
      status: 'done',
      priority: 'high',
      created_at: '2026-09-27T14:30:00Z',
    },
    {
      id: 'act-2-2',
      summary_id: 'sum-2',
      meeting_id: m2Id,
      description: 'Benchmark search recall metrics against staging meeting database.',
      owner_name: 'Sarah Miller',
      due_date: '2026-10-09',
      status: 'open',
      priority: 'medium',
      created_at: '2026-09-27T14:30:00Z',
    }
  ];

  // 3. Meeting 3: Enterprise Security & PII Redaction
  const m3Id = 'meet-security-pii-03';
  const m3Speakers: Speaker[] = [
    { id: 'spk-7', meeting_id: m3Id, speaker_label: 'Speaker A', display_name: 'Alex Rivera', avatar_color: '#ef4444', role: 'Security Officer' },
    { id: 'spk-8', meeting_id: m3Id, speaker_label: 'Speaker B', display_name: 'Niranjan S.', avatar_color: '#6366f1', role: 'Head of Engineering' },
  ];

  const m3Segments: TranscriptSegment[] = [
    {
      id: 'seg-3-1',
      meeting_id: m3Id,
      speaker_label: 'Speaker A',
      start_ms: 0,
      end_ms: 22000,
      text: "We must ensure that when meetings are deleted by an authorized user, the deletion is cascading and complete. That means removing the audio file from storage, wiping the transcript rows, and purging all vector embeddings.",
      confidence_score: 0.99,
    },
    {
      id: 'seg-3-2',
      meeting_id: m3Id,
      speaker_label: 'Speaker B',
      start_ms: 22800,
      end_ms: 41000,
      text: "Yes, our delete endpoint implements an atomic cascade across all related collections and object storage buckets. Additionally, we are adding regex and NER-based PII masking for credit cards and passwords before LLM prompting.",
      confidence_score: 0.96,
    },
    {
      id: 'seg-3-3',
      meeting_id: m3Id,
      speaker_label: 'Speaker A',
      start_ms: 41800,
      end_ms: 56000,
      text: "Excellent. Let's make sure the audit log verifies zero orphaned data artifacts on meeting deletion.",
      confidence_score: 0.94,
    }
  ];

  const m3Summary: Summary = {
    id: 'sum-3',
    meeting_id: m3Id,
    executive_summary: "Security and engineering established a strict data hygiene protocol requiring atomic cascading deletions across object storage, relational records, and vector embeddings when a meeting is removed. Pre-LLM PII scrubbing will automatically redact sensitive identifiers prior to summary generation.",
    key_decisions: [
      {
        id: 'dec-3-1',
        text: 'Enforce atomic cascading deletion of audio binaries, transcript rows, and vector embeddings.',
        context: 'Guarantees complete data removal without orphaned files or residual index fragments.',
        timestamp_ms: 22800,
        agreed_by: ['Alex Rivera', 'Niranjan S.']
      }
    ],
    ai_model_version: 'gpt-4o-structured-v2',
    created_at: '2026-09-25T16:00:00Z',
    sentiment_score: 0.75,
    topics: ['Data Privacy', 'Cascading Deletion', 'PII Masking']
  };

  const m3ActionItems: ActionItem[] = [
    {
      id: 'act-3-1',
      summary_id: 'sum-3',
      meeting_id: m3Id,
      description: 'Verify cascading delete tests against local S3 mock and vector database.',
      owner_name: 'Niranjan S.',
      due_date: '2026-10-04',
      status: 'done',
      priority: 'high',
      created_at: '2026-09-25T16:00:00Z',
    }
  ];

  // 4. Meeting 4: Customer Churn & Onboarding Discovery
  const m4Id = 'meet-churn-onboarding-04';
  const m4Speakers: Speaker[] = [
    { id: 'spk-9', meeting_id: m4Id, speaker_label: 'Speaker A', display_name: 'Sarah Miller', avatar_color: '#8b5cf6', role: 'Customer Success Lead' },
    { id: 'spk-10', meeting_id: m4Id, speaker_label: 'Speaker B', display_name: 'Liam Gallagher', avatar_color: '#06b6d4', role: 'Growth Lead' },
  ];

  const m4Segments: TranscriptSegment[] = [
    {
      id: 'seg-4-1',
      meeting_id: m4Id,
      speaker_label: 'Speaker A',
      start_ms: 0,
      end_ms: 19000,
      text: "Our Q2 customer interview analysis showed that users love the automatic summaries, but 35% requested an interactive audio player directly linked to the transcript lines so they can verify specific quotes quickly.",
      confidence_score: 0.97,
    },
    {
      id: 'seg-4-2',
      meeting_id: m4Id,
      speaker_label: 'Speaker B',
      start_ms: 19800,
      end_ms: 36000,
      text: "That aligns with our prototype design. Clicking any transcript segment should jump the audio scrubber straight to that timestamp and highlight the active talking block.",
      confidence_score: 0.95,
    }
  ];

  const m4Summary: Summary = {
    id: 'sum-4',
    meeting_id: m4Id,
    executive_summary: "Review of customer onboarding metrics highlighted high demand for synced transcript audio playback. The team confirmed adding interactive timestamp jumping and synchronized talking block highlights to improve verification speed.",
    key_decisions: [
      {
        id: 'dec-4-1',
        text: 'Implement interactive transcript timestamp scrubber syncing audio playback with talking segments.',
        context: 'Addresses customer feedback from 35% of power users seeking quick quote verification.',
        timestamp_ms: 19800,
        agreed_by: ['Sarah Miller', 'Liam Gallagher']
      }
    ],
    ai_model_version: 'gpt-4o-structured-v2',
    created_at: '2026-09-24T11:00:00Z',
    sentiment_score: 0.88,
    topics: ['Customer Feedback', 'Audio Playback Sync', 'Quote Verification']
  };

  const m4ActionItems: ActionItem[] = [
    {
      id: 'act-4-1',
      summary_id: 'sum-4',
      meeting_id: m4Id,
      description: 'Integrate synchronized audio scrubbing inside the transcript viewer component.',
      owner_name: 'Liam Gallagher',
      due_date: '2026-10-10',
      status: 'open',
      priority: 'high',
      created_at: '2026-09-24T11:00:00Z',
    }
  ];

  // 5. Meeting 5: Failed / Retryable demo meeting
  const m5Id = 'meet-failed-demo-05';
  const m5Meeting: Meeting = {
    id: m5Id,
    title: 'Client Discovery Call - Audio Stream Interrupted',
    uploaded_at: '2026-09-29T18:40:00Z',
    duration_seconds: 720,
    status: 'failed',
    recording_url: '/uploads/client_discovery_corrupted.mp3',
    host_name: 'Elena Rostova',
    participants_count: 2,
    file_name: 'client_discovery_corrupted.mp3',
    file_size_bytes: 4820000,
    error_message: 'Audio stream packet loss exceeded threshold at 04:12. STT provider connection timed out. Click Retry to re-process with fallback provider.',
    speakers: [],
    action_items_count: { total: 0, open: 0, in_progress: 0, done: 0 }
  };

  // Build meetings array
  const meetings: Meeting[] = [
    {
      id: m1Id,
      title: 'Q3 AI Roadmap & LLM Provider Architecture',
      uploaded_at: '2026-09-28T10:15:00Z',
      duration_seconds: 148,
      status: 'ready',
      recording_url: '/uploads/ai_roadmap_sync.mp3',
      host_name: 'Niranjan S.',
      participants_count: 3,
      file_name: 'ai_roadmap_sync.mp3',
      file_size_bytes: 8450000,
      speakers: m1Speakers,
      summary: m1Summary,
      action_items_count: { total: 3, open: 1, in_progress: 1, done: 1 }
    },
    {
      id: m2Id,
      title: 'PostgreSQL pgvector Migration & Database Optimization',
      uploaded_at: '2026-09-27T14:30:00Z',
      duration_seconds: 85,
      status: 'ready',
      recording_url: '/uploads/pgvector_migration.mp3',
      host_name: 'Elena Rostova',
      participants_count: 3,
      file_name: 'pgvector_migration.mp3',
      file_size_bytes: 5210000,
      speakers: m2Speakers,
      summary: m2Summary,
      action_items_count: { total: 2, open: 1, in_progress: 0, done: 1 }
    },
    {
      id: m3Id,
      title: 'Enterprise Security Review & PII Redaction Protocols',
      uploaded_at: '2026-09-25T16:00:00Z',
      duration_seconds: 56,
      status: 'ready',
      recording_url: '/uploads/security_pii_sync.mp3',
      host_name: 'Alex Rivera',
      participants_count: 2,
      file_name: 'security_pii_sync.mp3',
      file_size_bytes: 3120000,
      speakers: m3Speakers,
      summary: m3Summary,
      action_items_count: { total: 1, open: 0, in_progress: 0, done: 1 }
    },
    {
      id: m4Id,
      title: 'Customer Churn Feedback & Onboarding Flow Discovery',
      uploaded_at: '2026-09-24T11:00:00Z',
      duration_seconds: 36,
      status: 'ready',
      recording_url: '/uploads/customer_onboarding.mp3',
      host_name: 'Sarah Miller',
      participants_count: 2,
      file_name: 'customer_onboarding.mp3',
      file_size_bytes: 2190000,
      speakers: m4Speakers,
      summary: m4Summary,
      action_items_count: { total: 1, open: 1, in_progress: 0, done: 0 }
    },
    m5Meeting
  ];

  const transcript_segments: Record<string, TranscriptSegment[]> = {
    [m1Id]: m1Segments,
    [m2Id]: m2Segments,
    [m3Id]: m3Segments,
    [m4Id]: m4Segments,
    [m5Id]: [],
  };

  const speakers: Record<string, Speaker[]> = {
    [m1Id]: m1Speakers,
    [m2Id]: m2Speakers,
    [m3Id]: m3Speakers,
    [m4Id]: m4Speakers,
    [m5Id]: [],
  };

  const summaries: Record<string, Summary> = {
    [m1Id]: m1Summary,
    [m2Id]: m2Summary,
    [m3Id]: m3Summary,
    [m4Id]: m4Summary,
  };

  const action_items: Record<string, ActionItem[]> = {
    [m1Id]: m1ActionItems,
    [m2Id]: m2ActionItems,
    [m3Id]: m3ActionItems,
    [m4Id]: m4ActionItems,
    [m5Id]: [],
  };

  // Generate vector embeddings for all transcript chunks
  const transcript_embeddings: Record<string, TranscriptEmbedding[]> = {};

  for (const [mId, segments] of Object.entries(transcript_segments)) {
    if (segments.length === 0) continue;
    const chunks = chunkTranscript(segments, { maxWordsPerChunk: 100, wordOverlap: 20 });
    const embeddingsList: TranscriptEmbedding[] = [];

    chunks.forEach((chunk, index) => {
      const vec = computeEmbedding(chunk.combined_text, new Map());
      embeddingsList.push({
        id: `emb-${mId}-${index}`,
        meeting_id: mId,
        chunk_index: index,
        chunk_text: chunk.combined_text,
        start_ms: chunk.start_ms,
        end_ms: chunk.end_ms,
        speaker_label: chunk.speaker_labels[0] || 'Speaker',
        embedding: vec,
      });
    });

    transcript_embeddings[mId] = embeddingsList;
  }

  return {
    meetings,
    transcript_segments,
    speakers,
    summaries,
    action_items,
    transcript_embeddings,
  };
}
