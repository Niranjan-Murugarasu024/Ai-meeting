import React, { useState, useEffect } from 'react';
import {
  Meeting,
  TranscriptSegment,
  Speaker,
  Summary,
  ActionItem,
  ActionItemStatus,
} from '../../types/index.ts';
import {
  fetchTranscript,
  fetchSummary,
  fetchActionItems,
  updateActionItemStatus,
  deleteMeeting,
} from '../services/api.ts';
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  CheckSquare,
  MessageSquare,
  Sparkles,
  Download,
  Trash2,
  Calendar,
  Clock,
  User,
  Layers,
  Award,
  Share2,
  Code,
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { TranscriptView } from './TranscriptView.tsx';
import { ActionItemsView } from './ActionItemsView.tsx';
import { DecisionLogView } from './DecisionLogView.tsx';
import { TopicSegmentsView } from './TopicSegmentsView.tsx';
import { EffectivenessScoreCard } from './EffectivenessScoreCard.tsx';
import { IntegrationsDistributionPanel } from './IntegrationsDistributionPanel.tsx';
import { AudioDiagnosticsBadge } from './AudioDiagnosticsBadge.tsx';
import { AudioPlayerBar } from './AudioPlayerBar.tsx';

interface MeetingDetailViewProps {
  meetingId: string;
  initialTimestampMs?: number;
  onBack: () => void;
  onMeetingDeleted: () => void;
}

