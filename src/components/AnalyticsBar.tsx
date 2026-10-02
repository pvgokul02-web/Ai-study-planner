import React from 'react';
import { Award, Calendar, CheckCircle2, Clock, Flame, Target, BookOpen } from 'lucide-react';
import { StudyPlan } from '../types';
import { calculateDaysBetween } from '../utils/scheduleGenerator';

interface AnalyticsBarProps {
  plan: StudyPlan;
}

export const AnalyticsBar: React.FC<AnalyticsBarProps> = ({ plan }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate statistics
  let totalSessions = 0;
  let completedSessions = 0;
  let totalMinutes = 0;
  let completedMinutes = 0;

  const subjectMinutesMap: Record<string, { total: number; completed: number }> = {};
  plan.subjects.forEach((s) => {
    subjectMinutesMap[s.id] = { total: 0, completed: 0 };
  });

  plan.dailySchedules.forEach((day) => {
    day.sessions.forEach((sess) => {
      totalSessions++;
      totalMinutes += sess.durationMinutes;

      if (!subjectMinutesMap[sess.subjectId]) {
        subjectMinutesMap[sess.subjectId] = { total: 0, completed: 0 };
      }
      subjectMinutesMap[sess.subjectId].total += sess.durationMinutes;

      if (sess.completed) {
        completedSessions++;
        completedMinutes += sess.durationMinutes;
        subjectMinutesMap[sess.subjectId].completed += sess.durationMinutes;
      }
    });
  });

  const completionPercent =
    totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completedHours = (completedMinutes / 60).toFixed(1);

  // Sorted upcoming exams
  const upcomingExams = [...plan.subjects]
    .map((s) => ({
      ...s,
      daysLeft: calculateDaysBetween(todayStr, s.examDate),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-sm space-y-6">
      {/* Top metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Readiness Score */}
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Readiness Score
            </span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-display text-neutral-900">
              {completionPercent}%
            </span>
            <span className="text-xs text-neutral-500">completed</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, completionPercent)}%` }}
            />
          </div>
        </div>

        {/* Sessions Completed */}
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Sessions Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-display text-neutral-900">
              {completedSessions}
            </span>
            <span className="text-xs text-neutral-500">/ {totalSessions} total</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">
            {totalSessions - completedSessions} sessions left to exam
          </p>
        </div>

        {/* Study Hours */}
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Hours Logged
            </span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-display text-neutral-900">
              {completedHours}h
            </span>
            <span className="text-xs text-neutral-500">/ {totalHours}h goal</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">
            Paced across {plan.dailySchedules.length} days
          </p>
        </div>

        {/* Next Exam Countdown */}
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Next Exam
            </span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          {upcomingExams.length > 0 ? (
            <div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-display text-neutral-900">
                  {upcomingExams[0].daysLeft < 0
                    ? '0'
                    : upcomingExams[0].daysLeft}
                </span>
                <span className="text-xs text-neutral-500">days left</span>
              </div>
              <p className="text-[11px] font-medium text-neutral-600 truncate mt-2">
                {upcomingExams[0].name}
              </p>
            </div>
          ) : (
            <span className="text-sm text-neutral-400 mt-2">No upcoming exams</span>
          )}
        </div>
      </div>

      {/* Subject Distribution & Target Badges */}
      <div className="pt-2 border-t border-neutral-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
            Subject Workload & Exam Deadlines
          </span>
          <span className="text-xs text-neutral-400">
            {plan.subjects.length} active exam tracks
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {upcomingExams.map((subj) => {
            const data = subjectMinutesMap[subj.id] || { total: 0, completed: 0 };
            const hours = (data.total / 60).toFixed(1);
            const compHours = (data.completed / 60).toFixed(1);
            const sPercent = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
            const isUrgent = subj.daysLeft <= 5 && subj.daysLeft >= 0;

            return (
              <div
                key={subj.id}
                className="p-3.5 rounded-xl border border-neutral-200/80 bg-white hover:border-neutral-300 transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: subj.color }}
                    />
                    <span className="text-xs font-bold text-neutral-900 truncate max-w-[140px]">
                      {subj.name}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      subj.daysLeft < 0
                        ? 'bg-neutral-100 text-neutral-500'
                        : isUrgent
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {subj.daysLeft < 0
                      ? 'Past'
                      : subj.daysLeft === 0
                      ? 'Exam Today!'
                      : `${subj.daysLeft}d to exam`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Goal: {subj.targetGrade || 'A'}</span>
                  <span>
                    {compHours}h / {hours}h ({sPercent}%)
                  </span>
                </div>

                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: subj.color,
                      width: `${Math.min(100, sPercent)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
