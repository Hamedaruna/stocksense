"use client";

import { useEffect, useState } from "react";

type ProductPerformance = {
  productId: number;
  name: string;
  quantitySold: number;
  revenue: number;
};

type Report = {
  totalRevenue: number;
  totalUnits: number;
  totalTransactions: number;
};

type Period = "TODAY" | "WEEK" | "MONTH" | "ALL";

export default function ReportsPage() {
  const [report, setReport] = useState<Report>({
    totalRevenue: 0,
    totalUnits: 0,
    totalTransactions: 0,
  });

  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [period, setPeriod] = useState<Period>("TODAY");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);

        const now = new Date();

        let from: Date | null = null;
        let to: Date | null = null;

        if (period === "TODAY") {
          from = new Date();
          from.setHours(0, 0, 0, 0);

          to = new Date();
        }

        if (period === "WEEK") {
          from = new Date();
          from.setDate(from.getDate() - 6);
          from.setHours(0, 0, 0, 0);

          to = new Date();
        }

        if (period === "MONTH") {
          from = new Date();
          from.setDate(1);
          from.setHours(0, 0, 0, 0);

          to = new Date();
        }

        const params = new URLSearchParams();

        if (from) {
          params.set("from", from.toISOString());
        }

        if (to) {
          params.set("to", to.toISOString());
        }

        const response = await fetch(
          `/api/sales?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load reports");
        }

        const data = await response.json();

        setReport(
          data.summary ?? {
            totalRevenue: 0,
            totalUnits: 0,
            totalTransactions: 0,
          }
        );

        setTopProducts(
          Array.isArray(data.topProducts)
            ? data.topProducts
            : []
        );
      } catch (error) {
        console.error("Failed to load reports:", error);

        setReport({
          totalRevenue: 0,
          totalUnits: 0,
          totalTransactions: 0,
        });

        setTopProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadReports();

    function handleFocus() {
      loadReports();
    }

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [period]);

  const periodLabel =
    period === "TODAY"
      ? "Today"
      : period === "WEEK"
      ? "This Week"
      : period === "MONTH"
      ? "This Month"
      : "All Time";

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

        <div>
          <p className="text-sm font-medium tracking-widest text-gray-500">
            STOCKSENSE
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-gray-900">
            Reports
          </h1>

          <p className="mt-2 text-gray-500">
            Understand your business performance.
          </p>
        </div>

        <div>
          <select
            value={period}
            onChange={(e) =>
              setPeriod(e.target.value as Period)
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:border-black"
          >
            <option value="TODAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
            <option value="ALL">All Time</option>
          </select>
        </div>

      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Total Revenue
          </p>

          <h2 className="mt-2 text-3xl font-semibold text-gray-900">
            ₦{report.totalRevenue.toLocaleString()}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {periodLabel}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Units Sold
          </p>

          <h2 className="mt-2 text-3xl font-semibold text-gray-900">
            {report.totalUnits}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Units sold during {periodLabel.toLowerCase()}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Transactions
          </p>

          <h2 className="mt-2 text-3xl font-semibold text-gray-900">
            {report.totalTransactions}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Recorded sales
          </p>
        </div>

      </div>

      {/* Sales Performance */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">

        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Sales Performance
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            A summary of your sales activity for {periodLabel.toLowerCase()}.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">

          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Revenue
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              ₦{report.totalRevenue.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Units Sold
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {report.totalUnits}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Transactions
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {report.totalTransactions}
            </p>
          </div>

        </div>

        <div className="mt-6 rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">
            Average sale value
          </p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            ₦
            {report.totalTransactions > 0
              ? Math.round(
                  report.totalRevenue /
                    report.totalTransactions
                ).toLocaleString()
              : "0"}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Average revenue generated per transaction.
          </p>
        </div>

      </div>

      {/* Product Performance */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">

        <div className="border-b border-gray-200 p-6">

          <h2 className="text-xl font-semibold text-gray-900">
            Product Performance
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            See which products are driving your sales.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[650px]">

            <thead className="bg-gray-50">

              <tr className="text-left text-sm text-gray-500">

                <th className="px-6 py-4 font-medium">
                  Product
                </th>

                <th className="px-6 py-4 font-medium">
                  Units Sold
                </th>

                <th className="px-6 py-4 font-medium">
                  Revenue
                </th>

                <th className="px-6 py-4 font-medium">
                  Performance
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    Loading reports...
                  </td>
                </tr>
              ) : topProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      No sales data
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Record a sale to start seeing product performance.
                    </p>
                  </td>
                </tr>
              ) : (
                topProducts.map((product, index) => (

                  <tr
                    key={product.productId}
                    className="border-t border-gray-100 text-sm"
                  >

                    <td className="px-6 py-5 font-medium text-gray-900">
                      {product.name}
                    </td>

                    <td className="px-6 py-5 text-gray-700">
                      {product.quantitySold}
                    </td>

                    <td className="px-6 py-5 text-gray-700">
                      ₦{product.revenue.toLocaleString()}
                    </td>

                    <td className="px-6 py-5">

                      {index === 0 ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          Best Seller
                        </span>
                      ) : product.quantitySold <= 1 ? (
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                          Slow Moving
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          Selling
                        </span>
                      )}

                    </td>

                  </tr>

                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

    </main>
  );
}