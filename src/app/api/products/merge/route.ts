import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function POST(request: Request) {
  try {
    // -----------------------------
    // AUTHENTICATION
    // -----------------------------

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // -----------------------------
    // READ REQUEST
    // -----------------------------

    const body = await request.json();

    const sourceId = Number(body.sourceId);
    const targetId = Number(body.targetId);

    if (!sourceId || !targetId || sourceId === targetId) {
      return NextResponse.json(
        {
          error: "Two different product IDs are required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // FIND PRODUCTS
    // -----------------------------

    const source = await prisma.product.findFirst({
      where: {
        id: sourceId,
        userId,
      },
    });

    const target = await prisma.product.findFirst({
      where: {
        id: targetId,
        userId,
      },
    });

    // Important:
    // Because both products are filtered by userId,
    // a user cannot merge another user's product.

    if (!source || !target) {
      return NextResponse.json(
        {
          error: "One or both products could not be found.",
        },
        { status: 404 }
      );
    }

    // -----------------------------
    // CHECK PRODUCT NAMES
    // -----------------------------

    const sourceName = source.name.trim().toLowerCase();
    const targetName = target.name.trim().toLowerCase();

    if (sourceName !== targetName) {
      return NextResponse.json(
        {
          error:
            "Products can only be merged when their names match.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // MERGE
    // -----------------------------

    const result = await prisma.$transaction(async (tx) => {
      // Move sales from duplicate → main product
      await tx.sale.updateMany({
        where: {
          productId: sourceId,
        },
        data: {
          productId: targetId,
        },
      });

      // Move inventory history
      await tx.inventoryHistory.updateMany({
        where: {
          productId: sourceId,
        },
        data: {
          productId: targetId,
        },
      });

      // Combine stock
      const updatedTarget = await tx.product.update({
        where: {
          id: targetId,
        },
        data: {
          stock: {
            increment: source.stock,
          },
        },
      });

      // Delete duplicate
      await tx.product.delete({
        where: {
          id: sourceId,
        },
      });

      return updatedTarget;
    });

    return NextResponse.json({
      success: true,
      product: result,
    });
  } catch (error) {
    console.error("MERGE PRODUCTS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to merge products.",
      },
      { status: 500 }
    );
  }
}