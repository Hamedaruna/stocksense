"use client";


import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sold: number;
  status: string;
  recentSales: number;
  salesPerDay: number;
  estimatedDaysRemaining: number | null;
  recommendedRestock: number;
  recommendation: string;
  lowStockLimit: number;
  
};

function ProductsPageContent() {
const searchParams = useSearchParams();
const [products, setProducts] = useState<Product[]>([]);
const [highlightedProductId, setHighlightedProductId] = useState<number | null>(null);

const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("all");
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
  const productId = Number(searchParams.get("id"));

  if (productId) {
    setHighlightedProductId(productId);
  } else {
    setHighlightedProductId(null);
  }
}, [searchParams]);

useEffect(() => {
  if (!highlightedProductId || products.length === 0) {
    return;
  }

  const timer = setTimeout(() => {
    const productElement = document.getElementById(
      `product-${highlightedProductId}`
    );

    if (productElement) {
      productElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, 100);

  return () => clearTimeout(timer);
}, [highlightedProductId, products]);


const filteredProducts = products.filter((product) => {
  const matchesSearch =
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesStatus =
    statusFilter === "all" ||
    product.status.toLowerCase() === statusFilter.toLowerCase();

  return matchesSearch && matchesStatus;
});

const [showForm, setShowForm] = useState(false);

const [name, setName] = useState("");
const [category, setCategory] = useState("");
const [price, setPrice] = useState("");
const [stock, setStock] = useState("");

const [restockProduct, setRestockProduct] = useState<Product | null>(null);
const [restockQuantity, setRestockQuantity] = useState("");

  async function addProduct(e: React.FormEvent) {
  e.preventDefault();

  if (!name || !category || !price || !stock) return;

  try {
    const response = await fetch("/api/products", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name,
    category,
    price: Number(price),
    stock: Number(stock),
  }),
});

const data = await response.json();

if (!response.ok) {
  alert(data.error || "Failed to add product.");
  return;
}

const updatedResponse = await fetch("/api/products", {
  cache: "no-store",
});

const updatedProducts = await updatedResponse.json();

setProducts(updatedProducts);

if (Array.isArray(updatedProducts)) {
  setProducts(updatedProducts);
}
    setName("");
    setCategory("");
    setPrice("");
    setStock("");
    setShowForm(false);
  } catch (error) {
    console.error("Failed to add product:", error);
  }
}

async function restockProductHandler(id: number) {
  const quantity = Number(restockQuantity);

  if (!quantity || quantity <= 0) {
    alert("Enter a valid restock quantity.");
    return;
  }

  try {
    const response = await fetch("/api/products", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        quantity,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to restock product");
      return;
    }

    const updatedResponse = await fetch("/api/products");
    const updatedProducts = await updatedResponse.json();

    if (Array.isArray(updatedProducts)) {
      setProducts(updatedProducts);
    }

    setRestockProduct(null);
    setRestockQuantity("");
  } catch (error) {
    console.error("Failed to restock product:", error);
    alert("Failed to restock product");
  }
}

