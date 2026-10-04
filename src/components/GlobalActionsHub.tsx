import React, { useState, useEffect } from 'react';
import { Meeting, ActionItem, ActionItemStatus } from '../../types/index.ts';
import { fetchMeetings, fetchActionItems, updateActionItemStatus } from '../services/api.ts';
import { CheckSquare, CheckCircle2, Clock, Circle, User, Calendar, ArrowRight, Filter, Sparkles } from 'lucide-react';

interface GlobalActionsHubProps {
  onSelectMeeting: (meetingId: string) => void;
}

interface ActionWithMeeting extends ActionItem {
  meetingTitle: string;
}

export const GlobalActionsHub: React.FC<GlobalActionsHubProps> = ({ onSelectMeeting }) => {
  const [actions, setActions] = useState<ActionWithMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');

  useEffect(() => {
    loadAllActions();
  }, []);

  const loadAllActions = async () => {
    setIsLoading(true);
    try {
      const meetingsData = await fetchMeetings();
      const allActions: ActionWithMeeting[] = [];

      for (const m of meetingsData.meetings) {
        if (m.status === 'ready') {
          try {
            const actRes = await fetchActionItems(m.id);
            for (const item of actRes.action_items) {
              allActions.push({
                ...item,
                meetingTitle: m.title,
              });
            }
          } catch {
            // ignore
          }
        }
      }

      setActions(allActions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusToggle = async (item: ActionWithMeeting) => {
    const nextStatus: ActionItemStatus =
      item.status === 'open' ? 'in-progress' : item.status === 'in-progress' ? 'done' : 'open';

    try {
      const updated = await updateActionItemStatus(item.id, nextStatus);
      setActions(prev =>
        prev.map(a => (a.id === item.id ? { ...a, status: updated.status } : a))
      );
    } catch (err) {
      alert('Failed to update action item');
    }
  };

  const uniqueOwners = Array.from(
    new Set(actions.map(a => a.owner_name).filter(Boolean))
  ) as string[];

  const filtered = actions.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesOwner =
      ownerFilter === 'all' ||
      (ownerFilter === 'unassigned' ? !item.owner_name : item.owner_name === ownerFilter);

    return matchesStatus && matchesOwner;
  });

  const doneCount = actions.filter(a => a.status === 'done').length;
  const inProgressCount = actions.filter(a => a.status === 'in-progress').length;
  const openCount = actions.filter(a => a.status === 'open').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300 mb-2">
            <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>Cross-Meeting Action Items Hub</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">
            Consolidated Action Items & Task Tracker
          </h1>
          <p className="text-xs text-slate-400">
            Track ownership and deadlines extracted across all organization meetings in one unified queue
          </p>
        </div>

        {/* Quick KPI Stat Chips */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500">Open:</span> <strong className="text-white">{openCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-300">
            <span className="text-slate-500">In Progress:</span>{' '}
            <strong>{inProgressCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300">
            <span className="text-slate-500">Done:</span> <strong>{doneCount}</strong>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-900/80 border border-slate-800 glass-panel">
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Tasks:</span>
        </div>

        <div className="flex items-center space-x-2.5">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Statuses ({actions.length})</option>
            <option value="open">Open ({openCount})</option>
            <option value="in-progress">In Progress ({inProgressCount})</option>
            <option value="done">Completed ({doneCount})</option>
          </select>

          <select
            value={ownerFilter}
            onChange={e => setOwnerFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Assignees</option>
            {uniqueOwners.map(owner => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
            <option value="unassigned">Unassigned (Unstated in audio)</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Aggregating action items from all recordings...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface-900/40 border border-slate-800 text-slate-400 text-sm">
          No action items found for the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all glass-panel ${
                item.status === 'done'
                  ? 'bg-surface-950/40 border-slate-800/60 opacity-80'
                  : 'bg-surface-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Checkbox toggle & Task Description */}
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleStatusToggle(item)}
                    className={`mt-0.5 p-1 rounded-lg transition-all focus:outline-none ${
                      item.status === 'done'
                        ? 'text-emerald-400 hover:bg-emerald-500/10'
                        : item.status === 'in-progress'
                        ? 'text-amber-400 hover:bg-amber-500/10'
                        : 'text-slate-500 hover:text-brand-400 hover:bg-slate-800'
                    }`}
                  >
                    {item.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : item.status === 'in-progress' ? (
                      <Clock className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium leading-relaxed ${
                        item.status === 'done' ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {item.description}
                    </p>

                    {/* Meeting Link & Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                      {/* Meeting origin chip */}
                      <button
                        onClick={() => onSelectMeeting(item.meeting_id)}
                        className="flex items-center space-x-1 px-2 py-0.5 rounded bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[11px] font-medium transition-colors"
                      >
                        <span>From: {item.meetingTitle}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      {/* Owner */}
                      <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-300">
                        <User className="w-3 h-3 text-brand-400" />
                        <span>
                          {item.owner_name ? (
                            <strong>{item.owner_name}</strong>
                          ) : (
                            <em className="text-slate-400">Unassigned</em>
                          )}
                        </span>
                      </div>

                      {/* Due date */}
                      <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-300">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        <span>
                          {item.due_date ? (
                            <strong>{item.due_date}</strong>
                          ) : (
                            <em className="text-slate-400">No deadline</em>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Status Pill */}
                <button
                  onClick={() => handleStatusToggle(item)}
                  className="shrink-0 text-xs font-semibold"
                >
                  {item.status === 'done' ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      Done
                    </span>
                  ) : item.status === 'in-progress' ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      In Progress
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      Open
                    </span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
