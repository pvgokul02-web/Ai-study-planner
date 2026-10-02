import {
  Subject,
  StudyPreferences,
  DailySchedule,
  StudySession,
  ActivityType,
  StudyPlan,
} from '../types';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatDateLabel(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  } catch {
    return dateStr;
  }
}

export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function generateAlgorithmicSchedule(
  subjects: Subject[],
  preferences: StudyPreferences,
  startDateStr: string = new Date().toISOString().split('T')[0]
): StudyPlan {
  if (subjects.length === 0) {
    return {
      id: `plan-${Date.now()}`,
      title: 'Personal Study Plan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subjects: [],
      preferences,
      dailySchedules: [],
      aiOverview: {
        summary: 'No subjects added yet. Add your subjects and exam dates to generate a schedule.',
        keyRecommendations: [],
        readinessStrategy: 'Add subjects to begin.',
      },
    };
  }

  // Find latest exam date
  const sortedByExam = [...subjects].sort(
    (a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
  );
  const latestExamDate = sortedByExam[sortedByExam.length - 1].examDate;
  const totalDays = Math.max(1, calculateDaysBetween(startDateStr, latestExamDate));

  // Determine difficulty weight
  const getDifficultyWeight = (diff: string) => {
    switch (diff) {
      case 'Very Hard':
        return 2.0;
      case 'Challenging':
        return 1.6;
      case 'Moderate':
        return 1.2;
      default:
        return 1.0;
    }
  };

  const getPriorityWeight = (prio: string) => {
    switch (prio) {
      case 'High':
        return 1.5;
      case 'Medium':
        return 1.2;
      default:
        return 1.0;
    }
  };

  const dailySchedules: DailySchedule[] = [];
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const curDate = new Date(sy, sm - 1, sd);

  // Keep track of topic rotation per subject
  const topicIndexMap: Record<string, number> = {};
  subjects.forEach((s) => {
    topicIndexMap[s.id] = 0;
  });

  for (let dayOffset = 0; dayOffset <= totalDays; dayOffset++) {
    const thisDate = new Date(curDate);
    thisDate.setDate(curDate.getDate() + dayOffset);
    const dateStr = thisDate.toISOString().split('T')[0];
    const dayOfWeek = DAYS_OF_WEEK[thisDate.getDay()];
    const isWeekend = thisDate.getDay() === 0 || thisDate.getDay() === 6;

    // Check which exams are on this day
    const examsToday = subjects
      .filter((s) => s.examDate === dateStr)
      .map((s) => ({ subjectId: s.id, subjectName: s.name, targetGrade: s.targetGrade }));

    // Find active subjects (where exam is today or in future)
    const activeSubjects = subjects.filter((s) => {
      const daysUntilExam = calculateDaysBetween(dateStr, s.examDate);
      return daysUntilExam >= 0;
    });

    if (activeSubjects.length === 0) {
      // All exams finished
      break;
    }

    const availableHours = isWeekend
      ? preferences.dailyHoursWeekend
      : preferences.dailyHoursWeekday;
    const sessionDuration = preferences.sessionDuration || 45;
    const maxSessions = Math.max(1, Math.floor((availableHours * 60) / sessionDuration));

    const sessions: StudySession[] = [];

    // Sort active subjects for this day by urgency & weight
    const rankedSubjects = [...activeSubjects].sort((a, b) => {
      const daysLeftA = Math.max(0.1, calculateDaysBetween(dateStr, a.examDate));
      const daysLeftB = Math.max(0.1, calculateDaysBetween(dateStr, b.examDate));
      const scoreA = (getDifficultyWeight(a.difficulty) * getPriorityWeight(a.priority)) / daysLeftA;
      const scoreB = (getDifficultyWeight(b.difficulty) * getPriorityWeight(b.priority)) / daysLeftB;
      return scoreB - scoreA;
    });

    let sessionsAssigned = 0;
    let currentSubjectIdx = 0;

    while (sessionsAssigned < maxSessions && rankedSubjects.length > 0) {
      const subject = rankedSubjects[currentSubjectIdx % rankedSubjects.length];
      const daysUntilExam = calculateDaysBetween(dateStr, subject.examDate);

      // Select topic
      const topics = subject.topics.length > 0
        ? subject.topics
        : [{ id: 'gen', name: 'General Core Syllabus', confidence: 3 }];
      const tIdx = topicIndexMap[subject.id] % topics.length;
      const topic = topics[tIdx];
      topicIndexMap[subject.id] = tIdx + 1;

      // Select activity type based on proximity to exam
      let activityType: ActivityType = 'Concept Learning';
      let actionableTask = `Study foundational concepts and take structured notes for ${topic.name}`;
      let keyTip = 'Focus on understanding first principles rather than pure rote memorization.';

      if (daysUntilExam === 0) {
        activityType = 'Pre-Exam Quick Polish';
        actionableTask = `Final quick formula and key definitions check for ${subject.name} before the exam`;
        keyTip = 'Keep calm, stay hydrated, and trust your preparation.';
      } else if (daysUntilExam <= 2) {
        activityType = 'Formula & Cheat Sheet Review';
        actionableTask = `Review summary sheets, formula derivations, and common mistakes for ${topic.name}`;
        keyTip = 'Practice 2-3 high-yield questions under timed conditions.';
      } else if (daysUntilExam <= 5 && preferences.includeMockExams) {
        activityType = 'Mock Test / Timed Exam';
        actionableTask = `Timed past-paper exam simulation covering ${topic.name} & mixed questions`;
        keyTip = 'Grade your answers strictly using marking schemes to identify weak spots.';
      } else if (daysUntilExam <= 10 && preferences.spacedRepetition) {
        activityType = 'Active Recall & Flashcards';
        actionableTask = `Self-testing via flashcards & blurting technique on ${topic.name}`;
        keyTip = 'Close your notes and write out everything you recall from memory before reviewing.';
      } else if (topic.confidence <= 2) {
        activityType = 'Practice & Problems';
        actionableTask = `Solve 8-10 guided practice problems with step-by-step breakdown on ${topic.name}`;
        keyTip = 'Work through each error immediately: annotate why the wrong step was chosen.';
      }

      sessions.push({
        id: `sess-${dateStr}-${sessionsAssigned + 1}-${subject.id}`,
        date: dateStr,
        dayOfWeek,
        subjectId: subject.id,
        subjectName: subject.name,
        topicName: topic.name,
        activityType,
        durationMinutes: sessionDuration,
        actionableTask,
        keyTip,
        completed: false,
      });

      sessionsAssigned++;
      currentSubjectIdx++;
    }

    const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

    dailySchedules.push({
      date: dateStr,
      dayOfWeek,
      sessions,
      totalMinutes,
      isRestDay: sessions.length === 0,
      examsOnThisDay: examsToday.length > 0 ? examsToday : undefined,
      dailyMotivation:
        dayOffset === 0
          ? 'Today marks day 1. Consistent daily blocks build unstoppable mastery.'
          : examsToday.length > 0
          ? 'Exam Day! Take deep breaths, pace your time, and show what you know.'
          : 'Focus on one session at a time. Protect your study blocks from distractions.',
    });
  }

  return {
    id: `plan-${Date.now()}`,
    title: `AI Master Study Plan (${subjects.length} Subjects)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subjects,
    preferences,
    dailySchedules,
    aiOverview: {
      summary: `Automated study schedule constructed across ${dailySchedules.length} days leading up to exams for ${subjects.map((s) => s.name).join(', ')}. Weighted toward high-difficulty topics and spaced retrieval.`,
      keyRecommendations: [
        'Use active recall sessions to test yourself without notes before checking solutions.',
        'Prioritize high-weight topics that currently have the lowest confidence levels.',
        'Reserve the 48 hours prior to each exam for light formula reviews and adequate sleep.',
      ],
      readinessStrategy:
        'Evenly distributes daily study blocks across weekdays and weekends with simulated timed test milestones.',
    },
  };
}
