import { Meeting, TranscriptSegment, Speaker, Summary, ActionItem, TranscriptEmbedding, SearchResult, MeetingStats, ActionItemStatus } from '../../types/index.ts';
import { DatabaseState, createInitialDatabaseState } from './schema.ts';
import { generateSeedData } from '../mock/demoMeetings.ts';
import { searchEmbeddings, computeEmbedding } from '../pipeline/vectorSearch.ts';
import { chunkTranscript } from '../pipeline/chunker.ts';
import { processAudioTranscription } from '../pipeline/transcription.ts';
import { extractMeetingIntelligence } from '../pipeline/extraction.ts';

class MeetingStore {
  private db: DatabaseState;

  constructor() {
    this.db = createInitialDatabaseState();
    this.seedInitialData();
  }

  private seedInitialData() {
    const seed = generateSeedData();
    seed.meetings.forEach(m => this.db.meetings.set(m.id, m));
    
    Object.entries(seed.transcript_segments).forEach(([k, v]) => {
      this.db.transcript_segments.set(k, v);
    });

    Object.entries(seed.speakers).forEach(([k, v]) => {
      this.db.speakers.set(k, v);
    });

    Object.entries(seed.summaries).forEach(([k, v]) => {
      this.db.summaries.set(k, v);
    });

    Object.entries(seed.action_items).forEach(([k, v]) => {
      this.db.action_items.set(k, v);
    });

    Object.entries(seed.transcript_embeddings).forEach(([k, v]) => {
      this.db.transcript_embeddings.set(k, v);
    });
  }

  public getAllMeetings(): Meeting[] {
    const list: Meeting[] = [];
    for (const meeting of this.db.meetings.values()) {
      // Recompute action items stats dynamically
      const actions = this.db.action_items.get(meeting.id) || [];
      const stats = {
        total: actions.length,
        open: actions.filter(a => a.status === 'open').length,
        in_progress: actions.filter(a => a.status === 'in-progress').length,
        done: actions.filter(a => a.status === 'done').length,
      };

      const summary = this.db.summaries.get(meeting.id);
      const speakers = this.db.speakers.get(meeting.id) || [];

      list.push({
        ...meeting,
        speakers,
        summary,
        action_items_count: stats,
      });
    }

    // Sort descending by uploaded_at
    return list.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  }

  public getMeetingById(id: string): Meeting | undefined {
    const meeting = this.db.meetings.get(id);
    if (!meeting) return undefined;

    const actions = this.db.action_items.get(id) || [];
    const stats = {
      total: actions.length,
      open: actions.filter(a => a.status === 'open').length,
      in_progress: actions.filter(a => a.status === 'in-progress').length,
      done: actions.filter(a => a.status === 'done').length,
    };

    const summary = this.db.summaries.get(id);
    const speakers = this.db.speakers.get(id) || [];

    return {
      ...meeting,
      speakers,
      summary,
      action_items_count: stats,
    };
  }

  public getTranscriptSegments(meetingId: string): TranscriptSegment[] {
    return this.db.transcript_segments.get(meetingId) || [];
  }

  public getSpeakers(meetingId: string): Speaker[] {
    return this.db.speakers.get(meetingId) || [];
  }

  public getSummary(meetingId: string): Summary | undefined {
    return this.db.summaries.get(meetingId);
  }

  public getActionItems(meetingId: string): ActionItem[] {
    return this.db.action_items.get(meetingId) || [];
  }

  public updateActionItemStatus(actionId: string, status: ActionItemStatus): ActionItem | null {
    for (const [meetingId, items] of this.db.action_items.entries()) {
      const itemIndex = items.findIndex(a => a.id === actionId);
      if (itemIndex !== -1) {
        const updatedItem: ActionItem = {
          ...items[itemIndex],
          status,
          updated_at: new Date().toISOString(),
        };
        items[itemIndex] = updatedItem;
        this.db.action_items.set(meetingId, items);
        return updatedItem;
      }
    }
    return null;
  }

  public searchMeetings(query: string, topK: number = 8): SearchResult[] {
    return searchEmbeddings(query, this.db.transcript_embeddings, this.db.meetings, topK);
  }

  public deleteMeeting(id: string): boolean {
    if (!this.db.meetings.has(id)) return false;

    // Complete cascading deletion across all collections
    this.db.meetings.delete(id);
    this.db.transcript_segments.delete(id);
    this.db.speakers.delete(id);
    this.db.summaries.delete(id);
    this.db.action_items.delete(id);
    this.db.transcript_embeddings.delete(id);
    return true;
  }

