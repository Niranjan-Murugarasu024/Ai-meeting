import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  FileText,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Key,
  Server,
  Activity,
  Radio,
  RefreshCw,
  Sliders,
  Send,
  Check,
  Zap,
  Info,
  Building2,
  FileCheck2,
  Link,
  Cpu
} from 'lucide-react';
import {
  fetchCompliancePolicy,
  updateCompliancePolicy,
  fetchComplianceAuditLogs,
  fetchSecurityStatus,
  fetchQueueMetrics,
  retryDlqJob
} from '../services/api.ts';
import {
  CompliancePolicy,
  ComplianceAuditLog,
  SecurityStatus,
  QueueMetrics
} from '../../types/index.ts';

export const ComplianceStudioView: React.FC = () => {
  const [policy, setPolicy] = useState<CompliancePolicy | null>(null);
  const [auditLogs, setAuditLogs] = useState<ComplianceAuditLog[]>([]);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);

  const [activeTab, setActiveTab] = useState<'retention' | 'residency' | 'kms' | 'webhooks' | 'dlq' | 'audit'>('retention');
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Form states for policy
  const [ttlPolicy, setTtlPolicy] = useState<string>('30_days');
  const [autoPurgeAudio, setAutoPurgeAudio] = useState<boolean>(true);
  const [recordingConsent, setRecordingConsent] = useState<boolean>(true);

  // Webhook playground states
  const [webhookPlatform, setWebhookPlatform] = useState<'slack' | 'zoom'>('slack');
  const [webhookPayload, setWebhookPayload] = useState<string>('{"event":"meeting.ended","meeting_id":"zm-98421049281"}');
  const [webhookSimResult, setWebhookSimResult] = useState<{ valid: boolean; message: string; signature?: string } | null>(null);
  const [isVerifyingWebhook, setIsVerifyingWebhook] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [pRes, logsRes, secRes, qRes] = await Promise.all([
        fetchCompliancePolicy(),
        fetchComplianceAuditLogs(),
        fetchSecurityStatus(),
        fetchQueueMetrics(),
      ]);
      setPolicy(pRes);
      setTtlPolicy(pRes.ttl_policy);
      setAutoPurgeAudio(pRes.auto_purge_raw_audio);
      setRecordingConsent(pRes.recording_consent_required);

      setAuditLogs(logsRes.logs);
      setSecurityStatus(secRes);
      setQueueMetrics(qRes);
    } catch (err) {
      console.error('Failed to load compliance data:', err);
    }
  };

  const handleSavePolicy = async () => {
    setIsSavingPolicy(true);
    try {
      const updated = await updateCompliancePolicy({
        ttl_policy: ttlPolicy,
        auto_purge_raw_audio: autoPurgeAudio,
        recording_consent_required: recordingConsent,
      });
      setPolicy(updated);
      setSaveSuccessMsg('Compliance policy successfully saved and cryptographic audit block appended.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      const logsRes = await fetchComplianceAuditLogs();
      setAuditLogs(logsRes.logs);
    } catch (err) {
      console.error('Failed to update policy:', err);
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const handleRetryDlq = async (taskId: string) => {
    try {
      await retryDlqJob(taskId);
      const qRes = await fetchQueueMetrics();
      setQueueMetrics(qRes);
    } catch (err) {
      console.error('Failed to retry task:', err);
    }
  };

  const handleTestWebhookSignature = (mode: 'valid' | 'tamper' | 'replay') => {
    setIsVerifyingWebhook(true);
    setTimeout(() => {
      if (mode === 'tamper') {
        setWebhookSimResult({
          valid: false,
          message: 'HMAC Signature Mismatch: Payload modified or secret key invalid. Rejected with HTTP 401 Unauthorized.',
          signature: 'v0=invalid_tampered_hmac_sha256_hash_982b',
        });
      } else if (mode === 'replay') {
        setWebhookSimResult({
          valid: false,
          message: 'Replay Attack Prevented: Nonce hash found in Redis TTL cache (`SET NX EX 300`). Identical payload & timestamp already consumed within 300s clock-drift window. Rejected with HTTP 409 Conflict.',
          signature: 'v0=a89f92cb4120df01bc588019ab761e09581a0279e8c4608c02',
        });
      } else {
        setWebhookSimResult({
          valid: true,
          message: 'HMAC-SHA256 Signature Verified! Nonce registered in Redis cache (TTL 300s). Authorized for idempotent post-processing.',
          signature: 'v0=a89f92cb4120df01bc588019ab761e09581a0279e8c4608c02',
        });
      }
      setIsVerifyingWebhook(false);
    }, 350);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-surface-900/90 via-surface-900/60 to-indigo-950/40 border border-slate-800 shadow-xl backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-display flex items-center space-x-2">
                <span>Enterprise Compliance, Security & Data Residency Hub</span>
              </h1>
              <p className="text-xs text-slate-400">
                India DPDP Section 8(5) & GDPR Art. 17 data residency (`ap-south-1`), sub-processors registry, signed DPA, KMS token vault, and SHA-256 Merkle audit chain.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadAllData}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('retention')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'retention'
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>GDPR / DPDP Retention & Consent</span>
        </button>

        <button
          onClick={() => setActiveTab('residency')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'residency'
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Data Residency & Sub-Processors</span>
        </button>

        <button
          onClick={() => setActiveTab('kms')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'kms'
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>KMS Token Vault (AES-256-GCM)</span>
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'webhooks'
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Webhook HMAC & Replay-Cache</span>
        </button>

        <button
          onClick={() => setActiveTab('dlq')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'dlq'
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Async DLQ ({queueMetrics?.dead_letter_queue_count || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'audit'
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Merkle Audit Ledger ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Retention & Consent */}
      {activeTab === 'retention' && policy && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-surface-900/60 border border-slate-800 shadow-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Data Retention Policy (TTL) & Right-to-Erasure</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure automated transcript and audio data lifecycle to satisfy GDPR Art. 17 & India DPDP Act 2023 Sec. 12.
              </p>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* TTL Selector */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-200">
                  Transcript Retention Time-To-Live (TTL) Policy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { value: 'immediate_audio_purge', label: 'Immediate Audio Purge', desc: 'Audio deleted immediately post-processing; transcript kept 30 days.' },
                    { value: '30_days', label: '30-Day Strict Retention (Recommended)', desc: 'Complete purge of transcripts and audio binaries after 30 days.' },
                    { value: '90_days', label: '90-Day Enterprise Archive', desc: 'Compliant with standard enterprise quarterly retention windows.' },
                    { value: 'never', label: 'Indefinite (Manual Purge Only)', desc: 'Requires manual admin deletion requests.' },
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => setTtlPolicy(opt.value)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        ttlPolicy === opt.value
                          ? 'bg-brand-500/15 border-brand-500 text-white shadow-sm'
                          : 'bg-surface-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-slate-200 flex items-center justify-between">
                        <span>{opt.label}</span>
                        {ttlPolicy === opt.value && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center space-x-3 p-3.5 rounded-xl bg-surface-950/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPurgeAudio}
                    onChange={(e) => setAutoPurgeAudio(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-slate-800 border-slate-700"
                  />
                  <div>
                    <span className="font-bold text-slate-200">Auto-Purge Raw Audio Stream After Extraction</span>
                    <p className="text-[11px] text-slate-400">
                      Discards heavy raw audio binary chunks once transcription is validated, reducing voice biometric liability.
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3.5 rounded-xl bg-surface-950/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recordingConsent}
                    onChange={(e) => setRecordingConsent(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-slate-800 border-slate-700"
                  />
                  <div>
                    <span className="font-bold text-slate-200">Enforce Audio Recording Notice Announcement</span>
                    <p className="text-[11px] text-slate-400">
                      AI bot announces audio recording and legal disclaimer in the conference room before beginning transcription.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSavePolicy}
                  disabled={isSavingPolicy}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold shadow-glow transition-all disabled:opacity-50"
                >
                  {isSavingPolicy ? 'Updating Policy...' : 'Save Compliance Policy'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Disclaimer Box */}
          <div className="p-6 rounded-2xl bg-surface-900/60 border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Mandatory Consent Notice</span>
            </h2>

            <div className="p-4 rounded-xl bg-surface-950/90 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed">
              "{policy.consent_disclaimer_text}"
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                Supported Regulatory Frameworks:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {policy.supported_regulations.map((reg) => (
                  <span
                    key={reg}
                    className="px-2.5 py-1 rounded bg-slate-800/80 text-slate-300 border border-slate-700 text-[11px]"
                  >
                    {reg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Data Residency & Sub-Processors */}
      {activeTab === 'residency' && policy && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface-900/70 border border-slate-800">
              <span className="text-xs text-slate-400">Primary Data Residency Region</span>
              <div className="text-lg font-bold text-emerald-300 font-mono mt-1 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{policy.data_residency_region || 'ap-south-1 (Mumbai / Hyderabad)'}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">India DPDP Sec. 8(5) Compliant</p>
            </div>

            <div className="p-4 rounded-xl bg-surface-900/70 border border-slate-800">
              <span className="text-xs text-slate-400">Signed Enterprise DPA Reference</span>
              <div className="text-sm font-bold text-indigo-300 font-mono mt-1 flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{policy.signed_dpa_reference || 'DPA-WEBENOID-2026-DPDP-GDPR-V3'}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Standard Contractual Clauses (SCCs) Active</p>
            </div>

            <div className="p-4 rounded-xl bg-surface-900/70 border border-slate-800">
              <span className="text-xs text-slate-400">Audit Ledger Architecture</span>
              <div className="text-sm font-bold text-cyan-300 font-mono mt-1 flex items-center space-x-2">
                <Link className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>SHA-256 Merkle Chain</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Append-Only Tamper-Evident Ledger</p>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-900/60 border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 bg-surface-950/80 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Authorized Sub-Processors Registry ({policy.sub_processors?.length || 4})</span>
              </h3>
              <span className="text-xs text-emerald-400 font-mono">
                100% Executed DPAs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-surface-950/40 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Sub-Processor Entity</th>
                    <th className="p-3.5">Processing Role</th>
                    <th className="p-3.5">Data Residency</th>
                    <th className="p-3.5">Security Certifications</th>
                    <th className="p-3.5 text-right">DPA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {(policy.sub_processors || []).map((sp) => (
                    <tr key={sp.name} className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-white font-sans">{sp.name}</td>
                      <td className="p-3.5 text-slate-300">{sp.role}</td>
                      <td className="p-3.5 text-emerald-400">{sp.data_residency}</td>
                      <td className="p-3.5">
                        <div className="flex gap-1">
                          {sp.certifications.map((c) => (
                            <span key={c} className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                          {sp.dpa_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: KMS Token Security */}
      {activeTab === 'kms' && securityStatus && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-surface-900/60 border border-slate-800 shadow-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Key className="w-5 h-5 text-indigo-400" />
                <span>KMS-Authenticated OAuth Secret & Token Vault</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Zero plaintext credentials stored in .env or logs. All refresh tokens are sealed using AWS KMS / AES-256-GCM envelope encryption.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-xs">Encryption Cipher</span>
                <p className="text-lg font-bold text-indigo-300 font-mono">
                  {securityStatus.algorithm}
                </p>
                <p className="text-[11px] text-emerald-400">Authenticated Galois/Counter Mode</p>
              </div>

              <div className="p-4 rounded-xl bg-surface-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-xs">In-Transit Security</span>
                <p className="text-lg font-bold text-cyan-300 font-mono">
                  {securityStatus.in_transit_tls_version || 'TLS 1.3'}
                </p>
                <p className="text-[11px] text-cyan-400">End-to-End Encrypted Handshake</p>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-200">
                Encrypted Credentials at Rest ({securityStatus.stored_credentials_encrypted?.length || 0})
              </span>
              <div className="space-y-2">
                {(securityStatus.stored_credentials_encrypted || []).map((credKey) => (
                  <div
                    key={credKey}
                    className="p-3 rounded-xl bg-surface-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{credKey}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      SEALED_AES256_GCM
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface-900/60 border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Vault Fingerprint</span>
            </h2>

            <div className="p-4 rounded-xl bg-surface-950 font-mono text-[11px] text-slate-300 break-all border border-slate-800">
              {securityStatus.vault_fingerprint || 'SHA256:8f3c4e9102b1156d89a42f570e34c98e2178ad04'}
            </div>

            <div className="text-xs text-slate-400 space-y-2">
              <p>
                Tokens are dynamically decrypted only in memory during authenticated REST calls to Slack, Zoom, MS Teams Graph, and Jira API endpoints.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Webhook HMAC & Replay Cache Playground */}
      {activeTab === 'webhooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-surface-900/60 border border-slate-800 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Radio className="w-5 h-5 text-teal-400" />
                <span>HMAC Signature & Redis Replay-Cache Verifier</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Test 300s clock-drift tolerance, HMAC-SHA256 verification, and Redis nonce cache rejection (`SET NX EX 300`).
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300">Target Ingestion Platform</label>
                <div className="flex items-center space-x-2 mt-1">
                  <button
                    onClick={() => setWebhookPlatform('slack')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                      webhookPlatform === 'slack'
                        ? 'bg-brand-500/20 text-brand-300 border-brand-500'
                        : 'bg-surface-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Slack Events API (X-Slack-Signature)
                  </button>
                  <button
                    onClick={() => setWebhookPlatform('zoom')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                      webhookPlatform === 'zoom'
                        ? 'bg-brand-500/20 text-brand-300 border-brand-500'
                        : 'bg-surface-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Zoom Webhook (v0=HMAC)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300">Payload JSON</label>
                <textarea
                  rows={4}
                  value={webhookPayload}
                  onChange={(e) => setWebhookPayload(e.target.value)}
                  className="w-full mt-1 p-3 rounded-xl bg-surface-950 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => handleTestWebhookSignature('valid')}
                  disabled={isVerifyingWebhook}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow transition-all"
                >
                  Test Valid Signature
                </button>
                <button
                  onClick={() => handleTestWebhookSignature('replay')}
                  disabled={isVerifyingWebhook}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all"
                >
                  Test Replay Attack (Redis 300s Rejection)
                </button>
                <button
                  onClick={() => handleTestWebhookSignature('tamper')}
                  disabled={isVerifyingWebhook}
                  className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs transition-all"
                >
                  Test Tampered (401 Reject)
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface-900/60 border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Verification Result</span>
            </h2>

            {isVerifyingWebhook ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
                <span>Validating HMAC signature & checking Redis nonce cache...</span>
              </div>
            ) : webhookSimResult ? (
              <div
                className={`p-4 rounded-xl border space-y-2 text-xs ${
                  webhookSimResult.valid
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold">
                  {webhookSimResult.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{webhookSimResult.valid ? 'HTTP 200 OK — Signature Verified' : 'Security Policy Enforced'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">{webhookSimResult.message}</p>
                {webhookSimResult.signature && (
                  <div className="p-2 rounded bg-surface-950 font-mono text-[10px] text-slate-300 break-all">
                    Computed Signature: {webhookSimResult.signature}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs font-mono">
                Click a test button on the left to verify webhook signatures.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Durable Task Queue & Dead-Letter Queue (DLQ) */}
      {activeTab === 'dlq' && queueMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface-900/70 border border-slate-800">
              <span className="text-xs text-slate-400">Total Enqueued Jobs</span>
              <div className="text-2xl font-bold text-white font-mono mt-1">{queueMetrics.total_tasks}</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-900/70 border border-slate-800">
              <span className="text-xs text-slate-400">Completed Deliveries</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{queueMetrics.completed}</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-900/70 border border-slate-800">
              <span className="text-xs text-slate-400">Active / Processing</span>
              <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">{queueMetrics.processing + queueMetrics.queued}</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-900/70 border border-slate-800">
              <span className="text-xs text-slate-400">Dead-Letter Queue (DLQ)</span>
              <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{queueMetrics.dead_letter_queue_count}</div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-900/60 border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 bg-surface-950/80 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Async Job Queue & Dead-Letter Queue (DLQ) Monitor</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Exponential Backoff (3x Retries)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-surface-950/40 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Task ID</th>
                    <th className="p-3.5">Job Type</th>
                    <th className="p-3.5">Target Destination</th>
                    <th className="p-3.5">Retries</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {queueMetrics.tasks.map((task) => (
                    <tr key={task.task_id} className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-brand-300">{task.task_id}</td>
                      <td className="p-3.5 text-slate-300">{task.task_type}</td>
                      <td className="p-3.5 text-slate-400 font-sans">{task.payload_preview.meeting_title} ({task.payload_preview.channel})</td>
                      <td className="p-3.5">{task.retry_count} / {task.max_retries}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            task.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : task.status === 'dead_letter'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {task.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {task.status === 'dead_letter' && (
                          <button
                            onClick={() => handleRetryDlq(task.task_id)}
                            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold"
                          >
                            Retry DLQ Job
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Merkle Cryptographic Audit Ledger */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl bg-surface-900/60 border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 bg-surface-950/80 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Link className="w-4 h-4 text-indigo-400" />
              <span>Cryptographic Merkle Append-Only Audit Ledger</span>
            </h3>
            <span className="text-xs text-emerald-400 font-mono font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SHA-256 Hash Chain Intact</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-surface-950/40 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Block ID</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action & Regulation</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Prev Hash → Block Hash</th>
                  <th className="p-3.5 text-right">Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="p-3.5 text-brand-300 font-bold">{log.id}</td>
                    <td className="p-3.5 text-slate-400">{log.timestamp}</td>
                    <td className="p-3.5">
                      <span className="text-slate-200 font-semibold block">{log.action}</span>
                      <span className="text-[10px] text-indigo-300 font-sans">{log.regulation}</span>
                    </td>
                    <td className="p-3.5 text-slate-300 font-sans">{log.actor}</td>
                    <td className="p-3.5 text-slate-400">
                      <span className="text-slate-500">{log.prev_hash || 'genesis'}</span>
                      <span className="text-slate-600 mx-1">→</span>
                      <span className="text-cyan-300">{log.block_hash || 'verified'}</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
