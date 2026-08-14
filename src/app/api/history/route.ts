import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const history = await prisma.inventoryHistory.findMany({
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