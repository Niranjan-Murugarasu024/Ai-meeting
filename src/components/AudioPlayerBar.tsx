import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, FastForward } from 'lucide-react';

interface AudioPlayerBarProps {
  durationSeconds: number;
  currentMs: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (ms: number) => void;
  title: string;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  durationSeconds,
  currentMs,
  isPlaying,
  onTogglePlay,
  onSeek,
  title,
}) => {
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const totalMs = Math.max(1000, durationSeconds * 1000);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onSeek(val);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
  };

  const progressPercent = Math.min(100, (currentMs / totalMs) * 100);

  return (
    <div className="bg-surface-900/90 border border-slate-700/80 rounded-2xl p-4 glass-panel shadow-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Track Info & Visualizer */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
            {isPlaying ? (
              <div className="flex items-end space-x-0.5 h-4">
                <div className="w-1 bg-brand-400 rounded-full animate-wave" style={{ animationDelay: '0.1s' }} />
                <div className="w-1 bg-indigo-400 rounded-full animate-wave" style={{ animationDelay: '0.3s' }} />
                <div className="w-1 bg-cyan-400 rounded-full animate-wave" style={{ animationDelay: '0.2s' }} />
              </div>
            ) : (
              <Play className="w-4 h-4 text-brand-400 ml-0.5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{title}</p>
            <p className="text-[11px] text-slate-400 font-mono">
              {formatTime(currentMs)} <span className="text-slate-600">/</span> {formatTime(totalMs)}
            </p>
          </div>
        </div>

        {/* Center Controls & Timeline */}
        <div className="flex-1 w-full max-w-xl flex items-center space-x-3">
          <button
            onClick={() => onSeek(Math.max(0, currentMs - 10000))}
            title="Rewind 10s"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Scrubber Bar */}
          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min={0}
              max={totalMs}
              value={currentMs}
              onChange={handleSliderChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => onSeek(Math.min(totalMs, currentMs + 10000))}
            title="Forward 10s"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right Controls: Speed & Mute */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={cycleSpeed}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] font-mono font-semibold text-brand-300 border border-slate-700 transition-colors"
          >
            {playbackRate}x
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
