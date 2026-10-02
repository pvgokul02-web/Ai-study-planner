import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Sparkles,
  Calendar,
  BookOpen,
  Award,
  Clock,
  Settings2,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Subject, StudyPreferences, Topic, DifficultyLevel, PriorityLevel } from '../types';
import { SUBJECT_COLOR_PALETTE, getRelativeDate } from '../utils/sampleData';
import { calculateDaysBetween } from '../utils/scheduleGenerator';

interface SubjectFormProps {
  subjects: Subject[];
  preferences: StudyPreferences;
  onUpdateSubjects: (subjects: Subject[]) => void;
  onUpdatePreferences: (prefs: StudyPreferences) => void;
  onGeneratePlan: (useAI: boolean) => void;
  isGenerating: boolean;
  generatingProgressText?: string;
  onLoadPreset: (presetKey: 'stem' | 'med') => void;
}

export const SubjectForm: React.FC<SubjectFormProps> = ({
  subjects,
  preferences,
  onUpdateSubjects,
  onUpdatePreferences,
  onGeneratePlan,
  isGenerating,
  generatingProgressText,
  onLoadPreset,
}) => {
  const [newTopicInputs, setNewTopicInputs] = useState<Record<string, string>>({});
  const [loadingTopicsSubjectId, setLoadingTopicsSubjectId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleAddSubject = () => {
    const nextColor = SUBJECT_COLOR_PALETTE[subjects.length % SUBJECT_COLOR_PALETTE.length].value;
    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      name: '',
      examDate: getRelativeDate(14),
      difficulty: 'Moderate',
      targetGrade: 'A',
      priority: 'High',
      color: nextColor,
      topics: [
        { id: `top-${Date.now()}-1`, name: 'Core Foundations & Definitions', confidence: 3 },
      ],
    };
    onUpdateSubjects([...subjects, newSub]);
  };

  const handleRemoveSubject = (id: string) => {
    if (subjects.length <= 1) {
      setErrorNotice('You need at least one subject to generate a study schedule.');
      setTimeout(() => setErrorNotice(null), 3000);
      return;
    }
    onUpdateSubjects(subjects.filter((s) => s.id !== id));
  };

  const handleUpdateSubjectField = <K extends keyof Subject>(
    id: string,
    field: K,
    value: Subject[K]
  ) => {
    onUpdateSubjects(
      subjects.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleAddTopic = (subjectId: string) => {
    const text = (newTopicInputs[subjectId] || '').trim();
    if (!text) return;

    onUpdateSubjects(
      subjects.map((s) => {
        if (s.id !== subjectId) return s;
        const newTopic: Topic = {
          id: `top-${Date.now()}`,
          name: text,
          confidence: 2,
        };
        return { ...s, topics: [...s.topics, newTopic] };
      })
    );

    setNewTopicInputs((prev) => ({ ...prev, [subjectId]: '' }));
  };

  const handleRemoveTopic = (subjectId: string, topicId: string) => {
    onUpdateSubjects(
      subjects.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          topics: s.topics.filter((t) => t.id !== topicId),
        };
      })
    );
  };

  const handleUpdateTopicConfidence = (
    subjectId: string,
    topicId: string,
    confidence: number
  ) => {
    onUpdateSubjects(
      subjects.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          topics: s.topics.map((t) => (t.id === topicId ? { ...t, confidence } : t)),
        };
      })
    );
  };

  // AI Topic Suggester for this subject
  const handleAutoSuggestTopics = async (subject: Subject) => {
    if (!subject.name.trim()) {
      setErrorNotice('Please enter a subject name first (e.g., Organic Chemistry, Macroeconomics).');
      setTimeout(() => setErrorNotice(null), 3500);
      return;
    }

    try {
      setLoadingTopicsSubjectId(subject.id);
      const res = await fetch('/api/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectName: subject.name, examType: subject.targetGrade }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch AI topic recommendations');
      }

      const data = await res.json();
      if (Array.isArray(data.topics) && data.topics.length > 0) {
        const newTopics: Topic[] = data.topics.map((t: string, i: number) => ({
          id: `ai-top-${Date.now()}-${i}`,
          name: t,
          confidence: 2,
        }));

        // Merge or replace empty default
        onUpdateSubjects(
          subjects.map((s) => {
            if (s.id !== subject.id) return s;
            const existingNames = new Set(s.topics.map((t) => t.name.toLowerCase()));
            const uniqueNew = newTopics.filter((t) => !existingNames.has(t.name.toLowerCase()));
            return {
              ...s,
              topics: [...s.topics, ...uniqueNew],
            };
          })
        );
      }
    } catch (err: any) {
      console.error(err);
      setErrorNotice(err.message || 'Could not auto-generate topics. Please add them manually.');
      setTimeout(() => setErrorNotice(null), 4000);
    } finally {
      setLoadingTopicsSubjectId(null);
    }
  };

  const validateAndGenerate = (useAI: boolean) => {
    const invalidSubject = subjects.find((s) => !s.name.trim());
    if (invalidSubject) {
      setErrorNotice('Please provide a name for all subjects.');
      setTimeout(() => setErrorNotice(null), 3000);
      return;
    }

    const pastExam = subjects.find((s) => calculateDaysBetween(todayStr, s.examDate) < 0);
    if (pastExam) {
      setErrorNotice(`Exam date for ${pastExam.name || 'a subject'} cannot be in the past.`);
      setTimeout(() => setErrorNotice(null), 3500);
      return;
    }

    onGeneratePlan(useAI);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Banner & Presets */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Intelligent Exam Pacing
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 font-display">
              Configure Subjects & Exam Dates
            </h1>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Add your upcoming exams and syllabus topics. The AI will distribute revision blocks, active recall, and simulated mock test milestones leading up to each test day.
            </p>
          </div>

          {/* Preset Quick Load */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
            <span className="text-xs text-neutral-500 font-medium px-1">Quick Load:</span>
            <button
              id="btn-sample-stem"
              type="button"
              onClick={() => onLoadPreset('stem')}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-neutral-300 hover:border-neutral-400 text-neutral-800 shadow-2xs transition"
            >
              🎓 STEM Finals
            </button>
            <button
              id="btn-sample-med"
              type="button"
              onClick={() => onLoadPreset('med')}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-neutral-300 hover:border-neutral-400 text-neutral-800 shadow-2xs transition"
            >
              🩺 Board Prep
            </button>
          </div>
        </div>

        {errorNotice && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}
      </div>

      {/* Subjects List */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900 font-display flex items-center gap-2">
            <span>Subjects & Syllabi</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
              {subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'}
            </span>
          </h2>
          <button
            id="btn-add-subject"
            type="button"
            onClick={handleAddSubject}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        </div>

        {subjects.map((subject, sIdx) => {
          const daysLeft = calculateDaysBetween(todayStr, subject.examDate);
          const isUrgent = daysLeft >= 0 && daysLeft <= 7;

          return (
            <div
              key={subject.id}
              className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden transition hover:border-neutral-300"
            >
              {/* Subject Header */}
              <div className="p-5 sm:p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/50">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: subject.color }}
                  />
                  <input
                    id={`input-subject-name-${sIdx}`}
                    type="text"
                    placeholder="e.g. Organic Chemistry, Macroeconomics, AP Calculus..."
                    value={subject.name}
                    onChange={(e) => handleUpdateSubjectField(subject.id, 'name', e.target.value)}
                    className="text-base sm:text-lg font-bold text-neutral-900 placeholder:text-neutral-400 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Countdown Badge */}
                  <div
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                      daysLeft < 0
                        ? 'bg-neutral-100 text-neutral-500'
                        : isUrgent
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {daysLeft < 0
                        ? 'Exam Passed'
                        : daysLeft === 0
                        ? 'Exam Today!'
                        : `${daysLeft} days until exam`}
                    </span>
                  </div>

                  {/* Delete Subject */}
                  <button
                    id={`btn-remove-subject-${sIdx}`}
                    type="button"
                    onClick={() => handleRemoveSubject(subject.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Remove subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subject Config Grid */}
              <div className="p-5 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Exam Date */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                      Exam Date
                    </label>
                    <input
                      id={`input-exam-date-${sIdx}`}
                      type="date"
                      min={todayStr}
                      value={subject.examDate}
                      onChange={(e) =>
                        handleUpdateSubjectField(subject.id, 'examDate', e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  {/* Difficulty Level */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                      Difficulty Level
                    </label>
                    <select
                      id={`select-difficulty-${sIdx}`}
                      value={subject.difficulty}
                      onChange={(e) =>
                        handleUpdateSubjectField(
                          subject.id,
                          'difficulty',
                          e.target.value as DifficultyLevel
                        )
                      }
                      className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="Easy">Easy (Low effort needed)</option>
                      <option value="Moderate">Moderate (Average review)</option>
                      <option value="Challenging">Challenging (Heavy practice)</option>
                      <option value="Very Hard">Very Hard (Max hours + deep recall)</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                      Priority Focus
                    </label>
                    <select
                      id={`select-priority-${sIdx}`}
                      value={subject.priority}
                      onChange={(e) =>
                        handleUpdateSubjectField(
                          subject.id,
                          'priority',
                          e.target.value as PriorityLevel
                        )
                      }
                      className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>

                  {/* Target Grade / Goal */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                      Target Grade / Score
                    </label>
                    <input
                      id={`input-target-grade-${sIdx}`}
                      type="text"
                      placeholder="e.g. A+, 95%, 5 (AP)"
                      value={subject.targetGrade || ''}
                      onChange={(e) =>
                        handleUpdateSubjectField(subject.id, 'targetGrade', e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>

                {/* Color Palette Selector */}
                <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
                  <span className="text-xs text-neutral-500 font-medium">Card Accent:</span>
                  <div className="flex items-center gap-1.5">
                    {SUBJECT_COLOR_PALETTE.map((pal) => (
                      <button
                        key={pal.name}
                        type="button"
                        onClick={() => handleUpdateSubjectField(subject.id, 'color', pal.value)}
                        className={`w-5 h-5 rounded-full transition transform ${
                          subject.color === pal.value
                            ? 'ring-2 ring-neutral-900 ring-offset-2 scale-110'
                            : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: pal.value }}
                        title={pal.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Topics / Chapters Section */}
                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-sm font-bold text-neutral-800">
                        Key Topics / Chapters ({subject.topics.length})
                      </h4>
                      <span className="text-xs text-neutral-400">
                        (Confidence 1 = Weak, 5 = Mastered)
                      </span>
                    </div>

                    {/* AI Suggest Topics Button */}
                    <button
                      id={`btn-ai-topics-${sIdx}`}
                      type="button"
                      disabled={loadingTopicsSubjectId === subject.id}
                      onClick={() => handleAutoSuggestTopics(subject)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50"
                    >
                      {loadingTopicsSubjectId === subject.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Suggesting Topics...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Auto-Suggest Topics with AI</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Topic Chips */}
                  <div className="space-y-2 mb-3">
                    {subject.topics.map((topic, tIdx) => (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 hover:bg-neutral-100/50 transition"
                      >
                        <span className="text-sm text-neutral-800 font-medium truncate">
                          {topic.name}
                        </span>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Confidence Level Pills */}
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-neutral-400 mr-1 hidden sm:inline">
                              Confidence:
                            </span>
                            {[1, 2, 3, 4, 5].map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() =>
                                  handleUpdateTopicConfidence(subject.id, topic.id, lvl)
                                }
                                className={`w-5 h-5 rounded text-[10px] font-bold transition ${
                                  topic.confidence >= lvl
                                    ? 'bg-amber-400 text-neutral-900'
                                    : 'bg-neutral-200 text-neutral-500 hover:bg-neutral-300'
                                }`}
                                title={`Set confidence level ${lvl}/5`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveTopic(subject.id, topic.id)}
                            className="text-neutral-400 hover:text-rose-600 transition p-1"
                            title="Remove topic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Custom Topic Input */}
                  <div className="flex gap-2">
                    <input
                      id={`input-new-topic-${sIdx}`}
                      type="text"
                      placeholder="Add a syllabus topic or chapter (e.g. Taylor Series, Cellular Respiration)..."
                      value={newTopicInputs[subject.id] || ''}
                      onChange={(e) =>
                        setNewTopicInputs((prev) => ({
                          ...prev,
                          [subject.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTopic(subject.id);
                        }
                      }}
                      className="flex-1 px-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      id={`btn-add-topic-${sIdx}`}
                      type="button"
                      onClick={() => handleAddTopic(subject.id)}
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preferences Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <Settings2 className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-neutral-900 font-display">
            Daily Study Rhythm & Preferences
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Weekday Hours */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-700">
                Weekday Available Hours
              </label>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {preferences.dailyHoursWeekday} hrs/day
              </span>
            </div>
            <input
              id="slider-weekday-hours"
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={preferences.dailyHoursWeekday}
              onChange={(e) =>
                onUpdatePreferences({
                  ...preferences,
                  dailyHoursWeekday: parseFloat(e.target.value),
                })
              }
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-neutral-400">
              Monday through Friday study time allocation.
            </p>
          </div>

          {/* Weekend Hours */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-700">
                Weekend Available Hours
              </label>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {preferences.dailyHoursWeekend} hrs/day
              </span>
            </div>
            <input
              id="slider-weekend-hours"
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={preferences.dailyHoursWeekend}
              onChange={(e) =>
                onUpdatePreferences({
                  ...preferences,
                  dailyHoursWeekend: parseFloat(e.target.value),
                })
              }
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-neutral-400">
              Saturday & Sunday deeper focus sessions.
            </p>
          </div>

          {/* Session Duration */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-700">
              Study Block Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[25, 45, 60].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() =>
                    onUpdatePreferences({
                      ...preferences,
                      sessionDuration: dur,
                    })
                  }
                  className={`py-2 text-xs font-semibold rounded-lg border transition ${
                    preferences.sessionDuration === dur
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {dur} mins
                </button>
              ))}
            </div>
            <p className="text-[11px] text-neutral-400">
              {preferences.sessionDuration === 25
                ? 'Standard Pomodoro blocks'
                : preferences.sessionDuration === 45
                ? 'Optimal deep-work block'
                : 'Comprehensive deep dive'}
            </p>
          </div>
        </div>

        {/* Cognitive & Prep Strategy Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={preferences.spacedRepetition}
              onChange={(e) =>
                onUpdatePreferences({
                  ...preferences,
                  spacedRepetition: e.target.checked,
                })
              }
              className="mt-0.5 rounded accent-indigo-600"
            />
            <div>
              <span className="block text-xs font-bold text-neutral-800">
                Spaced Repetition Review
              </span>
              <span className="block text-[11px] text-neutral-500">
                Reinforces past topics at expanding intervals.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={preferences.includeMockExams}
              onChange={(e) =>
                onUpdatePreferences({
                  ...preferences,
                  includeMockExams: e.target.checked,
                })
              }
              className="mt-0.5 rounded accent-indigo-600"
            />
            <div>
              <span className="block text-xs font-bold text-neutral-800">
                Simulated Mock Exam Milestones
              </span>
              <span className="block text-[11px] text-neutral-500">
                Inserts timed practice tests 3-7 days before exams.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={preferences.bufferDaysBeforeExam > 0}
              onChange={(e) =>
                onUpdatePreferences({
                  ...preferences,
                  bufferDaysBeforeExam: e.target.checked ? 1 : 0,
                })
              }
              className="mt-0.5 rounded accent-indigo-600"
            />
            <div>
              <span className="block text-xs font-bold text-neutral-800">
                Pre-Exam Light Review Day
              </span>
              <span className="block text-[11px] text-neutral-500">
                Reduces cognitive fatigue 24-48h before the exam.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Generator Call-To-Action */}
      <div className="bg-gradient-to-r from-neutral-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-bold font-display">Ready to Build Your Schedule?</h3>
          </div>
          <p className="text-sm text-neutral-300 max-w-lg">
            Gemini AI will synthesize your syllabus topics, calculate exam proximity, and construct a personalized day-by-day plan with actionable study tasks.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            id="btn-generate-ai-schedule"
            type="button"
            disabled={isGenerating}
            onClick={() => validateAndGenerate(true)}
            className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{generatingProgressText || 'Synthesizing Plan...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Generate AI Study Schedule</span>
              </>
            )}
          </button>

          <button
            id="btn-generate-instant-schedule"
            type="button"
            disabled={isGenerating}
            onClick={() => validateAndGenerate(false)}
            className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 font-semibold text-xs border border-white/15 transition text-center"
            title="Generate immediately using local rule-based engine"
          >
            Instant Generator
          </button>
        </div>
      </div>
    </div>
  );
};
