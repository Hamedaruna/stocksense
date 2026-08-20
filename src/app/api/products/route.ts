import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const products = await prisma.product.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const productIds = products.map((product) => product.id);

    const soldData =
      productIds.length > 0
        ? await prisma.sale.groupBy({
            by: ["productId"],
            where: {
              productId: {
                in: productIds,
              },
            },
            _sum: {
              quantity: true,
            },
          })
        : [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales =
      productIds.length > 0
        ? await prisma.sale.findMany({
            where: {
              productId: {
                in: productIds,
              },
              createdAt: {
                gte: thirtyDaysAgo,
              },
            },
          })
        : [];

    const productsWithSold = products.map((product) => {
      const sold = soldData.find(
        (item) => item.productId === product.id
      );

      const totalSold = sold?._sum.quantity ?? 0;

      const recentProductSales = recentSales
        .filter((sale) => sale.productId === product.id)
        .reduce(
          (total, sale) => total + sale.quantity,
          0
        );

      const salesPerDay = recentProductSales / 30;

      const estimatedDaysRemaining =
        salesPerDay > 0
          ? Math.round(product.stock / salesPerDay)
          : null;

      const leadTimeDays = product.leadTimeDays;

      const leadTimeDemand = Math.ceil(
        salesPerDay * leadTimeDays
      );

      const safetyStock = product.lowStockLimit * 2;

      const reorderPoint = Math.max(
        leadTimeDemand + safetyStock,
        product.lowStockLimit
      );

      let recommendedRestock = 0;

      if (
        salesPerDay > 0 &&
        product.stock <= reorderPoint
      ) {
        const targetStock = Math.ceil(
          salesPerDay * 30 + safetyStock
        );

        recommendedRestock = Math.max(
          0,
          targetStock - product.stock
        );
      }

      let recommendation =
        "Stock level looks healthy.";

      if (salesPerDay <= 0) {
        recommendation =
          "Not enough sales data for a reliable recommendation.";
      } else if (product.stock <= reorderPoint) {
        recommendation = `Stock may run low within ${leadTimeDays} days.`;
      } else if (estimatedDaysRemaining !== null) {
        recommendation = `Current stock should last about ${estimatedDaysRemaining} days.`;
      }

      let status = "No sales yet";

      if (totalSold >= 10) {
        status = "Best seller";
      } else if (totalSold >= 5) {
        status = "Selling well";
      } else if (totalSold > 0) {
        status = "Slow mover";
      }

      if (product.stock <= product.lowStockLimit) {
        status = "Restock soon";
      }

      return {
        ...product,
        sold: totalSold,
        status,
        recentSales: recentProductSales,
        salesPerDay,
        estimatedDaysRemaining,
        leadTimeDays,
        leadTimeDemand,
        reorderPoint,
        recommendedRestock,
        recommendation,
      };
    });

    return NextResponse.json(productsWithSold);
  } catch (error) {
    console.error("FAILED TO FETCH PRODUCTS:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await request.json();

    const name = String(body.name || "").trim();

    const category = body.category
      ? String(body.category).trim()
      : null;

    const price = Number(body.price);
    const stock = Number(body.stock);
    const leadTimeDays =
      Number(body.leadTimeDays) || 7;

    if (!name) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 }
      );
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: "A valid product price is required." },
        { status: 400 }
      );
    }

    if (stock < 0) {
      return NextResponse.json(
        { error: "Stock cannot be negative." },
        { status: 400 }
      );
    }

    const existingProducts =
      await prisma.product.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          name: true,
        },
      });

    const normalizedName = name.toLowerCase();

    const duplicate = existingProducts.find(
      (product) =>
        product.name.trim().toLowerCase() ===
        normalizedName
    );

    if (duplicate) {
      return NextResponse.json(
        {
          error: `A product named "${duplicate.name}" already exists.`,
        },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        price,
        stock,
        leadTimeDays,
        userId,
      },
    });

    return NextResponse.json(product, {
      status: 201,
    });
  } catch (error) {
    console.error("FAILED TO CREATE PRODUCT:", error);

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await request.json();

    const productId = Number(body.id);
    const quantity = Number(body.quantity);

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json(
        {
          error:
            "Product ID and a valid restock quantity are required.",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const updatedProduct =
          await tx.product.update({
            where: {
              id: productId,
            },
            data: {
              stock: {
                increment: quantity,
              },
            },
          });

        await tx.inventoryHistory.create({
          data: {
            type: "RESTOCK",
            quantity,
            productId,
          },
        });

        return updatedProduct;
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("RESTOCK PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to restock product",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const { id } = await request.json();

    const productId = Number(id);

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const salesCount = await prisma.sale.count({
      where: {
        productId,
      },
    });

    if (salesCount > 0) {
      return NextResponse.json(
        {
          error:
            "This product has sales history and cannot be deleted. Merge it with another product instead.",
        },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}