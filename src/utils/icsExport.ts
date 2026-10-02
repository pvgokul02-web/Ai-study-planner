import { StudyPlan } from '../types';

export function exportStudyPlanToICS(plan: StudyPlan): void {
  const events: string[] = [];

  // Helper to format date + time into iCal format (YYYYMMDDTHHMMSS)
  const formatICalDate = (dateStr: string, hour: number, minute: number): string => {
    const [y, m, d] = dateStr.split('-');
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${y}${m}${d}T${pad(hour)}${pad(minute)}00`;
  };

  const defaultStartHours: Record<string, number> = {
    morning: 9,
    afternoon: 14,
    evening: 18,
    flexible: 10,
  };

  const baseHour = defaultStartHours[plan.preferences.preferredTimeOfDay] || 9;

  plan.dailySchedules.forEach((day) => {
    // Add exam markers
    if (day.examsOnThisDay && day.examsOnThisDay.length > 0) {
      day.examsOnThisDay.forEach((exam, idx) => {
        const uid = `exam-${exam.subjectId}-${day.date}-${idx}@aistudyplanner`;
        const start = formatICalDate(day.date, 8, 0);
        const end = formatICalDate(day.date, 12, 0);
        events.push([
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `SUMMARY:🎯 EXAM: ${exam.subjectName}`,
          `DESCRIPTION:Target Goal: ${exam.targetGrade || 'A'}\\nExam Day! Stay calm and focused.`,
          `DTSTART:${start}`,
          `DTEND:${end}`,
          'STATUS:CONFIRMED',
          'TRANSP:OPAQUE',
          'END:VEVENT',
        ].join('\r\n'));
      });
    }

    // Add study sessions
    let currentHour = baseHour;
    let currentMinute = 0;

    day.sessions.forEach((session, idx) => {
      const start = formatICalDate(day.date, currentHour, currentMinute);
      
      // Calculate end time
      let endMinute = currentMinute + session.durationMinutes;
      let endHour = currentHour + Math.floor(endMinute / 60);
      endMinute = endMinute % 60;
      const end = formatICalDate(day.date, endHour, endMinute);

      // Increment for next session with 10 min break
      currentMinute = endMinute + 10;
      currentHour = endHour + Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;

      const uid = `session-${session.id || idx}-${day.date}@aistudyplanner`;
      const cleanDesc = `Subject: ${session.subjectName}\\nTopic: ${session.topicName}\\nType: ${session.activityType}\\nGoal: ${session.actionableTask}\\nTip: ${session.keyTip || 'Stay focused.'}`;

      events.push([
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `SUMMARY:📚 Study: ${session.subjectName} (${session.topicName})`,
        `DESCRIPTION:${cleanDesc}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT',
      ].join('\r\n'));
    });
  });

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Study Planner//Schedule Generator//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${plan.title || 'AI Study Schedule'}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${plan.title.replace(/\s+/g, '_')}_schedule.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