export const MeetingDetailView: React.FC<MeetingDetailViewProps> = ({
  meetingId,
  initialTimestampMs = 0,
  onBack,
  onMeetingDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<
    'summary' | 'chapters' | 'effectiveness' | 'actions' | 'decisions' | 'transcript' | 'distribution' | 'raw'
  >('summary');
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio Playback Sync State
  const [currentPlaybackMs, setCurrentPlaybackMs] = useState<number>(initialTimestampMs);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  useEffect(() => {
    loadMeetingData();
  }, [meetingId]);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentPlaybackMs(prev => {
          const maxMs = (meeting?.duration_seconds || 180) * 1000;
          if (prev >= maxMs) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 250;
        });
      }, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, meeting]);

  const loadMeetingData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const transcriptData = await fetchTranscript(meetingId);
      setSegments(transcriptData.segments);
      setSpeakers(transcriptData.speakers);

      try {
        const sumData = await fetchSummary(meetingId);
        setSummary(sumData);
      } catch {
        // Summary might be processing
      }

      try {
        const actData = await fetchActionItems(meetingId);
        setActionItems(actData.action_items);
      } catch {
        // Actions might be processing
      }

      const res = await fetch(`/api/meetings/${meetingId}`);
      if (res.ok) {
        const m = await res.json();
        setMeeting(m);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load meeting details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (actionId: string, newStatus: ActionItemStatus) => {
    try {
      const updated = await updateActionItemStatus(actionId, newStatus);
      setActionItems(prev => prev.map(a => (a.id === actionId ? updated : a)));
    } catch (err: any) {
      alert('Failed to update action item status.');
    }
  };

  const handleSeek = (ms: number) => {
    setCurrentPlaybackMs(ms);
    const card = document.getElementById(`seg-card-seg-${meetingId}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleExportMarkdown = () => {
    if (!meeting || !summary) return;

    let md = `# Meeting Notes: ${meeting.title}\n`;
    md += `**Date:** ${new Date(meeting.uploaded_at).toLocaleString()}\n`;
    md += `**Host:** ${meeting.host_name}\n`;
    md += `**Effectiveness Score:** ${summary.effectiveness?.overall_score || 94}/100\n\n`;

    md += `## Executive Narrative Summary\n${summary.executive_summary}\n\n`;

    md += `## Key Decisions Log\n`;
    summary.key_decisions.forEach((d, i) => {
      md += `${i + 1}. **${d.text}**\n   - Context: ${d.context || 'N/A'}\n   - Agreed by: ${d.agreed_by?.join(', ') || 'Team'}\n`;
    });
    md += `\n`;

    md += `## Action Items\n`;
    actionItems.forEach(a => {
      const check = a.status === 'done' ? '[x]' : '[ ]';
      md += `- ${check} **${a.description}** (Owner: ${a.owner_name || 'Unassigned'}, Due: ${a.due_date || 'None'}, Jira: ${a.jira_issue_key || 'ENG-4890'})\n`;
    });
    md += `\n`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meeting.title.replace(/\s+/g, '_')}_intelligence.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyRawJSON = () => {
    const raw = JSON.stringify(
      {
        meeting,
        summary,
        action_items: actionItems,
        transcript_segments: segments,
        speakers,
      },
      null,
      2
    );
    navigator.clipboard.writeText(raw);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleDeleteMeeting = async () => {
    if (confirm('Permanently wipe this meeting recording, transcript, decisions, and embeddings?')) {
      try {
        await deleteMeeting(meetingId);
        onMeetingDeleted();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete meeting');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-20 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
        <p className="text-sm text-slate-300 font-medium">Synthesizing meeting intelligence data...</p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4 max-w-xl mx-auto">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Error Loading Meeting</h2>
        <p className="text-xs text-rose-300">{error || 'Meeting not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
        >
          Return to Library
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Bar: Back & Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-surface-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors shrink-0"
            title="Back to Library"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                {meeting.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 uppercase font-mono">
                {meeting.status}
              </span>
              {summary?.effectiveness && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-brand-500/15 text-brand-300 border border-brand-500/30">
                  ⚡ {summary.effectiveness.overall_score}/100 Score
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-brand-400" />
                <span>Host: {meeting.host_name}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{new Date(meeting.uploaded_at).toLocaleDateString()}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{Math.ceil(meeting.duration_seconds / 60)} min</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleExportMarkdown}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-surface-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" />
            <span>Export Notes (.md)</span>
          </button>

          <button
            onClick={handleDeleteMeeting}
            className="p-2 rounded-xl bg-surface-900 hover:bg-rose-500/10 border border-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
            title="Delete Meeting"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Synchronized Audio Player Bar */}
      <AudioPlayerBar
        durationSeconds={meeting.duration_seconds || 180}
        currentMs={currentPlaybackMs}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onSeek={handleSeek}
        title={meeting.title}
      />

      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 p-1 rounded-xl bg-surface-900/90 border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'summary' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Executive Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('chapters')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'chapters' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Topic Chapters ({summary?.topic_segments?.length || 3})</span>
        </button>

        <button
          onClick={() => setActiveTab('effectiveness')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'effectiveness' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Effectiveness ({summary?.effectiveness?.overall_score || 94}/100)</span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'actions' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Action Items ({actionItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'decisions' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Decisions ({summary?.key_decisions.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'transcript' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Diarized Transcript</span>
        </button>

        <button
          onClick={() => setActiveTab('distribution')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'distribution' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Slack & Jira Delivery</span>
        </button>

        <button
          onClick={() => setActiveTab('raw')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'raw' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>API JSON</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {/* TAB 1: EXECUTIVE SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {summary ? (
              <div className="space-y-6">
                {/* Audio Diagnostics Banner */}
                <AudioDiagnosticsBadge diagnostics={summary.audio_diagnostics} />

                {/* Executive Summary Narrative */}
                <div className="p-6 rounded-2xl border border-slate-800 bg-surface-900/80 glass-panel space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-brand-400" />
                      <h2 className="text-base font-bold text-white tracking-tight">
                        Executive Narrative Summary
                      </h2>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {summary.ai_model_version}
                      </span>
                      {summary.model_tier && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                            summary.model_tier === 'conformer-xl'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          }`}
                          title={`Upstream STT Model Tier: ${summary.model_tier} (Fidelity: ${summary.upstream_stt_fidelity || 'standard'})`}
                        >
                          {summary.model_tier === 'conformer-xl' ? 'XL-TIER' : `${summary.model_tier.replace('conformer-', '').toUpperCase()} (SHED)`}
                        </span>
                      )}
                      {summary.sentiment_score !== undefined && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span>{Math.round(summary.sentiment_score * 100)}% Sentiment Score</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed font-sans font-normal text-justify sm:text-left">
                    {summary.executive_summary}
                  </p>

                  {/* Key Phrases Cloud */}
                  {summary.key_phrases && summary.key_phrases.length > 0 && (
                    <div className="pt-3 border-t border-slate-800/80 space-y-2">
                      <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                        <Tag className="w-3.5 h-3.5 text-brand-400" />
                        <span>High-Impact Key Phrases & Entities:</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {summary.key_phrases.map((kp, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-800/90 text-slate-200 border border-slate-700 flex items-center space-x-1.5"
                          >
                            <span>{kp.phrase}</span>
                            <span className="text-[10px] text-brand-400 font-bold">({kp.category})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Embedded Decisions Preview */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>Ratified Decisions ({summary.key_decisions.length})</span>
                    </h3>
                  </div>
                  <DecisionLogView decisions={summary.key_decisions} onSeek={handleSeek} />
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-surface-900/40 border border-slate-800 text-slate-400 text-sm">
                Summary is being synthesized by Python NLP pipeline...
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TOPIC CHAPTERS */}
        {activeTab === 'chapters' && (
          <TopicSegmentsView topicSegments={summary?.topic_segments || []} onSeek={handleSeek} />
        )}

        {/* TAB 3: EFFECTIVENESS SCORE */}
        {activeTab === 'effectiveness' && (
          <EffectivenessScoreCard effectiveness={summary?.effectiveness} />
        )}

        {/* TAB 4: ACTION ITEMS */}
        {activeTab === 'actions' && (
          <ActionItemsView actionItems={actionItems} onStatusChange={handleStatusChange} />
        )}

        {/* TAB 5: DECISIONS LOG */}
        {activeTab === 'decisions' && (
          <DecisionLogView decisions={summary?.key_decisions || []} onSeek={handleSeek} />
        )}

        {/* TAB 6: SPEAKER TRANSCRIBE */}
        {activeTab === 'transcript' && (
          <TranscriptView
            segments={segments}
            speakers={speakers}
            currentPlaybackMs={currentPlaybackMs}
            onSeek={handleSeek}
          />
        )}

        {/* TAB 7: SLACK & JIRA DISTRIBUTION */}
        {activeTab === 'distribution' && (
          <IntegrationsDistributionPanel
            distribution={summary?.distribution}
            meetingTitle={meeting.title}
            meetingId={meeting.id}
            actionItems={actionItems}
          />
        )}

        {/* TAB 8: RAW JSON */}
        {activeTab === 'raw' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-900 border border-slate-800 text-xs">
              <span className="text-slate-400 font-mono">Full Python API Schema Response</span>
              <button
                onClick={handleCopyRawJSON}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                {copiedRaw ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-surface-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[600px] leading-relaxed">
              {JSON.stringify(
                {
                  meeting,
                  summary,
                  action_items: actionItems,
                  transcript_segments: segments,
                  speakers,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
