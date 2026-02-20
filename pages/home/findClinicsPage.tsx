"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ClinicCard from "@/components/Layout/clinicCard";
import SideCategories from "@/components/Layout/SideCategories";
import styles from "@/styles/pages/findClinicsPage.module.css";
import Footer from "@/components/Layout/Footer";
import Topbar from "@/components/Layout/Topbar";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import { API_URL } from "@/config/api";

const ITEMS_PER_PAGE = 6;

/* ================= CATEGORY ================= */
interface ClinicCategory {
  _id: string;
  categoryId: string;
  name: string;
  imageUrl: string;
}

/* ================= CLINIC ================= */
interface Clinic {
  _id: string;
  cuc: string;
  clinicName: string;
  website?: string;
  contactNumber?: string;
  email: string;
  address: string;
  clinicStatus?: string;
  dermaCategory?: ClinicCategory;
  doctors?: any[];

  /* 🔥 MEDIA */
  clinicLogo?: string;
  bannerImage?: string;
  photos?: string[];
}

const FindClinicsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const categoryQuery = searchParams.get("category");

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [categories, setCategories] = useState<ClinicCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categoryQuery
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= BASE64 SAFE IMAGE ================= */
  const getImage = (img?: string) => {
    if (!img) return undefined;
    if (img.startsWith("data:")) return img;
    return img; // already base64 with prefix from backend
  };

  /* ================= FETCH CATEGORIES ================= */
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/clinic-categories`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load categories");
    }
  };

  /* ================= FETCH CLINICS ================= */
  const fetchClinics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/clinics`);
      const data = await res.json();
      setClinics(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load clinics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchClinics();
  }, []);

  /* ================= URL CATEGORY SYNC ================= */
  useEffect(() => {
    setSelectedCategoryId(categoryQuery);
  }, [categoryQuery]);

  /* ================= FILTER ================= */
  const filteredClinics = useMemo(() => {
    return clinics.filter((clinic) => {
      const matchCategory = selectedCategoryId
        ? clinic.dermaCategory?._id === selectedCategoryId
        : true;

      const matchSearch =
        clinic.clinicName.toLowerCase().includes(search.toLowerCase()) ||
        clinic.address.toLowerCase().includes(search.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [clinics, selectedCategoryId, search]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredClinics.length / ITEMS_PER_PAGE)
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedClinics = filteredClinics.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  return (
    <>
      <Topbar />

      {/* ================= MOBILE CATEGORY BAR ================= */}
      <div className={styles.mobileCategories}>
        {categories.map((cat) => (
          <div
            key={cat._id}
            className={`${styles.mobileCategoryItem} ${
              selectedCategoryId === cat._id ? styles.activeCategory : ""
            }`}
            onClick={() => {
              setSelectedCategoryId(cat._id);
              setCurrentPage(1);
            }}
          >
            <img src={cat.imageUrl} alt={cat.name} />
            <span>{cat.name}</span>
          </div>
        ))}
      </div>

      <div className={styles.layout}>
        {/* ================= SIDEBAR ================= */}
        <aside className={styles.sidebar}>
          <SideCategories
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={(id) => {
              setSelectedCategoryId(id);
              setCurrentPage(1);
            }}
          />
        </aside>

        {/* ================= MAIN ================= */}
        <main className={styles.main}>
          <div className={styles.headerRow}>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                placeholder="Search clinics by name or address"
                className={styles.searchBarSC}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <button className={styles.searchButton}>🔍</button>
            </div>
          </div>

          {/* ================= STATES ================= */}
          {loading ? (
            <p className={styles.status}>Loading clinics…</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : paginatedClinics.length === 0 ? (
            <p className={styles.status}>No clinics found.</p>
          ) : (
            paginatedClinics.map((clinic) => (
              <ClinicCard
                key={clinic._id}
                clinic={{
                  ...clinic,

                  /* ✅ REQUIRED BY ClinicCard */
                  name: clinic.clinicName,

                  /* 🔥 USE ONLY PHOTOS FOR FIND CLINICS SLIDER */
                  image: getImage(clinic.photos?.[0]),
                  images: [
                    ...(clinic.photos?.map((p) => getImage(p)) || []),
                  ].filter((img): img is string => Boolean(img)),
                  clinicLogo: undefined,
                  bannerImage: undefined,
                }}
              />
            ))
          )}

          {/* ================= PAGINATION ================= */}
          <div className={styles.pagination}>
            {Array.from({ length: totalPages }, (_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`${styles.pageButton} ${
                  currentPage === idx + 1 ? styles.active : ""
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </main>
      </div>

      <MobileNavbar />
      <Footer />
    </>
  );
};

export default FindClinicsPage;
