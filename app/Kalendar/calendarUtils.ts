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

function getDateTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

export function formatDateForInputInTimezone(date: Date, timeZone: string): string {
  const { year, month, day } = getDateTimeParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatTimeForInputInTimezone(date: Date, timeZone: string): string {
  const { hour, minute } = getDateTimeParts(date, timeZone);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function localDateTimeToDate(date: string, time: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(`${date}T${time}`);
  if (!match) throw new RangeError("Invalid calendar date or time.");
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const target = {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
    hour: Number(hourText),
    minute: Number(minuteText),
    second: 0,
  };
  const targetAsUtc = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute
  );
  let timestamp = targetAsUtc;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = getDateTimeParts(new Date(timestamp), timeZone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute
    );
    const difference = targetAsUtc - actualAsUtc;
    if (difference === 0) return new Date(timestamp);
    timestamp += difference;
  }

  throw new RangeError("The selected local time does not exist in this time zone.");
}

export function addCalendarDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, "0")}-${String(result.getUTCDate()).padStart(2, "0")}`;
}

export function getMinimumTimeForTodayInTimezone(date: Date, timeZone: string): string {
  const { year, month, day, hour, minute, second } = getDateTimeParts(date, timeZone);
  const minimum = new Date(Date.UTC(year, month - 1, day, hour, minute + Number(second > 0)));
  return `${String(minimum.getUTCHours()).padStart(2, "0")}:${String(minimum.getUTCMinutes()).padStart(2, "0")}`;
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
