import React from 'react';
import { Decision } from '../../types/index.ts';
import { ShieldCheck, Users, Play, Clock, Check } from 'lucide-react';

interface DecisionLogViewProps {
  decisions: Decision[];
  onSeek?: (ms: number) => void;
}

export const DecisionLogView: React.FC<DecisionLogViewProps> = ({ decisions, onSeek }) => {
  const formatTimestamp = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!decisions || decisions.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl bg-surface-900/40 border border-slate-800 text-slate-400 text-sm">
        No explicit decisions were agreed upon or extracted for this meeting.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Informational Header */}
      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong>Formal Decision Record:</strong> Extracted explicit consensus and ratified outcomes
            distinct from regular discussion topics.
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
          PRD Section 5
        </span>
      </div>

      {/* Decision Cards List */}
      <div className="space-y-3">
        {decisions.map((decision, index) => (
          <div
            key={decision.id || index}
            className="p-5 rounded-xl border border-slate-800 bg-surface-900/70 hover:border-slate-700 transition-all glass-panel"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-3.5 flex-1">
                {/* Decision Index Badge */}
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold font-mono shrink-0 mt-0.5">
                  #{index + 1}
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                    {decision.text}
                  </h3>

                  {decision.context && (
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                      <strong className="text-slate-400">Context / Rationale:</strong> {decision.context}
                    </p>
                  )}

                  {/* Agreed By Participants & Timestamp */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    {decision.agreed_by && decision.agreed_by.length > 0 && (
                      <div className="flex items-center space-x-1.5 text-slate-400">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Agreed by:</span>
                        <div className="flex items-center space-x-1">
                          {decision.agreed_by.map((person, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                            >
                              {person}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {decision.model_tier && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                          decision.model_tier === 'conformer-xl'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        }`}
                        title={`Derived from ${decision.model_tier} transcription (Fidelity: ${decision.upstream_stt_fidelity || 'standard'})`}
                      >
                        {decision.model_tier === 'conformer-xl' ? 'XL-TIER' : `${decision.model_tier.replace('conformer-', '').toUpperCase()} (SHED)`}
                      </span>
                    )}

                    {decision.timestamp_ms !== undefined && onSeek && (
                      <button
                        onClick={() => onSeek(decision.timestamp_ms!)}
                        className="flex items-center space-x-1 text-[11px] text-brand-400 hover:text-brand-300 font-mono group ml-auto"
                      >
                        <Play className="w-3 h-3 group-hover:scale-110 transition-transform" />
                        <span>Jump to {formatTimestamp(decision.timestamp_ms)}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
