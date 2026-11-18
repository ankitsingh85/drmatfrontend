"use client";

import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import CourseListing from "@/components/Layout/CourseListing";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import productImg from "@/public/product1.png";
import styles from "@/styles/ProductList.module.css";

interface CourseTypeCategory {
  id: string;
  name: string;
  imageUrl?: string;
}

interface StoredCourseType {
  id?: string;
  _id?: string;
  name?: string;
}

const CoursesPage = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isBusinessRole, setIsBusinessRole] = useState(false);

  const [categories, setCategories] = useState<CourseTypeCategory[]>([]);
  const [selectedTypeName, setSelectedTypeName] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const getImage = (img?: string) => {
    if (!img) return productImg.src;
    return resolveMediaUrl(img) || productImg.src;
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const role = Cookies.get("role")?.toLowerCase();
    const allowed = role === "clinic" || role === "doctor" || role === "b2buser";
    setIsBusinessRole(allowed);

    if (!allowed) {
      router.replace("/home");
    }
  }, [isHydrated, router]);

  // Hybrid sidebar + grid page — same pattern as home/B2bProductsList.tsx:
  // shows every course type as a sidebar tile, the grid is just
  // CourseListing filtered to whichever type is selected (or "All").
  useEffect(() => {
    const ac = new AbortController();

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/course-types`, { signal: ac.signal });
        if (!res.ok) throw new Error("Failed to fetch course types");

        const data = await res.json();
        const rawCategories = Array.isArray(data) ? data : data?.courseTypes || data?.data || [];

        const formatted: CourseTypeCategory[] = rawCategories
          .map((cat: any) => ({
            id: String(cat.id ?? cat._id ?? "").trim(),
            name: String(cat.name ?? "").trim(),
            imageUrl: cat.imageUrl,
          }))
          .filter((cat: CourseTypeCategory) => cat.id && cat.name);

        setCategories(formatted);

        const stored = localStorage.getItem("selectedCourseType");
        if (stored) {
          try {
            const parsed: StoredCourseType = JSON.parse(stored);
            if (parsed?.name) {
              const match = formatted.find(
                (cat) => cat.name.toLowerCase() === parsed.name?.toLowerCase()
              );
              if (match) setSelectedTypeName(match.name);
            }
          } catch (error) {
            console.error("Invalid selectedCourseType in localStorage:", error);
          }
        }
      } catch (err) {
        if ((err as any)?.name !== "AbortError") {
          console.error("Error fetching course types:", err);
        }
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
    return () => ac.abort();
  }, []);

  const handleCategoryClick = (category: CourseTypeCategory | null) => {
    if (!category) {
      setSelectedTypeName(null);
      localStorage.removeItem("selectedCourseType");
      localStorage.removeItem("selectedCourseTypeId");
      return;
    }

    setSelectedTypeName(category.name);
    localStorage.setItem("selectedCourseType", JSON.stringify(category));
    localStorage.setItem("selectedCourseTypeId", category.id);
  };

  if (!isHydrated || !isBusinessRole) {
    return null;
  }

  return (
    <>
      <Topbar />
      <main style={{ backgroundColor: "#ffffff" }}>
        <section className={styles.shopSection}>
          <div className={styles.layoutWrapper}>
            <aside className={styles.sidebar}>
              <h3 className={styles.sidebarTitle}>Course Types</h3>

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

              {!loadingCategories &&
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
              <CourseListing
                showAll
                title={selectedTypeName ? `${selectedTypeName} Courses` : "All Courses"}
                showSeeMore={false}
                filterCourseType={selectedTypeName || undefined}
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default CoursesPage;
