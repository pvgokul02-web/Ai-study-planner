import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Sparkles,
  Play,
  Award,
  Filter,
  Search,
  BookOpen,
  ChevronRight,
  Info,
  Layers,
  FileText,
} from 'lucide-react';
import { StudyPlan, StudySession, DailySchedule, ActivityType } from '../types';
import { formatDateLabel, calculateDaysBetween } from '../utils/scheduleGenerator';

interface ScheduleViewProps {
  plan: StudyPlan;
  onToggleSessionComplete: (sessionId: string) => void;
  onStartFocusTimer: (session: StudySession) => void;
  onUpdateSessionNotes: (sessionId: string, notes: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  plan,
  onToggleSessionComplete,
  onStartFocusTimer,
  onUpdateSessionNotes,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [filterView, setFilterView] = useState<'all' | 'today' | 'week' | 'exams'>('all');
  const [expandedNotesSessionId, setExpandedNotesSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper for activity badge styles
  const getActivityBadge = (type: ActivityType) => {
    switch (type) {
      case 'Concept Learning':
        return {
          label: 'Concept Learning',
          classes: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'Practice & Problems':
        return {
          label: 'Practice & Problems',
          classes: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'Active Recall & Flashcards':
        return {
          label: 'Active Recall',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'Mock Test / Timed Exam':
        return {
          label: 'Timed Mock Test',
          classes: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
        };
      case 'Formula & Cheat Sheet Review':
        return {
          label: 'Formula & Review',
          classes: 'bg-orange-50 text-orange-700 border-orange-200',
        };
      case 'Pre-Exam Quick Polish':
        return {
          label: 'Pre-Exam Polish',
          classes: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
        };
      default:
        return {
          label: type,
          classes: 'bg-neutral-50 text-neutral-700 border-neutral-200',
        };
    }
  };

  // Filter days
  const filteredDays = useMemo(() => {
    return plan.dailySchedules.filter((day) => {
      // Date filter
      if (filterView === 'today' && day.date !== todayStr) {
        return false;
      }

      if (filterView === 'week') {
        const daysFromToday = calculateDaysBetween(todayStr, day.date);
        if (daysFromToday < 0 || daysFromToday > 7) {
          return false;
        }
      }

      if (filterView === 'exams') {
        if (!day.examsOnThisDay || day.examsOnThisDay.length === 0) {
          return false;
        }
      }

      // Subject & search filter
      if (selectedSubjectId !== 'all' || searchQuery.trim()) {
        const hasMatchingSession = day.sessions.some((s) => {
          const matchSubject = selectedSubjectId === 'all' || s.subjectId === selectedSubjectId;
          const matchSearch =
            !searchQuery.trim() ||
            s.topicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.actionableTask.toLowerCase().includes(searchQuery.toLowerCase());
          return matchSubject && matchSearch;
        });

        // Also allow exam days if matching subject
        const hasMatchingExam =
          day.examsOnThisDay &&
          day.examsOnThisDay.some((e) => selectedSubjectId === 'all' || e.subjectId === selectedSubjectId);

        return hasMatchingSession || hasMatchingExam;
      }

      return true;
    });
  }, [plan.dailySchedules, filterView, selectedSubjectId, searchQuery, todayStr]);

  return (
    <div className="space-y-6">
      {/* AI Strategy Overview Banner (if present) */}
      {plan.aiOverview && (
        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-neutral-50 rounded-2xl p-6 border border-indigo-100/80 shadow-2xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-100" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 font-display">
                  AI Study Strategy & Spaced Pacing
                </h3>
                <p className="text-xs text-neutral-500">
                  Customized cognitive schedule synthesized for your exam target dates
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-700 shadow-2xs">
              Adaptive Schedule
            </span>
          </div>

          <p className="text-sm text-neutral-700 leading-relaxed">
            {plan.aiOverview.summary}
          </p>

          {plan.aiOverview.keyRecommendations && plan.aiOverview.keyRecommendations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {plan.aiOverview.keyRecommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white border border-neutral-200/70 text-xs text-neutral-700 flex items-start gap-2 shadow-2xs"
                >
                  <span className="font-bold text-indigo-600 shrink-0">0{i + 1}</span>
                  <span className="leading-snug">{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
        {/* Quick View Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            id="filter-view-all"
            type="button"
            onClick={() => setFilterView('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
              filterView === 'all'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            All Days ({plan.dailySchedules.length})
          </button>
          <button
            id="filter-view-today"
            type="button"
            onClick={() => setFilterView('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
              filterView === 'today'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Today's Plan
          </button>
          <button
            id="filter-view-week"
            type="button"
            onClick={() => setFilterView('week')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
              filterView === 'week'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Next 7 Days
          </button>
          <button
            id="filter-view-exams"
            type="button"
            onClick={() => setFilterView('exams')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
              filterView === 'exams'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Exam Milestones
          </button>
        </div>

        {/* Subject Filter & Search */}
        <div className="flex items-center gap-2.5">
          {/* Subject selector */}
          <div className="relative">
            <select
              id="filter-select-subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="text-xs font-semibold px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-neutral-800"
            >
              <option value="all">All Subjects</option>
              {plan.subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              id="input-search-sessions"
              type="text"
              placeholder="Search topic or goal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Days Schedule List */}
      <div className="space-y-6">
        {filteredDays.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-neutral-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">No study sessions found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Try adjusting your view filter or search query to see other days in your schedule.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterView('all');
                setSelectedSubjectId('all');
                setSearchQuery('');
              }}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredDays.map((day) => {
            const isToday = day.date === todayStr;
            const daysFromNow = calculateDaysBetween(todayStr, day.date);
            const totalHours = (day.totalMinutes / 60).toFixed(1);
            const completedCount = day.sessions.filter((s) => s.completed).length;
            const isAllCompleted =
              day.sessions.length > 0 && completedCount === day.sessions.length;

            return (
              <div
                key={day.date}
                className={`bg-white rounded-2xl border transition shadow-2xs print-break-inside-avoid ${
                  isToday
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : isAllCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-neutral-200'
                }`}
              >
                {/* Day Header */}
                <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/60 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-neutral-200 text-neutral-900'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
                        {day.dayOfWeek.slice(0, 3)}
                      </span>
                      <span className="text-sm leading-none">
                        {day.date.split('-')[2]}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-neutral-900 font-display">
                          {formatDateLabel(day.date)}
                        </h4>
                        {isToday && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                            Today
                          </span>
                        )}
                        {daysFromNow === 1 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                            Tomorrow
                          </span>
                        )}
                      </div>
                      {day.dailyMotivation && (
                        <p className="text-xs text-neutral-500 italic mt-0.5">
                          "{day.dailyMotivation}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Day Progress & Duration */}
                  <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
                    {day.sessions.length > 0 && (
                      <span className="font-semibold text-neutral-600">
                        {completedCount}/{day.sessions.length} done ({totalHours} hrs)
                      </span>
                    )}
                    {isAllCompleted && (
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Day Complete!
                      </span>
                    )}
                  </div>
                </div>

                {/* Exam Day Milestone Warning / Banner */}
                {day.examsOnThisDay && day.examsOnThisDay.length > 0 && (
                  <div className="m-4 sm:m-5 p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-indigo-500/10 border-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                          Official Exam Day
                        </span>
                        <h5 className="text-sm font-extrabold text-neutral-900">
                          {day.examsOnThisDay.map((e) => e.subjectName).join(' & ')}
                        </h5>
                      </div>
                    </div>
                    <div className="text-xs text-neutral-700 font-semibold bg-white/80 px-3 py-1.5 rounded-lg border border-amber-200 shadow-2xs">
                      Target Goal: {day.examsOnThisDay[0].targetGrade || 'A'} • Trust your prep!
                    </div>
                  </div>
                )}

                {/* Study Sessions List */}
                <div className="p-4 sm:p-5 space-y-3">
                  {day.sessions.length === 0 ? (
                    <div className="p-6 text-center text-neutral-500 bg-neutral-50/60 rounded-xl border border-dashed border-neutral-200">
                      <p className="text-xs font-semibold text-neutral-700">
                        Rest / Buffer Day
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Take a mental breather, hydrate, and prepare for upcoming study blocks.
                      </p>
                    </div>
                  ) : (
                    day.sessions
                      .filter(
                        (s) =>
                          selectedSubjectId === 'all' || s.subjectId === selectedSubjectId
                      )
                      .map((session) => {
                        const subjectObj = plan.subjects.find(
                          (sub) => sub.id === session.subjectId
                        );
                        const badge = getActivityBadge(session.activityType);
                        const isNotesOpen = expandedNotesSessionId === session.id;

                        return (
                          <div
                            key={session.id}
                            className={`p-4 rounded-xl border transition flex flex-col gap-3 ${
                              session.completed
                                ? 'bg-neutral-50/80 border-neutral-200 opacity-75'
                                : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              {/* Left: Checkbox + Title */}
                              <div className="flex items-start gap-3 flex-1">
                                <button
                                  type="button"
                                  onClick={() => onToggleSessionComplete(session.id)}
                                  className="mt-0.5 text-neutral-400 hover:text-indigo-600 transition shrink-0 cursor-pointer"
                                  title={
                                    session.completed
                                      ? 'Mark as uncompleted'
                                      : 'Mark as completed'
                                  }
                                >
                                  {session.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-neutral-300 hover:text-indigo-500" />
                                  )}
                                </button>

                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Subject badge with custom color */}
                                    <span
                                      className="text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 text-white"
                                      style={{
                                        backgroundColor: subjectObj?.color || '#6366F1',
                                      }}
                                    >
                                      {session.subjectName}
                                    </span>

                                    {/* Activity Type Badge */}
                                    <span
                                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badge.classes}`}
                                    >
                                      {badge.label}
                                    </span>

                                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {session.durationMinutes} mins
                                    </span>
                                  </div>

                                  <h5
                                    className={`text-sm font-bold ${
                                      session.completed
                                        ? 'line-through text-neutral-500'
                                        : 'text-neutral-900'
                                    }`}
                                  >
                                    {session.topicName}
                                  </h5>

                                  <p className="text-xs text-neutral-600 leading-relaxed">
                                    {session.actionableTask}
                                  </p>

                                  {session.keyTip && (
                                    <div className="text-[11px] text-indigo-900/80 bg-indigo-50/60 p-2 rounded-lg border border-indigo-100/60 flex items-start gap-1.5 mt-2">
                                      <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                      <span>
                                        <strong>Recall Tip:</strong> {session.keyTip}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right: Focus Timer Launcher & Notes Toggle */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => onStartFocusTimer(session)}
                                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1 transition"
                                  title="Start Focus Timer for this session"
                                >
                                  <Play className="w-3 h-3 fill-indigo-600 text-indigo-600" />
                                  <span className="hidden sm:inline">Start Timer</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedNotesSessionId(
                                      isNotesOpen ? null : session.id
                                    )
                                  }
                                  className={`p-1.5 rounded-lg border text-xs transition ${
                                    session.notes
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'text-neutral-400 hover:text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                                  }`}
                                  title="Add study notes"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Collapsible Session Notes */}
                            {isNotesOpen && (
                              <div className="mt-2 pt-3 border-t border-neutral-100 space-y-2">
                                <label className="block text-[11px] font-semibold text-neutral-600">
                                  Session Notes & Weak Formulas to Revisit:
                                </label>
                                <textarea
                                  value={session.notes || ''}
                                  onChange={(e) =>
                                    onUpdateSessionNotes(session.id, e.target.value)
                                  }
                                  placeholder="Write key equations, mistakes from practice problems, or questions to ask professor..."
                                  rows={2}
                                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
