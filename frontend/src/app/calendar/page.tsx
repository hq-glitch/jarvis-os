"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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
};

const storageKey = "jarvis-calendar-events";

const categoryStyles: Record<EventCategory, string> = {
  Personal: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Pepperdine: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Rouke Ranch": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Finance: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Appointment: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

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
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(selectedDate);
  const [time, setTime] = useState("");
  const [category, setCategory] =
    useState<EventCategory>("Personal");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try {
      const savedEvents = window.localStorage.getItem(storageKey);

      if (savedEvents) {
        setEvents(JSON.parse(savedEvents) as CalendarEvent[]);
      } else {
        setEvents(starterEvents);
      }
    } catch {
      setEvents(starterEvents);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(events));
  }, [events, isLoaded]);

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

  function openEventForm(day?: Date) {
    const chosenDate = day
      ? day.toLocaleDateString("en-CA")
      : selectedDate;

    setSelectedDate(chosenDate);
    setDate(chosenDate);
    setIsFormOpen(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle || !date) {
      return;
    }

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      date,
      time,
      category,
      notes: notes.trim(),
    };

    setEvents((currentEvents) => [...currentEvents, newEvent]);

    setTitle("");
    setTime("");
    setCategory("Personal");
    setNotes("");
    setIsFormOpen(false);
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

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-slate-950 px-8 py-10 text-slate-100">
        <p className="text-slate-400">Loading calendar...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-400">
              Schedule
            </p>

            <h1 className="mt-3 text-4xl font-semibold">Calendar</h1>

            <p className="mt-2 text-slate-400">
              Manage appointments, deadlines, and important events.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openEventForm()}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Add event
          </button>
        </div>

        {isFormOpen && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add calendar event</h2>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label>
                <span className="text-sm text-slate-300">Event title</span>

                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Example: Pepperdine assignment due"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </label>

              <label>
                <span className="text-sm text-slate-300">Category</span>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as EventCategory)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option>Personal</option>
                  <option>Pepperdine</option>
                  <option>Rouke Ranch</option>
                  <option>Finance</option>
                  <option>Appointment</option>
                </select>
              </label>

              <label>
                <span className="text-sm text-slate-300">Date</span>

                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                />
              </label>

              <label>
                <span className="text-sm text-slate-300">Time</span>

                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="text-sm text-slate-300">Notes</span>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add details or preparation notes"
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-blue-500"
              />
            </label>

            <button
              type="submit"
              className="mt-5 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Save event
            </button>
          </form>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={previousMonth}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-800"
                >
                  ←
                </button>

                <h2 className="min-w-44 text-center text-xl font-semibold">
                  {formatMonth(currentMonth)}
                </h2>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-800"
                >
                  →
                </button>
              </div>

              <button
                type="button"
                onClick={goToToday}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Today
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-800 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
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
                    className="min-h-28 border-b border-r border-slate-800 p-2 text-left transition hover:bg-slate-800/60"
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                        isToday
                          ? "bg-blue-600 text-white"
                          : isCurrentMonth
                            ? "text-slate-200"
                            : "text-slate-600"
                      }`}
                    >
                      {day.getDate()}
                    </span>

                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`truncate rounded border px-2 py-1 text-xs ${
                            categoryStyles[event.category]
                          }`}
                        >
                          {event.time && `${formatTime(event.time)} `}
                          {event.title}
                        </div>
                      ))}

                      {dayEvents.length > 3 && (
                        <p className="px-1 text-xs text-slate-500">
                          +{dayEvents.length - 3} more
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-blue-400">
                Next up
              </p>

              <h2 className="mt-2 text-xl font-semibold">Upcoming events</h2>
            </div>

            <div className="mt-5 space-y-4">
              {upcomingEvents.length === 0 ? (
                <p className="rounded-xl bg-slate-950 p-4 text-sm text-slate-500">
                  No upcoming events.
                </p>
              ) : (
                upcomingEvents.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs ${
                            categoryStyles[event.category]
                          }`}
                        >
                          {event.category}
                        </span>

                        <h3 className="mt-3 font-medium text-slate-100">
                          {event.title}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          {formatEventDate(event.date)} ·{" "}
                          {formatTime(event.time)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteEvent(event.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>

                    {event.notes && (
                      <p className="mt-3 text-sm leading-6 text-slate-500">
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
    </main>
  );
}