"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { API_URL } from "@/config/api";
import styles from "@/styles/components/homePage/categories.module.css";
import FullPageLoader from "@/components/common/FullPageLoader";

interface ServiceCategory {
  _id: string;
  name: string;
  imageUrl: string;
}

interface TreatmentPlansProps {
  limit?: number;
  title?: string;
  backgroundColor?: string;
  border?: string;
}

const TreatmentPlans = ({
  limit = 17,
  title = "Find Best Treatment Plans",
  backgroundColor,
  border,
}: TreatmentPlansProps) => {
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = API_URL.replace(/\/api\/?$/, "");

  const resolveImage = (img?: string) => {
    if (!img) return "/skin_hair.jpg";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    if (img.startsWith("data:")) return img;
    if (img.startsWith("/")) return `${apiBaseUrl}${img}`;
    return `data:image/jpeg;base64,${img}`;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/service-categories`);
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch treatment types:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const displayCategories = useMemo(
    () => categories.slice(0, limit),
    [categories, limit]
  );
  const remainingCount = Math.max(categories.length - displayCategories.length, 0);

  if (loading) return <FullPageLoader />;

  return (
    <div
      className={styles.cliniContainer}
      style={{ backgroundColor: backgroundColor || "#fff" }}
    >
      <h2 className={styles.clinicTitle}>{title}</h2>

      <div className={styles.gridContainer}>
        {displayCategories.map((category) => (
          <div
            key={category._id}
            className={styles.categoryWrapper}
            onClick={() => {
              localStorage.setItem("selectedTreatmentCategoryId", category._id);
              localStorage.setItem(
                "selectedTreatmentCategory",
                JSON.stringify(category)
              );
              router.push("/treatment-plans");
            }}
          >
            <div
              className={styles.categoryCard}
              style={{ borderColor: border || undefined }}
            >
              <img
                src={resolveImage(category.imageUrl)}
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
            onClick={() => {
              localStorage.removeItem("selectedTreatmentCategoryId");
              localStorage.removeItem("selectedTreatmentCategory");
              router.push("/TreatmentCategoryList");
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
};

export default TreatmentPlans;
