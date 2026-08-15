import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    

    const soldData = await prisma.sale.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
    });

    // Look at sales from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const productsWithSold = products.map((product) => {
      const sold = soldData.find(
        (item) => item.productId === product.id
      );

      const totalSold = sold?._sum.quantity ?? 0;

      // Sales during the last 30 days
      const recentProductSales = recentSales
        .filter((sale) => sale.productId === product.id)
        .reduce((total, sale) => total + sale.quantity, 0);

      // Average units sold per day
      const salesPerDay = recentProductSales / 30;

      // Estimated number of days current stock will last
      const estimatedDaysRemaining =
        salesPerDay > 0
          ? Math.round(product.stock / salesPerDay)
          : null;

     // ------------------------------------------------
// SMART RESTOCK RECOMMENDATION
// ------------------------------------------------

// Supplier lead time
const leadTimeDays = product.leadTimeDays;

// Expected sales while waiting for new stock
const leadTimeDemand = Math.ceil(
  salesPerDay * leadTimeDays
);

// Keep a safety buffer
const safetyStock = product.lowStockLimit * 2;

// Reorder point:
// expected demand during supplier lead time
// + safety stock
const reorderPoint = Math.max(
  leadTimeDemand + safetyStock,
  product.lowStockLimit
);

// Only recommend a purchase when stock is
// below the reorder point.
let recommendedRestock = 0;

if (
  salesPerDay > 0 &&
  product.stock <= reorderPoint
) {
  // Target enough stock for roughly 30 days
  // of expected demand + safety stock.
  const targetStock = Math.ceil(
    salesPerDay * 30 + safetyStock
  );

  recommendedRestock = Math.max(
    0,
    targetStock - product.stock
  );
}

let recommendation = "Stock level looks healthy.";

if (salesPerDay <= 0) {
  recommendation = "Not enough sales data for a reliable recommendation.";
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
    console.error("FAILED TO CREATE PRODUCT:", error);

    return NextResponse.json(
      {
        error: "Failed to create product",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}



export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const category = body.category
      ? String(body.category).trim()
      : null;

    const price = Number(body.price);
    const stock = Number(body.stock);
    const leadTimeDays = Number(body.leadTimeDays) || 7;

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

    // Prevent duplicate product names.
    // "Egg", "egg", and " egg " are treated as the same product.
    const existingProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const normalizedName = name.toLowerCase();

    const duplicate = existingProducts.find(
      (product) =>
        product.name.trim().toLowerCase() === normalizedName
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
      },
    });

    return NextResponse.json(product, { status: 201 });
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
    const body = await request.json();

    const productId = Number(body.id);
    const quantity = Number(body.quantity);

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json(
        {
          error: "Product ID and a valid restock quantity are required.",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
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

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
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
    });

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
    const { id } = await request.json();

    const productId = Number(id);

    if (!productId) {
      return Response.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const salesCount = await prisma.sale.count({
      where: {
        productId,
      },
    });

    if (salesCount > 0) {
      return Response.json(
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

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    return Response.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}