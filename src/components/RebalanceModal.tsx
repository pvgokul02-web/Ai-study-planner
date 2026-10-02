import React, { useState } from 'react';
import { X, RotateCcw, Sparkles, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { StudyPlan } from '../types';

interface RebalanceModalProps {
  plan: StudyPlan;
  isOpen: boolean;
  onClose: () => void;
  onApplyRebalance: (newPlan: StudyPlan) => void;
}

export const RebalanceModal: React.FC<RebalanceModalProps> = ({
  plan,
  isOpen,
  onClose,
  onApplyRebalance,
}) => {
  const [missedCount, setMissedCount] = useState<number>(2);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiAdvice, setAiAdvice] = useState<{
    advice: string;
    catchUpSteps: string[];
    rebalanceRatio?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleAskAIRebalance = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/rebalance-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          missedSessionsCount: missedCount,
          focusSubjectId: selectedSubject,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get rebalance recommendations');
      }

      const data = await res.json();
      setAiAdvice(data);
    } catch (err: any) {
      console.error(err);
      // Fallback advice
      setAiAdvice({
        advice:
          'Shift lower-confidence topics into high-yield active recall blocks, and add 20 minutes to your next 3 weekend sessions rather than cramming tonight.',
        catchUpSteps: [
          'Convert passive reading into 15-minute active self-testing flashcard blocks.',
          'Prune non-essential subtopics and focus strictly on past-paper exam question patterns.',
          'Consolidate related topic notes into a 1-page formula cheat sheet.',
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Redistribute missed sessions into remaining days
  const handleAutoRedistribute = () => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Collect incomplete sessions from past days
    const incompletePastSessions: any[] = [];
    const updatedDailySchedules = plan.dailySchedules.map((day) => {
      if (day.date < todayStr) {
        const remainingInDay = day.sessions.filter((s) => {
          if (!s.completed) {
            incompletePastSessions.push({ ...s, date: todayStr });
            return false;
          }
          return true;
        });
        return {
          ...day,
          sessions: remainingInDay,
          totalMinutes: remainingInDay.reduce((sum, s) => sum + s.durationMinutes, 0),
        };
      }
      return day;
    });

    // Spread incomplete sessions into upcoming days
    const upcomingDays = updatedDailySchedules.filter((d) => d.date >= todayStr);
    if (upcomingDays.length > 0 && incompletePastSessions.length > 0) {
      incompletePastSessions.forEach((sess, idx) => {
        const targetDay = upcomingDays[idx % upcomingDays.length];
        sess.date = targetDay.date;
        sess.id = `redistrib-${Date.now()}-${idx}`;
        targetDay.sessions.push(sess);
        targetDay.totalMinutes += sess.durationMinutes;
      });
    }

    onApplyRebalance({
      ...plan,
      dailySchedules: updatedDailySchedules,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 relative max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 font-display">
                Catch-up & Rebalance Assistant
              </h3>
              <p className="text-xs text-neutral-500">
                Fell behind or missed a few sessions? Recalibrate without cramming.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Estimated Missed Sessions
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={missedCount}
              onChange={(e) => setMissedCount(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Subject of Concern
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-neutral-900"
            >
              <option value="all">All Subjects (Overall)</option>
              {plan.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleAskAIRebalance}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
              <span>Analyzing Pace with Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-neutral-950" />
              <span>Analyze Catch-up Strategy</span>
            </>
          )}
        </button>

        {/* AI Recommendations */}
        {aiAdvice && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Recommended Recovery Plan</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-medium">
              {aiAdvice.advice}
            </p>

            <div className="space-y-1.5 pt-1">
              {aiAdvice.catchUpSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="text-xs text-amber-900 bg-white/80 p-2 rounded-lg border border-amber-200 flex items-start gap-2"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleAutoRedistribute}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>1-Click Rebalance Incomplete Sessions to Upcoming Days</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
