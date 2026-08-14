import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {

    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const totalRevenue = sales.reduce(
      (total, sale) => total + sale.total,
      0
    );

    const totalUnits = sales.reduce(
      (total, sale) => total + sale.quantity,
      0
    );

    const totalTransactions = sales.length;

    // -----------------------------
    // WEEKLY PERFORMANCE
    // -----------------------------

    const now = new Date();

    const startOfThisWeek = new Date(now);
    const day = startOfThisWeek.getDay();

    // Make Monday the first day of the week
    const daysSinceMonday = day === 0 ? 6 : day - 1;

    startOfThisWeek.setDate(
      startOfThisWeek.getDate() - daysSinceMonday
    );

    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);

    startOfLastWeek.setDate(
      startOfLastWeek.getDate() - 7
    );

    const thisWeekSales = sales.filter(
      (sale) => sale.createdAt >= startOfThisWeek
    );

    const lastWeekSales = sales.filter(
      (sale) =>
        sale.createdAt >= startOfLastWeek &&
        sale.createdAt < startOfThisWeek
    );

    const thisWeekRevenue = thisWeekSales.reduce(
      (total, sale) => total + sale.total,
      0
    );

    const lastWeekRevenue = lastWeekSales.reduce(
      (total, sale) => total + sale.total,
      0
    );

    const thisWeekUnits = thisWeekSales.reduce(
      (total, sale) => total + sale.quantity,
      0
    );

    const lastWeekUnits = lastWeekSales.reduce(
      (total, sale) => total + sale.quantity,
      0
    );

    function calculateChange(
      current: number,
      previous: number
    ) {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }

      return ((current - previous) / previous) * 100;
    }

    const revenueChange = calculateChange(
      thisWeekRevenue,
      lastWeekRevenue
    );

    const unitsChange = calculateChange(
      thisWeekUnits,
      lastWeekUnits
    );

    // -----------------------------
    // PRODUCT PERFORMANCE
    // -----------------------------

    const productPerformance = sales.reduce<
      Record<
        number,
        {
          productId: number;
          name: string;
          quantitySold: number;
          revenue: number;
        }
      >
    >((result, sale) => {
      const productId = sale.product.id;

      if (!result[productId]) {
        result[productId] = {
          productId,
          name: sale.product.name,
          quantitySold: 0,
          revenue: 0,
        };
      }

      result[productId].quantitySold += sale.quantity;
      result[productId].revenue += sale.total;

      return result;
    }, {});

    const topProducts = Object.values(productPerformance).sort(
      (a, b) => b.quantitySold - a.quantitySold
    );

    return Response.json({
      sales,

      summary: {
        totalRevenue,
        totalUnits,
        totalTransactions,

        thisWeekRevenue,
        lastWeekRevenue,
        thisWeekUnits,
        lastWeekUnits,

        revenueChange,
        unitsChange,
      },

      topProducts,
    });
  } catch (error) {
    console.error("GET SALES ERROR:", error);

    return Response.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const productId = Number(body.productId);
    const quantity = Number(body.quantity);

    if (!productId || !quantity || quantity <= 0) {
      return Response.json(
        { error: "Product and quantity are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return Response.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (quantity > product.stock) {
      return Response.json(
        { error: "Not enough stock available" },
        { status: 400 }
      );
    }

  
    const total = product.price * quantity;

   const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          productId: product.id,
          quantity,
          price: product.price,
          total,
        },
        include: {
          product: true,
        },
      });

      await tx.product.update({
        where: {
          id: product.id,
        },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      });

      await tx.inventoryHistory.create({
        data: {
          type: "SALE",
          quantity,
          productId: product.id,
        },
      });

      return sale;
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error("CREATE SALE ERROR:", error);

    return Response.json(
      { error: "Failed to record sale" },
      { status: 500 }
    );
  }
}

    export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const saleId = Number(body.id);

    if (!saleId) {
      return Response.json(
        { error: "Sale ID is required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: {
          id: saleId,
        },
      });

      if (!sale) {
        throw new Error("Sale not found");
      }

      await tx.product.update({
        where: {
          id: sale.productId,
        },
        data: {
          stock: {
            increment: sale.quantity,
          },
        },
      });

      await tx.sale.delete({
        where: {
          id: saleId,
        },
      });

      return sale;
    });

    return Response.json(result);
  } catch (error) {
    console.error("DELETE SALE ERROR:", error);

    return Response.json(
      { error: "Failed to delete sale" },
      { status: 500 }
    );
  }
}