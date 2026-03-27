"use client";
import { API_URL } from "@/config/api";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/pages/cliniccategorylist.module.css";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl } from "@/lib/media";

interface ClinicCategory {
  _id: string;
  categoryId: string;
  name: string;
  imageUrl: string;
}

const ClinicCategoryList: React.FC = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<ClinicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.removeItem("selectedClinicCategory");
    localStorage.removeItem("selectedClinicCategoryId");

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/clinic-categories`);
        const data = await res.json();
        const nextCategories = Array.isArray(data) ? data : data.categories || [];
        setCategories(nextCategories);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError("Failed to load clinic categories.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <>
      <Topbar />
      {loading && <FullPageLoader />}
      <div className={styles.cliniContainer}>
        <h2 className={styles.clinicTitle}>Clinic Categories List</h2>

        {!loading && (
          <>
            {error && <p className={styles.error}>{error}</p>}

            {categories.length === 0 ? (
              <p className={styles.empty}>No clinic categories found.</p>
            ) : (
              <div className={styles.gridContainer}>
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className={styles.categoryWrapper}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/home/findClinicsPage?category=${cat._id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/home/findClinicsPage?category=${cat._id}`);
                      }
                    }}
                  >
                    <div className={styles.categoryCard}>
                      <img
                        src={resolveMediaUrl(cat.imageUrl) || cat.imageUrl}
                        alt={cat.name}
                        className={styles.categoryImg}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default ClinicCategoryList;
