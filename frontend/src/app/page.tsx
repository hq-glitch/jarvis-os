"use client";

import Link from "next/link";
import { rankTasks } from "@/lib/jarvis/priority-engine";
import { buildDailyBrief } from "@/lib/jarvis/daily-brief";
import QuickCapture from "@/components/jarvis/QuickCapture";
import { useEffect, useMemo, useState } from "react";

type ImportedEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  notes: string;
  location: string | null;
  htmlLink: string | null;
  calendarName: string;
  calendarColor: string | null;
  accountEmail: string;
};

type CalendarConnectionError = {
  accountEmail: string | null;
  calendarName?: string;
  error: string;
};

type GmailMessage = {
  externalId: string;
  threadId: string | null;
  subject: string;
  from: string | null;
  to: string | null;
  date: string | null;
  snippet: string | null;
  isUnread: boolean;
  labels: string[];
};

type GmailAccount = {
  integrationId: string;
  email: string | null;
  displayName: string | null;
  accountColor: string | null;
  messages: GmailMessage[];
};

type GmailConnectionError = {
  integrationId: string;
  email: string | null;
  error: string;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
  sourceType: string | null;
  sourceAccount: string | null;
  createdAt: string;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  progress: number;
  status: string;
  nextAction: string | null;
  notes: string | null;
};

type AreaTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
};

type AreaProject = {
  id: string;
  name: string;
  status: string;
  progress: number;
  nextAction: string | null;
};

type Area = {
  id: string;
  name: string;
  slug: string;
  projects: AreaProject[];
  tasks: AreaTask[];
};

type SocialContent = {
  id: string;
  title: string;
  platform: string;
  status: string;
  publishAt: string | null;
  projectId: string | null;
};

type IncomeOpportunity = {
  id: string;
  name: string;
  status: string;
  jarvisScore: number | null;
  nextAction: string | null;
  monthlyPotential: number | null;
  actualIncome: number;
};

type AttentionEmail = GmailMessage & {
  accountEmail: string;
  accountColor: string | null;
  priority: "Urgent" | "Action Needed";
};

