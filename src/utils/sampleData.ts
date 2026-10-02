import { StudyPlan, Subject, StudyPreferences } from '../types';

export function getRelativeDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

export const PRESET_STEM_FINALS: {
  title: string;
  subjects: Subject[];
  preferences: StudyPreferences;
} = {
  title: 'University STEM Finals Prep',
  preferences: {
    dailyHoursWeekday: 3.5,
    dailyHoursWeekend: 5,
    sessionDuration: 45,
    preferredTimeOfDay: 'morning',
    includeMockExams: true,
    spacedRepetition: true,
    bufferDaysBeforeExam: 1,
  },
  subjects: [
    {
      id: 'sub-calc',
      name: 'Calculus & Differential Equations',
      examDate: getRelativeDate(14),
      difficulty: 'Very Hard',
      targetGrade: 'A',
      priority: 'High',
      color: '#3B82F6', // Blue
      topics: [
        { id: 'top-1', name: 'Integration Techniques & By-Parts', confidence: 2 },
        { id: 'top-2', name: 'Taylor & Maclaurin Series', confidence: 1 },
        { id: 'top-3', name: 'First-Order Differential Equations', confidence: 3 },
        { id: 'top-4', name: 'Partial Derivatives & Chain Rule', confidence: 4 },
      ],
    },
    {
      id: 'sub-chem',
      name: 'Organic Chemistry',
      examDate: getRelativeDate(18),
      difficulty: 'Challenging',
      targetGrade: 'A-',
      priority: 'High',
      color: '#10B981', // Emerald
      topics: [
        { id: 'top-5', name: 'Reaction Mechanisms (SN1/SN2, E1/E2)', confidence: 2 },
        { id: 'top-6', name: 'Stereochemistry & Enantiomers', confidence: 3 },
        { id: 'top-7', name: 'Spectroscopy (NMR & IR Interpretation)', confidence: 2 },
        { id: 'top-8', name: 'Aromaticity & Electrophilic Substitution', confidence: 3 },
      ],
    },
    {
      id: 'sub-cs',
      name: 'Data Structures & Algorithms',
      examDate: getRelativeDate(22),
      difficulty: 'Moderate',
      targetGrade: 'A+',
      priority: 'Medium',
      color: '#8B5CF6', // Purple
      topics: [
        { id: 'top-9', name: 'Binary Search Trees & Heaps', confidence: 4 },
        { id: 'top-10', name: 'Graph Traversals (BFS, DFS, Dijkstra)', confidence: 3 },
        { id: 'top-11', name: 'Dynamic Programming Foundations', confidence: 2 },
        { id: 'top-12', name: 'Big-O Complexity Analysis', confidence: 5 },
      ],
    },
  ],
};

export const PRESET_MED_PREP: {
  title: string;
  subjects: Subject[];
  preferences: StudyPreferences;
} = {
  title: 'Medical / Biology Board Review',
  preferences: {
    dailyHoursWeekday: 4,
    dailyHoursWeekend: 6,
    sessionDuration: 50,
    preferredTimeOfDay: 'morning',
    includeMockExams: true,
    spacedRepetition: true,
    bufferDaysBeforeExam: 2,
  },
  subjects: [
    {
      id: 'sub-anat',
      name: 'Human Anatomy & Physiology',
      examDate: getRelativeDate(16),
      difficulty: 'Very Hard',
      targetGrade: 'High Pass',
      priority: 'High',
      color: '#EC4899', // Pink
      topics: [
        { id: 'med-1', name: 'Cardiovascular Dynamics & ECG', confidence: 2 },
        { id: 'med-2', name: 'Renal Glomerular Filtration & Acid-Base', confidence: 2 },
        { id: 'med-3', name: 'Neuroanatomy & Cranial Nerves', confidence: 3 },
      ],
    },
    {
      id: 'sub-pharm',
      name: 'Pharmacology',
      examDate: getRelativeDate(21),
      difficulty: 'Challenging',
      targetGrade: 'A',
      priority: 'High',
      color: '#F59E0B', // Amber
      topics: [
        { id: 'med-4', name: 'Autonomic Nervous System Agonists', confidence: 2 },
        { id: 'med-5', name: 'Antibiotic Mechanisms & Resistance', confidence: 3 },
        { id: 'med-6', name: 'Pharmacokinetics & Half-Life Calculations', confidence: 4 },
      ],
    },
  ],
};

export const SUBJECT_COLOR_PALETTE = [
  { name: 'Indigo', value: '#6366F1', bgLight: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { name: 'Blue', value: '#3B82F6', bgLight: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Emerald', value: '#10B981', bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Amber', value: '#F59E0B', bgLight: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Rose', value: '#F43F5E', bgLight: 'bg-rose-50 text-rose-700 border-rose-200' },
  { name: 'Purple', value: '#8B5CF6', bgLight: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Teal', value: '#14B8A6', bgLight: 'bg-teal-50 text-teal-700 border-teal-200' },
  { name: 'Cyan', value: '#06B6D4', bgLight: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
];
