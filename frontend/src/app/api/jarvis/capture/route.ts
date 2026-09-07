import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseJarvisCapture } from "@/lib/jarvis/capture-parser";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CaptureIntent =
  | "TASK"
  | "INCOME_LAB";

type CaptureBody = {
  intent?: CaptureIntent;

  text?: string;
  contextText?: string | null;

  title?: string;
  description?: string | null;

  areaSlug?: string | null;
  projectId?: string | null;

  priority?: string | null;
  dueAt?: string | null;

  sourceType?: string | null;
  sourceAccount?: string | null;
  sourceMessageId?: string | null;

  category?: string | null;
  nextAction?: string | null;
  notes?: string | null;
};

function clean(value?: string | null) {
  return value?.trim() || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CaptureBody;

    let intent = body.intent;
    let title = clean(body.title);

    let parsed:
      | ReturnType<typeof parseJarvisCapture>
      | null = null;

    if (!intent && body.text?.trim()) {
      parsed = parseJarvisCapture(body.text, {
        contextText: body.contextText,
      });

      if (!parsed) {
        return NextResponse.json(
          {
            captured: false,
            error:
              "Jarvis could not determine what should be captured.",
            needsClarification: true,
          },
          {
            status: 400,
          },
        );
      }

      if (parsed.needsContext) {
        return NextResponse.json(
          {
            captured: false,
            error:
              "Jarvis needs context to know what this refers to.",
            needsClarification: true,
            parsed,
          },
          {
            status: 400,
          },
        );
      }

      intent = parsed.intent;
      title = parsed.title;
    }

    if (!intent) {
      return NextResponse.json(
        {
          error: "Capture intent is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          error: "Capture title is required.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await getOrCreateDefaultUser();

    if (intent === "TASK") {
      const requestedProjectId = clean(body.projectId);

      const requestedAreaSlug =
        clean(body.areaSlug) ??
        (parsed?.intent === "TASK"
          ? parsed.areaSlug
          : null);

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

      let requestedAreaId: string | null = null;

      if (requestedAreaSlug) {
        const area = await prisma.area.findFirst({
          where: {
            userId: user.id,
            slug: requestedAreaSlug,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        if (!area) {
          return NextResponse.json(
            {
              error: `Area "${requestedAreaSlug}" not found.`,
            },
            {
              status: 400,
            },
          );
        }

        requestedAreaId = area.id;
      }

      if (
        requestedProjectId &&
        requestedAreaId &&
        projectAreaId !== requestedAreaId
      ) {
        return NextResponse.json(
          {
            error:
              "Captured task area does not match the project's area.",
          },
          {
            status: 400,
          },
        );
      }

      const sourceType =
        clean(body.sourceType) ?? "JARVIS_CAPTURE";

      const sourceAccount =
        clean(body.sourceAccount) ?? "jarvis";

      const sourceMessageId =
        clean(body.sourceMessageId);

      if (sourceMessageId) {
        const existing = await prisma.task.findFirst({
          where: {
            userId: user.id,
            sourceAccount,
            sourceMessageId,
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

        if (existing) {
          return NextResponse.json({
            captured: true,
            intent,
            alreadyExists: true,
            task: existing,
          });
        }
      }

      let dueAt: Date | null = null;

      if (body.dueAt) {
        dueAt = new Date(body.dueAt);

        if (Number.isNaN(dueAt.getTime())) {
          return NextResponse.json(
            {
              error: "Invalid due date.",
            },
            {
              status: 400,
            },
          );
        }
      }

      const task = await prisma.task.create({
        data: {
          userId: user.id,
          title,
          description: clean(body.description),
          priority:
            clean(body.priority) ??
            (parsed?.intent === "TASK"
              ? parsed.priority
              : "NORMAL"),
          dueAt,
          sourceType,
          sourceAccount,
          sourceMessageId,
          projectId: requestedProjectId,
          areaId: requestedProjectId
            ? null
            : requestedAreaId,
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
        captured: true,
        intent,
        alreadyExists: false,
        task,
      });
    }

    if (intent === "INCOME_LAB") {
      const existing =
        await prisma.incomeOpportunity.findFirst({
          where: {
            userId: user.id,
            name: title,
          },
        });

      if (existing) {
        return NextResponse.json({
          captured: true,
          intent,
          alreadyExists: true,
          opportunity: existing,
        });
      }

      const opportunity =
        await prisma.incomeOpportunity.create({
          data: {
            userId: user.id,
            name: title,
            category: clean(body.category),
            description: clean(body.description),
            notes: clean(body.notes),
            nextAction: clean(body.nextAction),
            status: "RESEARCHING",
          },
        });

      return NextResponse.json({
        captured: true,
        intent,
        alreadyExists: false,
        opportunity,
      });
    }

    return NextResponse.json(
      {
        error: "Unsupported capture intent.",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error("Jarvis capture failed:", error);

    return NextResponse.json(
      {
        error: "Jarvis capture failed.",
      },
      {
        status: 500,
      },
    );
  }
}
