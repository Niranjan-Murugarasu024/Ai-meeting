import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { MeetingLibrary } from './components/MeetingLibrary.tsx';
import { MeetingUploadModal } from './components/MeetingUploadModal.tsx';
import { LiveBotJoinModal } from './components/LiveBotJoinModal.tsx';
import { IntegrationsSettingsModal } from './components/IntegrationsSettingsModal.tsx';
import { MeetingDetailView } from './components/MeetingDetailView.tsx';
import { SemanticSearchView } from './components/SemanticSearchView.tsx';
import { GlobalActionsHub } from './components/GlobalActionsHub.tsx';
import { EvalScorecardView } from './components/EvalScorecardView.tsx';
import { ComplianceStudioView } from './components/ComplianceStudioView.tsx';
import { fetchMeetings, fetchStats, deleteMeeting, retryMeeting } from './services/api.ts';
import { Meeting, MeetingStats } from '../types/index.ts';

export function App() {
  const [currentView, setCurrentView] = useState<'library' | 'search' | 'actions' | 'eval' | 'compliance' | 'detail'>('library');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [initialSeekMs, setInitialSeekMs] = useState<number>(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLiveBotModalOpen, setIsLiveBotModalOpen] = useState(false);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    const pollInterval = setInterval(() => {
      loadData(false);
    }, 4000);
    return () => clearInterval(pollInterval);
  }, []);

  const loadData = async (showLoadingSpinner: boolean = true) => {
    if (showLoadingSpinner) setIsLoading(true);
    try {
      const [meetingsRes, statsRes] = await Promise.all([
        fetchMeetings(),
        fetchStats(),
      ]);
      setMeetings(meetingsRes.meetings);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load meetings or telemetry stats:', err);
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  };

  const handleSelectMeeting = (meetingId: string, initialTimestampMs: number = 0) => {
    setSelectedMeetingId(meetingId);
    setInitialSeekMs(initialTimestampMs);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLibrary = () => {
    setSelectedMeetingId(null);
    setCurrentView('library');
    loadData(false);
  };

  const handleUploadSuccess = (newMeeting: Meeting) => {
    loadData(false);
    handleSelectMeeting(newMeeting.id);
  };

  const handleLiveBotMeetingCompleted = (newMeeting: Meeting) => {
    loadData(false);
    handleSelectMeeting(newMeeting.id);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    await deleteMeeting(meetingId);
    loadData(false);
    if (selectedMeetingId === meetingId) {
      handleBackToLibrary();
    }
  };

  const handleRetryMeeting = async (meetingId: string) => {
    await retryMeeting(meetingId);
    loadData(false);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-brand-500/30 selection:text-brand-200">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView === 'detail' ? 'library' : currentView}
        onNavigate={view => {
          setCurrentView(view);
          setSelectedMeetingId(null);
        }}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenLiveBot={() => setIsLiveBotModalOpen(true)}
        onOpenIntegrations={() => setIsIntegrationsModalOpen(true)}
        stats={stats}
      />

      {/* Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'library' && (
          <MeetingLibrary
            meetings={meetings}
            onSelectMeeting={handleSelectMeeting}
            onDeleteMeeting={handleDeleteMeeting}
            onRetryMeeting={handleRetryMeeting}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            isLoading={isLoading}
          />
        )}

        {currentView === 'search' && (
          <SemanticSearchView onSelectMeeting={handleSelectMeeting} />
        )}

        {currentView === 'actions' && (
          <GlobalActionsHub onSelectMeeting={handleSelectMeeting} />
        )}

        {currentView === 'eval' && (
          <EvalScorecardView />
        )}

        {currentView === 'compliance' && (
          <ComplianceStudioView />
        )}

        {currentView === 'detail' && selectedMeetingId && (
          <MeetingDetailView
            meetingId={selectedMeetingId}
            initialTimestampMs={initialSeekMs}
            onBack={handleBackToLibrary}
            onMeetingDeleted={handleBackToLibrary}
          />
        )}
      </main>

      {/* Upload Modal */}
      <MeetingUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Live AI Bot Dispatcher Modal */}
      <LiveBotJoinModal
        isOpen={isLiveBotModalOpen}
        onClose={() => setIsLiveBotModalOpen(false)}
        onMeetingCompleted={handleLiveBotMeetingCompleted}
      />

      {/* Integrations Settings Modal */}
      <IntegrationsSettingsModal
        isOpen={isIntegrationsModalOpen}
        onClose={() => setIsIntegrationsModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-surface-950/60 py-6 mt-12 text-center text-xs text-slate-500 font-mono">
        <p>
          AI Meeting Intelligence Platform • Python FastAPI Backend & AI Pipeline • Zoom, Google Meet, Teams, Webex & Slack Integrated
        </p>
      </footer>
    </div>
  );
}
