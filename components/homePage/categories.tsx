"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useState } from "react";
import styles from "@/styles/components/homePage/categories.module.css";
import { useRouter } from "next/router";

interface ClinicCategory {
  _id: string;
  name: string;
  imageUrl: string;
}

interface ClinicCategoryProps {
  title: string;
  backgroundColor?: string;
  textBg?: string;
  border?: string;
}

// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const ClinicCategories: React.FC<ClinicCategoryProps> = ({
  title,
  backgroundColor,
  border,
}) => {
  const router = useRouter();
  const [categories, setCategories] = useState<ClinicCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch(`${API_URL}/clinic-categories`);
      const data: ClinicCategory[] = await res.json();
      setCategories(data);

      setLoading(false);
    };

    fetchCategories();
  }, []);

  if (loading) return <p>Loading...</p>;

  const displayCategories = categories.slice(0, 17);
  const remainingCount = Math.max(categories.length - displayCategories.length, 0);

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
            onClick={() =>
              router.push(`/home/findClinicsPage?category=${category._id}`)
            }
          >
            <div
              className={styles.categoryCard}
              style={{ borderColor: border || undefined }}
            >
              <img
                src={category.imageUrl}
                alt={category.name}
                className={styles.categoryImg}
              />
            </div>
          </div>
        ))}

        {remainingCount > 0 && (
          <div
            className={styles.categoryWrapper}
            onClick={() => router.push("/ClinicCategoryList")}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicCategories;
