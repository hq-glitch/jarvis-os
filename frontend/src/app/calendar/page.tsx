"use client";
import Link from "next/link";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type EventCategory =
  | "Personal"
  | "Pepperdine"
  | "Rouke Ranch"
  | "Finance"
  | "Appointment";

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  category: EventCategory;
  notes: string;
  sourceCalendar?: string;
sourceColor?: string | null;
};
type ImportedCalendarEvent = {
  id: string;
  title: string;
  startAt: string;
  isAllDay: boolean;
  notes: string;
  accountEmail: string;
  calendarName: string;
calendarColor: string | null;
};

type WritableCalendar = {
  id: string;
  name: string;
  accountEmail: string;
  providerColor: string | null;
};

const storageKey = "jarvis-calendar-events";

const categoryStyles: Record<EventCategory, string> = {
  Personal: "bg-[#7A826E]/20 text-[#4F5C49] border-[#7A826E]/35",
  Pepperdine: "bg-[#B08D57]/20 text-[#7C5F33] border-[#B08D57]/40",
  "Rouke Ranch": "bg-[#1E3A34]/15 text-[#1E3A34] border-[#1E3A34]/30",
  Finance: "bg-[#B08D57]/20 text-[#7C5F33] border-[#B08D57]/40",
  Appointment: "bg-[#D7D0C5]/50 text-[#5F665C] border-[#B08D57]/30",
};
function getSourceCalendarStyle(event: CalendarEvent) {
  const colorMatch = event.sourceColor?.match(
    /^#([0-9a-f]{6})/i,
  );

  if (!colorMatch) {
    return undefined;
  }

  const color = `#${colorMatch[1]}`;

  return {
    backgroundColor: `${color}1F`,
    borderColor: `${color}66`,
    color: "#2C2C2C",
  };
}
const starterEvents: CalendarEvent[] = [
  {
    id: "jarvis-calendar-launch",
    title: "Build Jarvis Calendar",
    date: new Date().toISOString().slice(0, 10),
    time: "14:00",
    category: "Personal",
    notes: "Create the first working calendar workspace.",
  },
];

function formatMonth(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatEventDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(time: string) {
  if (!time) {
    return "All day";
  }

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
export default function CalendarPage() {
  const [events, setEvents] =
    useState<CalendarEvent[]>(starterEvents);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(selectedDate);
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [category, setCategory] =
    useState<EventCategory>("Personal");

  const [notes, setNotes] = useState("");

  const [writableCalendars, setWritableCalendars] =
    useState<WritableCalendar[]>([]);

  const [destinationCalendarId, setDestinationCalendarId] =
    useState("");

  const [isSavingEvent, setIsSavingEvent] = useState(false);

  const [eventSaveError, setEventSaveError] =
    useState<string | null>(null);

  const [editingEvent, setEditingEvent] =
    useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isUpdatingEvent, setIsUpdatingEvent] =
    useState(false);
  const [editEventError, setEditEventError] =
    useState<string | null>(null);

  const [isSyncing, setIsSyncing] = useState(true);
  const [syncVersion, setSyncVersion] = useState(0);

useEffect(() => {
  let cancelled = false;

  async function loadWritableCalendars() {
    try {
      const response = await fetch("/api/integrations", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load connected calendars.");
      }

      const data = (await response.json()) as {
        integrations: Array<{
          provider: string;
          email: string;
          calendars: Array<{
            id: string;
            name: string;
            isEnabled: boolean;
            isReadOnly: boolean;
            providerColor: string | null;
          }>;
        }>;
      };

      const calendars: WritableCalendar[] =
        data.integrations
          .filter(
            (integration) =>
              integration.provider === "GOOGLE" ||
              integration.provider === "APPLE",
          )
          .flatMap((integration) =>
            integration.calendars
              .filter(
                (calendar) =>
                  calendar.isEnabled &&
                  !calendar.isReadOnly,
              )
              .map((calendar) => ({
                id: calendar.id,
                name: calendar.name,
                accountEmail:
                  integration.provider === "APPLE"
                    ? `iCloud · ${integration.email}`
                    : integration.email,
                providerColor: calendar.providerColor,
              })),
          );

      if (cancelled) {
        return;
      }

      setWritableCalendars(calendars);

      setDestinationCalendarId((current) =>
        current || calendars[0]?.id || "",
      );
    } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : "Unable to load writable calendars.",
      );
    }
  }

  void loadWritableCalendars();

  return () => {
    cancelled = true;
  };
}, []);

