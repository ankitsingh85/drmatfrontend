"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/pages/treatmentcategorylist.module.css";
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

const TreatmentCategoryList: React.FC = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiBaseUrl = API_URL.replace(/\/api\/?$/, "");

  const resolveImage = (img?: string) => {
    return resolveMediaUrl(img) || "/skin_hair.jpg";
  };

  const normalizeCategories = (payload: unknown): Category[] => {
    const source = Array.isArray(payload)
      ? payload
      : payload && typeof payload === "object"
        ? (() => {
            const obj = payload as Record<string, unknown>;
            if (Array.isArray(obj.data)) return obj.data;
            if (Array.isArray(obj.categories)) return obj.categories;
            return [];
          })()
        : [];

    return (source as any[])
      .map((cat: any) => ({
        id: String(cat?.id ?? cat?._id ?? "").trim(),
        name: String(cat?.name ?? "").trim(),
        imageUrl: cat?.imageUrl,
      }))
      .filter((cat: Category) => cat.id && cat.name);
  };

  useEffect(() => {
    localStorage.removeItem("selectedTreatmentCategory");
    localStorage.removeItem("selectedTreatmentCategoryId");

    const ac = new AbortController();

    const fetchCategories = async () => {
      try {
        setError("");
        const res = await fetch(`${API_URL}/service-categories`, {
          signal: ac.signal,
        });

        if (!res.ok) {
          throw new Error("Failed to fetch treatment categories");
        }

        const raw = await res.json();
        setCategories(normalizeCategories(raw));
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("Error fetching treatment categories:", err);
          setError("Failed to load treatment categories.");
          setCategories([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    return () => ac.abort();
  }, []);

  const visibleCategories = useMemo(() => categories, [categories]);

  const handleCategoryClick = (category: Category) => {
    localStorage.setItem("selectedTreatmentCategory", JSON.stringify(category));
    localStorage.setItem("selectedTreatmentCategoryId", category.id);
    router.push("/treatment-plans");
  };

  if (loading) return <FullPageLoader />;

  return (
    <>
      <Topbar />
      <div className={styles.cliniContainer}>
        <h2 className={styles.clinicTitle}>All Treatment Categories</h2>

        {error ? (
          <p className={styles.emptyState}>{error}</p>
        ) : visibleCategories.length === 0 ? (
          <p className={styles.emptyState}>No treatment categories found.</p>
        ) : (
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
                <div className={styles.categoryCard}>
                  <img
                    src={resolveImage(category.imageUrl)}
                    alt={category.name}
                    className={styles.categoryImg}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default TreatmentCategoryList;
