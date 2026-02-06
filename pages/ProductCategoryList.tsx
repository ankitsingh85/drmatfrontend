"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/productcategorylist.module.css";
import productImg from "@/public/product1.png";
import { API_URL } from "@/config/api";

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const ProductCategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/categories`, { signal: ac.signal });
        if (!res.ok) throw new Error("Failed to fetch categories");

        const data: Category[] = await res.json();
        const validCategories = data
          .map((cat: any) => ({
            id: cat.id ?? cat._id,
            name: cat.name,
            imageUrl: cat.imageUrl,
          }))
          .filter((cat: Category) => cat.id && cat.id.trim() !== "");

        setCategories(validCategories);
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("Error fetching categories:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    return () => ac.abort();
  }, []);

  const getValidImage = (img?: string) => {
    if (!img) return productImg.src;
    if (img.startsWith("data:")) return img;
    return `data:image/jpeg;base64,${img}`;
  };

  if (loading) return <p>Loading categories...</p>;

  return (
    <div className={styles.cliniContainer}>
      <h2 className={styles.clinicTitle}>All Categories</h2>
      <div className={styles.gridContainer}>
        {categories.map((category) => (
          <div key={category.id} className={styles.categoryCard}>
            <img
              src={getValidImage(category.imageUrl)}
              alt={category.name}
              className={styles.categoryImg}
            />
            <p className={styles.categoryName}>{category.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCategoryList;
