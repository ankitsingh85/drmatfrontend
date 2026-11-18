"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import productImg from "@/public/product1.png";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import TraningWorkshop from "@/pages/home/TraningWorkshop";
import styles from "@/styles/ProductList.module.css";

interface TrainingTypeCategory {
  id: string;
  name: string;
  imageUrl?: string;
}

interface StoredTrainingType {
  id?: string;
  _id?: string;
  name?: string;
}

// Hybrid sidebar + grid page — same pattern as home/B2bProductsList.tsx:
// shows every training type as a sidebar tile, the grid is just
// TraningWorkshop filtered to whichever type is selected (or "All").
export default function WorkshopTrainingsPage() {
  const [categories, setCategories] = useState<TrainingTypeCategory[]>([]);
  const [selectedTypeName, setSelectedTypeName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getImage = (img?: string) => {
    if (!img) return productImg.src;
    return resolveMediaUrl(img) || productImg.src;
  };

  useEffect(() => {
    const ac = new AbortController();

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/training-types`, { signal: ac.signal });
        if (!res.ok) throw new Error("Failed to fetch training types");

        const data = await res.json();
        const rawCategories = Array.isArray(data) ? data : data?.trainingTypes || data?.data || [];

        const formatted: TrainingTypeCategory[] = rawCategories
          .map((cat: any) => ({
            id: String(cat.id ?? cat._id ?? "").trim(),
            name: String(cat.name ?? "").trim(),
            imageUrl: cat.imageUrl,
          }))
          .filter((cat: TrainingTypeCategory) => cat.id && cat.name);

        setCategories(formatted);

        const stored = localStorage.getItem("selectedTrainingType");
        if (stored) {
          try {
            const parsed: StoredTrainingType = JSON.parse(stored);
            if (parsed?.name) {
              const match = formatted.find(
                (cat) => cat.name.toLowerCase() === parsed.name?.toLowerCase()
              );
              if (match) setSelectedTypeName(match.name);
            }
          } catch (error) {
            console.error("Invalid selectedTrainingType in localStorage:", error);
          }
        }
      } catch (err) {
        if ((err as any)?.name !== "AbortError") {
          console.error("Error fetching training types:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    return () => ac.abort();
  }, []);

  const handleCategoryClick = (category: TrainingTypeCategory | null) => {
    if (!category) {
      setSelectedTypeName(null);
      localStorage.removeItem("selectedTrainingType");
      localStorage.removeItem("selectedTrainingTypeId");
      return;
    }

    setSelectedTypeName(category.name);
    localStorage.setItem("selectedTrainingType", JSON.stringify(category));
    localStorage.setItem("selectedTrainingTypeId", category.id);
  };

  return (
    <>
      <Topbar />
      <section className={styles.shopSection}>
        <div className={styles.layoutWrapper}>
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Training Types</h3>

            <div
              className={`${styles.sidebarCard} ${!selectedTypeName ? styles.activeCategory : ""}`}
              onClick={() => handleCategoryClick(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleCategoryClick(null);
                }
              }}
            >
              <img src={productImg.src} alt="All" className={styles.sidebarImage} />
              <p className={styles.sidebarName}>All</p>
            </div>

            {!loading &&
              categories.map((category) => (
                <div
                  key={category.id}
                  className={`${styles.sidebarCard} ${
                    selectedTypeName?.toLowerCase() === category.name.toLowerCase()
                      ? styles.activeCategory
                      : ""
                  }`}
                  onClick={() => handleCategoryClick(category)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleCategoryClick(category);
                    }
                  }}
                >
                  <img src={getImage(category.imageUrl)} alt={category.name} className={styles.sidebarImage} />
                  <p className={styles.sidebarName}>{category.name}</p>
                </div>
              ))}
          </aside>

          <div style={{ width: "100%" }}>
            <TraningWorkshop
              showAll
              title={selectedTypeName ? `${selectedTypeName} Workshop Trainings` : "All Workshop Trainings"}
              showSeeMore={false}
              filterTrainingType={selectedTypeName || undefined}
            />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
