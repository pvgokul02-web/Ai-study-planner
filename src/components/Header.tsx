import React from 'react';
import {
  BookOpen,
  Calendar,
  Sparkles,
  Clock,
  RotateCcw,
  Download,
  Sliders,
  Sparkle,
} from 'lucide-react';
import { StudyPlan } from '../types';

interface HeaderProps {
  currentPlan: StudyPlan | null;
  onNewPlan: () => void;
  onLoadPreset: (presetKey: 'stem' | 'med') => void;
  onOpenExport: () => void;
  onOpenTimer: () => void;
  onOpenRebalance: () => void;
  activeView: 'schedule' | 'edit';
  setActiveView: (view: 'schedule' | 'edit') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPlan,
  onNewPlan,
  onLoadPreset,
  onOpenExport,
  onOpenTimer,
  onOpenRebalance,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] no-print transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-4 ring-indigo-50/50">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                AI Study Planner
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 border border-indigo-200/60 inline-flex items-center gap-1">
                <Sparkle className="w-2.5 h-2.5 fill-indigo-500 text-indigo-500" />
                Gemini 3.8
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
              Spaced Repetition & Adaptive Exam Pacing
            </p>
          </div>
        </div>

        {/* View Switcher Tabs (Schedule vs Edit) */}
        {currentPlan && (
          <div className="hidden md:flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner">
            <button
              id="tab-view-schedule"
              type="button"
              onClick={() => setActiveView('schedule')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeView === 'schedule'
                  ? 'bg-white text-indigo-700 shadow-xs shadow-slate-200 ring-1 ring-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Study Agenda</span>
            </button>
            <button
              id="tab-view-edit"
              type="button"
              onClick={() => setActiveView('edit')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeView === 'edit'
                  ? 'bg-white text-indigo-700 shadow-xs shadow-slate-200 ring-1 ring-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Subjects & Pacing</span>
            </button>
          </div>
        )}

        {/* Actions Group */}
        <div className="flex items-center gap-2">
          {/* Quick Focus Timer */}
          <button
            id="btn-header-focus-timer"
            type="button"
            onClick={onOpenTimer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white/90 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 text-xs font-semibold shadow-xs hover:shadow-sm transition-all"
            title="Launch Pomodoro Focus Timer"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Focus Timer</span>
          </button>

          {/* Rebalance button if plan exists */}
          {currentPlan && (
            <button
              id="btn-open-rebalance"
              type="button"
              onClick={onOpenRebalance}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200/80 bg-white/90 text-slate-700 hover:text-amber-700 hover:border-amber-200 shadow-xs transition-all"
              title="Catch up missed study sessions"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span>Catch-up Assistant</span>
            </button>
          )}

          {/* Export modal trigger */}
          {currentPlan && (
            <button
              id="btn-open-export"
              type="button"
              onClick={onOpenExport}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-sm shadow-slate-900/10 hover:shadow transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}

          {!currentPlan && (
            <button
              id="btn-load-demo-header"
              type="button"
              onClick={() => onLoadPreset('stem')}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Demo Syllabus</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
