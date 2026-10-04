import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, Play, FileText, Calendar, User, Clock, CheckCircle2 } from 'lucide-react';
import { searchMeetings } from '../services/api.ts';
import { SearchResult, Meeting } from '../../types/index.ts';

interface SemanticSearchViewProps {
  onSelectMeeting: (meetingId: string, initialTimestampMs?: number) => void;
}

export const SemanticSearchView: React.FC<SemanticSearchViewProps> = ({ onSelectMeeting }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQueries = [
    'What did we decide regarding PostgreSQL and pgvector?',
    'Deepgram versus AssemblyAI benchmark results and latency',
    'What are the security rules for deleting meeting recordings?',
    'Who is responsible for the API rate limiter or adapter?',
    'Customer feedback on interactive audio scrubber',
  ];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const data = await searchMeetings(searchQuery.trim(), 8);
      setResults(data.results);
    } catch (err: any) {
      setError(err?.message || 'Failed to perform vector semantic search.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const formatTimestamp = (ms?: number) => {
    if (ms === undefined) return '';
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-mono text-brand-300">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Natural Language Vector Similarity Search (PRD Section 5 & 9)</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">
          Search Your Entire Meeting Knowledge Base
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Ask questions in plain English across all historical recordings. Semantic embeddings rank the most
          relevant discussions and jump directly to the exact spoken moment.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-brand-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search across all transcripts (e.g., 'What was agreed on the database migration?')..."
            className="w-full pl-12 pr-32 py-4 rounded-2xl bg-surface-900 border border-slate-700/80 text-base text-white placeholder-slate-500 shadow-glow focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
          <button
            onClick={() => handleSearch(query)}
            disabled={isSearching || !query.trim()}
            className={`absolute right-2 px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all flex items-center space-x-2 ${
              isSearching || !query.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-500 text-white shadow-glow hover:scale-[1.02]'
            }`}
          >
            {isSearching ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Suggested Query Chips */}
      <div className="space-y-2">
        <p className="text-xs text-slate-400 font-medium">Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(sample);
                handleSearch(sample);
              }}
              className="px-3 py-1.5 rounded-lg bg-surface-900/80 hover:bg-brand-500/10 border border-slate-800 hover:border-brand-500/30 text-xs text-slate-300 hover:text-brand-300 transition-all text-left"
            >
              "{sample}"
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Results Section */}
      {results !== null && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
            <span>
              Found <strong>{results.length}</strong> matching meeting excerpt(s) for "{query}"
            </span>
            <span className="font-mono text-brand-400">Cosine Similarity Ranked</span>
          </div>

          {results.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-surface-900/40 border border-slate-800 text-slate-400 space-y-2">
              <p className="text-base font-semibold text-slate-300">No semantic matches found</p>
              <p className="text-xs text-slate-500">
                Try rephrasing your search query or asking about another topic discussed in your meeting recordings.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((res, index) => {
                const matchPct = Math.round(res.similarity_score * 100);
                return (
                  <div
                    key={index}
                    className="p-5 rounded-2xl border border-slate-800 bg-surface-900/80 hover:border-brand-500/40 transition-all glass-panel group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                          {res.meeting.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3 text-brand-400" />
                            <span>{res.meeting.host_name}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{new Date(res.meeting.uploaded_at).toLocaleDateString()}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{Math.ceil(res.meeting.duration_seconds / 60)} min</span>
                          </span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          {matchPct}% Match
                        </span>
                      </div>
                    </div>

                    {/* Excerpt Box */}
                    <div className="mt-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                        <span className="text-brand-300">
                          Spoken by {res.matched_segment?.speaker_label || 'Speaker'}
                        </span>
                        {res.matched_segment?.start_ms !== undefined && (
                          <span>
                            Timestamp: {formatTimestamp(res.matched_segment.start_ms)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed italic">
                        "{res.matched_chunk_text}"
                      </p>
                    </div>

                    {/* CTA Action */}
                    <div className="mt-4 flex items-center justify-end space-x-3">
                      <button
                        onClick={() =>
                          onSelectMeeting(res.meeting.id, res.matched_segment?.start_ms)
                        }
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/30 text-xs font-semibold transition-all group-hover:shadow-glow"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Open Meeting & Play From Excerpt</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
