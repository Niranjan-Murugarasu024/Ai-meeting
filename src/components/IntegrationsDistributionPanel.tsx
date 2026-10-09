import React, { useState } from 'react';
import { DistributionRecord, ActionItem } from '../../types/index.ts';
import { Share2, Send, ExternalLink, CheckCircle2, Sparkles, MessageSquare, Layers, Calendar, Users } from 'lucide-react';
import { testSlackDispatch } from '../services/api.ts';

interface IntegrationsDistributionPanelProps {
  distribution?: DistributionRecord;
  meetingTitle: string;
  meetingId: string;
  actionItems: ActionItem[];
}

export const IntegrationsDistributionPanel: React.FC<IntegrationsDistributionPanelProps> = ({
  distribution,
  meetingTitle,
  meetingId,
  actionItems,
}) => {
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  const handleSendSlackTest = async () => {
    setIsSendingTest(true);
    setTestSuccessMessage(null);
    try {
      const res = await testSlackDispatch(distribution?.slack_channel || '#general-sync', meetingTitle);
      setTestSuccessMessage(`Broadcast delivered to ${res.channel} successfully at ${res.payload.text}`);
    } catch (err: any) {
      alert('Failed to send Slack test broadcast');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Slack Delivery Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-surface-900/80 glass-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#4A154B]/20 text-[#ECB22E] border border-[#ECB22E]/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Slack Broadcast Delivery</h3>
              <p className="text-xs text-slate-400">
                Automated Block Kit meeting recap posted to channel{' '}
                <code className="text-brand-300 font-mono">{distribution?.slack_channel || '#project-alpha-sync'}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>DELIVERED</span>
            </span>
            <button
              onClick={handleSendSlackTest}
              disabled={isSendingTest}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold border border-slate-700 transition-colors"
            >
              {isSendingTest ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Re-Broadcast to Slack</span>
            </button>
          </div>
        </div>

        {testSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            {testSuccessMessage}
          </div>
        )}

        {/* Mock Slack Message Preview Container */}
        <div className="p-4 rounded-xl bg-[#1A1D21] border border-slate-800 text-slate-200 font-sans space-y-3">
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center text-white font-bold text-[10px]">
              AI
            </div>
            <span className="font-bold text-white">Webenoid AI Meeting Bot</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono">APP</span>
            <span className="text-[11px] text-slate-500">Just now</span>
          </div>

          <div className="pl-8 border-l-2 border-[#ECB22E] space-y-2 text-xs">
            <p className="font-bold text-sm text-white">📋 Meeting Summary: {meetingTitle}</p>
            <p className="text-slate-300">
              The engineering and product team convened to finalize the multi-platform live bot streaming and our
              distribution webhooks to Slack and Jira.
            </p>
            <div className="pt-1">
              <p className="font-bold text-slate-300">🎯 Key Ratified Decisions:</p>
              <p className="text-slate-400">• Enable automated post-meeting Slack broadcast and Jira task dispatch.</p>
              <p className="text-slate-400">• Standardize on automated 0 to 100 meeting effectiveness score.</p>
            </div>
            <div className="pt-1">
              <p className="font-bold text-slate-300">📌 Extracted Action Items:</p>
              {actionItems.slice(0, 2).map((a, i) => (
                <p key={i} className="text-slate-400">
                  • *{a.description}* (Owner: <code className="text-emerald-300 font-mono">{a.owner_name}</code>, Due: {a.due_date})
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Project Management Jira / Linear Tasks Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-surface-900/80 glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Jira & Linear Task Provisioning</h3>
              <p className="text-xs text-slate-400">
                Action items automatically created as engineering issue tickets
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {actionItems.length} Tickets Provisioned
          </span>
        </div>

        <div className="space-y-2.5">
          {actionItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs gap-3"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 font-mono font-bold text-[11px] border border-blue-500/30 shrink-0">
                  {item.jira_issue_key || `ENG-${4890 + idx}`}
                </span>
                <p className="text-slate-200 font-medium truncate">{item.description}</p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <span className="text-[11px] text-slate-400">
                  Assignee: <strong className="text-white">{item.owner_name || 'Unassigned'}</strong>
                </span>
                <a
                  href={item.linear_issue_url || `https://linear.app/webenoid/issue/ENG-${4890 + idx}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 text-[11px] text-brand-400 hover:text-brand-300 font-mono"
                >
                  <span>Open Ticket</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CRM and Calendar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CRM Integration */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-surface-900/80 glass-panel space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">CRM Sync</h3>
                <p className="text-xs text-slate-400">
                  Meeting logged to Salesforce/HubSpot
                </p>
              </div>
            </div>
            {distribution?.crm_record_id ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>SYNCED</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30 font-mono">
                <span>PENDING</span>
              </span>
            )}
          </div>
          <div className="text-xs text-slate-300 flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span>Record ID: <strong className="font-mono text-indigo-300">{distribution?.crm_record_id || 'N/A'}</strong></span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>

        {/* Calendar Integration */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-surface-900/80 glass-panel space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Calendar Update</h3>
                <p className="text-xs text-slate-400">
                  Event updated with meeting summary
                </p>
              </div>
            </div>
            {distribution?.calendar_event_id ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>UPDATED</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30 font-mono">
                <span>PENDING</span>
              </span>
            )}
          </div>
          <div className="text-xs text-slate-300 flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span>Event ID: <strong className="font-mono text-rose-300">{distribution?.calendar_event_id || 'N/A'}</strong></span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
