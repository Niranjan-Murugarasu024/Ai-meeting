import React from 'react';
import { AudioDiagnostics } from '../../types/index.ts';
import { Volume2, Globe, Mic, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AudioDiagnosticsBadgeProps {
  diagnostics?: AudioDiagnostics;
}

export const AudioDiagnosticsBadge: React.FC<AudioDiagnosticsBadgeProps> = ({ diagnostics }) => {
  if (!diagnostics) return null;

  return (
    <div className="p-4 rounded-2xl border border-slate-800 bg-surface-900/60 glass-panel space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-white flex items-center space-x-1.5">
          <Mic className="w-4 h-4 text-brand-400" />
          <span>Edge Case Audio & Language Diagnostics</span>
        </span>
        <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>Speech Clarity Index: {Math.round(diagnostics.speech_clarity_index * 100)}%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Noise Cancellation */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Noise Cancellation:</span>
          </div>
          <p className="font-semibold text-emerald-300 font-mono text-xs">
            Active (-{diagnostics.noise_db_reduction} dB SNR)
          </p>
          <p className="text-[10px] text-slate-500">Spectral gating & mic leveling</p>
        </div>

        {/* Accent Adaptation */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Accent Adaptive Model:</span>
          </div>
          <p className="font-semibold text-indigo-300 font-mono text-xs truncate">
            {diagnostics.accent_adaptive_mode}
          </p>
          <p className="text-[10px] text-slate-500">Global phoneme compensation</p>
        </div>

        {/* Multi-Language Breakdown */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Multi-Language Ingestion:</span>
          </div>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {diagnostics.primary_languages_detected &&
              Object.entries(diagnostics.primary_languages_detected).map(([lang, pct], i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-cyan-300 font-mono border border-slate-700/60"
                >
                  {lang}: {pct}%
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
