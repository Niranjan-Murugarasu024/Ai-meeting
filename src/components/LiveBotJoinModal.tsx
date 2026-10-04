import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  Video,
  Sparkles,
  Mic,
  Volume2,
  CheckCircle2,
  Radio,
  Share2,
  Layers,
  ArrowRight,
  ShieldAlert,
  Send,
  Sliders,
  Check,
} from 'lucide-react';
import { PlatformType, LiveBotJoinRequest, Meeting } from '../../types/index.ts';
import { joinLiveBot, endLiveMeeting } from '../services/api.ts';

interface LiveBotJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingCompleted: (meeting: Meeting) => void;
}

export const LiveBotJoinModal: React.FC<LiveBotJoinModalProps> = ({
  isOpen,
  onClose,
  onMeetingCompleted,
}) => {
  const [platform, setPlatform] = useState<PlatformType>('zoom');
  const [meetingUrl, setMeetingUrl] = useState('https://zoom.us/j/98421049281');
  const [meetingTitle, setMeetingTitle] = useState('Project Alpha Architecture & Multi-Platform Sync');
  const [botName, setBotName] = useState('Webenoid AI Meeting Bot');
  const [slackChannel, setSlackChannel] = useState('#project-alpha-sync');
  const [enableNoiseCancellation, setEnableNoiseCancellation] = useState(true);
  const [enableAccentAdaptation, setEnableAccentAdaptation] = useState(true);
  const [autoCreateJira, setAutoCreateJira] = useState(true);

  // Live session state
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isEndingMeeting, setIsEndingMeeting] = useState(false);
  const [liveDurationSec, setLiveDurationSec] = useState(45);
  const [liveSegments, setLiveSegments] = useState<
    Array<{ speaker: string; text: string; lang: string; accent: string; time: string }>
  >([]);

  useEffect(() => {
    if (platform === 'webrtc') setMeetingUrl('https://webenoid.internal/webrtc/live-room');
    else if (platform === 'zoom') setMeetingUrl('https://zoom.us/j/98421049281');
    else if (platform === 'google_meet') setMeetingUrl('https://meet.google.com/abc-wxyz-qrs');
    else if (platform === 'ms_teams') setMeetingUrl('https://teams.microsoft.com/l/meetup-join/19%3ameeting_alpha');
    else if (platform === 'webex') setMeetingUrl('https://webenoid.webex.com/meet/team-alpha');
  }, [platform]);

  useEffect(() => {
    let timer: any = null;
    if (isLiveSessionActive) {
      timer = setInterval(() => {
        setLiveDurationSec(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLiveSessionActive]);

  if (!isOpen) return null;

  const handleStartBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);

    try {
      const req: LiveBotJoinRequest = {
        platform,
        meeting_url: meetingUrl,
        meeting_title: meetingTitle,
        bot_name: botName,
        enable_noise_cancellation: enableNoiseCancellation,
        enable_accent_adaptation: enableAccentAdaptation,
        auto_post_slack: true,
        slack_channel: slackChannel,
        auto_create_jira_tasks: autoCreateJira,
        project_key: 'ENG',
      };

      await joinLiveBot(req);

      // Initialize live simulated transcript feed
      setLiveSegments([
        {
          speaker: 'Niranjan S.',
          text: 'Namaste everyone. Welcome to the live Project Alpha sync. Let’s review the streaming bot architecture and Slack webhook auto-delivery.',
          lang: 'en-IN',
          accent: 'Indian English',
          time: '00:05',
        },
        {
          speaker: 'Elena Rostova',
          text: 'Bonjour Niranjan. The Zoom and Teams bot listeners are receiving live audio packets with sub-150ms buffer latency.',
          lang: 'en-EU',
          accent: 'European / Slavic',
          time: '00:18',
        },
        {
          speaker: 'Marcus Vance',
          text: 'Perfect. When this call ends, the NLP pipeline should immediately extract decisions and broadcast to Slack.',
          lang: 'en-US',
          accent: 'North American',
          time: '00:32',
        },
      ]);

      setIsJoining(false);
      setIsLiveSessionActive(true);
    } catch (err: any) {
      setIsJoining(false);
      alert(err?.message || 'Failed to dispatch bot');
    }
  };

  const handleEndLiveMeeting = async () => {
    setIsEndingMeeting(true);
    try {
      const result = await endLiveMeeting({
        meeting_title: meetingTitle,
        platform: platform,
        meeting_url: meetingUrl,
        slack_channel: slackChannel,
      });

      setIsEndingMeeting(false);
      setIsLiveSessionActive(false);
      onMeetingCompleted(result.meeting);
      onClose();
    } catch (err: any) {
      setIsEndingMeeting(false);
      alert(err?.message || 'Failed to end and process live meeting');
    }
  };

  const formatLiveTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-surface-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden glass-panel">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-surface-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 text-white shadow-glow">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {isLiveSessionActive ? 'Live Meeting Assistant Active' : 'AI Meeting Bot Dispatcher'}
                </h2>
                {isLiveSessionActive && (
                  <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>REC • {formatLiveTimer(liveDurationSec)}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isLiveSessionActive
                  ? 'Real-time audio streaming, accent-adaptation & polyglot diarization active'
                  : 'Zoom • Google Meet • Microsoft Teams • Cisco Webex'}
              </p>
            </div>
          </div>
          {!isLiveSessionActive && (
            <button
              onClick={onClose}
              disabled={isJoining}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        {!isLiveSessionActive ? (
          /* STEP 1: CONFIGURE & JOIN */
          <form onSubmit={handleStartBot} className="p-6 space-y-5">
            {/* Platform Selector Tabs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Target Ingestion Source / Platform:</label>
                <span className="text-[10px] text-brand-400 font-mono bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                  Source-Agnostic Adapter Active
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'webrtc', label: 'WebRTC Client', desc: 'In-Browser Mic', color: '#10B981' },
                  { id: 'zoom', label: 'Zoom SDK', desc: 'Server-to-Server', color: '#2D8CFF' },
                  { id: 'google_meet', label: 'Google Meet', desc: 'Media API Hook', color: '#00AC47' },
                  { id: 'ms_teams', label: 'MS Teams', desc: 'Graph Call Bot', color: '#6264A7' },
                  { id: 'webex', label: 'Cisco Webex', desc: 'Media REST API', color: '#00C8FF' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id as PlatformType)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                      platform === p.id
                        ? 'bg-brand-500/15 border-brand-500/60 shadow-glow text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span>{p.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Meeting URL & Title Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Meeting Link / URL
                </label>
                <input
                  type="text"
                  value={meetingUrl}
                  onChange={e => setMeetingUrl(e.target.value)}
                  placeholder="https://zoom.us/j/98421049281"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Meeting Name / Agenda
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  placeholder="Project Alpha Sync"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Automated Distribution Config */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center space-x-1.5">
                  <Share2 className="w-3.5 h-3.5 text-brand-400" />
                  <span>Automated Post-Meeting Distribution</span>
                </span>
                <span className="text-[10px] text-brand-400 font-mono">Real-time Webhook</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">
                    Broadcast to Slack Channel:
                  </label>
                  <input
                    type="text"
                    value={slackChannel}
                    onChange={e => setSlackChannel(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <input
                    type="checkbox"
                    id="jira-auto"
                    checked={autoCreateJira}
                    onChange={e => setAutoCreateJira(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-brand-500 focus:ring-brand-500"
                  />
                  <label htmlFor="jira-auto" className="text-xs text-slate-300 cursor-pointer">
                    Auto-create tasks in Jira & Linear
                  </label>
                </div>
              </div>
            </div>

            {/* Edge Cases & AI Pipeline Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setEnableNoiseCancellation(!enableNoiseCancellation)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-2.5 ${
                  enableNoiseCancellation
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={enableNoiseCancellation}
                  onChange={() => {}}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-xs font-bold text-white">Noise Cancellation Preprocessing</p>
                  <p className="text-[11px] text-slate-400">
                    DeepFilterNet spectral gating for poor microphones and room noise.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setEnableAccentAdaptation(!enableAccentAdaptation)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-2.5 ${
                  enableAccentAdaptation
                    ? 'bg-indigo-500/10 border-indigo-500/30'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={enableAccentAdaptation}
                  onChange={() => {}}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-xs font-bold text-white">Accent-Adaptive & Code-Switching</p>
                  <p className="text-[11px] text-slate-400">
                    Phoneme compensation for heavy global accents & multi-language shifts.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isJoining}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isJoining}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow hover:scale-[1.02] transition-all"
              >
                {isJoining ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Connecting Bot...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Dispatch AI Bot to Meeting</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: ACTIVE LIVE ROOM STREAM */
          <div className="p-6 space-y-5">
            {/* Live Audio Telemetry Strip */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center space-x-3">
                <div className="flex items-end space-x-1 h-5 px-1">
                  <div className="w-1 bg-emerald-400 rounded-full animate-wave" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1 bg-brand-400 rounded-full animate-wave" style={{ animationDelay: '0.3s' }} />
                  <div className="w-1 bg-cyan-400 rounded-full animate-wave" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 bg-indigo-400 rounded-full animate-wave" style={{ animationDelay: '0.4s' }} />
                </div>
                <div>
                  <p className="font-bold text-white flex items-center space-x-2">
                    <span>{meetingTitle}</span>
                    <span className="text-[10px] text-emerald-400 font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                      Live Streaming
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Target: {platform.toUpperCase()} • Noise Reduction: Active (-18.5 dB SNR)
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-slate-400">
                <span className="text-white font-bold">{formatLiveTimer(liveDurationSec)}</span> elapsed
              </div>
            </div>

            {/* Real-time Streaming Transcript Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Live Transcript & Diarization Feed:</span>
                <span className="text-[10px] font-mono text-brand-400 animate-pulse">
                  ● Real-Time STT Buffer (150ms)
                </span>
              </div>

              <div className="h-64 overflow-y-auto space-y-2.5 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                {liveSegments.map((seg, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-surface-900/60 border border-slate-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-brand-300">{seg.speaker}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                          {seg.accent}
                        </span>
                        <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                          [{seg.lang}]
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{seg.time}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{seg.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Execution Flow Card */}
            <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-400 shrink-0 animate-spin" />
                <span>
                  <strong>User Flow Active:</strong> Audio Stream &rarr; Diarization &rarr; NLP Topics &rarr; Action Extraction &rarr; Slack Broadcast ({slackChannel})
                </span>
              </div>
            </div>

            {/* End Call & Trigger Processing Action */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleEndLiveMeeting}
                disabled={isEndingMeeting}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-glow hover:scale-[1.02] transition-all"
              >
                {isEndingMeeting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Processing AI Extraction & Slack Broadcast...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>End Meeting & Execute AI Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
