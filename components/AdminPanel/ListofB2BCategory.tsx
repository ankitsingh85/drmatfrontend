"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useState } from "react";
import styles from "@/styles/Dashboard/listofcliniccategory.module.css";

interface Category {
  _id: string;
  name: string;
  imageUrl: string;
}

// const API_URL =
//   process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

export default function ListofB2BCategory() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await fetch(`${API_URL}/b2b-categories`);
    const data = await res.json();
    setCategories(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;

    await fetch(`${API_URL}/b2b-categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c._id !== id));
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>B2B Category List</h2>

      <input
        className={styles.search}
        placeholder="Search category..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className={styles.table}>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Name</th>
            <th>Image</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((cat, index) => (
            <tr key={cat._id}>
              <td>{index + 1}</td>
              <td>{cat.name}</td>
              <td>
                <img src={cat.imageUrl} className={styles.image} />
              </td>
              <td>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(cat._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={4} className={styles.empty}>
                No categories found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
