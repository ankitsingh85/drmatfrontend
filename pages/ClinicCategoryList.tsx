"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/cliniccategorylist.module.css";

interface ClinicCategory {
  _id: string;
  categoryId: string;
  name: string;
  imageUrl: string;
}

// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const ClinicCategoryList: React.FC = () => {
  const [categories, setCategories] = useState<ClinicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/clinic-categories`);
        const data = await res.json();

        // 🔥 SAFE HANDLING (array or wrapped response)
        setCategories(Array.isArray(data) ? data : data.categories || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError("Failed to load clinic categories.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return <p className={styles.loading}>Loading clinic categories…</p>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Clinic Categories</h1>

      {error && <p className={styles.error}>{error}</p>}

      {categories.length === 0 ? (
        <p className={styles.empty}>No clinic categories found.</p>
      ) : (
        <div className={styles.grid}>
          {categories.map((cat) => (
            <div key={cat._id} className={styles.card}>
              <div className={styles.imageWrapper}>
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className={styles.image}
                />
              </div>

              <div className={styles.content}>
                <h3 className={styles.name}>{cat.name}</h3>
                <span className={styles.badge}>{cat.categoryId}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicCategoryList;
