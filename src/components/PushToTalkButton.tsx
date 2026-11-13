import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Square, Loader2, X, Volume2, Sparkles, Check } from 'lucide-react';
import { usePushToTalk } from '../hooks/usePushToTalk';

interface PushToTalkButtonProps {
  onTranscript: (text: string) => void;
  onAutoSend?: (text: string) => void;
  disabled?: boolean;
}

export const PushToTalkButton: React.FC<PushToTalkButtonProps> = ({
  onTranscript,
  onAutoSend,
  disabled = false,
}) => {
  const [autoSend, setAutoSend] = useState<boolean>(true);
  const [holdMode, setHoldMode] = useState<boolean>(false);
  const isHoldingRef = React.useRef<boolean>(false);

  const {
    isRecording,
    isTranscribing,
    audioDuration,
    audioVolume,
    error,
    permissionDenied,
    startRecording,
    stopRecording,
    cancelRecording,
  } = usePushToTalk({
    onTranscriptComplete: (transcript) => {
      onTranscript(transcript);
      if (autoSend && onAutoSend && transcript.trim()) {
        onAutoSend(transcript);
      }
    },
  });

  // Handle ESC key to cancel recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isRecording) {
        cancelRecording();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, cancelRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Click-to-toggle handler
  const handleToggleClick = () => {
    if (disabled || isTranscribing) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Hold-to-talk mouse/touch handlers
  const handleMouseDown = () => {
    if (disabled || isTranscribing || isRecording) return;
    isHoldingRef.current = true;
    startRecording();
  };

  const handleMouseUp = () => {
    if (isHoldingRef.current && isRecording) {
      isHoldingRef.current = false;
      stopRecording();
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Recording Status / Active Overlay */}
      {isRecording && (
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs shadow-xs animate-in fade-in duration-150">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0" />
          
          {/* Animated Volume Waveform Bars */}
          <div className="flex items-center gap-0.5 h-4">
            {[0.4, 0.8, 1.2, 0.6, 1.0].map((multiplier, idx) => {
              const height = Math.max(4, Math.min(16, (audioVolume / 100) * 16 * multiplier));
              return (
                <div
                  key={idx}
                  style={{ height: `${height}px` }}
                  className="w-1 bg-rose-600 dark:bg-rose-400 rounded-full transition-all duration-75"
                />
              );
            })}
          </div>

          <span className="font-mono font-bold tabular-nums">{formatTime(audioDuration)}</span>
          <span className="hidden sm:inline text-[11px] text-rose-600/80 dark:text-rose-400/80">
            {autoSend ? 'Will auto-send' : 'Review transcript'}
          </span>

          {/* Cancel button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              cancelRecording();
            }}
            title="Cancel recording (ESC)"
            className="p-0.5 hover:bg-rose-200 dark:hover:bg-rose-900 rounded text-rose-600 dark:text-rose-300 ml-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Transcribing Indicator */}
      {isTranscribing && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs shadow-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span className="text-[11px] font-medium">Transcribing audio...</span>
        </div>
      )}

      {/* Main Push-to-Talk Mic Button */}
      <button
        type="button"
        onClick={handleToggleClick}
        onMouseDown={holdMode ? handleMouseDown : undefined}
        onMouseUp={holdMode ? handleMouseUp : undefined}
        onTouchStart={holdMode ? handleMouseDown : undefined}
        onTouchEnd={holdMode ? handleMouseUp : undefined}
        disabled={disabled || isTranscribing}
        title={
          isRecording
            ? 'Click to stop recording & transcribe'
            : 'Push to talk: Click to record audio and dictate prompt'
        }
        className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0 select-none ${
          isRecording
            ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
            : isTranscribing
            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-400 cursor-wait'
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
        }`}
      >
        {isRecording ? (
          <>
            <Square className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Stop & Send</span>
          </>
        ) : isTranscribing ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Processing</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Push-to-Talk</span>
          </>
        )}
      </button>

      {/* Auto-send toggle dropdown / tiny checkbox */}
      <button
        type="button"
        onClick={() => setAutoSend(!autoSend)}
        title={autoSend ? 'Auto-send prompt on voice release: ON' : 'Auto-send prompt on voice release: OFF'}
        className={`hidden md:flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded transition-colors ${
          autoSend
            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100'
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-transparent'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${autoSend ? 'bg-indigo-500' : 'bg-slate-400'}`} />
        <span>Auto-send</span>
      </button>

      {/* Error or Permission warning popover */}
      {error && !isRecording && (
        <div className="absolute -top-10 left-0 bg-rose-900 text-white text-[11px] px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5 z-20 whitespace-nowrap animate-in fade-in duration-150">
          <MicOff className="w-3 h-3 text-rose-300" />
          <span>{error}</span>
          <button onClick={() => cancelRecording()} className="p-0.5 hover:bg-rose-800 rounded">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
