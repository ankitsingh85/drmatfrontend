"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useState } from "react";
import styles from "@/styles/components/homePage/categories.module.css";
import { useRouter } from "next/navigation";
import productImg from "@/public/product1.png";
import FullPageLoader from "@/components/common/FullPageLoader";

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

interface ProductCategoryProps {
  title: string;
  backgroundColor?: string;
  textBg?: string;
  border?: string;
}

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const ProductCategory: React.FC<ProductCategoryProps> = ({
  title,
  backgroundColor,
  border,
}) => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Convert base64 or fallback image
  const getValidImage = (img?: string) => {
    if (!img) return productImg.src;
    if (img.startsWith("data:")) return img;
    if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/")) return img;
    return `data:image/jpeg;base64,${img}`;
  };

  useEffect(() => {
    const ac = new AbortController();

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/categories`, { signal: ac.signal });
        if (!res.ok) throw new Error("Failed to fetch categories");

        const data: Category[] = await res.json();
        if (!Array.isArray(data)) return;

        // Format categories
        const formatted: Category[] = data.map((cat: any) => ({
          id: cat.id ?? cat._id,
          name: cat.name,
          imageUrl: cat.imageUrl,
        }));

        setCategories(formatted);

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

  const handleCategoryClick = (category: Category) => {
    localStorage.setItem("selectedCategory", JSON.stringify(category));
    router.push("/product-listing");
  };

  const handleMoreClick = () => {
    localStorage.removeItem("selectedCategory");
    localStorage.removeItem("selectedCategoryId");
    router.push("/ProductCategoryList");
  };

  if (loading) return <FullPageLoader />;

  const visibleCategories = categories.slice(0, 17);
  const remainingCount = Math.max(categories.length - visibleCategories.length, 0);

  return (
    <div
      className={styles.cliniContainer}
      style={{ backgroundColor: backgroundColor || "#f0f0f0" }}
    >
      <h2 className={styles.clinicTitle}>{title}</h2>

      <div className={styles.gridContainer}>
        {visibleCategories.map((category) => (
          <div
            key={category.id}
            className={styles.categoryWrapper}
            onClick={() => handleCategoryClick(category)}
          >
            <div
              className={styles.categoryCard}
              style={{ borderColor: border || undefined }}
            >
              <img
                src={getValidImage(category.imageUrl)}
                alt={category.name}
                className={styles.categoryImg}
              />
            </div>
            <div className={styles.categoryLabelBox}>
              <p className={styles.categoryLabel}>{category.name}</p>
            </div>
          </div>
        ))}

        {remainingCount > 0 && (
          <div className={styles.categoryWrapper} onClick={handleMoreClick}>
            <div
              className={`${styles.categoryCard} ${styles.exploreCard}`}
              style={{ borderColor: border || undefined }}
            >
              <div className={styles.exploreCountCard}>
                <span className={styles.exploreCount}>{remainingCount}+</span>
                <span className={styles.exploreCountText}>More Categories</span>
              </div>
            </div>
            <div className={styles.categoryLabelBox}>
              <p className={styles.categoryLabel}>More Categories</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCategory;
