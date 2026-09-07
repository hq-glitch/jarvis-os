import type { ScoredTask } from "@/lib/jarvis/priority-engine";

export type BriefEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt?: string | null;
};

export type BriefEmail = {
  priority: string;
};

export type DailyBriefInput = {
  events: BriefEvent[];
  rankedTasks: ScoredTask[];
  attentionEmails: BriefEmail[];
  connectionAlertCount: number;
  now?: Date;
};

export type DailyBrief = {
  greeting: string;
  headline: string;
  summary: string[];
  recommendation: string;
  recommendationReason: string;
  status: "clear" | "focused" | "busy" | "attention";
};

function greetingFor(date: Date) {
  const hour = date.getHours();

  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  return "Good evening.";
}

function plural(
  count: number,
  singular: string,
  pluralForm = `${singular}s`,
) {
  return count === 1 ? singular : pluralForm;
}

export function buildDailyBrief(
  input: DailyBriefInput,
): DailyBrief {
  const now = input.now ?? new Date();

  const openRankedTasks = input.rankedTasks.filter(
    (item) =>
      !item.task.completedAt &&
      item.task.status.toUpperCase() !== "DONE",
  );

  const topTask = openRankedTasks[0];

  const urgentEmails = input.attentionEmails.filter(
    (email) => email.priority === "Urgent",
  );

  const dueSoonTasks = openRankedTasks.filter((item) => {
    if (!item.task.dueAt) return false;

    const due = new Date(item.task.dueAt);

    if (Number.isNaN(due.getTime())) return false;

    const hoursUntilDue =
      (due.getTime() - now.getTime()) /
      (1000 * 60 * 60);

    return hoursUntilDue >= 0 && hoursUntilDue <= 72;
  });

  const overdueTasks = openRankedTasks.filter((item) => {
    if (!item.task.dueAt) return false;

    const due = new Date(item.task.dueAt);

    return (
      !Number.isNaN(due.getTime()) &&
      due.getTime() < now.getTime()
    );
  });

  const summary: string[] = [];

  if (input.events.length === 0) {
    summary.push("Your calendar is clear today.");
  } else {
    summary.push(
      `You have ${input.events.length} calendar ${plural(
        input.events.length,
        "commitment",
      )} today.`,
    );
  }

  if (overdueTasks.length > 0) {
    summary.push(
      `${overdueTasks.length} ${plural(
        overdueTasks.length,
        "task is",
        "tasks are",
      )} overdue.`,
    );
  } else if (dueSoonTasks.length > 0) {
    summary.push(
      `${dueSoonTasks.length} ${plural(
        dueSoonTasks.length,
        "task is",
        "tasks are",
      )} due within the next 72 hours.`,
    );
  }

  if (urgentEmails.length > 0) {
    summary.push(
      `${urgentEmails.length} urgent ${plural(
        urgentEmails.length,
        "email needs",
        "emails need",
      )} attention.`,
    );
  } else if (input.attentionEmails.length > 0) {
    summary.push(
      `${input.attentionEmails.length} ${plural(
        input.attentionEmails.length,
        "email needs",
        "emails need",
      )} attention, but none are urgent.`,
    );
  } else {
    summary.push("No email currently requires attention.");
  }

  if (input.connectionAlertCount > 0) {
    return {
      greeting: greetingFor(now),
      headline: "Jarvis needs a connection repaired.",
      summary,
      recommendation:
        "Reconnect the affected account before relying on today's brief.",
      recommendationReason:
        "One or more data sources are currently unavailable.",
      status: "attention",
    };
  }

  if (urgentEmails.length > 0) {
    return {
      greeting: greetingFor(now),
      headline: "Your inbox needs immediate attention.",
      summary,
      recommendation:
        "Handle the urgent message before starting planned work.",
      recommendationReason:
        "Jarvis detected an urgent email requiring attention.",
      status: "attention",
    };
  }

  if (topTask) {
    const reasons =
      topTask.reasons.length > 0
        ? topTask.reasons.join(" • ")
        : "Highest-ranked open task";

    const status =
      input.events.length >= 6
        ? "busy"
        : topTask.score >= 50
          ? "focused"
          : "clear";

    return {
      greeting: greetingFor(now),
      headline:
        status === "busy"
          ? "Today is busy. Protect your focus."
          : "Here is your first move.",
      summary,
      recommendation: topTask.task.title,
      recommendationReason:
        `${reasons}. Priority score: ${topTask.score}.`,
      status,
    };
  }

  return {
    greeting: greetingFor(now),
    headline: "You have capacity today.",
    summary,
    recommendation:
      "Choose one active project and make concrete progress.",
    recommendationReason:
      "There are no higher-priority open tasks competing for your attention.",
    status:
      input.events.length >= 6 ? "busy" : "clear",
  };
}
