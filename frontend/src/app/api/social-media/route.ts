import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();

    const content = await prisma.socialContent.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        {
          publishAt: "asc",
        },
        {
          updatedAt: "desc",
        },
      ],
    });

    return NextResponse.json({
      content,
    });
  } catch (error) {
    console.error("Failed to load social content:", error);

    return NextResponse.json(
      {
        error: "Failed to load social content.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: string;
      platform?: string;
      status?: string;
      series?: string | null;
      caption?: string | null;
      hashtags?: string | null;
      publishAt?: string | null;
      publishedUrl?: string | null;
      notes?: string | null;
      projectId?: string | null;
    };

    if (!body.title?.trim()) {
      return NextResponse.json(
        {
          error: "Content title is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!body.platform?.trim()) {
      return NextResponse.json(
        {
          error: "Platform is required.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await getOrCreateDefaultUser();

    const content = await prisma.socialContent.create({
      data: {
        userId: user.id,
        title: body.title.trim(),
        platform: body.platform.trim(),
        status: body.status?.trim() || "IDEA",
        series: body.series?.trim() || null,
        caption: body.caption?.trim() || null,
        hashtags: body.hashtags?.trim() || null,
        publishAt: body.publishAt
          ? new Date(body.publishAt)
          : null,
        publishedUrl: body.publishedUrl?.trim() || null,
        notes: body.notes?.trim() || null,
        projectId: body.projectId?.trim() || null,
      },
    });

    return NextResponse.json({
      content,
    });
  } catch (error) {
    console.error("Failed to create social content:", error);

    return NextResponse.json(
      {
        error: "Failed to create social content.",
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
      platform?: string;
      status?: string;
      series?: string | null;
      caption?: string | null;
      hashtags?: string | null;
      publishAt?: string | null;
      publishedUrl?: string | null;
      notes?: string | null;
      projectId?: string | null;
    };

    if (!body.id) {
      return NextResponse.json(
        {
          error: "Content ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await getOrCreateDefaultUser();

    const existing = await prisma.socialContent.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Content item not found.",
        },
        {
          status: 404,
        },
      );
    }

    const content = await prisma.socialContent.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(body.title !== undefined
          ? {
              title: body.title.trim(),
            }
          : {}),
        ...(body.platform !== undefined
          ? {
              platform: body.platform.trim(),
            }
          : {}),
        ...(body.status !== undefined
          ? {
              status: body.status.trim(),
            }
          : {}),
        ...(body.series !== undefined
          ? {
              series: body.series?.trim() || null,
            }
          : {}),
        ...(body.caption !== undefined
          ? {
              caption: body.caption?.trim() || null,
            }
          : {}),
        ...(body.hashtags !== undefined
          ? {
              hashtags: body.hashtags?.trim() || null,
            }
          : {}),
        ...(body.publishAt !== undefined
          ? {
              publishAt: body.publishAt
                ? new Date(body.publishAt)
                : null,
            }
          : {}),
        ...(body.publishedUrl !== undefined
          ? {
              publishedUrl:
                body.publishedUrl?.trim() || null,
            }
          : {}),
        ...(body.notes !== undefined
          ? {
              notes: body.notes?.trim() || null,
            }
          : {}),
        ...(body.projectId !== undefined
          ? {
              projectId: body.projectId?.trim() || null,
            }
          : {}),
      },
    });

    return NextResponse.json({
      content,
    });
  } catch (error) {
    console.error("Failed to update social content:", error);

    return NextResponse.json(
      {
        error: "Failed to update social content.",
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
          error: "Content ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await getOrCreateDefaultUser();

    const existing = await prisma.socialContent.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Content item not found.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.socialContent.delete({
      where: {
        id: existing.id,
      },
    });

    return NextResponse.json({
      deleted: true,
    });
  } catch (error) {
    console.error("Failed to delete social content:", error);

    return NextResponse.json(
      {
        error: "Failed to delete social content.",
      },
      {
        status: 500,
      },
    );
  }
}
