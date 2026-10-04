import React from 'react';
import { TopicSegment } from '../../types/index.ts';
import { Layers, Play, Clock, CheckCircle2, ChevronRight, User } from 'lucide-react';

interface TopicSegmentsViewProps {
  topicSegments: TopicSegment[];
  onSeek?: (ms: number) => void;
}

export const TopicSegmentsView: React.FC<TopicSegmentsViewProps> = ({
  topicSegments,
  onSeek,
}) => {
  const formatTimestamp = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!topicSegments || topicSegments.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-surface-900/40 border border-slate-800 text-slate-400 text-xs">
        No topic segmentation chapters generated for this recording.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-brand-400 shrink-0" />
          <span>
            <strong>Semantic Topic Segmentation:</strong> Automatic chronological chaptering with key takeaways
            and speaker attribution boundaries.
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-300">
          NLP Pipeline
        </span>
      </div>

      {/* Chapters Timeline List */}
      <div className="space-y-4">
        {topicSegments.map(topic => (
          <div
            key={topic.id}
            className="p-5 rounded-2xl border border-slate-800 bg-surface-900/80 hover:border-slate-700 transition-all glass-panel"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                  {topic.chapter_index}
                </span>
                <h3 className="text-sm font-bold text-white tracking-tight">{topic.title}</h3>
              </div>

              {onSeek && (
                <button
                  onClick={() => onSeek(topic.start_ms)}
                  className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-400 hover:text-white text-xs font-mono transition-colors shrink-0"
                >
                  <Play className="w-3 h-3" />
                  <span>
                    {formatTimestamp(topic.start_ms)} - {formatTimestamp(topic.end_ms)}
                  </span>
                </button>
              )}
            </div>

            {/* Chapter Summary */}
            <p className="text-xs text-slate-200 leading-relaxed mt-3">{topic.summary}</p>

            {/* Key Takeaways */}
            {topic.key_points && topic.key_points.length > 0 && (
              <div className="mt-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/70 space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wide">
                  Key Takeaways:
                </p>
                <ul className="space-y-1 text-xs text-slate-300">
                  {topic.key_points.map((pt, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <ChevronRight className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Primary Speakers */}
            {topic.primary_speakers && topic.primary_speakers.length > 0 && (
              <div className="mt-3 flex items-center space-x-2 text-xs text-slate-400">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px]">Primary Contributors:</span>
                <div className="flex items-center space-x-1">
                  {topic.primary_speakers.map((spk, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700/60"
                    >
                      {spk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
