import type { ScoredTask } from "@/lib/jarvis/priority-engine";

export type AutomationLevel =
  | "AUTO"
  | "SUGGEST"
  | "APPROVAL_REQUIRED";

export type AutomationAction = {
  id: string;
  level: AutomationLevel;
  type:
    | "OVERDUE_TASK"
    | "UPCOMING_DEADLINE"
    | "STALE_TASK"
    | "HIGH_PRIORITY_TASK";
  title: string;
  description: string;
  taskId?: string;
  score: number;
};

export type AutomationInput = {
  rankedTasks: ScoredTask[];
  now?: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(
  date: string,
  now: Date,
) {
  return (
    (new Date(date).getTime() - now.getTime()) /
    DAY_MS
  );
}

function ageInDays(
  date: string,
  now: Date,
) {
  return (
    (now.getTime() - new Date(date).getTime()) /
    DAY_MS
  );
}

export function evaluateAutomations({
  rankedTasks,
  now = new Date(),
}: AutomationInput): AutomationAction[] {
  const actions: AutomationAction[] = [];

  for (const scored of rankedTasks) {
    const task = scored.task;

    if (
      task.status === "DONE" ||
      task.completedAt
    ) {
      continue;
    }

    if (task.dueAt) {
      const remaining = daysUntil(task.dueAt, now);

      if (remaining < 0) {
        actions.push({
          id: `overdue:${task.id}`,
          level: "SUGGEST",
          type: "OVERDUE_TASK",
          title: task.title,
          description: "This task is overdue and needs a decision.",
          taskId: task.id,
          score: scored.score + 100,
        });

        continue;
      }

      if (remaining <= 3) {
        actions.push({
          id: `deadline:${task.id}`,
          level: "SUGGEST",
          type: "UPCOMING_DEADLINE",
          title: task.title,
          description:
            remaining <= 1
              ? "This task is due within 24 hours."
              : "This task is due within 3 days.",
          taskId: task.id,
          score: scored.score + 50,
        });

        continue;
      }
    }

    const age = ageInDays(task.createdAt, now);

    if (
      !task.dueAt &&
      age >= 14 &&
      task.sourceType !== "EMAIL"
    ) {
      actions.push({
        id: `stale:${task.id}`,
        level: "SUGGEST",
        type: "STALE_TASK",
        title: task.title,
        description:
          "This task has been open for at least two weeks without a deadline.",
        taskId: task.id,
        score: scored.score + 10,
      });

      continue;
    }

    if (
      task.priority === "HIGH" &&
      scored.score >= 40
    ) {
      actions.push({
        id: `priority:${task.id}`,
        level: "SUGGEST",
        type: "HIGH_PRIORITY_TASK",
        title: task.title,
        description:
          "Jarvis considers this one of your highest-priority open tasks.",
        taskId: task.id,
        score: scored.score,
      });
    }
  }

  return actions.sort(
    (a, b) => b.score - a.score,
  );
}