useEffect(() => {
  try {
    const savedEvents = window.localStorage.getItem(storageKey);

    if (savedEvents) {
      setEvents(JSON.parse(savedEvents) as CalendarEvent[]);
    }
  } catch {
    setEvents(starterEvents);
  }
}, []);
  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(events));
  }, [events]);
  useEffect(() => {
  let cancelled = false;

  async function loadConnectedCalendarEvents() {
    try {
      const response = await fetch("/api/events", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load connected calendar events.");
      }

      const data = (await response.json()) as {
        events: ImportedCalendarEvent[];
      };

      if (cancelled) {
        return;
      }

      const importedEvents: CalendarEvent[] = data.events.map((event) => {
        const start = new Date(event.startAt);

        const date = [
          start.getFullYear(),
          String(start.getMonth() + 1).padStart(2, "0"),
          String(start.getDate()).padStart(2, "0"),
        ].join("-");

        const time = event.isAllDay
          ? ""
          : [
              String(start.getHours()).padStart(2, "0"),
              String(start.getMinutes()).padStart(2, "0"),
            ].join(":");

        return {
          id: event.id,
          title: event.title,
          date,
          time,
          category: event.accountEmail.endsWith("@pepperdine.edu")
            ? "Pepperdine"
            : "Personal",
          notes: event.notes,
          sourceCalendar: event.calendarName,
sourceColor: event.calendarColor,
        };
      });

      setEvents((currentEvents) => [
        ...currentEvents.filter(
          (event) =>
  !event.id.startsWith("google:") &&
  !event.id.startsWith("apple:"),
        ),
        ...importedEvents,
      ]);
       } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : "Unable to load connected calendar events.",
      );
    } finally {
      if (!cancelled) {
        setIsSyncing(false);
      }
    }
  }

  void loadConnectedCalendarEvents();

  return () => {
    cancelled = true;
  };
}, [syncVersion]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const leadingDays = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const days: Date[] = [];

    for (let index = leadingDays - 1; index >= 0; index -= 1) {
      days.push(new Date(year, month, -index));
    }

    for (let day = 1; day <= totalDays; day += 1) {
      days.push(new Date(year, month, day));
    }

    while (days.length % 7 !== 0) {
      const nextDay = days.length - leadingDays - totalDays + 1;
      days.push(new Date(year, month + 1, nextDay));
    }

    return days;
  }, [currentMonth]);

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    return [...events]
      .filter((event) => event.date >= today)
      .sort((a, b) => {
        const first = `${a.date}T${a.time || "00:00"}`;
        const second = `${b.date}T${b.time || "00:00"}`;

        return first.localeCompare(second);
      })
      .slice(0, 6);
  }, [events]);