  public async createMeeting(
    fileName: string,
    fileSizeBytes: number,
    recordingUrl: string,
    title?: string,
    hostName: string = 'Alex Johnson'
  ): Promise<Meeting> {
    const id = `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const meetingTitle = title || fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

    const newMeeting: Meeting = {
      id,
      title: meetingTitle,
      uploaded_at: new Date().toISOString(),
      duration_seconds: 0,
      status: 'processing',
      recording_url: recordingUrl,
      host_name: hostName,
      participants_count: 3,
      file_name: fileName,
      file_size_bytes: fileSizeBytes,
      action_items_count: { total: 0, open: 0, in_progress: 0, done: 0 }
    };

    this.db.meetings.set(id, newMeeting);

    // Run async background processing pipeline
    this.processMeetingAsync(id, fileName, meetingTitle, recordingUrl);

    return newMeeting;
  }

  public async retryMeeting(id: string): Promise<Meeting | null> {
    const meeting = this.db.meetings.get(id);
    if (!meeting) return null;

    meeting.status = 'processing';
    meeting.error_message = undefined;
    this.db.meetings.set(id, meeting);

    this.processMeetingAsync(id, meeting.file_name, meeting.title, meeting.recording_url);
    return meeting;
  }

  private async processMeetingAsync(meetingId: string, fileName: string, title: string, filePath: string) {
    try {
      // Simulate realistic processing delay (2.5 seconds) for UX transition
      await new Promise(resolve => setTimeout(resolve, 2500));

      // 1. Transcription & Diarization
      const transcription = await processAudioTranscription(filePath, fileName, meetingId);
      this.db.transcript_segments.set(meetingId, transcription.segments);
      this.db.speakers.set(meetingId, transcription.speakers);

      // 2. Structured Extraction (Summary, Decisions, Actions)
      const extraction = await extractMeetingIntelligence(meetingId, title, transcription.segments);
      this.db.summaries.set(meetingId, extraction.summary);
      this.db.action_items.set(meetingId, extraction.action_items);

      // 3. Long-Meeting Chunking & Vector Embeddings
      const chunks = chunkTranscript(transcription.segments, { maxWordsPerChunk: 100, wordOverlap: 20 });
      const embeddingsList: TranscriptEmbedding[] = chunks.map((chunk, index) => ({
        id: `emb-${meetingId}-${index}`,
        meeting_id: meetingId,
        chunk_index: index,
        chunk_text: chunk.combined_text,
        start_ms: chunk.start_ms,
        end_ms: chunk.end_ms,
        speaker_label: chunk.speaker_labels[0] || 'Speaker',
        embedding: computeEmbedding(chunk.combined_text, new Map()),
      }));
      this.db.transcript_embeddings.set(meetingId, embeddingsList);

      // 4. Update Meeting to ready status
      const existing = this.db.meetings.get(meetingId);
      if (existing) {
        existing.status = 'ready';
        existing.duration_seconds = transcription.duration_seconds;
        existing.speakers = transcription.speakers;
        existing.summary = extraction.summary;
        existing.action_items_count = {
          total: extraction.action_items.length,
          open: extraction.action_items.length,
          in_progress: 0,
          done: 0,
        };
        this.db.meetings.set(meetingId, existing);
      }
    } catch (err: any) {
      const existing = this.db.meetings.get(meetingId);
      if (existing) {
        existing.status = 'failed';
        existing.error_message = err?.message || 'Speech-to-text processing failed. Please retry.';
        this.db.meetings.set(meetingId, existing);
      }
    }
  }

  public getStats(): MeetingStats {
    const all = this.getAllMeetings();
    const ready = all.filter(m => m.status === 'ready');
    const totalMinutes = Math.round(ready.reduce((sum, m) => sum + (m.duration_seconds || 0), 0) / 60);

    let totalActions = 0;
    let openActions = 0;
    let doneActions = 0;
    let totalDecisions = 0;

    for (const m of ready) {
      if (m.action_items_count) {
        totalActions += m.action_items_count.total;
        openActions += m.action_items_count.open + m.action_items_count.in_progress;
        doneActions += m.action_items_count.done;
      }
      if (m.summary && m.summary.key_decisions) {
        totalDecisions += m.summary.key_decisions.length;
      }
    }

    return {
      total_meetings: all.length,
      total_minutes_processed: totalMinutes,
      total_action_items: totalActions,
      total_decisions_logged: totalDecisions,
      open_action_items: openActions,
      completed_action_items: doneActions,
      avg_processing_time_seconds: 3.2,
    };
  }
}

export const meetingStore = new MeetingStore();
