import React, { useState } from 'react';
import { TranscriptSegment, Speaker } from '../../types/index.ts';
import { AlertTriangle, Search, Play, Filter, Copy, Check, Info } from 'lucide-react';

interface TranscriptViewProps {
  segments: TranscriptSegment[];
  speakers: Speaker[];
  currentPlaybackMs: number;
  onSeek: (ms: number) => void;
  confidenceThreshold?: number;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  segments,
  speakers,
  currentPlaybackMs,
  onSeek,
  confidenceThreshold = 0.82,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('all');
  const [showLowConfidenceOnly, setShowLowConfidenceOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getSpeakerInfo = (label: string) => {
    return (
      speakers.find(s => s.speaker_label === label) || {
        speaker_label: label,
        display_name: label,
        avatar_color: '#6366f1',
        role: 'Participant',
      }
    );
  };

  const formatTimestamp = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredSegments = segments.filter(seg => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      seg.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSpeakerInfo(seg.speaker_label).display_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpeaker =
      selectedSpeaker === 'all' || seg.speaker_label === selectedSpeaker;

    const matchesConfidence =
      !showLowConfidenceOnly || seg.confidence_score < confidenceThreshold;

    return matchesSearch && matchesSpeaker && matchesConfidence;
  });

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const lowConfidenceCount = segments.filter(s => s.confidence_score < confidenceThreshold).length;

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-xl bg-surface-900/80 border border-slate-800 glass-panel">
        {/* Search within transcript */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search within transcript lines or speakers..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Filter by speaker */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Speaker:</span>
          </div>
          <select
            value={selectedSpeaker}
            onChange={e => setSelectedSpeaker(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Speakers ({speakers.length || 'Auto'})</option>
            {speakers.map(s => (
              <option key={s.id} value={s.speaker_label}>
                {s.display_name} ({s.speaker_label})
              </option>
            ))}
          </select>

          {/* Low Confidence Filter Toggle */}
          {lowConfidenceCount > 0 && (
            <button
              onClick={() => setShowLowConfidenceOnly(!showLowConfidenceOnly)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showLowConfidenceOnly
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Flagged ({lowConfidenceCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Low Confidence Explainer Banner */}
      {lowConfidenceCount > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Confidence Flagging:</strong> {lowConfidenceCount} transcript segment(s) scored below the{' '}
              {Math.round(confidenceThreshold * 100)}% certainty threshold due to acoustic noise or cross-talk.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
            PRD Section 5
          </span>
        </div>
      )}

      {/* Transcript Segments List */}
      <div className="space-y-3">
        {filteredSegments.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-surface-900/40 border border-slate-800 text-slate-400 text-sm">
            No transcript segments match your current search or filter criteria.
          </div>
        ) : (
          filteredSegments.map(seg => {
            const speaker = getSpeakerInfo(seg.speaker_label);
            const isLowConfidence = seg.confidence_score < confidenceThreshold;
            const isCurrentlyPlaying =
              currentPlaybackMs >= seg.start_ms && currentPlaybackMs <= seg.end_ms;

            return (
              <div
                key={seg.id}
                id={`seg-card-${seg.id}`}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrentlyPlaying
                    ? 'bg-brand-500/10 border-brand-500/40 shadow-glow'
                    : 'bg-surface-900/60 hover:bg-surface-900 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Speaker Badge & Timestamp */}
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0"
                      style={{ backgroundColor: speaker.avatar_color || '#6366f1' }}
                    >
                      {speaker.display_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white tracking-tight">
                          {speaker.display_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.2 rounded bg-slate-800">
                          {speaker.speaker_label}
                        </span>
                        {speaker.role && (
                          <span className="text-[10px] text-slate-500 hidden sm:inline">
                            • {speaker.role}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => onSeek(seg.start_ms)}
                        className="flex items-center space-x-1 text-[11px] text-brand-400 hover:text-brand-300 font-mono mt-0.5 group"
                      >
                        <Play className="w-2.5 h-2.5 group-hover:scale-110 transition-transform" />
                        <span>
                          {formatTimestamp(seg.start_ms)} - {formatTimestamp(seg.end_ms)}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Confidence Badge, Model Tier & Quick Actions */}
                  <div className="flex items-center space-x-2">
                    {/* Model Tier Flag for Backpressure Audit Transparency */}
                    {seg.model_tier && seg.model_tier !== 'conformer-xl' ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300" title="Generated under backpressure shedding (Conformer-Medium)">
                        {seg.model_tier.replace('conformer-', '').toUpperCase()}-TIER (SHED)
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-500 bg-slate-800/40" title="Full Precision 1.5B Conformer-XL">
                        XL-TIER
                      </span>
                    )}

                    {/* Subject ID indicator */}
                    {seg.subject_id && (
                      <span className="text-[9px] text-slate-500 font-mono px-1.5 py-0.5 rounded bg-slate-800/30 hidden lg:inline" title="Indexed Subject ID (GDPR Art. 17 / DPDP Sec. 12)">
                        {seg.subject_id}
                      </span>
                    )}

                    {isLowConfidence ? (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold low-confidence-tag">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>{Math.round(seg.confidence_score * 100)}% Conf.</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-800/40">
                        {Math.round(seg.confidence_score * 100)}%
                      </span>
                    )}

                    <button
                      onClick={() => handleCopyText(seg.id, seg.text)}
                      title="Copy text"
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      {copiedId === seg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Transcript Text Body */}
                <div className="mt-2.5 pl-10">
                  <p
                    className={`text-sm leading-relaxed ${
                      isLowConfidence ? 'text-rose-100/90 font-medium' : 'text-slate-200'
                    }`}
                  >
                    {seg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
