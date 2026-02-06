"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/productlist.module.css";
import { API_URL } from "@/config/api";

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  productName: string;
  category: string; // category id or name
  mrpPrice: number;
  discountedPrice: number;
  brandName: string;
  description: string;
  ingredients: string;
  targetConcerns: string;
  usageInstructions: string;
  netQuantity: string;
  expiryDate: string;
  manufacturerName: string;
  licenseNumber: string;
  packagingType: string;
  productImages: string[];
  productShortVideo: string;
  howToUseVideo: string;
  benefits: string;
  certifications: string;
  gender: string;
  skinHairType: string;
  barcode: string;
  productURL: string;
  createdAt: string;
}

// const API_URL =
//   process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const ListOfProduct: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [filterCategory, setFilterCategory] = useState("all");
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [prodRes, catRes] = await Promise.all([
      fetch(`${API_URL}/products`),
      fetch(`${API_URL}/categories`),
    ]);

    const prodData = await prodRes.json();
    const catData = await catRes.json();

    setProducts(prodData);
    setCategories(catData);
  };

  /* ================= HELPERS ================= */
  const getCategoryName = (id: string) =>
    categories.find((c) => c._id === id)?.name || id;

  /* ================= FILTER + SORT ================= */
  const filteredProducts = useMemo(() => {
    let data = [...products];

    if (search) {
      data = data.filter((p) =>
        p.productName.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterCategory !== "all") {
      data = data.filter((p) => p.category === filterCategory);
    }

    if (sortBy === "name") {
      data.sort((a, b) => a.productName.localeCompare(b.productName));
    } else {
      data.sort((a, b) => a.mrpPrice - b.mrpPrice);
    }

    return data;
  }, [products, search, sortBy, filterCategory]);

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;

    await fetch(`${API_URL}/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Product List</h2>

      {/* ===== CONTROLS ===== */}
      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
        </select>

        <select onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* ===== TABLE ===== */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredProducts.map((p, i) => (
            <tr key={p._id}>
              <td>{i + 1}</td>
              <td>{p.productName}</td>
              <td>{getCategoryName(p.category)}</td>
              <td>₹{p.mrpPrice}</td>
              <td className={styles.actions}>
                <button
                  className={styles.eye}
                  onClick={() => setViewProduct(p)}
                >
                  👁
                </button>
                <button className={styles.edit}>✏️</button>
                <button
                  className={styles.delete}
                  onClick={() => handleDelete(p._id)}
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== VIEW MODAL ===== */}
      {viewProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{viewProduct.productName}</h3>

            <div className={styles.modalGrid}>
              {Object.entries(viewProduct).map(([key, val]) => (
                <div key={key}>
                  <strong>{key}</strong>
                  <p>
                    {Array.isArray(val)
                      ? val.join(", ")
                      : String(val || "-")}
                  </p>
                </div>
              ))}
            </div>

            <button onClick={() => setViewProduct(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListOfProduct;
