import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SubjectForm } from './components/SubjectForm';
import { ScheduleView } from './components/ScheduleView';
import { AnalyticsBar } from './components/AnalyticsBar';
import { FocusTimerModal } from './components/FocusTimerModal';
import { RebalanceModal } from './components/RebalanceModal';
import { ExportModal } from './components/ExportModal';
import { Subject, StudyPreferences, StudyPlan, StudySession } from './types';
import {
  PRESET_STEM_FINALS,
  PRESET_MED_PREP,
  getRelativeDate,
} from './utils/sampleData';
import { generateAlgorithmicSchedule } from './utils/scheduleGenerator';

const STORAGE_KEY_PLAN = 'aistudyplanner_current_plan_v1';
const STORAGE_KEY_SUBJECTS = 'aistudyplanner_subjects_v1';
const STORAGE_KEY_PREFS = 'aistudyplanner_prefs_v1';

const DEFAULT_PREFERENCES: StudyPreferences = {
  dailyHoursWeekday: 3,
  dailyHoursWeekend: 5,
  sessionDuration: 45,
  preferredTimeOfDay: 'morning',
  includeMockExams: true,
  spacedRepetition: true,
  bufferDaysBeforeExam: 1,
};

const DEFAULT_INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-calc',
    name: 'Calculus & Linear Algebra',
    examDate: getRelativeDate(14),
    difficulty: 'Very Hard',
    targetGrade: 'A',
    priority: 'High',
    color: '#3B82F6',
    topics: [
      { id: 'top-1', name: 'Integration Techniques & Parts', confidence: 2 },
      { id: 'top-2', name: 'Eigenvalues & Matrix Inverses', confidence: 2 },
      { id: 'top-3', name: 'Taylor Series Approximations', confidence: 3 },
    ],
  },
  {
    id: 'sub-phys',
    name: 'University Physics Mechanics',
    examDate: getRelativeDate(20),
    difficulty: 'Challenging',
    targetGrade: 'A-',
    priority: 'High',
    color: '#10B981',
    topics: [
      { id: 'top-4', name: 'Rotational Dynamics & Torque', confidence: 2 },
      { id: 'top-5', name: 'Simple Harmonic Motion', confidence: 3 },
      { id: 'top-6', name: 'Work-Energy Theorem', confidence: 4 },
    ],
  },
];

