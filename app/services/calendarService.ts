const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  category: string;
  is_all_day: boolean;
  deleted_at: string | null;
  recoverable_until?: string;
}

export interface CalendarActionResult {
  action: "none" | "created" | "updated" | "delete_confirmation";
  event?: CalendarEvent;
  reason?: string | null;
}

export interface CalendarNoteInput {
  id: number;
  text: string;
  date: string;
  time: string;
  category: string;
}

async function calendarRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
    credentials: "include",
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || `Calendar request failed: ${response.status}`);
  }
  return result as T;
}

export async function getCalendarEvents(token: string): Promise<CalendarEvent[]> {
  const result = await calendarRequest<{ events: CalendarEvent[] }>("/api/events", token);
  return result.events;
}

export async function importLocalCalendarNotes(
  notes: CalendarNoteInput[],
  token: string,
  timezoneOffsetMinutes: number,
  timezoneName: string
): Promise<void> {
  await calendarRequest("/api/events/import-local", token, {
    method: "POST",
    body: JSON.stringify({
      notes,
      timezone_offset_minutes: timezoneOffsetMinutes,
      timezone_name: timezoneName,
    }),
  });
}

export async function createCalendarEvent(
  event: Pick<CalendarEvent, "title" | "start_time" | "end_time" | "category" | "is_all_day">,
  token: string
): Promise<CalendarEvent> {
  const result = await calendarRequest<{ event: CalendarEvent }>("/api/events", token, {
    method: "POST",
    body: JSON.stringify(event),
  });
  return result.event;
}

export async function updateCalendarEvent(
  id: number,
  event: Pick<CalendarEvent, "title" | "start_time" | "end_time" | "category" | "is_all_day">,
  token: string
): Promise<CalendarEvent> {
  const result = await calendarRequest<{ event: CalendarEvent }>(`/api/events/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(event),
  });
  return result.event;
}

export async function deleteCalendarEvent(id: number, token: string): Promise<CalendarEvent> {
  const result = await calendarRequest<{ event: CalendarEvent }>(`/api/events/${id}`, token, {
    method: "DELETE",
  });
  return result.event;
}

export async function getDeletedCalendarEvents(token: string): Promise<CalendarEvent[]> {
  const result = await calendarRequest<{ events: CalendarEvent[] }>("/api/events/deleted", token);
  return result.events;
}

export async function restoreCalendarEvent(id: number, token: string): Promise<CalendarEvent> {
  const result = await calendarRequest<{ event: CalendarEvent }>(`/api/events/${id}/restore`, token, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return result.event;
}

export async function parseEventFromText(
  text: string,
  token: string,
  timezoneOffsetMinutes: number,
  timezoneName: string
): Promise<CalendarActionResult> {
  return calendarRequest<CalendarActionResult>("/api/chat/parse-event", token, {
    method: "POST",
    body: JSON.stringify({
      text,
      timezone_offset_minutes: timezoneOffsetMinutes,
      timezone_name: timezoneName,
    }),
  });
}
