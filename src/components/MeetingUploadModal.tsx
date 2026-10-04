import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileAudio, CheckCircle2, AlertCircle, Sparkles, Mic, FileText, ArrowRight } from 'lucide-react';
import { uploadMeeting } from '../services/api.ts';
import { Meeting } from '../../types/index.ts';

interface MeetingUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (meeting: Meeting) => void;
}

export const MeetingUploadModal: React.FC<MeetingUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [hostName, setHostName] = useState('Alex Johnson');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
  };

  const handleSelectedFile = (selectedFile: File) => {
    const validExtensions = /\.(mp3|mp4|wav|m4a|webm|ogg|aac|flac)$/i;
    if (!validExtensions.test(selectedFile.name)) {
      setError('Please upload a valid audio or video recording file (MP3, MP4, WAV, M4A, WEBM, AAC).');
      return;
    }
    setError(null);
    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleSelectSample = (sampleName: string, duration: string) => {
    // Create a mock File object for instantaneous sample testing
    const sampleBlob = new Blob(['sample-audio-data'], { type: 'audio/mp3' });
    const mockFile = new File([sampleBlob], `${sampleName.toLowerCase().replace(/\s+/g, '_')}.mp3`, {
      type: 'audio/mp3',
    });
    setFile(mockFile);
    setTitle(sampleName);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or drop a recording file.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title.trim()) formData.append('title', title.trim());
      if (hostName.trim()) formData.append('host_name', hostName.trim());

      // Progress animation simulation
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 15;
        });
      }, 200);

      const response = await uploadMeeting(formData);
      clearInterval(progressTimer);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        onUploadSuccess(response.meeting);
        onClose();
      }, 600);
    } catch (err: any) {
      setIsUploading(false);
      setError(err?.message || 'Failed to upload meeting recording.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-surface-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden glass-panel">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-surface-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Upload Meeting Recording</h2>
              <p className="text-xs text-slate-400">Ingest audio/video for STT, diarization & structured extraction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-brand-400 bg-brand-500/10 shadow-glow'
                : file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-700 hover:border-slate-500 bg-slate-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.mp4,.wav,.m4a,.webm,.ogg,.aac,.flac"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <FileAudio className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-white">{file.name}</p>
                <p className="text-xs text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI processing
                </p>
                <span className="text-[11px] text-brand-400 hover:underline pt-1">Click to change file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  <UploadCloud className="w-8 h-8 text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Drag and drop your audio or video file here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports MP3, MP4, WAV, M4A, WEBM, AAC (Up to 500MB)
                  </p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-600 transition-colors"
                >
                  Browse Local Files
                </button>
              </div>
            )}
          </div>

          {/* Quick Sample Selector for Instant Demo Testing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Or select a quick test recording:</span>
              <span className="text-[11px] text-brand-400 font-mono">1-Click Test</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { name: 'Sprint Planning & Feature Matrix', duration: '28m', tag: 'Engineering' },
                { name: 'Quarterly Sales Pipeline Sync', duration: '45m', tag: 'Revenue' },
                { name: 'Product Design & Mobile UX Discovery', duration: '32m', tag: 'Design' },
              ].map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSample(sample.name, sample.duration)}
                  className="flex flex-col text-left p-2.5 rounded-lg bg-slate-800/60 hover:bg-brand-500/10 border border-slate-700/60 hover:border-brand-500/30 transition-all text-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-slate-400 group-hover:text-brand-300">
                      {sample.tag}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{sample.duration}</span>
                  </div>
                  <span className="text-slate-200 font-medium mt-1 truncate">{sample.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Meeting Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Meeting Title <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Q4 Growth Strategy Sync"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Meeting Host / Facilitator
              </label>
              <input
                type="text"
                value={hostName}
                onChange={e => setHostName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Upload Progress Indicator */}
          {isUploading && (
            <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-brand-300 font-medium">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Transcribing audio & executing extraction pipeline...</span>
                </div>
                <span className="font-mono text-brand-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-500 to-indigo-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                !file || isUploading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow hover:scale-[1.02]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isUploading ? 'Processing...' : 'Start Transcription Pipeline'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