export default function App() {
  // Persistence state
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAN);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBJECTS);
      return saved ? JSON.parse(saved) : DEFAULT_INITIAL_SUBJECTS;
    } catch {
      return DEFAULT_INITIAL_SUBJECTS;
    }
  });

  const [preferences, setPreferences] = useState<StudyPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFS);
      return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  // UI Views & Modals
  const [activeView, setActiveView] = useState<'schedule' | 'edit'>('edit');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingProgressText, setGeneratingProgressText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Focus Timer Modal
  const [timerSession, setTimerSession] = useState<StudySession | null>(null);
  const [isTimerOpen, setIsTimerOpen] = useState<boolean>(false);

  // Rebalance & Export Modals
  const [isRebalanceOpen, setIsRebalanceOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Save to localStorage when state updates
  useEffect(() => {
    if (currentPlan) {
      try {
        localStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(currentPlan));
      } catch (e) {
        console.warn('Failed to save plan to localStorage:', e);
      }
    }
  }, [currentPlan]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(subjects));
    } catch (e) {
      console.warn('Failed to save subjects:', e);
    }
  }, [subjects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(preferences));
    } catch (e) {
      console.warn('Failed to save preferences:', e);
    }
  }, [preferences]);

  // Set default view on first load if plan exists
  useEffect(() => {
    if (currentPlan && currentPlan.dailySchedules.length > 0) {
      setActiveView('schedule');
    }
  }, []);

  // Load Presets
  const handleLoadPreset = (presetKey: 'stem' | 'med') => {
    const preset = presetKey === 'stem' ? PRESET_STEM_FINALS : PRESET_MED_PREP;
    setSubjects(preset.subjects);
    setPreferences(preset.preferences);

    // Auto generate schedule for preset
    const autoPlan = generateAlgorithmicSchedule(
      preset.subjects,
      preset.preferences
    );
    autoPlan.title = preset.title;
    setCurrentPlan(autoPlan);
    setActiveView('schedule');
  };

  const handleNewPlan = () => {
    setActiveView('edit');
  };

  // Generate Plan (AI or Algorithmic)
  const handleGeneratePlan = async (useAI: boolean) => {
    setIsGenerating(true);
    setErrorMessage(null);

    if (useAI) {
      setGeneratingProgressText('Analyzing syllabus topics with Gemini...');
      try {
        const timer1 = setTimeout(() => {
          setGeneratingProgressText('Synthesizing spaced repetition milestones...');
        }, 1500);

        const timer2 = setTimeout(() => {
          setGeneratingProgressText('Distributing daily practice blocks...');
        }, 3000);

        const response = await fetch('/api/generate-schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjects,
            preferences,
            startDate: new Date().toISOString().split('T')[0],
          }),
        });

        clearTimeout(timer1);
        clearTimeout(timer2);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Server error generating schedule');
        }

        const generatedPlan: StudyPlan = await response.json();
        setCurrentPlan(generatedPlan);
        setActiveView('schedule');
      } catch (err: any) {
        console.error('AI generation failed, using intelligent fallback:', err);
        setErrorMessage(
          `AI service encountered: ${err.message || 'connection issue'}. Generated using intelligent local algorithm instead.`
        );
        const fallbackPlan = generateAlgorithmicSchedule(subjects, preferences);
        setCurrentPlan(fallbackPlan);
        setActiveView('schedule');
        setTimeout(() => setErrorMessage(null), 6000);
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Local Algorithmic generation
      const instantPlan = generateAlgorithmicSchedule(subjects, preferences);
      setCurrentPlan(instantPlan);
      setActiveView('schedule');
      setIsGenerating(false);
    }
  };

  // Toggle session completed status
  const handleToggleSessionComplete = (sessionId: string) => {
    if (!currentPlan) return;

    const updatedSchedules = currentPlan.dailySchedules.map((day) => ({
      ...day,
      sessions: day.sessions.map((sess) =>
        sess.id === sessionId ? { ...sess, completed: !sess.completed } : sess
      ),
    }));

    setCurrentPlan({
      ...currentPlan,
      dailySchedules: updatedSchedules,
      updatedAt: new Date().toISOString(),
    });
  };

  // Update session study notes
  const handleUpdateSessionNotes = (sessionId: string, notes: string) => {
    if (!currentPlan) return;

    const updatedSchedules = currentPlan.dailySchedules.map((day) => ({
      ...day,
      sessions: day.sessions.map((sess) =>
        sess.id === sessionId ? { ...sess, notes } : sess
      ),
    }));

    setCurrentPlan({
      ...currentPlan,
      dailySchedules: updatedSchedules,
      updatedAt: new Date().toISOString(),
    });
  };

  // Focus Timer actions
  const handleStartFocusTimer = (session: StudySession) => {
    setTimerSession(session);
    setIsTimerOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Header
        currentPlan={currentPlan}
        onNewPlan={handleNewPlan}
        onLoadPreset={handleLoadPreset}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenTimer={() => setIsTimerOpen(true)}
        onOpenRebalance={() => setIsRebalanceOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {errorMessage && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs animate-fadeIn">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-amber-700 hover:text-amber-900 font-bold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Analytics Header (Shown when in schedule view) */}
        {activeView === 'schedule' && currentPlan && (
          <AnalyticsBar plan={currentPlan} />
        )}

        {/* Dynamic Views */}
        {activeView === 'edit' || !currentPlan ? (
          <SubjectForm
            subjects={subjects}
            preferences={preferences}
            onUpdateSubjects={setSubjects}
            onUpdatePreferences={setPreferences}
            onGeneratePlan={handleGeneratePlan}
            isGenerating={isGenerating}
            generatingProgressText={generatingProgressText}
            onLoadPreset={handleLoadPreset}
          />
        ) : (
          <ScheduleView
            plan={currentPlan}
            onToggleSessionComplete={handleToggleSessionComplete}
            onStartFocusTimer={handleStartFocusTimer}
            onUpdateSessionNotes={handleUpdateSessionNotes}
          />
        )}
      </main>

      {/* Modals */}
      <FocusTimerModal
        session={timerSession}
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        onCompleteSession={handleToggleSessionComplete}
      />

      {currentPlan && (
        <>
          <RebalanceModal
            plan={currentPlan}
            isOpen={isRebalanceOpen}
            onClose={() => setIsRebalanceOpen(false)}
            onApplyRebalance={(newPlan) => setCurrentPlan(newPlan)}
          />
          <ExportModal
            plan={currentPlan}
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
          />
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-700">AI Study Planner</span>
            <span>• Powered by Gemini 3.8 Flash</span>
          </div>
          <div>
            <span>Spaced Repetition • Active Recall • Micro-Action Pacing</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
