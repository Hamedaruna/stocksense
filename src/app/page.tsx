"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

type SalesSummary = {
  totalRevenue: number;
  totalUnits: number;
  totalTransactions: number;
  thisWeekRevenue: number;
  lastWeekRevenue: number;
  thisWeekUnits: number;
  lastWeekUnits: number;
  revenueChange: number | null;
  unitsChange: number | null;
};

export default function Home() {
    const { data: session } = authClient.useSession();

  const userName = session?.user?.name || session?.user?.email || "";

  const userInitials =
    userName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??";

  const [products, setProducts] = useState<any[]>([]);

  const [salesSummary, setSalesSummary] = useState<SalesSummary>({
    totalRevenue: 0,
    totalUnits: 0,
    totalTransactions: 0,
    thisWeekRevenue: 0,
    lastWeekRevenue: 0,
    thisWeekUnits: 0,
    lastWeekUnits: 0,
    revenueChange: null,
    unitsChange: null,
  });

  const currentHour = new Date().getHours();

  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
      ? "Good afternoon"
      : "Good evening";

  // -----------------------------------------
  // INVENTORY INSIGHTS
  // -----------------------------------------

  const lowStockProducts = products.filter(
    (product) => product.stock <= product.lowStockLimit
  );

  const bestSeller = products.reduce(
    (best, product) => {
      if (!best || product.sold > best.sold) {
        return product;
      }

      return best;
    },
    null as any
  );

  const slowMovingProduct = products.reduce(
    (slow, product) => {
      if (!slow || product.sold < slow.sold) {
        return product;
      }

      return slow;
    },
    null as any
  );

  const restockProduct = lowStockProducts.reduce(
    (lowest, product) => {
      if (!lowest || product.stock < lowest.stock) {
        return product;
      }

      return lowest;
    },
    null as any
  );

  const stockRecommendations = products
    .filter((product) => product.recommendedRestock > 0)
    .sort((a, b) => {
      const aPriority =
        (a.salesPerDay || 0) * 2 +
        (a.recommendedRestock || 0);

      const bPriority =
        (b.salesPerDay || 0) * 2 +
        (b.recommendedRestock || 0);

      return bPriority - aPriority;
    })
    .slice(0, 3);

  // -----------------------------------------
  // LOAD DASHBOARD DATA
  // -----------------------------------------

  useEffect(() => {
    async function loadDashboard() {
      try {
        const now = new Date();

        // Start of today
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        // Start of tomorrow
        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(
          startOfTomorrow.getDate() + 1
        );

        // Same day last week
        const startOfLastWeek = new Date(startOfToday);
        startOfLastWeek.setDate(
          startOfLastWeek.getDate() - 7
        );

        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(
          endOfLastWeek.getDate() + 1
        );

        const [
          productsResponse,
          todaySalesResponse,
          lastWeekSalesResponse,
        ] = await Promise.all([
          fetch("/api/products", {
            cache: "no-store",
          }),

          fetch(
            `/api/sales?from=${encodeURIComponent(
              startOfToday.toISOString()
            )}&to=${encodeURIComponent(
              startOfTomorrow.toISOString()
            )}`,
            {
              cache: "no-store",
            }
          ),

          fetch(
            `/api/sales?from=${encodeURIComponent(
              startOfLastWeek.toISOString()
            )}&to=${encodeURIComponent(
              endOfLastWeek.toISOString()
            )}`,
            {
              cache: "no-store",
            }
          ),
        ]);

        const productsData =
          await productsResponse.json();

        const todaySalesData =
          await todaySalesResponse.json();

        const lastWeekSalesData =
          await lastWeekSalesResponse.json();

        // -----------------------------------------
        // PRODUCTS
        // -----------------------------------------

        setProducts(
          Array.isArray(productsData)
            ? productsData
            : []
        );

        // -----------------------------------------
        // SALES SUMMARIES
        // -----------------------------------------

        const todaySummary =
          todaySalesData.summary ?? {
            totalRevenue: 0,
            totalUnits: 0,
            totalTransactions: 0,
          };

        const lastWeekSummary =
          lastWeekSalesData.summary ?? {
            totalRevenue: 0,
            totalUnits: 0,
            totalTransactions: 0,
          };

        // -----------------------------------------
        // CHANGE CALCULATIONS
        // -----------------------------------------

        function calculateChange(
          current: number,
          previous: number
        ): number | null {
          if (previous === 0) {
            return null;
          }

          return ((current - previous) / previous) * 100;
        }

        const revenueChange =
          calculateChange(
            todaySummary.totalRevenue,
            lastWeekSummary.totalRevenue
          );

        const unitsChange =
          calculateChange(
            todaySummary.totalUnits,
            lastWeekSummary.totalUnits
          );

        // -----------------------------------------
        // UPDATE DASHBOARD SALES STATE
        // -----------------------------------------

        setSalesSummary({
          totalRevenue:
            todaySummary.totalRevenue,

          totalUnits:
            todaySummary.totalUnits,

          totalTransactions:
            todaySummary.totalTransactions,

          thisWeekRevenue:
            todaySummary.totalRevenue,

          lastWeekRevenue:
            lastWeekSummary.totalRevenue,

          thisWeekUnits:
            todaySummary.totalUnits,

          lastWeekUnits:
            lastWeekSummary.totalUnits,

          revenueChange,

          unitsChange,
        });
      } catch (error) {
        console.error(
          "Failed to load dashboard:",
          error
        );
      }
    }

    // Load when dashboard opens
    loadDashboard();

    // Reload whenever user comes back to this tab
    const handleFocus = () => {
      loadDashboard();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, []);

  // -----------------------------------------
  // PAGE
  // -----------------------------------------

  return (
    <main className="dashboard">
      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="logo">
          <span className="logo-mark">S</span>
          <span>StockSense</span>
        </div>

        <nav className="navigation">
          <Link
            className="nav-item active"
            href="/"
          >
            <span>⌂</span>
            Dashboard
          </Link>

          <Link
            className="nav-item"
            href="/products"
          >
            <span>📦</span>
            Products
          </Link>

          <Link
            className="nav-item"
            href="/sales"
          >
            <span>🧾</span>
            Sales
          </Link>

          <Link
            className="nav-item"
            href="/reports"
          >
            <span>📊</span>
            Reports
          </Link>

          <Link
            className="nav-item"
            href="/history"
          >
            <span>🕘</span>
            History
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <Link
            className="nav-item"
            href="/settings"
          >
            <span>⚙️</span>
            Settings
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <section className="main-content">
        {/* HEADER */}

        <header className="topbar">
          <div>
            <p className="eyebrow">
              YOUR BUSINESS
            </p>

            <h1>
              {greeting} 👋
            </h1>
          </div>

          <button className="profile-button">
            {userInitials}
          </button>
        </header>

        {/* OVERVIEW */}

        <section>
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                OVERVIEW
              </p>

              <h2>
                Today&apos;s business
              </h2>
            </div>

            <button className="date-button">
              Today ▾
            </button>
          </div>

          <div className="stats-grid">
            {/* TOTAL SALES */}

            <div className="stat-card">
              <p>Total Sales</p>

              <h3>
                ₦
                {salesSummary.totalRevenue.toLocaleString()}
              </h3>

              <span
                className={
                  salesSummary.revenueChange === null
                    ? "positive"
                    : salesSummary.revenueChange >= 0
                    ? "positive"
                    : "warning"
                }
              >
                <p className="mt-3 text-sm">
                  {salesSummary.revenueChange ===
                  null ? (
                    "New sales vs last week"
                  ) : (
                    <>
                      {salesSummary.revenueChange >=
                      0
                        ? "↑"
                        : "↓"}{" "}
                      {Math.abs(
                        salesSummary.revenueChange
                      ).toFixed(1)}
                      % vs last week
                    </>
                  )}
                </p>
              </span>
            </div>

            {/* PRODUCTS SOLD */}

            <div className="stat-card">
              <p>Products Sold</p>

              <h3>
                {salesSummary.totalUnits}
              </h3>

              <span
                className={
                  salesSummary.unitsChange === null
                    ? "positive"
                    : salesSummary.unitsChange >= 0
                    ? "positive"
                    : "warning"
                }
              >
                <p className="mt-3 text-sm">
                  {salesSummary.unitsChange ===
                  null ? (
                    "New sales vs last week"
                  ) : (
                    <>
                      {salesSummary.unitsChange >=
                      0
                        ? "↑"
                        : "↓"}{" "}
                      {Math.abs(
                        salesSummary.unitsChange
                      ).toFixed(1)}
                      % vs last week
                    </>
                  )}
                </p>
              </span>
            </div>

            {/* LOW STOCK */}

            <div className="stat-card">
              <p>Low Stock</p>

              <h3>
                {lowStockProducts.length}
              </h3>

              <span className="warning">
                Needs attention
              </span>
            </div>

            {/* BEST SELLER */}

            <div className="stat-card">
              <p>Best Seller</p>

              <h3>
                {bestSeller?.name ??
                  "No sales yet"}
              </h3>

              <span>
                {bestSeller
                  ? `${bestSeller.sold} units sold`
                  : "No sales yet"}
              </span>
            </div>
          </div>
        </section>

        {/* ATTENTION */}

        <section className="insights-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                STOCKSENSE
              </p>

              <h2>
                What needs your attention?
              </h2>
            </div>
          </div>

          <div className="insights-grid">
            {/* RESTOCK */}

            <div className="insight-card">
              <div className="insight-icon">
                📦
              </div>

              <div>
                <span className="card-label">
                  RESTOCK SOON
                </span>

                <h3>
                  {restockProduct?.name ??
                    "No products need restocking"}
                </h3>

                <p>
                  {restockProduct
                    ? `Only ${restockProduct.stock} units left.`
                    : "Your current stock levels look good."}
                </p>
              </div>

              <Link
                href={
                  restockProduct
                    ? `/products?id=${restockProduct.id}`
                    : "/products"
                }
                className="font-medium"
              >
                View product →
              </Link>
            </div>

            {/* BEST SELLER */}

            <div className="insight-card">
              <div className="insight-icon">
                🔥
              </div>

              <div>
                <span className="card-label">
                  BEST SELLER
                </span>

                <h3>
                  {bestSeller?.name ??
                    "No sales yet"}
                </h3>

                <p>
                  {bestSeller
                    ? `Your fastest-moving product with ${bestSeller.sold} units sold.`
                    : "Record some sales to discover your best seller."}
                </p>
              </div>

              <Link
                href={
                  bestSeller
                    ? `/sales?productId=${bestSeller.id}`
                    : "/sales"
                }
                className="font-medium"
              >
                View sales →
              </Link>
            </div>

            {/* SLOW MOVING */}

            <div className="insight-card">
              <div className="insight-icon">
                🐌
              </div>

              <div>
                <span className="card-label">
                  SLOW MOVING
                </span>

                <h3>
                  {slowMovingProduct?.name ??
                    "No products yet"}
                </h3>

                <p>
                  {slowMovingProduct
                    ? `${slowMovingProduct.sold} units sold so far.`
                    : "Add products to start tracking sales."}
                </p>
              </div>

              <Link
                href={
                  slowMovingProduct
                    ? `/products?id=${slowMovingProduct.id}`
                    : "/products"
                }
                className="font-medium"
              >
                View product →
              </Link>
            </div>
          </div>
        </section>

        {/* STOCKSENSE INTELLIGENCE */}

        <section className="products-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                STOCKSENSE INTELLIGENCE
              </p>

              <h2>
                What should I stock?
              </h2>
            </div>

            <Link
              href="/products"
              className="font-medium"
            >
              View all products →
            </Link>
          </div>

          {stockRecommendations.length >
          0 ? (
            <div className="insights-grid">
              {stockRecommendations.map(
                (product) => (
                  <div
                    className="insight-card"
                    key={product.id}
                  >
                    <div className="insight-icon">
                      {product.salesPerDay >= 1
                        ? "🔥"
                        : product.salesPerDay >=
                          0.25
                        ? "📈"
                        : "🐌"}
                    </div>

                    <div>
                      <span className="card-label">
                        {product.salesPerDay >=
                        1
                          ? "HIGH DEMAND"
                          : product.salesPerDay >=
                            0.25
                          ? "STEADY DEMAND"
                          : "SLOW MOVING"}
                      </span>

                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        {product.salesPerDay >
                        0
                          ? `Selling about ${product.salesPerDay.toFixed(
                              2
                            )} units per day.`
                          : "Not enough recent sales data."}
                      </p>

                      <p className="mt-2">
                        <strong>
                          Recommended restock:{" "}
                          {
                            product.recommendedRestock
                          }{" "}
                          units
                        </strong>
                      </p>
                    </div>

                    <Link
                      href={`/products?id=${product.id}`}
                      className="font-medium"
                    >
                      View product →
                    </Link>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="font-medium text-gray-900">
                No restocking recommendations
                yet.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Keep recording sales and StockSense
                will identify products worth
                prioritizing.
              </p>
            </div>
          )}
        </section>

        {/* INVENTORY */}

        <section className="products-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                INVENTORY
              </p>

              <h2>
                Products that need attention
              </h2>
            </div>

            <Link
              href="/products"
              className="primary-button"
            >
              + Add Product
            </Link>
          </div>

          <div className="product-table">
            <div className="table-header">
              <span>Product</span>
              <span>Stock</span>
              <span>Sales</span>
              <span>Status</span>
            </div>

            {products.map((product) => (
              <div
                className="table-row"
                key={product.id}
              >
                <span className="product-name">
                  {product.name}
                </span>

                <span>
                  {product.stock} units
                </span>

                <span>
                  {product.sold} sold
                </span>

                <span
                  className={`status ${
                    product.status ===
                    "Restock soon"
                      ? "danger"
                      : product.status ===
                        "Best seller"
                      ? "healthy"
                      : product.status ===
                        "Slow mover"
                      ? "slow"
                      : "healthy"
                  }`}
                >
                  {product.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}