async function deleteProduct(id: number) {
  try {
    const response = await fetch("/api/products", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
  const errorData = await response.json();

  alert(errorData.error || "Failed to delete product");

  return;
}

    setProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== id)
    );
  } catch (error) {
    console.error("Failed to delete product:", error);
  }
}



  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-gray-500">
            StockSense
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-gray-900">
            Products
          </h1>

          <p className="mt-2 text-gray-500">
            Manage your products and keep track of what is selling.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800"
        >
          + Add Product
        </button>
      </div>

      {/* Add Product Form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Add a new product
          </h2>

          <form
            onSubmit={addProduct}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Product name
              </label>

              <input
                type="text"
                placeholder="e.g. Milo 500g"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Category
              </label>

              <input
                type="text"
                placeholder="e.g. Food"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Selling price (₦)
              </label>

              <input
                type="number"
                placeholder="e.g. 1500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Current stock
              </label>

              <input
                type="number"
                placeholder="e.g. 50"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div className="flex gap-3 md:col-span-2">
              <button
                type="submit"
                className="rounded-xl bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
              >
                Add Product
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

            

      {/* Restock Product Form */}
      {restockProduct && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Restock {restockProduct.name}
          </h2>

          <p className="mb-5 text-sm text-gray-500">
            Current stock: {restockProduct.stock} units
          </p>

          <div className="max-w-md">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Quantity received
            </label>

            <input
              type="number"
              min="1"
              value={restockQuantity}
              onChange={(e) => setRestockQuantity(e.target.value)}
              placeholder="e.g. 30"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  restockProductHandler(restockProduct.id)
                }
                className="rounded-xl bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
              >
                Restock Product
              </button>

              <button
                type="button"
                onClick={() => {
                  setRestockProduct(null);
                  setRestockQuantity("");
                }}
                className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Summary */}

      {/* Product Summary */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total products</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {products.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total units in stock</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {products.reduce(
             (total, product) => total + (Number(product.stock) || 0),
             0
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Units sold</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {products.reduce(
  (total, product) => total + (Number(product.sold) || 0),
  0
)}
          </p>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Your products
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            See your current stock and sales performance.
          </p>

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black md:max-w-md"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-black"
          >
            <option value="all">All products</option>
            <option value="best seller">Best sellers</option>
            <option value="selling well">Selling well</option>
            <option value="slow mover">Slow movers</option>
            <option value="restock soon">Restock soon</option>
            <option value="no sales yet">No sales yet</option>
          </select>
        </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-500">
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Sold</th>
                <th className="px-6 py-4 font-medium">Stock runway</th>
                <th className="px-6 py-4 font-medium">Restock recommendation</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
                <tr
                key={product.id}
                 id={`product-${product.id}`}
                 className={`border-t border-gray-100 text-sm transition ${
                 highlightedProductId === product.id
                    ? "bg-yellow-50"
                     : ""
                 }`}
                  >
                  <td className="px-6 py-5 font-medium text-gray-900">
                    {product.name}
                  </td>

                  <td className="px-6 py-5 text-gray-500">
                    {product.category}
                  </td>

                  <td className="px-6 py-5 text-gray-900">
                    ₦{product.price.toLocaleString()}
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={
                        product.stock <= 10
                          ? "font-medium text-orange-600"
                          : "text-gray-700"
                      }
                    >
                      {product.stock}
                    </span>

                    {product.stock <= 10 && (
                      <span className="ml-2 rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-600">
                        Low stock
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-5 font-medium text-gray-900">
                  {product.sold}
                  </td>

                  <td className="px-6 py-5">
                  {product.estimatedDaysRemaining !== null ? (
                  <div>
                  <p className="font-medium text-gray-900">
                  ~{product.estimatedDaysRemaining} days
                  </p>

                 <p className="text-xs text-gray-500">
                     {product.salesPerDay.toFixed(2)} units/day
                 </p>
                  </div>
                     ) : (
                  <span className="text-gray-400">
                      Not enough data
                  </span>
                   )}
                  </td>

                  <td className="px-6 py-5">
  {product.recentSales <= 0 ? (
    <div>
      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
        🆕 No sales data
      </span>

      <p className="mt-2 text-sm text-gray-500">
        Start recording sales to get recommendations.
      </p>
    </div>
  ) : product.salesPerDay >= 1 ? (
    <div>
      <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
        🔥 High demand
      </span>

      <p className="mt-2 text-sm font-medium text-gray-900">
        {product.recommendedRestock > 0
          ? `Restock ${product.recommendedRestock} units`
          : "Stock level looks healthy."}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Selling about {product.salesPerDay.toFixed(2)} units/day.
      </p>
    </div>
  ) : product.salesPerDay >= 0.25 ? (
    <div>
      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
        📈 Steady demand
      </span>

      <p className="mt-2 text-sm font-medium text-gray-900">
        {product.recommendedRestock > 0
          ? `Restock ${product.recommendedRestock} units`
          : "Stock level looks healthy."}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Selling about {product.salesPerDay.toFixed(2)} units/day.
      </p>
    </div>
  ) : (
    <div>
      <span className="inline-flex rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-600">
        🐌 Slow moving
      </span>

      <p className="mt-2 text-sm font-medium text-gray-900">
        {product.recommendedRestock > 0
          ? `Restock only ${product.recommendedRestock} units`
          : "Avoid heavy restocking."}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Selling about {product.salesPerDay.toFixed(2)} units/day.
      </p>
    </div>
  )}
</td>

<td className="px-6 py-5">
  {product.stock <= product.lowStockLimit &&
  product.estimatedDaysRemaining !== null &&
  product.estimatedDaysRemaining > 60 ? (
    <div>
      <span className="inline-flex rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-600">
        ⚠️ Low stock
      </span>

      <p className="mt-2 text-sm text-gray-600">
        No urgent restock needed.
      </p>
    </div>
  ) : (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        product.status === "Restock soon"
          ? "bg-red-50 text-red-600"
          : product.status === "Best seller"
          ? "bg-green-50 text-green-600"
          : product.status === "Slow mover"
          ? "bg-yellow-50 text-yellow-600"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      {product.status}
    </span>
  )}
</td>
                <td className="px-6 py-5">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setRestockProduct(product);
                        setRestockQuantity("");
                      }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Restock
                    </button>

                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="text-sm font-medium text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
                </tr>
              ))}
               {products.length > 0 && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-gray-900">
                      No products found
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Try a different search or filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading products...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}