import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const history = await prisma.inventoryHistory.findMany({
      where: {
        product: {
          userId: session.user.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("GET HISTORY ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}