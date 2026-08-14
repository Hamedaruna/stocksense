import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
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

    const source = await prisma.product.findUnique({
      where: {
        id: sourceId,
      },
    });

    const target = await prisma.product.findUnique({
      where: {
        id: targetId,
      },
    });

    if (!source || !target) {
      return NextResponse.json(
        {
          error: "One or both products could not be found.",
        },
        { status: 404 }
      );
    }

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

    const result = await prisma.$transaction(async (tx) => {
      /*
       * Move all sales from the duplicate product
       * to the main product.
       *
       * Sale.price and Sale.total stay exactly the same.
       */
      await tx.sale.updateMany({
        where: {
          productId: sourceId,
        },
        data: {
          productId: targetId,
        },
      });

      /*
       * Move all inventory history to the main product.
       */
      await tx.inventoryHistory.updateMany({
        where: {
          productId: sourceId,
        },
        data: {
          productId: targetId,
        },
      });

      /*
       * Combine the current stock.
       */
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

      /*
       * Now the duplicate product has no
       * sales/history attached to it, so it
       * can safely be removed.
       */
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