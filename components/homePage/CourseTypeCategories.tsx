"use client";

import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl } from "@/lib/media";
import productImg from "@/public/product1.png";
import styles from "@/styles/components/homePage/categories.module.css";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

interface CourseTypeCategory {
  id: string;
  name: string;
  imageUrl?: string;
}

interface CourseTypeCategoriesProps {
  title?: string;
  backgroundColor?: string;
  border?: string;
}

// Mirrors B2BProductCategories.tsx exactly — same tile grid, same
// "pick a category, land on the full list pre-filtered" flow, just
// pointed at the Course Type catalog instead of B2B categories.
function CourseTypeCategories({
  title = "Featured Courses",
  backgroundColor = "#fff",
  border,
}: CourseTypeCategoriesProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CourseTypeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const getValidImage = (img?: string) => {
    if (!img) return productImg.src;
    return resolveMediaUrl(img) || productImg.src;
  };

  useEffect(() => {
    const ac = new AbortController();

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/course-types`, {
          signal: ac.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch course types");

        const data = await res.json();
        const rawCategories = Array.isArray(data)
          ? data
          : data?.courseTypes || data?.data || [];

        const formatted: CourseTypeCategory[] = rawCategories
          .map((cat: any) => ({
            id: String(cat.id ?? cat._id ?? "").trim(),
            name: String(cat.name ?? "").trim(),
            imageUrl: cat.imageUrl,
          }))
          .filter((cat: CourseTypeCategory) => cat.id && cat.name);

        setCategories(formatted);
      } catch (err) {
        if ((err as any)?.name !== "AbortError") {
          console.error("Error fetching course types:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    return () => ac.abort();
  }, []);

  const handleCategoryClick = (category: CourseTypeCategory) => {
    localStorage.setItem("selectedCourseType", JSON.stringify(category));
    localStorage.setItem("selectedCourseTypeId", category.id);
    router.push("/courses");
  };

  const handleMoreClick = () => {
    localStorage.removeItem("selectedCourseType");
    localStorage.removeItem("selectedCourseTypeId");
    router.push("/courses");
  };

  if (loading) return <FullPageLoader />;

  const visibleCategories = categories.slice(0, 17);
  const remainingCount = Math.max(
    categories.length - visibleCategories.length,
    0
  );

  return (
    <div className={styles.cliniContainer} style={{ backgroundColor }}>
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

export default CourseTypeCategories;
