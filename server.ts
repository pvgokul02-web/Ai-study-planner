import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy getter for GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auto-suggest syllabus topics for a subject
app.post('/api/suggest-topics', async (req, res) => {
  try {
    const { subjectName, examType } = req.body;
    if (!subjectName) {
      return res.status(400).json({ error: 'subjectName is required' });
    }

    const ai = getGeminiClient();
    const prompt = `You are an expert academic curriculum designer. Suggest 5 to 7 high-yield, foundational syllabus topics/chapters for the subject: "${subjectName}" (${examType || 'General University / High School Exam'}).
Return only a JSON array of strings containing clean topic titles (no numbering or bullet markers).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const topicsText = response.text || '[]';
    const topics = JSON.parse(topicsText);
    res.json({ topics });
  } catch (error: any) {
    console.error('Error suggesting topics:', error);
    res.status(500).json({ error: error.message || 'Failed to suggest topics' });
  }
});

// Generate comprehensive AI study schedule
app.post('/api/generate-schedule', async (req, res) => {
  try {
    const { subjects, preferences, startDate } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'At least one subject is required.' });
    }

    const ai = getGeminiClient();
    const curDateStr = startDate || new Date().toISOString().split('T')[0];

    const prompt = `You are a world-class cognitive learning scientist and study coach.
Design a highly effective, realistic, day-by-day study schedule starting from ${curDateStr} until the final exam date.

INPUT DATA:
- Current / Start Date: ${curDateStr}
- Subjects & Exams:
${JSON.stringify(subjects, null, 2)}

- User Study Preferences:
${JSON.stringify(preferences, null, 2)}

REQUIREMENTS FOR SCHEDULE:
1. Generate daily study schedules for each day starting from ${curDateStr} through the latest exam date.
2. For each day, include:
   - "date": format YYYY-MM-DD
   - "dayOfWeek": e.g. "Monday"
   - "dailyMotivation": 1 uplifting or practical study tip
   - "examsOnThisDay": array of { "subjectId", "subjectName", "targetGrade" } if any subject has its exam on this date
   - "sessions": array of study session blocks.
     Total planned study time per day should respect dailyHoursWeekday (~${preferences.dailyHoursWeekday}h) and dailyHoursWeekend (~${preferences.dailyHoursWeekend}h).
     Each session must have:
     - "id": unique string
     - "date": YYYY-MM-DD
     - "dayOfWeek": string
     - "subjectId": matching subject id
     - "subjectName": matching subject name
     - "topicName": specific topic from syllabus
     - "activityType": one of ["Concept Learning", "Practice & Problems", "Active Recall & Flashcards", "Mock Test / Timed Exam", "Formula & Cheat Sheet Review", "Pre-Exam Quick Polish"]
     - "durationMinutes": number (e.g. ${preferences.sessionDuration || 45})
     - "actionableTask": very concrete, micro-goal (e.g. "Solve 6 practice problems on integration by parts without looking at notes")
     - "keyTip": cognitive retention tip or memory anchor
     - "completed": false
3. Spaced repetition: Early days focus on Concept Learning and Practice; middle days on Active Recall & Flashcards; 3-7 days prior on Mock Tests; 1-2 days prior on Formula & Cheat Sheet review and light rest.
4. Also provide "aiOverview":
   - "summary": 2-3 sentence overview of this custom plan
   - "keyRecommendations": array of 3 top strategic study guidelines
   - "readinessStrategy": paragraph explaining the pacing rationale.

Return the result strictly as a valid JSON object matching this schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            aiOverview: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                keyRecommendations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                readinessStrategy: { type: Type.STRING },
              },
              required: ['summary', 'keyRecommendations', 'readinessStrategy'],
            },
            dailySchedules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  dayOfWeek: { type: Type.STRING },
                  dailyMotivation: { type: Type.STRING },
                  examsOnThisDay: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        subjectId: { type: Type.STRING },
                        subjectName: { type: Type.STRING },
                        targetGrade: { type: Type.STRING },
                      },
                      required: ['subjectId', 'subjectName'],
                    },
                  },
                  sessions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        date: { type: Type.STRING },
                        dayOfWeek: { type: Type.STRING },
                        subjectId: { type: Type.STRING },
                        subjectName: { type: Type.STRING },
                        topicName: { type: Type.STRING },
                        activityType: { type: Type.STRING },
                        durationMinutes: { type: Type.INTEGER },
                        actionableTask: { type: Type.STRING },
                        keyTip: { type: Type.STRING },
                        completed: { type: Type.BOOLEAN },
                      },
                      required: [
                        'id',
                        'date',
                        'dayOfWeek',
                        'subjectId',
                        'subjectName',
                        'topicName',
                        'activityType',
                        'durationMinutes',
                        'actionableTask',
                      ],
                    },
                  },
                },
                required: ['date', 'dayOfWeek', 'sessions'],
              },
            },
          },
          required: ['title', 'aiOverview', 'dailySchedules'],
        },
      },
    });

    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);

    // Calculate total minutes per day
    if (parsed.dailySchedules) {
      parsed.dailySchedules.forEach((day: any) => {
        day.totalMinutes = (day.sessions || []).reduce(
          (sum: number, s: any) => sum + (s.durationMinutes || 0),
          0
        );
        day.isRestDay = (day.sessions || []).length === 0;
      });
    }

    const fullPlan = {
      id: `plan-${Date.now()}`,
      title: parsed.title || `AI Study Plan (${subjects.length} Subjects)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subjects,
      preferences,
      dailySchedules: parsed.dailySchedules || [],
      aiOverview: parsed.aiOverview,
    };

    res.json(fullPlan);
  } catch (error: any) {
    console.error('Error generating AI study schedule:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate study schedule via AI',
    });
  }
});

// AI Re-balance / Catch-up: Rebalance upcoming schedule if student missed days
app.post('/api/rebalance-schedule', async (req, res) => {
  try {
    const { plan, missedSessionsCount, focusSubjectId } = req.body;
    if (!plan || !plan.dailySchedules) {
      return res.status(400).json({ error: 'Plan is required' });
    }

    const ai = getGeminiClient();
    const prompt = `The student fell behind on ${missedSessionsCount || 2} study sessions.
Subject focus: ${focusSubjectId || 'all subjects'}.
Current Plan Summary:
Subjects: ${plan.subjects.map((s: any) => `${s.name} (Exam: ${s.examDate})`).join(', ')}
Remaining days count: ${plan.dailySchedules.length}

Provide 3 concise, highly actionable re-calibration recommendations to catch up without burning out, plus an adjusted daily focus advice.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: { type: Type.STRING },
            catchUpSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            rebalanceRatio: { type: Type.STRING },
          },
          required: ['advice', 'catchUpSteps'],
        },
      },
    });

    const resultText = response.text || '{}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Error in rebalancing:', error);
    res.status(500).json({ error: error.message || 'Failed to rebalance' });
  }
});

async function startServer() {
  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
