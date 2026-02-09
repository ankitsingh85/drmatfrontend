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
  const [viewProduct, setViewProduct] = useState<B2BProduct | null>(null);

  const [editingProduct, setEditingProduct] = useState<B2BProduct | null>(null);
  const [editForm, setEditForm] = useState<Partial<B2BProduct>>({});
  const [isEditing, setIsEditing] = useState(false);

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
            {filteredProducts.map((p) => (
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
          </tbody>
      </table>

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
