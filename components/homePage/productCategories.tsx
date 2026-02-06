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

        // First 7 categories for grid
        setCategories(formatted.slice(0, 7));

        // Find explore image (any category with exploreImage)
        const exploreCat = data.find((cat: any) => cat.exploreImage);
        if (exploreCat?.exploreImage) setExploreImage(exploreCat.exploreImage);

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
        {/* Render first 7 categories */}
        {categories.map((category) => (
          <div
            key={category.id}
            className={styles.categoryCard}
            onClick={() => handleCategoryClick(category)}
            style={{
              cursor: "pointer",
              backgroundColor: textBg || "#D9EBFD",
              border: border || "none",
            }}
          >
            <img
              src={getValidImage(category.imageUrl)}
              alt={category.name}
              className={styles.categoryImg}
            />
            <p className={styles.categoryName}>{category.name}</p>
          </div>
        ))}

        {/* Explore Image as 8th tile */}
        {exploreImage && (
          <div
            className={styles.categoryCard}
            onClick={handleExploreClick}
            style={{
              cursor: "pointer",
              backgroundColor: "#E9F5FF",
              border: border || "none",
            }}
          >
            <img
              src={getValidImage(exploreImage)}
              alt="Explore More"
              className={styles.categoryImg}
            />
            <p className={styles.categoryName}>Explore More</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCategory;