function normalizeColor(value: string | null) {
  const match = value?.match(/^#([0-9a-f]{6})/i);

  return match ? `#${match[1]}` : "#7A826E";
}

function formatEventTime(event: ImportedEvent) {
  if (event.isAllDay) {
    return "All day";
  }

  return new Date(event.startAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTaskDueDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function classifyAttentionEmail(
  message: GmailMessage,
): "Urgent" | "Action Needed" | null {
  const text = [
    message.subject,
    message.from,
    message.snippet,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const promotionalTerms = [
    "unsubscribe",
    "sale",
    "save ",
    "% off",
    "discount",
    "promo",
    "promotion",
    "rewards",
    "points",
    "offer",
    "limited time",
    "shop now",
    "buy now",
    "free shipping",
    "coupon",
    "exclusive deal",
    "newsletter",
    "marketing",
  ];

  const urgentTerms = [
    "urgent",
    "immediately",
    "asap",
    "past due",
    "overdue",
    "final notice",
    "action required",
    "deadline today",
    "due today",
    "security alert",
    "suspicious",
    "failed payment",
    "payment failed",
  ];

  const actionTerms = [
    "please complete",
    "please review",
    "please respond",
    "please reply",
    "deadline",
    "submit",
    "approval",
    "appointment",
    "invoice",
    "verify",
  ];

  if (promotionalTerms.some((term) => text.includes(term))) {
    return null;
  }

  if (urgentTerms.some((term) => text.includes(term))) {
    return "Urgent";
  }

  if (actionTerms.some((term) => text.includes(term))) {
    return "Action Needed";
  }

  return null;
}

const AREA_ROUTES: Record<string, string> = {
  jarvis: "/",
  finance: "/finance",
  pepperdine: "/pepperdine",
  "social-media": "/social-media",
  "income-lab": "/income-lab",
  "rouke-ranch": "/ranch",
};

export default function Home() {
  const [events, setEvents] = useState<ImportedEvent[]>([]);
  const [calendarErrors, setCalendarErrors] = useState<
    CalendarConnectionError[]
  >([]);
  const [gmailAccounts, setGmailAccounts] = useState<GmailAccount[]>([]);
  const [gmailErrors, setGmailErrors] = useState<
    GmailConnectionError[]
  >([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [socialContent, setSocialContent] = useState<SocialContent[]>([]);
  const [incomeOpportunities, setIncomeOpportunities] =
    useState<IncomeOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [greeting, setGreeting] = useState("Welcome back, Sarah.");

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      setGreeting("Good morning, Sarah.");
    } else if (hour < 17) {
      setGreeting("Good afternoon, Sarah.");
    } else {
      setGreeting("Good evening, Sarah.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMissionControl() {
      setIsLoading(true);

      try {
        const [
          calendarResponse,
          emailResponse,
          taskResponse,
          projectResponse,
          areaResponse,
          socialResponse,
          incomeResponse,
        ] = await Promise.all([
          fetch("/api/events", {
            cache: "no-store",
          }),
          fetch("/api/email", {
            cache: "no-store",
          }),
          fetch("/api/tasks", {
            cache: "no-store",
          }),
          fetch("/api/projects", {
            cache: "no-store",
          }),
          fetch("/api/areas", {
            cache: "no-store",
          }),
          fetch("/api/social-media", {
            cache: "no-store",
          }),
          fetch("/api/income-lab", {
            cache: "no-store",
          }),
        ]);

        if (
          !calendarResponse.ok ||
          !emailResponse.ok ||
          !taskResponse.ok ||
          !projectResponse.ok ||
          !areaResponse.ok ||
          !socialResponse.ok ||
          !incomeResponse.ok
        ) {
          throw new Error(
            "One or more Mission Control data sources failed.",
          );
        }

        const calendarData = (await calendarResponse.json()) as {
          events: ImportedEvent[];
          connectionErrors?: CalendarConnectionError[];
        };

        const emailData = (await emailResponse.json()) as {
          accounts: GmailAccount[];
          connectionErrors?: GmailConnectionError[];
        };

        const taskData = (await taskResponse.json()) as {
          tasks: Task[];
        };

        const projectData = (await projectResponse.json()) as {
          projects: Project[];
        };

        const areaData = (await areaResponse.json()) as {
          areas: Area[];
        };

        const socialData = (await socialResponse.json()) as {
          content: SocialContent[];
        };

        const incomeData = (await incomeResponse.json()) as {
          opportunities: IncomeOpportunity[];
        };

        if (cancelled) {
          return;
        }

        setEvents(calendarData.events ?? []);
        setCalendarErrors(
          calendarData.connectionErrors ?? [],
        );
        setGmailAccounts(emailData.accounts ?? []);
        setGmailErrors(emailData.connectionErrors ?? []);
        setTasks(taskData.tasks ?? []);
        setProjects(projectData.projects ?? []);
        setAreas(areaData.areas ?? []);
        setSocialContent(socialData.content ?? []);
        setIncomeOpportunities(incomeData.opportunities ?? []);
      } catch (error) {
        console.error(
          error instanceof Error
            ? error.message
            : "Unable to load Mission Control.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMissionControl();

    return () => {
      cancelled = true;
    };
  }, [refreshVersion]);

  const dashboard = useMemo(() => {
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const todayEvents = events
      .filter((event) => {
        const start = new Date(event.startAt);

        return start >= startOfToday && start < startOfTomorrow;
      })
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() -
          new Date(b.startAt).getTime(),
      );

    const attentionEmails: AttentionEmail[] =
      gmailAccounts
        .flatMap((account) =>
          account.messages.map((message) => {
            const priority = classifyAttentionEmail(message);

            return priority
              ? {
                  ...message,
                  accountEmail: account.email ?? "Google account",
                  accountColor: account.accountColor,
                  priority,
                }
              : null;
          }),
        )
        .filter(
          (message): message is AttentionEmail =>
            message !== null,
        )
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority === "Urgent" ? -1 : 1;
          }

          const first = a.date
            ? new Date(a.date).getTime()
            : 0;

          const second = b.date
            ? new Date(b.date).getTime()
            : 0;

          return second - first;
        });

    const openTasks = tasks
      .filter(
        (task) =>
          !task.completedAt &&
          task.status.toUpperCase() !== "DONE",
      )
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          if (a.priority === "HIGH") {
            return -1;
          }

          if (b.priority === "HIGH") {
            return 1;
          }
        }

        if (a.dueAt && b.dueAt) {
          return (
            new Date(a.dueAt).getTime() -
            new Date(b.dueAt).getTime()
          );
        }

        if (a.dueAt) {
          return -1;
        }

        if (b.dueAt) {
          return 1;
        }

        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
      });

    const rankedTasks = rankTasks(openTasks);

    const unreadCount = gmailAccounts.reduce(
      (total, account) =>
        total +
        account.messages.filter((message) => message.isUnread)
          .length,
      0,
    );

    const activeProjects = projects
      .filter(
        (project) =>
          !["DONE", "COMPLETED", "ARCHIVED"].includes(
            project.status.toUpperCase(),
          ),
      )
      .sort((a, b) => {
        const aHasAction = Boolean(a.nextAction);
        const bHasAction = Boolean(b.nextAction);

        if (aHasAction !== bHasAction) {
          return aHasAction ? -1 : 1;
        }

        return a.progress - b.progress;
      });

    const areaOverview = areas
      .map((area) => {
        const openAreaTasks = (area.tasks ?? []).filter(
          (task) =>
            !task.completedAt &&
            task.status.toUpperCase() !== "DONE",
        );

        const activeAreaProjects = (area.projects ?? []).filter(
          (project) =>
            !["DONE", "COMPLETED", "ARCHIVED"].includes(
              project.status.toUpperCase(),
            ),
        );

        const nextActionCount = activeAreaProjects.filter(
          (project) => Boolean(project.nextAction),
        ).length;

        return {
          ...area,
          openTaskCount: openAreaTasks.length,
          activeProjectCount: activeAreaProjects.length,
          nextActionCount,
          attentionCount: openAreaTasks.length + nextActionCount,
        };
      })
      .sort((a, b) => {
        if (a.attentionCount !== b.attentionCount) {
          return b.attentionCount - a.attentionCount;
        }

        return a.name.localeCompare(b.name);
      });

    return {
      todayEvents,
      attentionEmails,
      openTasks,
      rankedTasks,
      activeProjects,
      areaOverview,
      unreadCount,
      connectionAlertCount:
        calendarErrors.length + gmailErrors.length,
    };
  }, [
    events,
    gmailAccounts,
    tasks,
    projects,
    areas,
    calendarErrors.length,
    gmailErrors.length,
  ]);

  const dailyBrief = useMemo(
    () =>
      buildDailyBrief({
        events: dashboard.todayEvents.map((event) => ({
          id: event.id,
          title: event.title,
          startAt: event.startAt,
          endAt: event.endAt,
        })),
        rankedTasks: dashboard.rankedTasks,
        attentionEmails: dashboard.attentionEmails.map((email) => ({
          priority: email.priority,
        })),
        connectionAlertCount: dashboard.connectionAlertCount,
      }),
    [
      dashboard.todayEvents,
      dashboard.rankedTasks,
      dashboard.attentionEmails,
      dashboard.connectionAlertCount,
    ],
  );


  return (
    <main className="min-h-screen bg-[#F3EFE7] px-6 py-10 text-[#2C2C2C] lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B08D57]">
              Jarvis OS · Mission Control
            </p>

            <h1 className="mt-3 text-5xl font-semibold text-[#1E3A34]">
              {greeting}
            </h1>

            <p className="mt-2 text-[#6F776B]">
              Here is what deserves your attention right now.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setRefreshVersion((version) => version + 1)
            }
            disabled={isLoading}
            className="rounded-xl border border-[#C7BFB2] bg-[#F8F5EF] px-5 py-3 text-sm font-medium text-[#3F4742] transition hover:bg-white disabled:cursor-wait disabled:opacity-50"
          >
            {isLoading ? "Refreshing…" : "Refresh Mission Control"}
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              value: dashboard.todayEvents.length,
              label: "Events today",
            },
            {
              value: dashboard.unreadCount,
              label: "Unread email",
            },
            {
              value: dashboard.attentionEmails.length,
              label: "Needs attention",
            },
            {
              value: dashboard.openTasks.length,
              label: "Open tasks",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-5 shadow-[0_12px_35px_rgba(30,58,52,0.05)]"
            >
              <p className="text-3xl font-semibold text-[#1E3A34]">
                {isLoading ? "—" : item.value}
              </p>

              <p className="mt-1 text-sm text-[#6F776B]">
                {item.label}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#B08D57] bg-[#1E3A34] text-white shadow-sm">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D6B77A]">
            Daily Command Brief
          </p>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/70">
                {dailyBrief.greeting}
              </p>

              <h2 className="mt-1 font-[family-name:var(--font-cormorant)] text-3xl font-semibold">
                {dailyBrief.headline}
              </h2>
            </div>

            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#F3EFE7]">
              {dailyBrief.status}
            </span>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D6B77A]">
              Situation
            </p>

            <div className="mt-4 space-y-3">
              {dailyBrief.summary.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D6B77A]" />

                  <p className="text-sm leading-6 text-[#F3EFE7]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#F3EFE7] p-5 text-[#2C2C2C]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9A7A45]">
              Recommended First Move
            </p>

            <h3 className="mt-3 font-[family-name:var(--font-cormorant)] text-2xl font-semibold leading-tight text-[#1E3A34]">
              {dailyBrief.recommendation}
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#667066]">
              {dailyBrief.recommendationReason}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <QuickCapture />
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6 shadow-[0_12px_35px_rgba(30,58,52,0.05)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B08D57]">
                  Communications
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1E3A34]">
                  Inbox attention
                </h2>
              </div>

              <Link
                href="/inbox"
                className="text-sm font-medium text-[#7C5F33]"
              >
                Open Inbox →
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {dashboard.attentionEmails.length === 0 ? (
                <div className="rounded-xl border border-[#E1DBD1] bg-[#F3EFE7] p-4 text-[#6F776B]">
                  Nothing currently flagged for attention.
                </div>
              ) : (
                dashboard.attentionEmails
                  .slice(0, 5)
                  .map((message) => {
                    const color = normalizeColor(
                      message.accountColor,
                    );

                    return (
                      <div
                        key={`${message.accountEmail}:${message.externalId}`}
                        className="rounded-xl border border-[#E1DBD1] bg-[#F3EFE7] p-4"
                        style={{
                          borderLeftWidth: 4,
                          borderLeftColor: color,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {message.subject}
                            </p>

                            <p className="mt-1 truncate text-xs text-[#7A826E]">
                              {message.from ?? "Unknown sender"}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${
                              message.priority === "Urgent"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {message.priority}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6 shadow-[0_12px_35px_rgba(30,58,52,0.05)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B08D57]">
                  Execution
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1E3A34]">
                  Open tasks
                </h2>
              </div>

              <span className="rounded-full bg-[#1E3A34] px-3 py-1 text-xs font-semibold text-white">
                {dashboard.openTasks.length}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {dashboard.openTasks.length === 0 ? (
                <div className="rounded-xl border border-[#E1DBD1] bg-[#F3EFE7] p-4 text-[#6F776B]">
                  No open tasks yet.
                </div>
              ) : (
                dashboard.openTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-[#E1DBD1] bg-[#F3EFE7] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {task.title}
                        </p>

                        {task.sourceAccount && (
                          <p className="mt-1 truncate text-xs text-[#7A826E]">
                            {task.sourceAccount}
                          </p>
                        )}
                      </div>

                      {formatTaskDueDate(task.dueAt) && (
                        <span className="shrink-0 rounded-full border border-[#D7D0C5] bg-white px-2.5 py-1 text-xs text-[#6F776B]">
                          {formatTaskDueDate(task.dueAt)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B08D57]">
              Life architecture
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1E3A34]">
              Areas requiring attention
            </h2>
            <p className="mt-2 text-sm text-[#6F776B]">
              Where your active commitments are concentrated right now.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              <div className="rounded-xl border border-[#E1DBD1] bg-[#F3EFE7] p-4 text-[#6F776B]">
                Loading Areas…
              </div>
            ) : dashboard.areaOverview.length === 0 ? (
              <div className="rounded-xl border border-[#E1DBD1] bg-[#F3EFE7] p-4 text-[#6F776B]">
                No Areas found.
              </div>
            ) : (
              dashboard.areaOverview.map((area) => (
                <Link
                  key={area.id}
                  href={AREA_ROUTES[area.slug] ?? "/projects"}
                  className="rounded-xl border border-[#E1DBD1] bg-[#F3EFE7] p-5 transition hover:border-[#B08D57] hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#1E3A34]">
                        {area.name}
                      </p>
                      <p className="mt-1 text-xs text-[#7A826E]">
                        {area.activeProjectCount} active{" "}
                        {area.activeProjectCount === 1 ? "project" : "projects"}
                      </p>
                    </div>

                    <span className="rounded-full bg-[#1E3A34] px-2.5 py-1 text-xs font-semibold text-white">
                      {area.attentionCount}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#D7D0C5] bg-white px-2.5 py-1 text-xs text-[#5F665C]">
                      {area.openTaskCount} open{" "}
                      {area.openTaskCount === 1 ? "task" : "tasks"}
                    </span>

                    <span className="rounded-full border border-[#D7D0C5] bg-white px-2.5 py-1 text-xs text-[#5F665C]">
                      {area.nextActionCount} next{" "}
                      {area.nextActionCount === 1 ? "action" : "actions"}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B08D57]">
                Momentum
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#1E3A34]">
                Active projects
              </h2>
            </div>

            <Link
              href="/projects"
              className="text-sm font-medium text-[#7C5F33]"
            >
              Open Projects →
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.activeProjects.length === 0 ? (
              <div className="rounded-xl border border-[#E1DBD1] bg-[#F3EFE7] p-4 text-[#6F776B]">
                No active projects.
              </div>
            ) : (
              dashboard.activeProjects.slice(0, 6).map((project) => (
                <article
                  key={project.id}
                  className="rounded-xl border border-[#E1DBD1] bg-[#F3EFE7] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-[#1E3A34]">
                      {project.name}
                    </p>
                    <span className="text-xs font-semibold text-[#7C5F33]">
                      {project.progress}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#D7D0C5]">
                    <div
                      className="h-full rounded-full bg-[#B08D57]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, project.progress),
                        )}%`,
                      }}
                    />
                  </div>

                  {project.nextAction && (
                    <p className="mt-3 text-sm leading-5 text-[#6F776B]">
                      Next: {project.nextAction}
                    </p>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B08D57]">
            Quick actions
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/calendar"
              className="rounded-xl bg-[#1E3A34] px-5 py-3 text-sm font-medium text-white"
            >
              Add calendar event
            </Link>

            <Link
              href="/inbox"
              className="rounded-xl border border-[#C7BFB2] bg-white px-5 py-3 text-sm font-medium text-[#3F4742]"
            >
              Review inbox
            </Link>

            <Link
              href="/projects"
              className="rounded-xl border border-[#C7BFB2] bg-white px-5 py-3 text-sm font-medium text-[#3F4742]"
            >
              Open projects
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
