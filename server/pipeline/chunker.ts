import { TranscriptSegment } from '../../types/index.ts';

export interface TranscriptChunk {
  chunk_index: number;
  segments: TranscriptSegment[];
  combined_text: string;
  start_ms: number;
  end_ms: number;
  speaker_labels: string[];
}

export interface ChunkerOptions {
  maxWordsPerChunk?: number;
  wordOverlap?: number;
}

/**
 * Long-Meeting Transcript Chunker
 * Breaks long meeting transcripts into overlapping windows to fit within LLM context limits
 * while preserving dialogue continuity and speaker attribution.
 */
export function chunkTranscript(
  segments: TranscriptSegment[],
  options: ChunkerOptions = {}
): TranscriptChunk[] {
  const maxWords = options.maxWordsPerChunk || 250;
  const overlapWords = options.wordOverlap || 40;

  if (segments.length === 0) {
    return [];
  }

  const chunks: TranscriptChunk[] = [];
  let currentChunkSegments: TranscriptSegment[] = [];
  let currentWordCount = 0;
  let chunkIndex = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const segmentWords = segment.text.trim().split(/\s+/).length;

    currentChunkSegments.push(segment);
    currentWordCount += segmentWords;

    if (currentWordCount >= maxWords || i === segments.length - 1) {
      const combinedText = currentChunkSegments
        .map(s => `[${s.speaker_label}] ${s.text}`)
        .join(' ');
      
      const uniqueSpeakers = Array.from(new Set(currentChunkSegments.map(s => s.speaker_label)));

      chunks.push({
        chunk_index: chunkIndex++,
        segments: [...currentChunkSegments],
        combined_text: combinedText,
        start_ms: currentChunkSegments[0].start_ms,
        end_ms: currentChunkSegments[currentChunkSegments.length - 1].end_ms,
        speaker_labels: uniqueSpeakers,
      });

      // Prepare next chunk with overlap
      if (i < segments.length - 1) {
        let overlapCount = 0;
        const overlapSegments: TranscriptSegment[] = [];
        
        for (let j = currentChunkSegments.length - 1; j >= 0; j--) {
          const seg = currentChunkSegments[j];
          const words = seg.text.trim().split(/\s+/).length;
          overlapSegments.unshift(seg);
          overlapCount += words;
          if (overlapCount >= overlapWords) {
            break;
          }
        }
        currentChunkSegments = overlapSegments;
        currentWordCount = overlapCount;
      } else {
        currentChunkSegments = [];
        currentWordCount = 0;
      }
    }
  }

  return chunks;
}
