import React, { useState } from 'react';
import { Meeting, MeetingStatus } from '../../types/index.ts';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Trash2,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  FileText,
  X,
} from 'lucide-react';

interface MeetingLibraryProps {
  meetings: Meeting[];
  onSelectMeeting: (meetingId: string) => void;
  onDeleteMeeting: (meetingId: string) => Promise<void>;
  onRetryMeeting: (meetingId: string) => Promise<void>;
  onOpenUpload: () => void;
  isLoading: boolean;
}

export const MeetingLibrary: React.FC<MeetingLibraryProps> = ({
  meetings,
  onSelectMeeting,
  onDeleteMeeting,
  onRetryMeeting,
  onOpenUpload,
  isLoading,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const filteredMeetings = meetings.filter(m => {
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.host_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.summary?.topics && m.summary.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesStatus && matchesSearch;
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (
      confirm(
        'Are you sure you want to delete this meeting? All transcripts, summaries, action items, and embeddings will be wiped permanently.'
      )
    ) {
      setDeletingId(id);
      try {
        await onDeleteMeeting(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleRetry = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRetryingId(id);
    try {
      await onRetryMeeting(id);
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Ready</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/30 whitespace-nowrap">
            <Sparkles className="w-3 h-3 text-brand-400 animate-spin" />
            <span>Processing</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 whitespace-nowrap">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>Failed</span>
          </span>
        );
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '< 1 min';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">
            Meeting Intelligence Library
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            All ingested audio recordings, speaker-diarized transcripts, summaries & action items
          </p>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search meetings by title or host..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-surface-900 border border-slate-700/80 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 font-medium"
          >
            <option value="all">All Statuses ({meetings.length})</option>
            <option value="ready">Ready ({meetings.filter(m => m.status === 'ready').length})</option>
            <option value="processing">Processing ({meetings.filter(m => m.status === 'processing').length})</option>
            <option value="failed">Failed ({meetings.filter(m => m.status === 'failed').length})</option>
          </select>
        </div>
      </div>

      {/* Grid of Meetings */}
      {isLoading ? (
        <div className="p-16 text-center">
          <Sparkles className="w-8 h-8 text-brand-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading meeting intelligence repository...</p>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-surface-900/40 border border-slate-800 glass-panel">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No meetings found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No meetings match your filter. Try changing search keywords or status filter.'
              : 'Upload your first audio or video recording to generate summaries and transcripts automatically.'}
          </p>
          <button
            onClick={onOpenUpload}
            className="mt-4 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all"
          >
            Upload Meeting Recording
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map(meeting => {
            const isDeleting = deletingId === meeting.id;
            const isRetrying = retryingId === meeting.id;

            return (
              <div
                key={meeting.id}
                onClick={() => onSelectMeeting(meeting.id)}
                className="group relative flex flex-col justify-between p-5 rounded-2xl border border-slate-800/90 bg-surface-900/70 hover:bg-surface-900/90 hover:border-brand-500/40 transition-all cursor-pointer glass-panel glass-panel-hover min-h-[330px]"
              >
                {/* Card Top: Title, Status, Metadata */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-2 min-h-[2.5rem] leading-snug">
                      {meeting.title}
                    </h3>
                    <div className="shrink-0 mt-0.5">{getStatusBadge(meeting.status)}</div>
                  </div>

                  {/* Metadata line */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <div className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-brand-400" />
                      <span>{meeting.host_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDuration(meeting.duration_seconds)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(meeting.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Executive Summary Preview or Error Box */}
                  {meeting.status === 'ready' && meeting.summary ? (
                    <div className="h-20 overflow-hidden text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/70">
                      <p className="line-clamp-3">{meeting.summary.executive_summary}</p>
                    </div>
                  ) : meeting.status === 'failed' ? (
                    <div className="h-20 overflow-hidden p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-1">
                      <p className="font-semibold flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Processing Failed</span>
                      </p>
                      <p className="text-[11px] text-rose-200/80 leading-relaxed line-clamp-2">
                        {meeting.error_message || 'Audio conversion timed out. Click Retry to re-process.'}
                      </p>
                    </div>
                  ) : (
                    <div className="h-20 flex items-center justify-center p-3 rounded-xl bg-brand-500/5 border border-brand-500/15 text-xs text-brand-300 space-x-2">
                      <Sparkles className="w-4 h-4 animate-spin text-brand-400" />
                      <span>Transcribing audio & synthesizing intelligence...</span>
                    </div>
                  )}

                  {/* Topic Tags */}
                  <div className="h-6 overflow-hidden flex items-center gap-1.5 pt-0.5">
                    {meeting.summary?.topics && meeting.summary.topics.length > 0 ? (
                      meeting.summary.topics.slice(0, 3).map((topic, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700/60 whitespace-nowrap"
                        >
                          {topic}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono italic">
                        {meeting.status === 'ready' ? 'General Meeting' : 'Pending metadata'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Summary metrics and quick actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
                  {/* Left: Summary Metrics */}
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    {meeting.action_items_count && meeting.action_items_count.total > 0 && (
                      <div className="flex items-center space-x-1 text-slate-300">
                        <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {meeting.action_items_count.done}/{meeting.action_items_count.total} Actions
                        </span>
                      </div>
                    )}
                    {meeting.summary?.key_decisions && (
                      <div className="flex items-center space-x-1 text-slate-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{meeting.summary.key_decisions.length} Decisions</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-1.5" onClick={e => e.stopPropagation()}>
                    {meeting.status === 'failed' && (
                      <button
                        onClick={e => handleRetry(e, meeting.id)}
                        disabled={isRetrying}
                        title="Retry processing"
                        className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs flex items-center space-x-1 transition-colors"
                      >
                        <RotateCcw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                        <span>Retry</span>
                      </button>
                    )}

                    <button
                      onClick={e => handleDelete(e, meeting.id)}
                      disabled={isDeleting}
                      title="Delete meeting permanently"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onSelectMeeting(meeting.id)}
                      className="p-1.5 rounded-lg text-brand-400 hover:text-white hover:bg-brand-600 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
