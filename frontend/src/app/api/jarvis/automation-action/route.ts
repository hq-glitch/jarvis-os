import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActionType =
  | "COMPLETE"
  | "SNOOZE"
  | "DISMISS";

type ActionBody = {
  action?: ActionType;
  actionId?: string;
  automationType?: string;
  taskId?: string;
  snoozedUntil?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ActionBody;

    if (
      !body.action ||
      !body.actionId ||
      !body.automationType ||
      !body.taskId
    ) {
      return NextResponse.json(
        {
          error:
            "action, actionId, automationType, and taskId are required.",
        },
        { status: 400 },
      );
    }

    const actionId = body.actionId;
    const automationType = body.automationType;
    const taskId = body.taskId;

    const user = await getOrCreateDefaultUser();

    const task = await prisma.task.findFirst({
      where: {
        id: body.taskId,
        userId: user.id,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found." },
        { status: 404 },
      );
    }

    const now = new Date();

    if (body.action === "COMPLETE") {
      const result = await prisma.$transaction(
        async (tx) => {
          const updatedTask = await tx.task.update({
            where: {
              id: task.id,
            },
            data: {
              status: "DONE",
              completedAt: now,
            },
          });

          const state =
            await tx.automationActionState.upsert({
              where: {
                userId_actionId: {
                  userId: user.id,
                  actionId,
                },
              },
              update: {
                actionType: automationType,
                taskId: task.id,
                status: "EXECUTED",
                executedAt: now,
              },
              create: {
                userId: user.id,
                actionId,
                actionType: automationType,
                taskId: task.id,
                status: "EXECUTED",
                executedAt: now,
              },
            });

          return {
            updatedTask,
            state,
          };
        },
      );

      return NextResponse.json({
        success: true,
        action: body.action,
        task: result.updatedTask,
        state: result.state,
      });
    }

    if (body.action === "DISMISS") {
      const state =
        await prisma.automationActionState.upsert({
          where: {
            userId_actionId: {
              userId: user.id,
              actionId,
            },
          },
          update: {
            actionType: automationType,
            taskId: task.id,
            status: "DISMISSED",
            dismissedAt: now,
          },
          create: {
            userId: user.id,
            actionId,
            actionType: automationType,
            taskId: task.id,
            status: "DISMISSED",
            dismissedAt: now,
          },
        });

      return NextResponse.json({
        success: true,
        action: body.action,
        state,
      });
    }

    if (body.action === "SNOOZE") {
      if (!body.snoozedUntil) {
        return NextResponse.json(
          {
            error:
              "snoozedUntil is required for SNOOZE.",
          },
          { status: 400 },
        );
      }

      const snoozedUntil = new Date(
        body.snoozedUntil,
      );

      if (
        Number.isNaN(snoozedUntil.getTime()) ||
        snoozedUntil <= now
      ) {
        return NextResponse.json(
          {
            error:
              "snoozedUntil must be a valid future date.",
          },
          { status: 400 },
        );
      }

      const result = await prisma.$transaction(
        async (tx) => {
          const updatedTask = await tx.task.update({
            where: {
              id: task.id,
            },
            data: {
              dueAt: snoozedUntil,
            },
          });

          const state =
            await tx.automationActionState.upsert({
              where: {
                userId_actionId: {
                  userId: user.id,
                  actionId,
                },
              },
              update: {
                actionType: automationType,
                taskId: task.id,
                status: "SNOOZED",
                snoozedUntil,
              },
              create: {
                userId: user.id,
                actionId,
                actionType: automationType,
                taskId: task.id,
                status: "SNOOZED",
                snoozedUntil,
              },
            });

          return {
            updatedTask,
            state,
          };
        },
      );

      return NextResponse.json({
        success: true,
        action: body.action,
        task: result.updatedTask,
        state: result.state,
      });
    }

    return NextResponse.json(
      { error: "Unsupported automation action." },
      { status: 400 },
    );
  } catch (error) {
    console.error(
      "Jarvis automation action failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Jarvis could not perform that action.",
      },
      { status: 500 },
    );
  }
}
