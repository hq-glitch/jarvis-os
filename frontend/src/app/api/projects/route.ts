import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();

    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
      },
      include: {
        area: true,
        tasks: {
          orderBy: [
            { sortOrder: "asc" },
            { createdAt: "asc" },
          ],
        },
        socialContent: {
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to load projects:", error);

    return NextResponse.json(
      { error: "Failed to load projects." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      status?: string;
      progress?: number;
      nextAction?: string | null;
      notes?: string | null;
      sourceType?: string | null;
      sourceId?: string | null;
      areaId?: string | null;
    };

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Project name is required." },
        { status: 400 },
      );
    }

    const user = await getOrCreateDefaultUser();

    const requestedAreaId = body.areaId?.trim() || null;

    if (requestedAreaId) {
      const area = await prisma.area.findFirst({
        where: {
          id: requestedAreaId,
          userId: user.id,
        },
      });

      if (!area) {
        return NextResponse.json(
          { error: "Area not found." },
          { status: 400 },
        );
      }
    }

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        status: body.status?.trim() || "PLANNING",
        progress: body.progress ?? 0,
        nextAction: body.nextAction?.trim() || null,
        notes: body.notes?.trim() || null,
        sourceType: body.sourceType?.trim() || null,
        sourceId: body.sourceId?.trim() || null,
        areaId: requestedAreaId,
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Failed to create project:", error);

    return NextResponse.json(
      { error: "Failed to create project." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      description?: string | null;
      status?: string;
      progress?: number;
      nextAction?: string | null;
      notes?: string | null;
      areaId?: string | null;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Project ID is required." },
        { status: 400 },
      );
    }

    const user = await getOrCreateDefaultUser();

    const requestedAreaId =
      body.areaId !== undefined
        ? body.areaId?.trim() || null
        : undefined;

    if (requestedAreaId) {
      const area = await prisma.area.findFirst({
        where: {
          id: requestedAreaId,
          userId: user.id,
        },
      });

      if (!area) {
        return NextResponse.json(
          { error: "Area not found." },
          { status: 400 },
        );
      }
    }

    const existing = await prisma.project.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 },
      );
    }

    const project = await prisma.project.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(body.name !== undefined
          ? { name: body.name.trim() }
          : {}),
        ...(body.description !== undefined
          ? { description: body.description?.trim() || null }
          : {}),
        ...(body.status !== undefined
          ? { status: body.status }
          : {}),
        ...(body.progress !== undefined
          ? {
              progress: Math.max(
                0,
                Math.min(100, body.progress),
              ),
            }
          : {}),
        ...(body.nextAction !== undefined
          ? {
              nextAction:
                body.nextAction?.trim() || null,
            }
          : {}),
        ...(body.notes !== undefined
          ? {
              notes: body.notes?.trim() || null,
            }
          : {}),
        ...(body.areaId !== undefined
          ? {
              areaId: requestedAreaId,
            }
          : {}),
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Failed to update project:", error);

    return NextResponse.json(
      { error: "Failed to update project." },
      { status: 500 },
    );
  }
}
