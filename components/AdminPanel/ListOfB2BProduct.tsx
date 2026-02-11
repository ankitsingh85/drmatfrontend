"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/productlist.module.css";
import createStyles from "@/styles/Dashboard/createproduct.module.css";
import { API_URL } from "@/config/api";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewProduct, setViewProduct] = useState<B2BProduct | null>(null);

  const [editingProduct, setEditingProduct] = useState<B2BProduct | null>(null);
  const [editForm, setEditForm] = useState<Partial<B2BProduct>>({});
  const [isEditing, setIsEditing] = useState(false);

  const premiumButtonStyle: React.CSSProperties = {
    border: "1px solid #d6d6d6",
    borderRadius: 10,
    padding: "9px 14px",
    background: "linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%)",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0.2,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
    cursor: "pointer",
  };

  const premiumButtonDisabledStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: "not-allowed",
  };

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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / itemsPerPage)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, sortKey, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleDownloadCSV = () => {
    const rows = [
      ["SKU", "Name", "Category", "Brand", "Price", "Stock", "MOQ", "GST"],
      ...filteredProducts.map((p) => [
        p.sku,
        p.productName,
        p.category,
        p.brandName,
        String(p.pricePerUnit || 0),
        String(p.stockAvailable || 0),
        String(p.moq || 0),
        String(p.gst || 0),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "b2b-products.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const printable = window.open("", "_blank");
    if (!printable) {
      alert("Unable to open print window. Please allow popups.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const rows = filteredProducts
      .map(
        (p) => `<tr>
          <td>${escapeHtml(p.sku)}</td>
          <td>${escapeHtml(p.productName)}</td>
          <td>${escapeHtml(p.category)}</td>
          <td>${escapeHtml(p.brandName)}</td>
          <td>Rs ${escapeHtml(String(p.pricePerUnit || 0))}</td>
          <td>${escapeHtml(String(p.stockAvailable || 0))}</td>
          <td>${escapeHtml(String(p.moq || 0))}</td>
          <td>${escapeHtml(String(p.gst || 0))}%</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>B2B Products List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>B2B Products List</h2>
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
                <th>GST</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this B2B product?")) return;
    await fetch(`${API_URL}/b2b-products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  /* ================= EDIT ================= */
  const handleEdit = (product: B2BProduct) => {
    setEditingProduct(product);
    setEditForm({ ...product });
    setIsEditing(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]:
        name === "pricePerUnit" ||
        name === "stockAvailable" ||
        name === "moq" ||
        name === "gst"
          ? value === ""
            ? undefined
            : Number(value)
          : value,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const { _id, createdAt, ...payload } = editForm;

      const res = await fetch(`${API_URL}/b2b-products/${editingProduct._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update B2B product");
      }

      setProducts((prev) => prev.map((p) => (p._id === data._id ? data : p)));
      setIsEditing(false);
      setEditingProduct(null);
      setEditForm({});
      alert("Product updated successfully");
    } catch (error: any) {
      alert(error?.message || "Update failed");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingProduct(null);
    setEditForm({});
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>B2B Products</h1>

      {/* CONTROLS */}
      <div className={styles.controls}>
        <input
          className={styles.search}
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
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}/page
            </option>
          ))}
        </select>
        <button type="button" style={premiumButtonStyle} onClick={handleDownloadCSV}>
          Download CSV
        </button>
        <button type="button" style={premiumButtonStyle} onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>

      {/* TABLE */}
      <table className={styles.table}>
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
            {paginatedProducts.map((p) => (
              <tr key={p._id}>
                <td>{p.sku}</td>
                <td>{p.productName}</td>
                <td>{p.category}</td>
                <td>{p.brandName}</td>
                <td>Rs {p.pricePerUnit || 0}</td>
                <td>{p.stockAvailable || 0}</td>
                <td>{p.moq || 0}</td>
                <td className={styles.actions}>
                  <button className={styles.eye} onClick={() => setViewProduct(p)}>
                    👁
                  </button>
                  <button className={styles.edit} onClick={() => handleEdit(p)}>
                    ✏️
                  </button>
                  <button className={styles.delete} onClick={() => handleDelete(p._id)}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan={8}>No products found.</td>
              </tr>
            )}
          </tbody>
      </table>
      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <p style={{ margin: 0 }}>
          Showing {paginatedProducts.length} of {filteredProducts.length}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            style={{
              ...premiumButtonStyle,
              ...(currentPage === 1 ? premiumButtonDisabledStyle : {}),
            }}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span style={{ alignSelf: "center" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            style={{
              ...premiumButtonStyle,
              ...(currentPage === totalPages ? premiumButtonDisabledStyle : {}),
            }}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* INLINE EDIT FORM */}
      {isEditing && editingProduct && (
        <div className={createStyles.container} style={{ marginTop: 40 }}>
          <h1 className={createStyles.heading}>Edit B2B Product</h1>

          <form className={createStyles.form} onSubmit={handleEditSubmit}>
            <div className={createStyles.section}>
            <label>SKU</label>
            <input
              className={createStyles.input}
              name="sku"
              value={editForm.sku || ""}
              onChange={handleEditChange}
            />

            <label>Product Name</label>
            <input
              className={createStyles.input}
              name="productName"
              value={editForm.productName || ""}
              onChange={handleEditChange}
            />

            <label>Category</label>
            <select
              className={createStyles.input}
              name="category"
              value={editForm.category || ""}
              onChange={handleEditChange}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label>Brand Name</label>
            <input
              className={createStyles.input}
              name="brandName"
              value={editForm.brandName || ""}
              onChange={handleEditChange}
            />

            <label>Price Per Unit</label>
            <input
              className={createStyles.input}
              type="number"
              name="pricePerUnit"
              value={editForm.pricePerUnit ?? ""}
              onChange={handleEditChange}
            />

            <label>Stock Available</label>
            <input
              className={createStyles.input}
              type="number"
              name="stockAvailable"
              value={editForm.stockAvailable ?? ""}
              onChange={handleEditChange}
            />

            <label>MOQ</label>
            <input
              className={createStyles.input}
              type="number"
              name="moq"
              value={editForm.moq ?? ""}
              onChange={handleEditChange}
            />

            <label>GST (%)</label>
            <input
              className={createStyles.input}
              type="number"
              name="gst"
              value={editForm.gst ?? ""}
              onChange={handleEditChange}
            />

            <label>Manufacturer Name</label>
            <input
              className={createStyles.input}
              name="manufacturerName"
              value={editForm.manufacturerName || ""}
              onChange={handleEditChange}
            />

            <label>Certifications</label>
            <input
              className={createStyles.input}
              name="certifications"
              value={editForm.certifications || ""}
              onChange={handleEditChange}
            />

            <label>Description</label>
            <textarea
              className={createStyles.input}
              name="description"
              value={editForm.description || ""}
              onChange={handleEditChange}
            />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className={createStyles.submitBtn}>
                Update Product
              </button>
              <button
                type="button"
                className={createStyles.submitBtn}
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{viewProduct.productName}</h3>
            <div className={styles.modalGrid}>
              <p>
                <b>SKU:</b> {viewProduct.sku}
              </p>
              <p>
                <b>Category:</b> {viewProduct.category}
              </p>
              <p>
                <b>Brand:</b> {viewProduct.brandName}
              </p>
              <p>
                <b>Price:</b> Rs {viewProduct.pricePerUnit || 0}
              </p>
              <p>
                <b>Stock:</b> {viewProduct.stockAvailable || 0}
              </p>
              <p>
                <b>MOQ:</b> {viewProduct.moq || 0}
              </p>
              <p>
                <b>GST:</b> {viewProduct.gst || 0}%
              </p>
            </div>
            <p>
              <b>Description:</b> {viewProduct.description}
            </p>
            <p>
              <b>Manufacturer:</b> {viewProduct.manufacturerName}
            </p>
            <p>
              <b>Certifications:</b> {viewProduct.certifications}
            </p>

            <div className={styles.modalActions}>
              <button onClick={() => setViewProduct(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
