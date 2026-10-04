import React from 'react';
import {
  Sparkles,
  UploadCloud,
  Search,
  CheckSquare,
  Layers,
  Activity,
  Plug,
  Radio,
  ShieldCheck,
  Award
} from 'lucide-react';
import { MeetingStats } from '../../types/index.ts';

interface NavbarProps {
  currentView: 'library' | 'search' | 'actions' | 'eval' | 'compliance';
  onNavigate: (view: 'library' | 'search' | 'actions' | 'eval' | 'compliance') => void;
  onOpenUpload: () => void;
  onOpenLiveBot: () => void;
  onOpenIntegrations: () => void;
  stats: MeetingStats | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenUpload,
  onOpenLiveBot,
  onOpenIntegrations,
  stats,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-surface-950/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 lg:gap-4">
          
          {/* Left: Brand Logo & Navigation */}
          <div className="flex items-center space-x-3 lg:space-x-4 min-w-0 flex-1">
            {/* Logo Brand */}
            <button
              onClick={() => onNavigate('library')}
              className="flex items-center space-x-2.5 group focus:outline-none shrink-0"
              title="Return to Library"
            >
              <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 p-[1px] shadow-glow transition-transform group-hover:scale-105 shrink-0">
                <div className="w-full h-full bg-surface-950 rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-brand-400 animate-pulse-subtle" />
                </div>
              </div>
              <div className="text-left flex flex-col justify-center">
                <div className="flex items-center space-x-1.5">
                  <span className="font-display font-bold text-sm lg:text-base text-white tracking-tight whitespace-nowrap">
                    AI Meeting
                  </span>
                  <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30 whitespace-nowrap hidden sm:inline-block">
                    FASTAPI
                  </span>
                </div>
              </div>
            </button>

            {/* Navigation Tabs */}
            <nav className="flex items-center space-x-1 pl-2 lg:pl-3 border-l border-slate-800/90 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => onNavigate('library')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  currentView === 'library'
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Library</span>
              </button>

              <button
                onClick={() => onNavigate('search')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  currentView === 'search'
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>

              <button
                onClick={() => onNavigate('actions')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  currentView === 'actions'
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Actions</span>
                {stats && stats.open_action_items > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    {stats.open_action_items}
                  </span>
                )}
              </button>

              {/* Model Eval Benchmark Tab */}
              <button
                onClick={() => onNavigate('eval')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  currentView === 'eval'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Model Eval</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold hidden xl:inline-block">
                  5.58% WER
                </span>
              </button>

              {/* Compliance & KMS Tab */}
              <button
                onClick={() => onNavigate('compliance')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  currentView === 'compliance'
                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Compliance</span>
              </button>

              {/* Integrations Modal Button */}
              <button
                onClick={onOpenIntegrations}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 whitespace-nowrap transition-all shrink-0 group border border-transparent hover:border-slate-700/60"
                title="Configure Slack, Zoom, Meet, Teams, Webex & Jira"
              >
                <Plug className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-45 transition-transform" />
                <span>Integrations</span>
              </button>
            </nav>
          </div>

          {/* Right Section: Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0 pl-2">
            {/* Live Bot CTA Button */}
            <button
              onClick={onOpenLiveBot}
              className="flex items-center space-x-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/30 whitespace-nowrap shrink-0"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
              <span>Join Live Call</span>
            </button>

            {/* Upload File CTA */}
            <button
              onClick={onOpenUpload}
              className="flex items-center space-x-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98] border border-brand-400/30 whitespace-nowrap shrink-0"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
