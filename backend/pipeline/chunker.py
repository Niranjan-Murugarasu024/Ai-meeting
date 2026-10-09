from typing import List, Dict, Any

def chunk_transcript(segments: List[Dict[str, Any]], max_words_per_chunk: int = 250, word_overlap: int = 40) -> List[Dict[str, Any]]:
    if not segments:
        return []

    chunks = []
    current_chunk_segments = []
    current_word_count = 0
    chunk_index = 0

    i = 0
    while i < len(segments):
        segment = segments[i]
        text = segment.get("text", "")
        speaker_label = segment.get("speaker_label", "Unknown")
        start_ms = segment.get("start_ms", 0)
        end_ms = segment.get("end_ms", 0)

        segment_words = len(text.strip().split())

        current_chunk_segments.append(segment)
        current_word_count += segment_words

        if current_word_count >= max_words_per_chunk or i == len(segments) - 1:
            combined_text = " ".join([f"[{s.get('speaker_label', 'Unknown')}] {s.get('text', '')}" for s in current_chunk_segments])
            unique_speakers = list(set([s.get("speaker_label", "Unknown") for s in current_chunk_segments]))

            chunks.append({
                "chunk_index": chunk_index,
                "segments": list(current_chunk_segments),
                "combined_text": combined_text,
                "start_ms": current_chunk_segments[0].get("start_ms", 0) if current_chunk_segments else 0,
                "end_ms": current_chunk_segments[-1].get("end_ms", 0) if current_chunk_segments else 0,
                "speaker_labels": unique_speakers
            })
            chunk_index += 1

            if i < len(segments) - 1:
                overlap_count = 0
                overlap_segments = []
                for j in range(len(current_chunk_segments) - 1, -1, -1):
                    seg = current_chunk_segments[j]
                    words = len(seg.get("text", "").strip().split())
                    overlap_segments.insert(0, seg)
                    overlap_count += words
                    if overlap_count >= word_overlap:
                        break
                current_chunk_segments = overlap_segments
                current_word_count = overlap_count
            else:
                current_chunk_segments = []
                current_word_count = 0
        i += 1

    return chunks
