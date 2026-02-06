"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useState } from "react";
import styles from "@/styles/components/homePage/categories.module.css";
import { useRouter } from "next/router";

interface ClinicCategory {
  _id: string;
  name: string;
  imageUrl: string;
  exploreImage?: string;
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
  textBg,
  border,
}) => {
  const router = useRouter();
  const [categories, setCategories] = useState<ClinicCategory[]>([]);
  const [exploreImage, setExploreImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch(`${API_URL}/clinic-categories`);
      const data: ClinicCategory[] = await res.json();
      setCategories(data);

      const exploreCat = data.find((c) => c.exploreImage);
      if (exploreCat?.exploreImage) {
        setExploreImage(exploreCat.exploreImage);
      }

      setLoading(false);
    };

    fetchCategories();
  }, []);

  if (loading) return <p>Loading...</p>;

  const displayCategories = categories.slice(0, 17);

  return (
    <div
      className={styles.cliniContainer}
      style={{ backgroundColor: backgroundColor || "#fff" }}
    >
      <h2 className={styles.clinicTitle}>{title}</h2>

      <div className={styles.gridContainer}>
        {displayCategories.map((category, index) => (
          <div
            key={category._id}
            className={styles.categoryWrapper}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() =>
              router.push(`/home/findClinicsPage?category=${category._id}`)
            }
          >
            {/* IMAGE CARD */}
            <div className={styles.categoryCard}>
              <img
                src={category.imageUrl}
                alt={category.name}
                className={styles.categoryImg}
              />
            </div>

            {/* TEXT BELOW */}
            <p className={styles.categoryLabel}>{category.name}</p>
          </div>
        ))}

        {/* 🔥 EXPLORE MORE (18th TILE) */}
        <div
          className={styles.categoryWrapper}
          onClick={() => router.push("/ClinicCategoryList")}
        >
          <div className={`${styles.categoryCard} ${styles.exploreCard}`}>
            {exploreImage && (
              <img
                src={exploreImage}
                alt="Explore More"
                className={styles.categoryImg}
              />
            )}
          </div>

          <p className={styles.categoryLabel}>Explore More</p>
        </div>
      </div>
    </div>
  );
};

export default ClinicCategories;
