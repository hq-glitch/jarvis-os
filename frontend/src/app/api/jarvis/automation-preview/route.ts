import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";
import { rankTasks } from "@/lib/jarvis/priority-engine";
import { evaluateAutomations } from "@/lib/jarvis/automation-engine";
import { applyAutomationPolicy } from "@/lib/jarvis/automation-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: {
          not: "DONE",
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const rankedTasks = rankTasks(
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt?.toISOString() ?? null,
        completedAt:
          task.completedAt?.toISOString() ?? null,
        sourceType: task.sourceType,
        sourceAccount: task.sourceAccount,
        createdAt: task.createdAt.toISOString(),
      })),
    );

    const actions = evaluateAutomations({
      rankedTasks,
    });

    const decisions = actions.map(
      applyAutomationPolicy,
    );

    return NextResponse.json({
      openTaskCount: tasks.length,
      proposedActionCount: decisions.length,
      actions: decisions.slice(0, 20),
    });
  } catch (error) {
    console.error(
      "Jarvis automation preview failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to evaluate Jarvis automations.",
      },
      {
        status: 500,
      },
    );
  }
}
