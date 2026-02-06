"use client";

import React, { useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

interface B2BProduct {
  _id: string;
  sku: string;
  productName: string;
  category: string;
  brandName: string;
  pricePerUnit?: number;
  stockAvailable?: number;
  moq?: number;
  description?: string;
  certifications?: string;
  manufacturerName?: string;
  gst?: number;
  createdAt?: string;
}

export default function ListOfB2BProduct() {
  const [products, setProducts] = useState<B2BProduct[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState("name");
  const [viewProduct, setViewProduct] = useState<B2BProduct | null>(null);

  /* ================= FETCH ================= */
  useEffect(() => {
    fetch(`${API_URL}/b2b-products`)
      .then((res) => res.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  /* ================= DERIVED ================= */
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products]
  );

  const filteredProducts = useMemo(() => {
    let data = [...products];

    if (search) {
      data = data.filter(
        (p) =>
          p.productName.toLowerCase().includes(search.toLowerCase()) ||
          p.brandName?.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      data = data.filter((p) => p.category === categoryFilter);
    }

    if (sortKey === "name") {
      data.sort((a, b) => a.productName.localeCompare(b.productName));
    } else if (sortKey === "price") {
      data.sort((a, b) => (a.pricePerUnit || 0) - (b.pricePerUnit || 0));
    } else if (sortKey === "stock") {
      data.sort((a, b) => (a.stockAvailable || 0) - (b.stockAvailable || 0));
    }

    return data;
  }, [products, search, categoryFilter, sortKey]);

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this B2B product?")) return;
    await fetch(`${API_URL}/b2b-products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="container">
      <h1 className="heading">B2B Products</h1>

      {/* CONTROLS */}
      <div className="controls">
        <input
          placeholder="Search by name, brand or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select onChange={(e) => setSortKey(e.target.value)}>
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
          <option value="stock">Sort by Stock</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Stock</th>
              <th>MOQ</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p._id}>
                <td>{p.sku}</td>
                <td>{p.productName}</td>
                <td>{p.category}</td>
                <td>{p.brandName}</td>
                <td>₹{p.pricePerUnit || 0}</td>
                <td>{p.stockAvailable || 0}</td>
                <td>{p.moq || 0}</td>
                <td className="actions">
                  <button onClick={() => setViewProduct(p)}>👁</button>
                  <button onClick={() => handleDelete(p._id)}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      {viewProduct && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>{viewProduct.productName}</h3>
            <p><b>SKU:</b> {viewProduct.sku}</p>
            <p><b>Category:</b> {viewProduct.category}</p>
            <p><b>Brand:</b> {viewProduct.brandName}</p>
            <p><b>Description:</b> {viewProduct.description}</p>
            <p><b>Manufacturer:</b> {viewProduct.manufacturerName}</p>
            <p><b>Certifications:</b> {viewProduct.certifications}</p>
            <p><b>GST:</b> {viewProduct.gst}%</p>

            <button onClick={() => setViewProduct(null)}>Close</button>
          </div>
        </div>
      )}

      {/* INTERNAL CSS */}
      <style jsx>{`
        .container {
          max-width: 1400px;
          margin: 40px auto;
          padding: 40px;
          background: #fff;
          border-radius: 28px;
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.12);
        }

        .heading {
          font-size: 34px;
          font-weight: 900;
          margin-bottom: 30px;
        }

        .controls {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .controls input,
        .controls select {
          padding: 14px 18px;
          border-radius: 14px;
          border: 1px solid #cbd5f5;
          font-size: 14px;
        }

        .tableWrap {
          overflow-x: auto;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f8fafc;
          font-weight: 800;
          text-align: left;
          padding: 16px;
          font-size: 13px;
        }

        td {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
        }

        tr:hover {
          background: #f9fafb;
        }

        .actions button {
          margin-right: 10px;
          font-size: 18px;
          cursor: pointer;
          background: none;
          border: none;
        }

        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal {
          background: white;
          padding: 32px;
          border-radius: 24px;
          max-width: 520px;
          width: 100%;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3);
        }

        .modal h3 {
          margin-bottom: 16px;
        }

        .modal p {
          margin-bottom: 8px;
          font-size: 14px;
        }

        .modal button {
          margin-top: 20px;
          padding: 14px 28px;
          border-radius: 999px;
          background: linear-gradient(180deg, #cfd0fa, #9ebbfd);
          border: none;
          font-weight: 800;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
