"use client";

import { useEffect, useMemo, useState } from "react";

import AreaWorkspace from "@/components/areas/AreaWorkspace";
import {
  fall2026Courses,
  fall2026Summary,
  fall2026Weeks,
  getPepperdineWeek,
  type PepperdineWeekItem,
} from "@/lib/pepperdine/fall-2026";

const COMPLETED_STORAGE_KEY = "jarvis-pepperdine-fall-2026-completed";

const courseTitles: Record<string, string> = {
  "OLED 700": "Leadership Theory and Practice",
  "OLED 724":
    "Ethical Leadership, Equity, Cultural Proficiency, and Social Justice",
  "OLED 766": "Introduction to Research Design and Methodology",
};

function itemKey(week: number, item: PepperdineWeekItem) {
  return [
    week,
    item.course,
    item.type,
    item.title,
    item.dueDate ?? "",
  ].join("::");
}

function formatDate(value?: string) {
  if (!value) return null;

  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function typeLabel(type: PepperdineWeekItem["type"]) {
  if (type === "assignment") return "Assignment";
  if (type === "reading") return "Reading";
  return "Live Session";
}

function courseBadgeClass(course: string) {
  if (course === "OLED 700") {
    return "border-[#D8BE88] bg-[#FFF7E7] text-[#7C5F33]";
  }

  if (course === "OLED 724") {
    return "border-[#BBC8AD] bg-[#F1F5EE] text-[#465347]";
  }

  return "border-[#B7CBC7] bg-[#EEF4F3] text-[#34514D]";
}

export default function PepperdinePage() {
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(
    () => new Set(),
  );

  const [hydrated, setHydrated] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(true);

  const currentWeek = useMemo(() => getPepperdineWeek(), []);

  const nextWeek = useMemo(() => {
    if (!currentWeek) return null;

    return (
      fall2026Weeks.find(
        (week) => week.week === currentWeek.week + 1,
      ) ?? null
    );
  }, [currentWeek]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(COMPLETED_STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setCompletedKeys(new Set(parsed));
        }
      }
    } catch (error) {
      console.error("Unable to load Pepperdine completion state:", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(
      COMPLETED_STORAGE_KEY,
      JSON.stringify(Array.from(completedKeys)),
    );
  }, [completedKeys, hydrated]);

  function toggleCompleted(week: number, item: PepperdineWeekItem) {
    const key = itemKey(week, item);

    setCompletedKeys((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  const currentItems = currentWeek?.items ?? [];

  const activeCurrentItems = currentWeek
    ? currentItems.filter(
        (item) =>
          !completedKeys.has(itemKey(currentWeek.week, item)),
      )
    : [];

  const currentCompletedCount = currentWeek
    ? currentItems.filter((item) =>
        completedKeys.has(itemKey(currentWeek.week, item)),
      ).length
    : 0;

  const currentProgress =
    currentItems.length > 0
      ? Math.round(
          (currentCompletedCount / currentItems.length) * 100,
        )
      : 0;

  const activeByCourse = useMemo(() => {
    const grouped: Record<string, PepperdineWeekItem[]> = {};

    for (const item of activeCurrentItems) {
      grouped[item.course] ??= [];
      grouped[item.course].push(item);
    }

    return grouped;
  }, [activeCurrentItems]);

  const archivedItems = useMemo(() => {
    return fall2026Weeks.flatMap((week) =>
      week.items
        .filter((item) =>
          completedKeys.has(itemKey(week.week, item)),
        )
        .map((item) => ({
          week: week.week,
          item,
        })),
    );
  }, [completedKeys]);

  return (
    <>
      <main className="bg-[#F3EFE7] px-6 pt-8 text-[#2C2C2C] lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="rounded-3xl border border-[#B08D57]/30 bg-[#142A26] p-7 text-[#F8F5EF] shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#D7B77C]">
              Pepperdine GSEP
            </p>

            <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-display text-4xl font-semibold">
                  {fall2026Summary.term}
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#D7D0C5]">
                  Doctoral semester command center for coursework,
                  deadlines, readings, live sessions, and major
                  deliverables.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  value={fall2026Summary.courseCount}
                  label="Courses"
                />
                <StatCard
                  value={fall2026Summary.units}
                  label="Units"
                />
                <StatCard
                  value={`${fall2026Summary.expectedWeeklyHours}+`}
                  label="Hrs / Week"
                />
              </div>
            </div>
          </header>

          {currentWeek && (
            <>
              <section className="mt-6 rounded-3xl border border-[#D7D0C5] bg-[#F8F5EF] p-6 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B08D57]">
                      This Week
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-semibold text-[#1E3A34]">
                        Week {currentWeek.week}
                      </h2>

                      {currentWeek.week === 1 && (
                        <span className="rounded-full bg-[#F0E4C8] px-4 py-1.5 text-xs font-semibold text-[#7C5F33]">
                          Starts tomorrow
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-[#6F776B]">
                      {formatDate(currentWeek.startDate)} –{" "}
                      {formatDate(currentWeek.endDate)}
                    </p>
                  </div>

                  <div className="w-full max-w-md">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#1E3A34]">
                        {currentCompletedCount} of{" "}
                        {currentItems.length} completed
                      </span>

                      <span className="font-semibold text-[#1E3A34]">
                        {currentProgress}%
                      </span>
                    </div>

                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#DEDCD5]">
                      <div
                        className="h-full rounded-full bg-[#1E3A34] transition-all duration-300"
                        style={{ width: `${currentProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-5 space-y-4">
                {Object.entries(activeByCourse).map(
                  ([course, items]) => (
                    <article
                      key={course}
                      className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${courseBadgeClass(
                              course,
                            )}`}
                          >
                            {course}
                          </span>

                          <h3 className="font-semibold text-[#1E3A34]">
                            {courseTitles[course] ?? course}
                          </h3>
                        </div>

                        <span className="text-xs text-[#6F776B]">
                          {items.length}{" "}
                          {items.length === 1 ? "item" : "items"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        {items.map((item) => (
                          <ChecklistItem
                            key={itemKey(currentWeek.week, item)}
                            item={item}
                            onComplete={() =>
                              toggleCompleted(
                                currentWeek.week,
                                item,
                              )
                            }
                          />
                        ))}
                      </div>
                    </article>
                  ),
                )}

                {activeCurrentItems.length === 0 && (
                  <div className="rounded-2xl border border-[#BBC8AD] bg-[#F1F5EE] p-8 text-center">
                    <p className="text-lg font-semibold text-[#1E3A34]">
                      Week {currentWeek.week} complete
                    </p>
                    <p className="mt-2 text-sm text-[#6F776B]">
                      Everything for this week has been moved to
                      the archive.
                    </p>
                  </div>
                )}
              </section>
            </>
          )}

          {nextWeek && (
            <section className="mt-6 rounded-2xl border border-[#D7D0C5] bg-white/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B08D57]">
                    Coming Next
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-[#1E3A34]">
                    Week {nextWeek.week}
                  </h2>

                  <p className="mt-1 text-xs text-[#6F776B]">
                    {formatDate(nextWeek.startDate)} –{" "}
                    {formatDate(nextWeek.endDate)}
                  </p>
                </div>

                <p className="text-sm text-[#6F776B]">
                  {
                    nextWeek.items.filter(
                      (item) => item.type === "assignment",
                    ).length
                  }{" "}
                  assignments ·{" "}
                  {
                    nextWeek.items.filter(
                      (item) => item.type === "meeting",
                    ).length
                  }{" "}
                  live sessions
                </p>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                {["OLED 700", "OLED 724", "OLED 766"].map(
                  (course) => {
                    const items = nextWeek.items.filter(
                      (item) =>
                        item.course === course &&
                        item.type !== "reading",
                    );

                    return (
                      <div
                        key={course}
                        className="rounded-xl border border-[#E1DBD1] bg-[#F8F5EF] p-4"
                      >
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${courseBadgeClass(
                            course,
                          )}`}
                        >
                          {course}
                        </span>

                        <div className="mt-3 space-y-2">
                          {items.length === 0 ? (
                            <p className="text-sm text-[#8A8E88]">
                              No scheduled items
                            </p>
                          ) : (
                            items.map((item) => (
                              <p
                                key={`${course}-${item.title}`}
                                className="text-sm leading-5 text-[#4B514D]"
                              >
                                • {item.title}
                                {item.dueDay
                                  ? ` (${item.dueDay.slice(
                                      0,
                                      3,
                                    )})`
                                  : ""}
                              </p>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </section>
          )}

          <section className="mt-6 rounded-2xl border border-[#D7B77C]/50 bg-[#FFF8E7] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7C5F33]">
              Immersion Week
            </p>

            <div className="mt-1 flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-8">
              <h2 className="shrink-0 text-xl font-semibold text-[#1E3A34]">
                September 23–27
              </h2>

              <p className="text-sm leading-6 text-[#5C625D]">
                Five consecutive days of Pepperdine in-person
                coursework across OLED 700, OLED 766, and OLED 724.
                Front-load assignments wherever possible.
              </p>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl border border-[#C8CEC5] bg-[#F8F5EF]">
            <button
              type="button"
              onClick={() => setArchiveOpen((open) => !open)}
              className="flex w-full items-center justify-between bg-[#E6EAE2] px-6 py-4 text-left"
            >
              <div>
                <p className="text-lg font-semibold text-[#1E3A34]">
                  Archived ({archivedItems.length})
                </p>

                <p className="mt-1 text-xs text-[#6F776B]">
                  Completed coursework
                </p>
              </div>

              <span className="text-xl text-[#1E3A34]">
                {archiveOpen ? "⌃" : "⌄"}
              </span>
            </button>

            {archiveOpen && (
              <div className="p-5">
                {archivedItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="font-semibold text-[#1E3A34]">
                      No completed items yet
                    </p>

                    <p className="mt-2 text-sm text-[#6F776B]">
                      Check off coursework above and it will move
                      here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {archivedItems.map(({ week, item }) => (
                      <div
                        key={itemKey(week, item)}
                        className="flex flex-col gap-3 rounded-xl border border-[#D7D0C5] bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.13em] ${courseBadgeClass(
                                item.course,
                              )}`}
                            >
                              {item.course}
                            </span>

                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A8E88]">
                              Week {week}
                            </span>

                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A8E88]">
                              {typeLabel(item.type)}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-[#59605B] line-through">
                            {item.title}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            toggleCompleted(week, item)
                          }
                          className="shrink-0 rounded-lg border border-[#B08D57]/40 px-3 py-2 text-xs font-semibold text-[#7C5F33] transition hover:bg-[#FFF8E7]"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="mt-8">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#B08D57]">
                Fall 2026
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-[#1E3A34]">
                Courses
              </h2>
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              {fall2026Courses.map((course) => (
                <article
                  key={course.code}
                  className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6 shadow-sm"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B08D57]">
                    {course.code}
                  </p>

                  <h3 className="mt-2 text-xl font-semibold leading-snug text-[#1E3A34]">
                    {course.title}
                  </h3>

                  <p className="mt-3 text-sm text-[#6F776B]">
                    {course.instructors.join(" • ")}
                  </p>

                  <div className="mt-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7C5F33]">
                      Live schedule
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[#4B514D]">
                      {course.meetingSummary}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <AreaWorkspace
        slug="pepperdine"
        eyebrow="Pepperdine Work"
      />
    </>
  );
}

function ChecklistItem({
  item,
  onComplete,
}: {
  item: PepperdineWeekItem;
  onComplete: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#DED8CD] bg-white/70 p-4 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={onComplete}
        aria-label={`Mark ${item.title} complete`}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#969C96] bg-white transition hover:border-[#1E3A34] hover:bg-[#F1F5EE]"
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#31443E]">
          {item.type === "reading" ? "Read " : ""}
          {item.title}
        </p>

        {item.type === "reading" && (
          <p className="mt-1 text-xs text-[#7C5F33]">
            {item.readingDetail ??
              "Chapter/pages not specified in syllabus — check Digital Campus"}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {item.dueDate && (
          <span
            className={
              item.priority === "high"
                ? "text-sm font-semibold text-[#A54B3F]"
                : "text-sm font-semibold text-[#7C5F33]"
            }
          >
            {formatDate(item.dueDate)}
          </span>
        )}

        <span className="rounded-full bg-[#EEF1ED] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#59605B]">
          {typeLabel(item.type)}
        </span>

        {item.priority === "high" && (
          <span className="rounded-full bg-[#FBE9E6] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#A54B3F]">
            High
          </span>
        )}
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-[#B08D57]/30 bg-[#1E3A34] px-4 py-3 text-center">
      <p className="text-2xl font-semibold">{value}</p>

      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#D7B77C]">
        {label}
      </p>
    </div>
  );
}
