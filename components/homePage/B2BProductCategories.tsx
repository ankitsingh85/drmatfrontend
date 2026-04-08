"use client";

import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl } from "@/lib/media";
import productImg from "@/public/product1.png";
import styles from "@/styles/components/homePage/categories.module.css";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

interface B2BProductCategoriesProps {
  title?: string;
  backgroundColor?: string;
  border?: string;
}

function B2BProductCategories({
  title = "B2B Product Categories",
  backgroundColor = "#fff",
  border,
}: B2BProductCategoriesProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const getValidImage = (img?: string) => {
    if (!img) return productImg.src;
    return resolveMediaUrl(img) || productImg.src;
  };

  useEffect(() => {
    const ac = new AbortController();

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/b2b-categories`, {
          signal: ac.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch B2B categories");

        const data = await res.json();
        const rawCategories = Array.isArray(data)
          ? data
          : data?.categories || data?.data || [];

        const formatted: Category[] = rawCategories
          .map((cat: any) => ({
            id: String(cat.id ?? cat._id ?? "").trim(),
            name: String(cat.name ?? "").trim(),
            imageUrl: cat.imageUrl,
          }))
          .filter((cat: Category) => cat.id && cat.name);

        setCategories(formatted);
      } catch (err) {
        if ((err as any)?.name !== "AbortError") {
          console.error("Error fetching B2B categories:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    return () => ac.abort();
  }, []);

  const handleCategoryClick = (category: Category) => {
    localStorage.setItem("selectedB2BCategory", JSON.stringify(category));
    localStorage.setItem("selectedB2BCategoryId", category.id);
    router.push("/home/B2bProductsList");
  };

  const handleMoreClick = () => {
    localStorage.removeItem("selectedB2BCategory");
    localStorage.removeItem("selectedB2BCategoryId");
    router.push("/home/B2bProductsList");
  };

  if (loading) return <FullPageLoader />;

  const visibleCategories = categories.slice(0, 17);
  const remainingCount = Math.max(
    categories.length - visibleCategories.length,
    0
  );

  return (
    <div
      className={styles.cliniContainer}
      style={{ backgroundColor }}
    >
      <h2 className={styles.clinicTitle}>{title}</h2>

      <div className={styles.gridContainer}>
        {visibleCategories.map((category) => (
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
          <div
            className={styles.categoryWrapper}
            role="button"
            tabIndex={0}
            onClick={handleMoreClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleMoreClick();
              }
            }}
          >
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
}

export default B2BProductCategories;
