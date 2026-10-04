import React, { useState } from 'react';
import { ActionItem, ActionItemStatus } from '../../types/index.ts';
import { CheckCircle2, Clock, Circle, User, Calendar, AlertCircle, Sparkles, Filter } from 'lucide-react';

interface ActionItemsViewProps {
  actionItems: ActionItem[];
  onStatusChange: (actionId: string, newStatus: ActionItemStatus) => Promise<void>;
  readOnly?: boolean;
}

export const ActionItemsView: React.FC<ActionItemsViewProps> = ({
  actionItems,
  onStatusChange,
  readOnly = false,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const uniqueOwners = Array.from(
    new Set(actionItems.map(a => a.owner_name).filter(Boolean))
  ) as string[];

  const hasUnassigned = actionItems.some(a => !a.owner_name);

  const filteredItems = actionItems.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesOwner =
      filterOwner === 'all' ||
      (filterOwner === 'unassigned' ? !item.owner_name : item.owner_name === filterOwner);

    return matchesStatus && matchesOwner;
  });

  const handleToggle = async (item: ActionItem) => {
    if (readOnly) return;
    const nextStatus: ActionItemStatus =
      item.status === 'open' ? 'in-progress' : item.status === 'in-progress' ? 'done' : 'open';

    setUpdatingId(item.id);
    try {
      await onStatusChange(item.id, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: ActionItemStatus) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Done</span>
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>In Progress</span>
          </span>
        );
      case 'open':
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Circle className="w-3.5 h-3.5 text-slate-400" />
            <span>Open</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter and Overview Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-900/80 border border-slate-800 glass-panel">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-semibold text-white">
            Extracted Action Items ({actionItems.length})
          </span>
          <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-800">
            {actionItems.filter(a => a.status === 'done').length} Completed
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Completed</option>
          </select>

          {/* Owner filter */}
          <select
            value={filterOwner}
            onChange={e => setFilterOwner(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Owners</option>
            {uniqueOwners.map(owner => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
            {hasUnassigned && <option value="unassigned">Unassigned</option>}
          </select>
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-surface-900/40 border border-slate-800 text-slate-400 text-sm">
            No action items match the selected filter.
          </div>
        ) : (
          filteredItems.map(item => {
            const isUpdating = updatingId === item.id;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all glass-panel ${
                  item.status === 'done'
                    ? 'bg-surface-950/40 border-slate-800/60 opacity-80'
                    : 'bg-surface-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Interactive Checkbox / Toggle & Description */}
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggle(item)}
                      disabled={readOnly || isUpdating}
                      title={`Click to cycle status (Current: ${item.status})`}
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

                      {/* Metadata Row: Owner & Due Date per PRD specification */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                        {/* Owner Badge */}
                        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
                          <User className="w-3 h-3 text-brand-400" />
                          <span>
                            {item.owner_name ? (
                              <strong className="text-slate-200">{item.owner_name}</strong>
                            ) : (
                              <em className="text-slate-400">Unassigned (Unstated in audio)</em>
                            )}
                          </span>
                        </div>

                        {/* Due Date Badge */}
                        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          <span>
                            {item.due_date ? (
                              <strong className="text-slate-200">{item.due_date}</strong>
                            ) : (
                              <em className="text-slate-400">No deadline stated</em>
                            )}
                          </span>
                        </div>

                        {/* Priority */}
                        {item.priority && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                              item.priority === 'high'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : item.priority === 'medium'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.priority} Priority
                          </span>
                        )}

                        {/* Model Tier Audit Badge */}
                        {item.model_tier && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                              item.model_tier === 'conformer-xl'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            }`}
                            title={`Derived from ${item.model_tier} transcription (Fidelity: ${item.upstream_stt_fidelity || 'standard'})`}
                          >
                            {item.model_tier === 'conformer-xl' ? 'XL-TIER' : `${item.model_tier.replace('conformer-', '').toUpperCase()} (SHED)`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Pill */}
                  <div className="shrink-0">
                    <button
                      onClick={() => handleToggle(item)}
                      disabled={readOnly || isUpdating}
                      className="cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    >
                      {getStatusBadge(item.status)}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