function syncCalendars() {
  setIsSyncing(true);
  setSyncVersion((version) => version + 1);
}
  function openEventForm(day?: Date) {
    const chosenDate = day
      ? day.toLocaleDateString("en-CA")
      : selectedDate;

    setSelectedDate(chosenDate);
    setDate(chosenDate);
    setIsFormOpen(true);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (
      !trimmedTitle ||
      !date ||
      !destinationCalendarId
    ) {
      return;
    }

    setIsSavingEvent(true);
    setEventSaveError(null);

    try {
      const isAllDay = !time;

      let startAt: Date;
      let endAt: Date;

      if (isAllDay) {
        startAt = new Date(`${date}T00:00:00`);

        endAt = new Date(startAt);
        endAt.setDate(endAt.getDate() + 1);
      } else {
        startAt = new Date(`${date}T${time}:00`);

        if (endTime) {
          endAt = new Date(`${date}T${endTime}:00`);

          if (endAt <= startAt) {
            endAt.setDate(endAt.getDate() + 1);
          }
        } else {
          endAt = new Date(
            startAt.getTime() + 60 * 60 * 1000,
          );
        }
      }

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calendarId: destinationCalendarId,
          title: trimmedTitle,
          description: notes.trim() || null,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          isAllDay,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to create calendar event.",
        );
      }

      setTitle("");
      setTime("");
      setEndTime("");
      setCategory("Personal");
      setNotes("");
      setIsFormOpen(false);

      setIsSyncing(true);
      setSyncVersion((version) => version + 1);
    } catch (error) {
      setEventSaveError(
        error instanceof Error
          ? error.message
          : "Unable to create calendar event.",
      );
    } finally {
      setIsSavingEvent(false);
    }
  }

  function openSyncedEventEditor(event: CalendarEvent) {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditDate(event.date);
    setEditTime(event.time);
    setEditEndTime("");
    setEditNotes(event.notes);
    setEditEventError(null);
  }

  async function saveSyncedEventChanges() {
    if (!editingEvent) {
      return;
    }

    const trimmedTitle = editTitle.trim();

    if (!trimmedTitle || !editDate) {
      return;
    }

    setIsUpdatingEvent(true);
    setEditEventError(null);

    try {
      const isAllDay = !editTime;

      let startAt: Date;
      let endAt: Date;

      if (isAllDay) {
        startAt = new Date(`${editDate}T00:00:00`);

        endAt = new Date(startAt);
        endAt.setDate(endAt.getDate() + 1);
      } else {
        startAt = new Date(`${editDate}T${editTime}:00`);

        if (editEndTime) {
          endAt = new Date(
            `${editDate}T${editEndTime}:00`,
          );

          if (endAt <= startAt) {
            endAt.setDate(endAt.getDate() + 1);
          }
        } else {
          endAt = new Date(
            startAt.getTime() + 60 * 60 * 1000,
          );
        }
      }

      const response = await fetch("/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingEvent.id,
          title: trimmedTitle,
          description: editNotes.trim() || null,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          isAllDay,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to update calendar event.",
        );
      }

      setEditingEvent(null);
      setIsSyncing(true);
      setSyncVersion((version) => version + 1);
    } catch (error) {
      setEditEventError(
        error instanceof Error
          ? error.message
          : "Unable to update calendar event.",
      );
    } finally {
      setIsUpdatingEvent(false);
    }
  }

  async function deleteSyncedEvent() {
    if (!editingEvent) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this event from its source calendar?",
    );

    if (!confirmed) {
      return;
    }

    setIsUpdatingEvent(true);
    setEditEventError(null);

    try {
      const response = await fetch("/api/events", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingEvent.id,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to delete calendar event.",
        );
      }

      setEditingEvent(null);
      setIsSyncing(true);
      setSyncVersion((version) => version + 1);
    } catch (error) {
      setEditEventError(
        error instanceof Error
          ? error.message
          : "Unable to delete calendar event.",
      );
    } finally {
      setIsUpdatingEvent(false);
    }
  }

  function deleteEvent(eventId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this event?",
    );

    if (!confirmed) {
      return;
    }

    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== eventId),
    );
  }

  function previousMonth() {
    setCurrentMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() - 1, 1),
    );
  }

  function nextMonth() {
    setCurrentMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() + 1, 1),
    );
  }

  function goToToday() {
    const today = new Date();

    setCurrentMonth(today);
    setSelectedDate(today.toISOString().slice(0, 10));
  }

  return (
    <main className="min-h-screen bg-[#F3EFE7] px-6 py-8 text-[#2C2C2C] lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#B08D57]">
              Schedule
            </p>

            <h1 className="mt-3 text-4xl font-semibold">Calendar</h1>

            <p className="mt-2 text-[#6F776B]">
              Manage appointments, deadlines, and important events.
            </p>
            <p className="mt-2 text-sm text-[#7A826E]">
  {isSyncing ? "Syncing calendars…" : "Calendars up to date"}
</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
  type="button"
  onClick={syncCalendars}
  disabled={isSyncing}
  className="rounded-xl border border-[#7A826E]/40 bg-[#7A826E]/10 px-5 py-3 text-sm font-medium text-[#4F5C49] transition hover:bg-[#7A826E]/20 disabled:cursor-wait disabled:opacity-60"
>
  {isSyncing ? "Syncing…" : "Sync now"}
</button>
  <Link
    href="/calendar/connect"
    className="rounded-xl border border-[#C7BFB2] bg-[#F8F5EF] px-5 py-3 text-sm font-medium text-[#2C2C2C] transition hover:border-[#AFA79A] hover:text-white"
  >
    Manage calendars
  </Link>

  <button
    type="button"
    onClick={() => openEventForm()}
    className="rounded-xl bg-[#1E3A34] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2A5148]"
  >
    Add event
  </button>
</div>
</div>
        {isFormOpen && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add calendar event</h2>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-sm text-[#6F776B] hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label>
                <span className="text-sm text-[#3F4742]">
                  Event title
                </span>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Example: Pepperdine assignment due"
                  required
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-[#F3EFE7] px-4 py-3 outline-none placeholder:text-[#8E887F] focus:border-[#B08D57]"
                />
              </label>

              <label>
                <span className="text-sm text-[#3F4742]">
                  Destination calendar
                </span>

                <select
                  value={destinationCalendarId}
                  onChange={(event) =>
                    setDestinationCalendarId(
                      event.target.value,
                    )
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-[#F3EFE7] px-4 py-3 outline-none focus:border-[#B08D57]"
                >
                  {writableCalendars.length === 0 ? (
                    <option value="">
                      No writable calendars
                    </option>
                  ) : (
                    writableCalendars.map((calendar) => (
                      <option
                        key={calendar.id}
                        value={calendar.id}
                      >
                        {calendar.name} —{" "}
                        {calendar.accountEmail}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label>
                <span className="text-sm text-[#3F4742]">
                  Category
                </span>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value as EventCategory,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-[#F3EFE7] px-4 py-3 outline-none focus:border-[#B08D57]"
                >
                  <option>Personal</option>
                  <option>Pepperdine</option>
                  <option>Rouke Ranch</option>
                  <option>Finance</option>
                  <option>Appointment</option>
                </select>
              </label>

              <label>
                <span className="text-sm text-[#3F4742]">
                  Date
                </span>

                <input
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-[#F3EFE7] px-4 py-3 outline-none focus:border-[#B08D57]"
                />
              </label>

              <label>
                <span className="text-sm text-[#3F4742]">
                  Start time
                </span>

                <input
                  type="time"
                  value={time}
                  onChange={(event) =>
                    setTime(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-[#F3EFE7] px-4 py-3 outline-none focus:border-[#B08D57]"
                />

                <span className="mt-1 block text-xs text-[#8E887F]">
                  Leave blank for an all-day event.
                </span>
              </label>

              <label>
                <span className="text-sm text-[#3F4742]">
                  End time
                </span>

                <input
                  type="time"
                  value={endTime}
                  onChange={(event) =>
                    setEndTime(event.target.value)
                  }
                  disabled={!time}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-[#F3EFE7] px-4 py-3 outline-none focus:border-[#B08D57] disabled:opacity-50"
                />

                <span className="mt-1 block text-xs text-[#8E887F]">
                  Defaults to one hour after start.
                </span>
              </label>
            </div>

            <label className="mt-5 block">
              <span className="text-sm text-[#3F4742]">Notes</span>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add details or preparation notes"
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-[#C7BFB2] bg-[#F3EFE7] px-4 py-3 outline-none placeholder:text-[#8E887F] focus:border-[#B08D57]"
              />
            </label>

            {eventSaveError && (
              <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {eventSaveError}
              </p>
            )}

            <button
              type="submit"
              disabled={
                isSavingEvent ||
                !destinationCalendarId ||
                writableCalendars.length === 0
              }
              className="mt-5 rounded-xl bg-[#1E3A34] px-5 py-3 text-sm font-semibold text-[#F8F5EF] transition hover:bg-[#2A5148] disabled:cursor-wait disabled:opacity-50"
            >
              {isSavingEvent
                ? "Saving to calendar…"
                : "Save event"}
            </button>
          </form>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <section className="overflow-hidden rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF]">
            <div className="flex flex-col gap-4 border-b border-[#D7D0C5] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={previousMonth}
                  className="rounded-lg border border-[#C7BFB2] px-3 py-2 text-[#3F4742] hover:bg-[#E6E0D7]"
                >
                  ←
                </button>

                <h2 className="min-w-44 text-center text-xl font-semibold">
                  {formatMonth(currentMonth)}
                </h2>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="rounded-lg border border-[#C7BFB2] px-3 py-2 text-[#3F4742] hover:bg-[#E6E0D7]"
                >
                  →
                </button>
              </div>

              <button
                type="button"
                onClick={goToToday}
                className="rounded-lg border border-[#C7BFB2] px-4 py-2 text-sm text-[#3F4742] hover:bg-[#E6E0D7]"
              >
                Today
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-[#D7D0C5] text-center text-xs font-medium uppercase tracking-wider text-[#7A826E]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (weekday) => (
                  <div key={weekday} className="py-3">
                    {weekday}
                  </div>
                ),
              )}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const dayKey = day.toLocaleDateString("en-CA");
                const isCurrentMonth =
                  day.getMonth() === currentMonth.getMonth();
                const isToday =
                  dayKey === new Date().toLocaleDateString("en-CA");

                const dayEvents = events
                  .filter((event) => event.date === dayKey)
                  .sort((a, b) => a.time.localeCompare(b.time));

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => openEventForm(day)}
                    className="min-h-28 border-b border-r border-[#D7D0C5] p-2 text-left transition hover:bg-[#D7D0C5]/40"
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                        isToday
                          ? "bg-[#1E3A34] text-white"
                          : isCurrentMonth
                            ? "text-[#2C2C2C]"
                            : "text-[#8E887F]"
                      }`}
                    >
                      {day.getDate()}
                    </span>

                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          role={
                            event.id.startsWith("google:") ||
                            event.id.startsWith("apple:")
                              ? "button"
                              : undefined
                          }
                          tabIndex={
                            event.id.startsWith("google:") ||
                            event.id.startsWith("apple:")
                              ? 0
                              : undefined
                          }
                          onClick={(clickEvent) => {
                            if (
                              event.id.startsWith("google:") ||
                              event.id.startsWith("apple:")
                            ) {
                              clickEvent.stopPropagation();
                              openSyncedEventEditor(event);
                            }
                          }}
                          className={`truncate rounded border px-2 py-1 text-xs ${
                            categoryStyles[event.category]
                          } ${
                            event.id.startsWith("google:") ||
                            event.id.startsWith("apple:")
                              ? "cursor-pointer"
                              : ""
                          }`}
                          style={getSourceCalendarStyle(event)}
                        >
                          {event.time && `${formatTime(event.time)} `}
                          {event.title}
                        </div>
                      ))}

                      {dayEvents.length > 3 && (
                        <p className="px-1 text-xs text-[#7A826E]">
                          +{dayEvents.length - 3} more
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#B08D57]">
                Next up
              </p>

              <h2 className="mt-2 text-xl font-semibold">Upcoming events</h2>
            </div>

            <div className="mt-5 space-y-4">
              {upcomingEvents.length === 0 ? (
                <p className="rounded-xl bg-[#F3EFE7] p-4 text-sm text-[#7A826E]">
                  No upcoming events.
                </p>
              ) : (
                upcomingEvents.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-xl border border-[#D7D0C5] bg-[#F3EFE7] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
  className={`inline-flex rounded-full border px-2 py-1 text-xs ${
    categoryStyles[event.category]
  }`}
  style={getSourceCalendarStyle(event)}
>
  {event.sourceCalendar ?? event.category}
</span>

                        <h3 className="mt-3 font-medium text-[#2C2C2C]">
                          {event.title}
                        </h3>

                        <p className="mt-1 text-sm text-[#6F776B]">
                          {formatEventDate(event.date)} ·{" "}
                          {formatTime(event.time)}
                        </p>
                      </div>

                     {event.id.startsWith("google:") ||
event.id.startsWith("apple:") ? (
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => openSyncedEventEditor(event)}
      className="rounded-full border border-[#7A826E]/30 bg-[#7A826E]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6F776B] transition hover:bg-[#7A826E]/20"
    >
      Edit
    </button>

    <button
      type="button"
      onClick={() => {
        openSyncedEventEditor(event);
      }}
      className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-600 transition hover:bg-red-100"
    >
      Delete
    </button>
  </div>
) : (
  <button
    type="button"
    onClick={() => deleteEvent(event.id)}
    className="text-xs text-red-400 hover:text-red-300"
  >
    Delete
  </button>
)}
                    </div>

                    {event.notes && (
                      <p className="mt-3 text-sm leading-6 text-[#7A826E]">
                        {event.notes}
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>

      {editingEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[2px]"
          onClick={() => setEditingEvent(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-[#D7D0C5] bg-[#F8F5EF] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B08D57]">
                  Synced event
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Edit calendar event
                </h2>

                <p className="mt-1 text-sm text-[#7A826E]">
                  {editingEvent.sourceCalendar}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="rounded-full border border-[#C7BFB2] px-4 py-2 text-sm text-[#5F665C]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="text-sm text-[#3F4742]">
                  Event title
                </span>

                <input
                  value={editTitle}
                  onChange={(event) =>
                    setEditTitle(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-[#F3EFE7] px-4 py-3 outline-none focus:border-[#B08D57]"
                />
              </label>

              <label>
                <span className="text-sm text-[#3F4742]">
                  Date
                </span>

                <input
                  type="date"
                  value={editDate}
                  onChange={(event) =>
                    setEditDate(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-[#F3EFE7] px-4 py-3 outline-none focus:border-[#B08D57]"
                />
              </label>

              <div />

              <label>
                <span className="text-sm text-[#3F4742]">
                  Start time
                </span>

                <input
                  type="time"
                  value={editTime}
                  onChange={(event) =>
                    setEditTime(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-[#F3EFE7] px-4 py-3 outline-none focus:border-[#B08D57]"
                />
              </label>

              <label>
                <span className="text-sm text-[#3F4742]">
                  End time
                </span>

                <input
                  type="time"
                  value={editEndTime}
                  onChange={(event) =>
                    setEditEndTime(event.target.value)
                  }
                  disabled={!editTime}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-[#F3EFE7] px-4 py-3 outline-none focus:border-[#B08D57] disabled:opacity-50"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm text-[#3F4742]">
                  Notes
                </span>

                <textarea
                  value={editNotes}
                  onChange={(event) =>
                    setEditNotes(event.target.value)
                  }
                  rows={4}
                  className="mt-2 w-full resize-none rounded-xl border border-[#C7BFB2] bg-[#F3EFE7] px-4 py-3 outline-none focus:border-[#B08D57]"
                />
              </label>
            </div>

            {editEventError && (
              <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {editEventError}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={() => void deleteSyncedEvent()}
                disabled={isUpdatingEvent}
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                Delete event
              </button>

              <button
                type="button"
                onClick={() =>
                  void saveSyncedEventChanges()
                }
                disabled={isUpdatingEvent}
                className="rounded-xl bg-[#1E3A34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2A5148] disabled:opacity-50"
              >
                {isUpdatingEvent
                  ? "Saving…"
                  : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
