export type PriorityTask = {
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

export type ScoredTask = {
  task: PriorityTask;
  score: number;
  reasons: string[];
};

type ScoreOptions = {
  now?: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(date: Date, now: Date) {
  return (date.getTime() - now.getTime()) / DAY_MS;
}

export function scoreTask(
  task: PriorityTask,
  options: ScoreOptions = {},
): ScoredTask {
  const now = options.now ?? new Date();
  let score = 0;
  const reasons: string[] = [];

  if (task.completedAt || task.status.toUpperCase() === "DONE") {
    return {
      task,
      score: -1000,
      reasons: ["Completed"],
    };
  }

  if (task.priority === "HIGH") {
    score += 18;
    reasons.push("High priority");
  }

  if (task.dueAt) {
    const due = new Date(task.dueAt);

    if (!Number.isNaN(due.getTime())) {
      const remaining = daysUntil(due, now);

      if (remaining < 0) {
        score += 70;
        reasons.push("Overdue");
      } else if (remaining <= 1) {
        score += 60;
        reasons.push("Due within 24 hours");
      } else if (remaining <= 2) {
        score += 50;
        reasons.push("Due within 48 hours");
      } else if (remaining <= 3) {
        score += 40;
        reasons.push("Due within 3 days");
      } else if (remaining <= 7) {
        score += 30;
        reasons.push("Due this week");
      } else if (remaining <= 14) {
        score += 10;
        reasons.push("Due within 2 weeks");
      }
    }
  }

  if (task.sourceType === "PEPPERDINE") {
    score += 6;
    reasons.push("Pepperdine coursework");
  }

  if (task.sourceType === "EMAIL") {
    if (task.dueAt) {
      score += 4;
      reasons.push("Email task with deadline");
    } else {
      score -= 8;
      reasons.push("Email task without deadline");
    }
  }

  if (
    task.sourceAccount === "pepperdine-fall-2026"
  ) {
    score += 2;
    reasons.push("Current semester");
  }

  const ageDays =
    (now.getTime() - new Date(task.createdAt).getTime()) /
    DAY_MS;

  if (!Number.isNaN(ageDays)) {
    if (ageDays >= 30) {
      score += 4;
      reasons.push("Long-standing task");
    } else if (ageDays >= 14) {
      score += 2;
      reasons.push("Older open task");
    }
  }

  return {
    task,
    score,
    reasons,
  };
}

export function rankTasks(
  tasks: PriorityTask[],
  options: ScoreOptions = {},
) {
  return tasks
    .map((task) => scoreTask(task, options))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const aDue = a.task.dueAt
        ? new Date(a.task.dueAt).getTime()
        : Number.POSITIVE_INFINITY;

      const bDue = b.task.dueAt
        ? new Date(b.task.dueAt).getTime()
        : Number.POSITIVE_INFINITY;

      if (aDue !== bDue) {
        return aDue - bDue;
      }

      return (
        new Date(b.task.createdAt).getTime() -
        new Date(a.task.createdAt).getTime()
      );
    });
}
