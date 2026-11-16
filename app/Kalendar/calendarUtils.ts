export interface Note {
  id: number;
  text: string;
  date: string;
  time: string;
  category: string;
}

export interface CalendarCell {
  day: number;
  offset: -1 | 0 | 1;
}

export const CATEGORY_OPTIONS = ["Lectures (lessons)", "Exams", "Meetings", "Notes", "Events"];
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_UPLOAD_TOTAL_SIZE = 20 * 1024 * 1024;
export const MAX_UPLOAD_COUNT = 5;
export const SUPPORTED_FILE_EXTENSIONS = new Set(["txt", "md", "csv", "json", "pdf", "docx"]);

export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMinimumTimeForToday(date: Date): string {
  const minimumTime = new Date(date);
  minimumTime.setSeconds(0, 0);
  if (date.getSeconds() > 0 || date.getMilliseconds() > 0) {
    minimumTime.setMinutes(minimumTime.getMinutes() + 1);
  }
  return `${String(minimumTime.getHours()).padStart(2, "0")}:${String(minimumTime.getMinutes()).padStart(2, "0")}`;
}

export function sortNotesByDateTime(notes: Note[]): Note[] {
  return notes.slice().sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return (a.time || "23:59").localeCompare(b.time || "23:59");
  });
}

export function getCategoryClass(category: string): string {
  switch (category) {
    case "Lectures (lessons)":
      return "lectures";
    case "Exams":
      return "exams";
    case "Meetings":
      return "meetings";
    case "Notes":
      return "notes";
    default:
      return "events";
  }
}

export function createCalendarCells(year: number, month: number): CalendarCell[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const leadingDays = firstDay === 0 ? 6 : firstDay - 1;
  const previousMonthDays = new Date(year, month, 0).getDate();

  return Array.from({ length: 42 }, (_, index) => {
    if (index < leadingDays) {
      return { day: previousMonthDays - leadingDays + 1 + index, offset: -1 };
    }
    if (index < leadingDays + daysInMonth) {
      return { day: index - leadingDays + 1, offset: 0 };
    }
    return { day: index - leadingDays - daysInMonth + 1, offset: 1 };
  });
}
