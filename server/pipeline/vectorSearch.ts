import { TranscriptEmbedding, SearchResult, Meeting } from '../../types/index.ts';

// Common English stop words
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
  'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Tokenize and normalize text into clean keywords
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

/**
 * Create a simple normalized term-frequency sparse/dense vector representation
 */
export function computeEmbedding(text: string, vocabulary: Map<string, number>, vocabSize: number = 256): number[] {
  const tokens = tokenize(text);
  const vector = new Array(vocabSize).fill(0);

  if (tokens.length === 0) return vector;

  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  // Hash or vocabulary map to fixed vector dimensions
  for (const [token, count] of tf.entries()) {
    let index = vocabulary.get(token);
    if (index === undefined) {
      // Deterministic hash into vector space
      let hash = 0;
      for (let i = 0; i < token.length; i++) {
        hash = (hash << 5) - hash + token.charCodeAt(i);
        hash |= 0;
      }
      index = Math.abs(hash) % vocabSize;
    }
    const normalizedWeight = (count / tokens.length) * (1 + Math.log(1 + token.length));
    vector[index % vocabSize] += normalizedWeight;
  }

  // Normalize to unit length (L2 norm)
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }

  return vector;
}

/**
 * Compute Cosine Similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search across all transcript embeddings for a given query
 */
export function searchEmbeddings(
  query: string,
  embeddingsMap: Map<string, TranscriptEmbedding[]>,
  meetingsMap: Map<string, Meeting>,
  topK: number = 8
): SearchResult[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const queryVec = computeEmbedding(query, new Map());
  const scoredChunks: Array<{
    meeting: Meeting;
    chunk: TranscriptEmbedding;
    score: number;
  }> = [];

  for (const [meetingId, embeddings] of embeddingsMap.entries()) {
    const meeting = meetingsMap.get(meetingId);
    if (!meeting || meeting.status !== 'ready') continue;

    for (const chunk of embeddings) {
      const cosSim = cosineSimilarity(queryVec, chunk.embedding);
      
      // Keyword boost: check exact token match presence in chunk
      const chunkLower = chunk.chunk_text.toLowerCase();
      let keywordHits = 0;
      for (const t of queryTokens) {
        if (chunkLower.includes(t)) {
          keywordHits++;
        }
      }
      const keywordBoost = (keywordHits / queryTokens.length) * 0.45;
      const combinedScore = Math.min(1.0, cosSim * 0.65 + keywordBoost);

      if (combinedScore > 0.15) {
        scoredChunks.push({
          meeting,
          chunk,
          score: Math.round(combinedScore * 1000) / 1000,
        });
      }
    }
  }

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);

  // Take top distinct or best-per-meeting chunks
  const results: SearchResult[] = [];
  const seenMeetings = new Map<string, number>();

  for (const item of scoredChunks) {
    const count = seenMeetings.get(item.meeting.id) || 0;
    if (count < 2 && results.length < topK) {
      seenMeetings.set(item.meeting.id, count + 1);
      results.push({
        meeting: item.meeting,
        similarity_score: Math.min(0.98, item.score * 1.15),
        matched_chunk_text: item.chunk.chunk_text,
        matched_segment: {
          start_ms: item.chunk.start_ms,
          end_ms: item.chunk.end_ms,
          speaker_label: item.chunk.speaker_label || 'Speaker',
        },
      });
    }
  }

  return results;
}
