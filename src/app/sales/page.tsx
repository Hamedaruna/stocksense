"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Sale = {
  id: number;
  product: {
    id: number;
    name: string;
  };
  quantity: number;
  price: number;
  total: number;
};

function SalesPageContent() {
  const searchParams = useSearchParams();

const focusProductId = Number(
  searchParams.get("productId")
);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [summary, setSummary] = useState({
  totalRevenue: 0,
  totalUnits: 0,
  totalTransactions: 0,
});
  
  useEffect(() => {
  fetch("/api/products")
    .then((response) => response.json())
    .then((data) => {
      setProducts(Array.isArray(data) ? data : []);
    })
    .catch((error) => {
      console.error("Failed to load products:", error);
      setProducts([]);
    });
}, []);

useEffect(() => {
  fetch("/api/sales")
    .then((response) => response.json())
    .then((data) => {
      setSales(Array.isArray(data.sales) ? data.sales : []);

      setSummary(
        data.summary ?? {
          totalRevenue: 0,
          totalUnits: 0,
          totalTransactions: 0,
        }
      );
    })
    .catch((error) => {
      console.error("Failed to load sales:", error);
      setSales([]);

      setSummary({
        totalRevenue: 0,
        totalUnits: 0,
        totalTransactions: 0,
      });
    });
}, []);

useEffect(() => {
  if (!focusProductId || sales.length === 0) {
    return;
  }

  const matchingSale = sales.find(
    (sale) => sale.product.id === focusProductId
  );

  if (!matchingSale) {
    return;
  }

  const element = document.getElementById(
    `sale-${matchingSale.id}`
  );

  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}, [focusProductId, sales]);


  async function recordSale(e: React.FormEvent) {
  e.preventDefault();

  const productId = Number(selectedProduct);
  const saleQuantity = Number(quantity);

  if (!productId || !saleQuantity || saleQuantity <= 0) {
    return;
  }

  try {
    const response = await fetch("/api/sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        quantity: saleQuantity,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to record sale");
      return;
    }

    setSales((currentSales) => [data, ...currentSales]);

    const updatedResponse = await fetch("/api/sales");
    const updatedData = await updatedResponse.json();

    setSummary(
    updatedData.summary ?? {
    totalRevenue: 0,
    totalUnits: 0,
    totalTransactions: 0,
   }
  );

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              stock: product.stock - saleQuantity,
            }
          : product
      )
    );

    setSelectedProduct("");
    setQuantity("");
  } catch (error) {
    console.error("Failed to record sale:", error);
  }
}


async function deleteSale(id: number) {
  try {
    const response = await fetch("/api/sales", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to delete sale");
      return;
    }

    // Remove ONLY the deleted sale from the table
    setSales((currentSales) =>
      currentSales.filter((sale) => sale.id !== id)
    );

    // Get the updated summary
    const updatedResponse = await fetch("/api/sales");
    const updatedData = await updatedResponse.json();

    setSummary(
      updatedData.summary ?? {
        totalRevenue: 0,
        totalUnits: 0,
        totalTransactions: 0,
      }
    );

    // Refresh products so restored stock appears immediately
    const productsResponse = await fetch("/api/products");
    const productsData = await productsResponse.json();

    if (Array.isArray(productsData)) {
      setProducts(productsData);
    }
  } catch (error) {
    console.error("Failed to delete sale:", error);
    alert("Failed to delete sale");
  }
}


  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">

  <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
  <h2 className="text-xl font-semibold text-gray-900">
    Record a Sale
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Select a product and enter how many units were sold.
  </p>

<form
  onSubmit={recordSale}
  className="mt-6 grid gap-4 md:grid-cols-3"
>
  <div>
    <label className="mb-2 block text-sm font-medium text-gray-700">
      Product
    </label>

    <select
      value={selectedProduct}
      onChange={(e) => setSelectedProduct(e.target.value)}
      className="w-full rounded-xl border border-gray-300 px-4 py-3"
      required
    >
      <option value="">Select product</option>

      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name} — {product.stock} in stock
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="mb-2 block text-sm font-medium text-gray-700">
      Quantity sold
    </label>

    <input
      type="number"
      min="1"
      value={quantity}
      onChange={(e) => setQuantity(e.target.value)}
      placeholder="e.g. 5"
      className="w-full rounded-xl border border-gray-300 px-4 py-3"
      required
    />
  </div>

  <div className="flex items-end">
    <button
      type="submit"
      className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white"
    >
      Record Sale
    </button>
     </div>
     </form>
        </div>
    

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            Total revenue
          </p>

          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ₦{summary.totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            Units sold
          </p>

          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {summary.totalUnits}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            Transactions
          </p>

          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {summary.totalTransactions}
          </p>
        </div>

      </div>

      {/* Sales Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-200 p-6">

          <h2 className="text-xl font-semibold text-gray-900">
            Recent sales
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Your latest recorded transactions.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[700px]">

            <thead className="bg-gray-50">

              <tr className="text-left text-sm text-gray-500">

                <th className="px-6 py-4 font-medium">
                  Product
                </th>

                <th className="px-6 py-4 font-medium">
                  Quantity
                </th>

                <th className="px-6 py-4 font-medium">
                  Price
                </th>

                <th className="px-6 py-4 font-medium">
                  Total
                </th>

                <th className="px-6 py-4 font-medium">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {sales.map((sale) => (

                <tr
                  id={`sale-${sale.id}`}
                  key={sale.id}
                  className={`border-t border-gray-100 text-sm transition-colors ${
                  sale.product.id === focusProductId
                   ? "bg-yellow-50"
                   : ""
                  }`}
                >

                  <td className="px-6 py-5 font-medium text-gray-900">
                    {sale.product.name}
                  </td>

                  <td className="px-6 py-5 text-gray-700">
                    {sale.quantity}
                  </td>

                  <td className="px-6 py-5 text-gray-700">
                    ₦{sale.price.toLocaleString()}
                  </td>

                  <td className="px-6 py-5 font-semibold text-gray-900">
                    ₦{sale.total.toLocaleString()}
                  </td>

                  <td className="px-6 py-5">

                    <button
                      onClick={() => deleteSale(sale.id)}
                      className="font-medium text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </main>
  );
}
export default function SalesPage() {
  return (
    <Suspense fallback={<div>Loading sales...</div>}>
      <SalesPageContent />
    </Suspense>
  );
}