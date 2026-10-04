import React from 'react';
import { EffectivenessScore } from '../../types/index.ts';
import { Award, TrendingUp, Users, ShieldCheck, CheckSquare, Sparkles, Lightbulb } from 'lucide-react';

interface EffectivenessScoreCardProps {
  effectiveness?: EffectivenessScore;
}

export const EffectivenessScoreCard: React.FC<EffectivenessScoreCardProps> = ({ effectiveness }) => {
  if (!effectiveness) {
    return (
      <div className="p-12 text-center rounded-2xl bg-surface-900/40 border border-slate-800 text-slate-400 text-xs">
        Effectiveness score is calculating based on meeting metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Overall Gauge */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-surface-900/80 glass-panel">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-300">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Meeting Productivity & Effectiveness Index</span>
            </div>
            <h2 className="text-xl font-display font-bold text-white tracking-tight">
              Overall Meeting Score: {effectiveness.overall_score}/100
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Calculated using weighted talk-time distribution, decision-making velocity, action item ownership,
              and conversational engagement.
            </p>
          </div>

          {/* Score Badge */}
          <div className="flex items-center space-x-4 shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 via-brand-600 to-indigo-500 p-[2px] shadow-glow">
              <div className="w-full h-full bg-surface-950 rounded-[14px] flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono text-emerald-400 leading-none">
                  {effectiveness.overall_score}
                </span>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 mt-1">
                  Grade {effectiveness.grade}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 KPI Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-brand-400" />
                <span>Talk Balance</span>
              </span>
              <span className="font-mono text-white font-bold">{effectiveness.talk_balance_score}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-brand-500 h-full rounded-full" style={{ width: `${effectiveness.talk_balance_score}%` }} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Decision Velocity</span>
              </span>
              <span className="font-mono text-white font-bold">{effectiveness.decision_clarity_score}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${effectiveness.decision_clarity_score}%` }} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center space-x-1">
                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Action Momentum</span>
              </span>
              <span className="font-mono text-white font-bold">{effectiveness.action_momentum_score}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${effectiveness.action_momentum_score}%` }} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Engagement Index</span>
              </span>
              <span className="font-mono text-white font-bold">{effectiveness.engagement_sentiment_score}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${effectiveness.engagement_sentiment_score}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Speaker Talk-Time Distribution Section */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-surface-900/80 glass-panel space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Users className="w-4 h-4 text-brand-400" />
          <span>Speaker Talk-Time Distribution</span>
        </h3>

        {/* Multi-Segment Stacked Bar */}
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-800">
          {effectiveness.talk_time_breakdown.map((b, idx) => (
            <div
              key={idx}
              title={`${b.display_name}: ${b.percentage}% (${b.talk_time_seconds}s)`}
              className="h-full transition-all hover:opacity-80"
              style={{
                width: `${b.percentage}%`,
                backgroundColor: b.avatar_color || '#6366f1',
              }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {effectiveness.talk_time_breakdown.map((b, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: b.avatar_color || '#6366f1' }}
                />
                <div>
                  <p className="font-bold text-white">{b.display_name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{b.talk_time_seconds}s spoken</p>
                </div>
              </div>
              <span className="font-mono text-brand-300 font-bold">{b.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Meeting Coaching Recommendations */}
      {effectiveness.ai_recommendations && effectiveness.ai_recommendations.length > 0 && (
        <div className="p-6 rounded-2xl border border-brand-500/20 bg-brand-500/5 glass-panel space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>AI Meeting Coaching Insights</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {effectiveness.ai_recommendations.map((rec, i) => (
              <li key={i} className="flex items-start space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
