export type DifficultyLevel = 'Easy' | 'Moderate' | 'Challenging' | 'Very Hard';
export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface Topic {
  id: string;
  name: string;
  confidence: number; // 1 to 5
  completed?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  examDate: string; // YYYY-MM-DD
  difficulty: DifficultyLevel;
  targetGrade?: string;
  priority: PriorityLevel;
  color: string;
  topics: Topic[];
}

export interface StudyPreferences {
  dailyHoursWeekday: number;
  dailyHoursWeekend: number;
  sessionDuration: number; // in minutes (e.g. 30, 45, 60)
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'flexible';
  includeMockExams: boolean;
  spacedRepetition: boolean;
  bufferDaysBeforeExam: number; // e.g. 1 or 2 days
}

export type ActivityType =
  | 'Concept Learning'
  | 'Practice & Problems'
  | 'Active Recall & Flashcards'
  | 'Mock Test / Timed Exam'
  | 'Formula & Cheat Sheet Review'
  | 'Pre-Exam Quick Polish';

export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  subjectId: string;
  subjectName: string;
  topicName: string;
  activityType: ActivityType;
  durationMinutes: number;
  actionableTask: string;
  keyTip?: string;
  completed: boolean;
  notes?: string;
}

export interface DayExamNotice {
  subjectId: string;
  subjectName: string;
  targetGrade?: string;
}

export interface DailySchedule {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  sessions: StudySession[];
  totalMinutes: number;
  isRestDay?: boolean;
  dailyMotivation?: string;
  examsOnThisDay?: DayExamNotice[];
}

export interface StudyPlan {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  subjects: Subject[];
  preferences: StudyPreferences;
  dailySchedules: DailySchedule[];
  aiOverview?: {
    summary: string;
    keyRecommendations: string[];
    readinessStrategy: string;
  };
}
