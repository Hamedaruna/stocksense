"use client";

import { useEffect, useState } from "react";

type HistoryItem = {
  id: number;
  quantity: number;
  type: string;
  createdAt: string;
  product: {
    name: string;
  };
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<"ALL" | "SALE" | "RESTOCK">("ALL");
  const [loading, setLoading] = useState(true);

  // Selected history item
  const [selectedItem, setSelectedItem] =
    useState<HistoryItem | null>(null);

  useEffect(() => {
  async function loadHistory() {
    try {
      setLoading(true);

      const response = await fetch("/api/history", {
        cache: "no-store",
      });

      const data = await response.json();

      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  }

  loadHistory();

  function handleFocus() {
    loadHistory();
  }

  window.addEventListener("focus", handleFocus);

  return () => {
    window.removeEventListener("focus", handleFocus);
  };
}, []);

  const filteredHistory =
    filter === "ALL"
      ? history
      : history.filter((item) => item.type === filter);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
            StockSense
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            History
          </h1>

          <p className="mt-2 text-gray-500">
            See what happened to your products and when.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {(["ALL", "SALE", "RESTOCK"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                filter === option
                  ? "bg-black text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {option === "ALL"
                ? "All"
                : option === "SALE"
                ? "Sales"
                : "Restocks"}
            </button>
          ))}
        </div>

        {/* History */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading history...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No history yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredHistory.map((item) => {
                const isRestock = item.type === "RESTOCK";
                const date = new Date(item.createdAt);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-xl">
                        {isRestock ? "📦" : "💰"}
                      </div>

                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {item.product.name}
                        </h2>

                        <p className="text-sm text-gray-500">
                          {isRestock ? "Restocked" : "Sold"}{" "}
                          {item.quantity}{" "}
                          {item.quantity === 1 ? "unit" : "units"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          isRestock
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {isRestock ? "+" : "-"}
                        {item.quantity}
                      </p>

                      <p className="text-xs text-gray-400">
                        {date.toLocaleDateString()} ·{" "}
                        {date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-gray-400">
                  Transaction details
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {selectedItem.product.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Action */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Action
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {selectedItem.type === "RESTOCK"
                    ? "Restocked"
                    : "Sold"}
                </p>
              </div>

              {/* Quantity */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Quantity
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {selectedItem.quantity}{" "}
                  {selectedItem.quantity === 1
                    ? "unit"
                    : "units"}
                </p>
              </div>

              {/* Stock movement */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Stock movement
                </p>

                <p
                  className={`mt-1 font-semibold ${
                    selectedItem.type === "RESTOCK"
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {selectedItem.type === "RESTOCK"
                    ? "+"
                    : "-"}
                  {selectedItem.quantity} units
                </p>
              </div>

              {/* Date */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Date
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {new Date(
                    selectedItem.createdAt
                  ).toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Time */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Time
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {new Date(
                    selectedItem.createdAt
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="mt-6 w-full rounded-xl bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
}