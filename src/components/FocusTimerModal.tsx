import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle2, Volume2, VolumeX, Sparkles, Clock } from 'lucide-react';
import { StudySession } from '../types';

interface FocusTimerModalProps {
  session: StudySession | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteSession: (sessionId: string) => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  session,
  isOpen,
  onClose,
  onCompleteSession,
}) => {
  const initialDuration = session ? session.durationMinutes * 60 : 25 * 60;
  const [totalSeconds, setTotalSeconds] = useState<number>(initialDuration);
  const [secondsLeft, setSecondsLeft] = useState<number>(initialDuration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [mode, setMode] = useState<'study' | 'break'>('study');

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (session) {
      const dur = session.durationMinutes * 60;
      setTotalSeconds(dur);
      setSecondsLeft(dur);
      setIsRunning(false);
      setMode('study');
    }
  }, [session]);

  // Gentle audio chime using Web Audio API
  const playCompletionChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const playTone = (freq: number, delay: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur);
      };

      // Play uplifting harmonic triad (C5, E5, G5)
      playTone(523.25, 0, 0.4);
      playTone(659.25, 0.15, 0.5);
      playTone(783.99, 0.3, 0.7);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playCompletionChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, soundEnabled]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const strokeDashoffset = 440 - 440 * progress;

  const handleSelectPreset = (mins: number, isBreak = false) => {
    setIsRunning(false);
    setTotalSeconds(mins * 60);
    setSecondsLeft(mins * 60);
    setMode(isBreak ? 'break' : 'study');
  };

  const handleFinishAndComplete = () => {
    if (session) {
      onCompleteSession(session.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 relative flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          id="btn-close-timer-modal"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sound toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="absolute top-4 left-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition text-xs flex items-center gap-1"
          title={soundEnabled ? 'Mute chimes' : 'Enable chimes'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-indigo-600" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* Active Session Info */}
        <div className="mt-2 space-y-1.5 max-w-xs">
          <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            {mode === 'break' ? '☕ Rejuvenation Break' : session ? session.subjectName : 'Focus Session'}
          </span>
          <h3 className="text-base font-bold text-neutral-900 truncate">
            {mode === 'break' ? '5-Min Rest & Hydrate' : session ? session.topicName : 'Active Deep Work'}
          </h3>
          {session?.actionableTask && mode === 'study' && (
            <p className="text-xs text-neutral-500 line-clamp-2">
              {session.actionableTask}
            </p>
          )}
        </div>

        {/* Circular Countdown Ring */}
        <div className="relative my-8 flex items-center justify-center">
          <svg className="w-56 h-56 transform -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="70"
              className="text-neutral-100 stroke-current"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="112"
              cy="112"
              r="70"
              className={`transition-all duration-500 stroke-current ${
                mode === 'break' ? 'text-emerald-500' : 'text-indigo-600'
              }`}
              strokeWidth="10"
              strokeDasharray="440"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold font-display tracking-tight text-neutral-900">
              {formattedTime}
            </span>
            <span className="text-xs font-semibold text-neutral-400 mt-1 uppercase tracking-wider">
              {isRunning ? 'In Flow' : secondsLeft === 0 ? 'Session Complete' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => handleSelectPreset(25)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              totalSeconds === 25 * 60 && mode === 'study'
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            25m Pomodoro
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset(45)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              totalSeconds === 45 * 60 && mode === 'study'
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            45m Deep Work
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset(5, true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              mode === 'break'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            5m Break
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 w-full">
          <button
            id="btn-reset-timer"
            type="button"
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(totalSeconds);
            }}
            className="p-3 text-neutral-500 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            id="btn-toggle-timer-play"
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{secondsLeft === 0 ? 'Restart Session' : 'Start Focus'}</span>
              </>
            )}
          </button>

          {session && (
            <button
              id="btn-mark-session-done-modal"
              type="button"
              onClick={handleFinishAndComplete}
              className="p-3 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
              title="Mark session as completed and close"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
