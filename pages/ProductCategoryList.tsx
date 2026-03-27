"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/pages/productcategorylist.module.css";
import productImg from "@/public/product1.png";
import { API_URL } from "@/config/api";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl } from "@/lib/media";

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const ProductCategoryList: React.FC = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const extractCategories = (payload: unknown): Category[] => {
    if (Array.isArray(payload)) return payload as Category[];
    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Category[];
      if (Array.isArray(obj.categories)) return obj.categories as Category[];
    }
    return [];
  };

  useEffect(() => {
    localStorage.removeItem("selectedCategory");
    localStorage.removeItem("selectedCategoryId");

    const ac = new AbortController();

    const fetchCategories = async () => {
      try {
        const endpoints = [
          `${API_URL}/categories`,
          "/api/v1/productcategories",
        ];

        let nextCategories: Category[] = [];

        for (const endpoint of endpoints) {
          const res = await fetch(endpoint, { signal: ac.signal });
          if (!res.ok) continue;

          const raw = await res.json();
          const validCategories = extractCategories(raw)
            .map((cat: any) => ({
              id: String(cat.id ?? cat._id ?? "").trim(),
              name: String(cat.name ?? "").trim(),
              imageUrl: cat.imageUrl,
            }))
            .filter((cat: Category) => cat.id && cat.name);

          if (validCategories.length > 0) {
            nextCategories = validCategories;
            break;
          }
        }

        setCategories(nextCategories);
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
    return resolveMediaUrl(img) || productImg.src;
  };

  if (loading) return <FullPageLoader />;

  const handleCategoryClick = (category: Category) => {
    localStorage.setItem("selectedCategory", JSON.stringify(category));
    localStorage.setItem("selectedCategoryId", category.id);
    router.push("/product-listing");
  };

  return (
    <>
      <Topbar />
      <div className={styles.cliniContainer}>
        <h2 className={styles.clinicTitle}>All Product Categories</h2>
        <div className={styles.gridContainer}>
          {categories.map((category) => (
            <div
              key={category.id}
              className={styles.categoryWrapper}
              role="button"
              tabIndex={0}
              onClick={() => handleCategoryClick(category)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleCategoryClick(category);
                }
              }}
            >
              <div className={styles.categoryCard}>
                <img
                  src={getValidImage(category.imageUrl)}
                  alt={category.name}
                  className={styles.categoryImg}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProductCategoryList;
