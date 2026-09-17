import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOrCreateDefaultUser();

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      inTaskList: true,
    },
    include: {
      area: true,
      project: {
        include: {
          area: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const orderedTasks = [...tasks].sort((a, b) => {
    const aCompleted =
      Boolean(a.completedAt) || a.status.toUpperCase() === "DONE";
    const bCompleted =
      Boolean(b.completedAt) || b.status.toUpperCase() === "DONE";

    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1;
    }

    if (a.manuallyOrdered || b.manuallyOrdered) {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
    }

    if (a.dueAt && b.dueAt) {
      return a.dueAt.getTime() - b.dueAt.getTime();
    }

    if (a.dueAt && !b.dueAt) {
      return -1;
    }

    if (!a.dueAt && b.dueAt) {
      return 1;
    }

    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return NextResponse.json({
    tasks: orderedTasks,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string | null;
      dueAt?: string | null;
      inTaskList?: boolean;
      sortOrder?: number;
      manuallyOrdered?: boolean;
      sourceType?: string | null;
      sourceAccount?: string | null;
      sourceMessageId?: string | null;
      sourceThreadId?: string | null;
      projectId?: string | null;
      areaId?: string | null;
    };

    const title = body.title?.trim();

    if (!title) {
      return NextResponse.json(
        {
          error: "Task title is required.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await getOrCreateDefaultUser();

    const existing =
      body.sourceMessageId && body.sourceAccount
        ? await prisma.task.findFirst({
            where: {
              userId: user.id,
              sourceMessageId: body.sourceMessageId,
              sourceAccount: body.sourceAccount,
            },
          })
        : null;

    if (existing) {
      return NextResponse.json({
        task: existing,
        alreadyExists: true,
      });
    }

    const requestedProjectId = body.projectId?.trim() || null;
    const requestedAreaId = body.areaId?.trim() || null;

    let projectAreaId: string | null = null;

    if (requestedProjectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: requestedProjectId,
          userId: user.id,
        },
        select: {
          id: true,
          areaId: true,
        },
      });

      if (!project) {
        return NextResponse.json(
          {
            error: "Project not found.",
          },
          {
            status: 400,
          },
        );
      }

      projectAreaId = project.areaId;
    }

    if (requestedAreaId) {
      const area = await prisma.area.findFirst({
        where: {
          id: requestedAreaId,
          userId: user.id,
        },
        select: {
          id: true,
        },
      });

      if (!area) {
        return NextResponse.json(
          {
            error: "Area not found.",
          },
          {
            status: 400,
          },
        );
      }
    }

    if (
      requestedProjectId &&
      requestedAreaId &&
      requestedAreaId !== projectAreaId
    ) {
      return NextResponse.json(
        {
          error: "Task area does not match the project's area.",
        },
        {
          status: 400,
        },
      );
    }

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title,
        description: body.description?.trim() || null,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        inTaskList: body.inTaskList ?? true,
        sortOrder: body.sortOrder ?? 0,
        manuallyOrdered: body.manuallyOrdered ?? false,
        sourceType: body.sourceType?.trim() || null,
        sourceAccount: body.sourceAccount?.trim() || null,
        sourceMessageId: body.sourceMessageId?.trim() || null,
        sourceThreadId: body.sourceThreadId?.trim() || null,
        projectId: requestedProjectId,
        areaId: requestedProjectId ? null : requestedAreaId,
      },
      include: {
        area: true,
        project: {
          include: {
            area: true,
          },
        },
      },
    });

    return NextResponse.json({
      task,
      alreadyExists: false,
    });
  } catch (error) {
    console.error("Failed to create task:", error);

    return NextResponse.json(
      {
        error: "Failed to create task.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id?: string;
      title?: string;
      description?: string | null;
      dueAt?: string | null;
      inTaskList?: boolean;
      sortOrder?: number;
      manuallyOrdered?: boolean;
      completed?: boolean;
      projectId?: string | null;
      areaId?: string | null;
    };

    if (!body.id) {
      return NextResponse.json(
        {
          error: "Task ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await getOrCreateDefaultUser();

    const existing = await prisma.task.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Task not found.",
        },
        {
          status: 404,
        },
      );
    }

    const nextProjectId =
      body.projectId !== undefined
        ? body.projectId?.trim() || null
        : existing.projectId;

    const requestedAreaId =
      body.areaId !== undefined
        ? body.areaId?.trim() || null
        : existing.areaId;

    let projectAreaId: string | null = null;

    if (nextProjectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: nextProjectId,
          userId: user.id,
        },
        select: {
          id: true,
          areaId: true,
        },
      });

      if (!project) {
        return NextResponse.json(
          {
            error: "Project not found.",
          },
          {
            status: 400,
          },
        );
      }

      projectAreaId = project.areaId;
    }

    if (requestedAreaId) {
      const area = await prisma.area.findFirst({
        where: {
          id: requestedAreaId,
          userId: user.id,
        },
        select: {
          id: true,
        },
      });

      if (!area) {
        return NextResponse.json(
          {
            error: "Area not found.",
          },
          {
            status: 400,
          },
        );
      }
    }

    if (
      nextProjectId &&
      body.areaId !== undefined &&
      requestedAreaId &&
      requestedAreaId !== projectAreaId
    ) {
      return NextResponse.json(
        {
          error: "Task area does not match the project's area.",
        },
        {
          status: 400,
        },
      );
    }

    const task = await prisma.task.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(body.title !== undefined
          ? {
              title: body.title.trim(),
            }
          : {}),
        ...(body.description !== undefined
          ? {
              description: body.description?.trim() || null,
            }
          : {}),
        ...(body.inTaskList !== undefined
          ? {
              inTaskList: body.inTaskList,
            }
          : {}),
        ...(body.sortOrder !== undefined
          ? {
              sortOrder: body.sortOrder,
            }
          : {}),
        ...(body.manuallyOrdered !== undefined
          ? {
              manuallyOrdered: body.manuallyOrdered,
            }
          : {}),
        ...(body.dueAt !== undefined
          ? {
              dueAt: body.dueAt ? new Date(body.dueAt) : null,
            }
          : {}),
        ...(body.completed !== undefined
          ? {
              status: body.completed ? "DONE" : "TODO",
              completedAt: body.completed ? new Date() : null,
            }
          : {}),
        ...(body.projectId !== undefined
          ? {
              projectId: nextProjectId,
            }
          : {}),
        ...(body.areaId !== undefined || body.projectId !== undefined
          ? {
              areaId: nextProjectId ? null : requestedAreaId,
            }
          : {}),
      },
      include: {
        area: true,
        project: {
          include: {
            area: true,
          },
        },
      },
    });

    return NextResponse.json({
      task,
    });
  } catch (error) {
    console.error("Failed to update task:", error);

    return NextResponse.json(
      {
        error: "Failed to update task.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        {
          error: "Task ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await getOrCreateDefaultUser();

    const existing = await prisma.task.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Task not found.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.task.delete({
      where: {
        id: existing.id,
      },
    });

    return NextResponse.json({
      deleted: true,
    });
  } catch (error) {
    console.error("Failed to delete task:", error);

    return NextResponse.json(
      {
        error: "Failed to delete task.",
      },
      {
        status: 500,
      },
    );
  }
}
