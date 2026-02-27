"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useState } from "react";
import styles from "@/styles/components/homePage/categories.module.css";
import { useRouter } from "next/navigation";
import productImg from "@/public/product1.png";

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  exploreImage?: string;
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
  textBg,
  border,
}) => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [exploreImage, setExploreImage] = useState<string | null>(null);
  const [exploreCategoryName, setExploreCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Convert base64 or fallback image
  const getValidImage = (img?: string) => {
    if (!img) return productImg.src;
    if (img.startsWith("data:")) return img;
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
          exploreImage: cat.exploreImage,
        }));

        // Only first 7 categories for grid (8th tile is reserved for exploration tile - NOT a category)
        setCategories(formatted.slice(0, 7));

        // Find explore image for the 8th tile (navigation only, NOT a category)
        const exploreCat = data.find((cat: any) => cat.exploreImage);
        if (exploreCat?.exploreImage) {
          setExploreImage(exploreCat.exploreImage);
          setExploreCategoryName(exploreCat.name);
        }

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

  const handleExploreClick = () => {
    router.push("/ProductCategoryList");
  };

  if (loading) return <p>Loading categories...</p>;

  return (
    <div
      className={styles.cliniContainer}
      style={{ backgroundColor: backgroundColor || "#f0f0f0" }}
    >
      <h2 className={styles.clinicTitle}>{title}</h2>

      <div className={styles.gridContainer}>
        {/* Render first 7 categories only */}
        {categories.map((category) => (
          <div
            key={category.id}
            className={styles.categoryWrapper}
            onClick={() => handleCategoryClick(category)}
            style={{ cursor: "pointer" }}
          >
            <div
              className={styles.categoryCard}
              style={{ backgroundColor: textBg || undefined, ...(border ? { border } : {}) }}
            >
              <img
                src={getValidImage(category.imageUrl)}
                alt={category.name}
                className={styles.categoryImg}
              />
            </div>
            <p className={styles.categoryLabel}>{category.name}</p>
          </div>
        ))}

        {/* 8th Tile: Exploration tile (NOT a category) - Navigation only to product list page */}
        {exploreImage && (
          <div
            className={styles.categoryWrapper}
            onClick={handleExploreClick}
            style={{ cursor: "pointer" }}
          >
            <div className={`${styles.categoryCard} ${styles.exploreCard}`} style={{ border: "1px solid #999" }}>
              <img
                src={getValidImage(exploreImage)}
                alt={exploreCategoryName || "Explore More"}
                className={styles.categoryImg}
              />
            </div>
            <p className={styles.categoryLabel}>{exploreCategoryName || "Explore More"}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCategory;
