import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();

    const areas = await prisma.area.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        projects: {
          orderBy: {
            updatedAt: "desc",
          },
        },
        tasks: {
          where: {
            projectId: null,
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json({ areas });
  } catch (error) {
    console.error("Failed to load areas:", error);

    return NextResponse.json(
      { error: "Failed to load areas." },
      { status: 500 },
    );
  }
}
