import { Meeting, TranscriptSegment, Speaker, Summary, ActionItem, TranscriptEmbedding } from '../../types/index.ts';

export interface DatabaseState {
  meetings: Map<string, Meeting>;
  transcript_segments: Map<string, TranscriptSegment[]>;
  speakers: Map<string, Speaker[]>;
  summaries: Map<string, Summary>;
  action_items: Map<string, ActionItem[]>;
  transcript_embeddings: Map<string, TranscriptEmbedding[]>;
}

export const createInitialDatabaseState = (): DatabaseState => ({
  meetings: new Map(),
  transcript_segments: new Map(),
  speakers: new Map(),
  summaries: new Map(),
  action_items: new Map(),
  transcript_embeddings: new Map(),
});
