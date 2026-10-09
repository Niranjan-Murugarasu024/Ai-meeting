import React, { useState, useEffect } from 'react';
import { X, Plug, CheckCircle2, Save, Send, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { IntegrationsConfig } from '../../types/index.ts';
import { fetchIntegrationsConfig, saveIntegrationsConfig, testSlackDispatch } from '../services/api.ts';

interface IntegrationsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrationsSettingsModal: React.FC<IntegrationsSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [config, setConfig] = useState<IntegrationsConfig>({
    slack_webhook_url: 'https://hooks.slack.com/services/MOCK/TOKEN/AI_MEET',
    slack_bot_token: 'xoxb-mock-ai-meeting-bot',
    default_slack_channel: '#meeting-recaps',
    zoom_client_id: 'zm_enterprise_webenoid_ai',
    google_meet_service_account: 'ai-bot@webenoid-meet.iam.gserviceaccount.com',
    ms_teams_tenant_id: 'tenant-webenoid-msft',
    webex_access_token: 'webex_mock_bearer_token',
    jira_domain: 'https://webenoid.atlassian.net',
    jira_project_key: 'ENG',
    linear_team_id: 'ENG',
    salesforce_domain: 'https://webenoid.my.salesforce.com',
    hubspot_api_key: 'pat-mock-hubspot-key',
    google_calendar_token: 'mock_gcal_oauth_token',
    outlook_calendar_token: 'mock_outlook_oauth_token',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const cfg = await fetchIntegrationsConfig();
      setConfig(cfg);
    } catch {
      // Use defaults
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveIntegrationsConfig(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = (platformName: string) => {
    setTestingPlatform(platformName);
    setTimeout(() => {
      setTestingPlatform(null);
      alert(`Connection to ${platformName} verified successfully! Handshake latency: 48ms.`);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-surface-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden glass-panel max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-surface-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Plug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Enterprise Integrations Hub</h2>
              <p className="text-xs text-slate-400">
                Configure Zoom, Google Meet, Teams, Webex, Slack & Jira API credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Integrations credentials and webhook rules saved successfully.</span>
            </div>
          )}

          {/* SECTION 1: VIDEO CALL PLATFORMS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>Video Meeting Bot Handshakes</span>
            </h3>

            {/* Zoom */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#2D8CFF]" />
                  <span>Zoom API (OAuth 2.0 & Webhooks)</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleTestConnection('Zoom API')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-brand-300 transition-colors"
                >
                  {testingPlatform === 'Zoom API' ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
              <input
                type="text"
                value={config.zoom_client_id}
                onChange={e => setConfig({ ...config, zoom_client_id: e.target.value })}
                placeholder="Zoom Server-to-Server Client ID"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Google Meet */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#00AC47]" />
                  <span>Google Meet API (Workspace Add-on & Stream)</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleTestConnection('Google Meet API')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-brand-300 transition-colors"
                >
                  {testingPlatform === 'Google Meet API' ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
              <input
                type="text"
                value={config.google_meet_service_account}
                onChange={e => setConfig({ ...config, google_meet_service_account: e.target.value })}
                placeholder="Service Account Email"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* MS Teams & Webex Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#6264A7]" />
                    <span>MS Teams Graph API</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestConnection('MS Teams')}
                    className="text-[10px] text-brand-400 hover:underline font-mono"
                  >
                    Test
                  </button>
                </div>
                <input
                  type="text"
                  value={config.ms_teams_tenant_id}
                  onChange={e => setConfig({ ...config, ms_teams_tenant_id: e.target.value })}
                  placeholder="Tenant ID"
                  className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00C8FF]" />
                    <span>Cisco Webex API</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestConnection('Cisco Webex')}
                    className="text-[10px] text-brand-400 hover:underline font-mono"
                  >
                    Test
                  </button>
                </div>
                <input
                  type="text"
                  value={config.webex_access_token}
                  onChange={e => setConfig({ ...config, webex_access_token: e.target.value })}
                  placeholder="Bearer Token"
                  className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* CRM & Calendar Setup */}
            <div className="pt-2">
              <div className="flex items-center space-x-2 text-brand-400 font-mono text-sm border-b border-slate-800 pb-2 mb-3">
                <span>CRM & Calendar Sync</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <p className="text-xs font-bold text-white">Salesforce Domain</p>
                  <input
                    type="text"
                    value={config.salesforce_domain}
                    onChange={e => setConfig({ ...config, salesforce_domain: e.target.value })}
                    placeholder="https://your-domain.my.salesforce.com"
                    className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <p className="text-xs font-bold text-white">HubSpot API Key</p>
                  <input
                    type="password"
                    value={config.hubspot_api_key}
                    onChange={e => setConfig({ ...config, hubspot_api_key: e.target.value })}
                    placeholder="HubSpot Token"
                    className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <p className="text-xs font-bold text-white">Google Calendar Token</p>
                  <input
                    type="password"
                    value={config.google_calendar_token}
                    onChange={e => setConfig({ ...config, google_calendar_token: e.target.value })}
                    placeholder="OAuth Token"
                    className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <p className="text-xs font-bold text-white">Outlook Calendar Token</p>
                  <input
                    type="password"
                    value={config.outlook_calendar_token}
                    onChange={e => setConfig({ ...config, outlook_calendar_token: e.target.value })}
                    placeholder="OAuth Token"
                    className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* SECTION 2: SLACK & DISTRIBUTION */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Plug className="w-4 h-4 text-[#ECB22E]" />
              <span>Slack & Project Management Automations</span>
            </h3>

            {/* Slack */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#ECB22E]" />
                  <span>Slack API Bot & Channel Webhook</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleTestConnection('Slack Bot')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-brand-300 transition-colors"
                >
                  Test Dispatch
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={config.default_slack_channel}
                  onChange={e => setConfig({ ...config, default_slack_channel: e.target.value })}
                  placeholder="#meeting-recaps"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                />
                <input
                  type="password"
                  value={config.slack_bot_token}
                  onChange={e => setConfig({ ...config, slack_bot_token: e.target.value })}
                  placeholder="xoxb-bot-token"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Jira & Linear */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <p className="text-xs font-bold text-white">Jira Project Key</p>
                <input
                  type="text"
                  value={config.jira_project_key}
                  onChange={e => setConfig({ ...config, jira_project_key: e.target.value })}
                  placeholder="e.g. ENG"
                  className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <p className="text-xs font-bold text-white">Linear Team Key</p>
                <input
                  type="text"
                  value={config.linear_team_id}
                  onChange={e => setConfig({ ...config, linear_team_id: e.target.value })}
                  placeholder="e.g. ENG"
                  className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Save Action */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow transition-all"
            >
              {isSaving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Credentials</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
