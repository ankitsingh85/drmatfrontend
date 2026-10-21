"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { FiChevronLeft, FiChevronRight, FiMapPin } from "react-icons/fi";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import { distanceInKm } from "@/lib/geo";
import styles from "@/styles/components/homePage/recommendedClinicsSection.module.css";

// Same 30km convention used by the treatment clinic-picker modal.
const RADIUS_KM = 30;
const AUTO_ADVANCE_MS = 3000;

interface ClinicCategory {
  _id: string;
  name: string;
}

interface Clinic {
  _id: string;
  slug?: string;
  clinicName: string;
  address?: string;
  city?: string;
  sector?: string;
  bannerImage?: string;
  dermaCategory?: ClinicCategory;
  verifiedBadgeVisible?: boolean;
  isActive?: boolean;
  isRecommended?: boolean;
  recommendedOrder?: number;
  latitude?: number;
  longitude?: number;
}

type ClinicWithDistance = Clinic & { distanceKm: number };

const getVisibleCount = () => {
  if (typeof window === "undefined") return 3;
  if (window.innerWidth <= 640) return 1;
  if (window.innerWidth <= 1024) return 2;
  return 3;
};

// Shown on the home page just above "Top Derma Clinics Near You" — an
// admin-curated shortlist (Admin Panel → Recommended Clinic), restricted to
// whichever of those clinics actually fall within RADIUS_KM of the
// visitor, since "recommended" shouldn't mean a clinic on the other side
// of the country.
const RecommendedClinicsSection: React.FC = () => {
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const res = await fetch(`${API_URL}/clinics?light=true`);
        const data = await res.json();
        const list: Clinic[] = Array.isArray(data) ? data : [];
        setClinics(list.filter((clinic) => clinic.isRecommended && clinic.isActive !== false));
      } catch (err) {
        console.error("Failed to fetch recommended clinics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommended();
  }, []);

  useEffect(() => {
    const cookieLat = Cookies.get("latitude");
    const cookieLng = Cookies.get("longitude");
    if (cookieLat && cookieLng) {
      setUserCoords({ lat: Number(cookieLat), lng: Number(cookieLng) });
      return;
    }

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        try {
          Cookies.set("latitude", String(latitude), { expires: 7 });
          Cookies.set("longitude", String(longitude), { expires: 7 });
        } catch {
          // Ignore cookie write failures — distance still works this session.
        }
      },
      () => {
        // Silently do nothing — the section just won't render without a
        // known location, same as it won't for zero recommended clinics.
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Strictly within the radius — no "show all" fallback when nothing is
  // nearby, unlike the treatment clinic-picker modal.
  const nearbyClinics = useMemo<ClinicWithDistance[]>(() => {
    if (!userCoords) return [];

    return clinics
      .filter(
        (clinic) =>
          typeof clinic.latitude === "number" && typeof clinic.longitude === "number"
      )
      .map((clinic) => ({
        ...clinic,
        distanceKm: distanceInKm(
          userCoords.lat,
          userCoords.lng,
          clinic.latitude as number,
          clinic.longitude as number
        ),
      }))
      .filter((clinic) => clinic.distanceKm <= RADIUS_KM)
      .sort((a, b) => {
        // Admin-set display rank wins first (1, 2, 3, ...); unranked
        // clinics, or a tie, fall back to nearest-first.
        const orderA = a.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return a.distanceKm - b.distanceKm;
      });
  }, [clinics, userCoords]);

  const pageCount = Math.max(1, Math.ceil(nearbyClinics.length / visibleCount));

  useEffect(() => {
    setPage(0);
  }, [nearbyClinics.length, visibleCount]);

  useEffect(() => {
    if (pageCount <= 1) return;
    const timer = setInterval(() => {
      setPage((prev) => (prev + 1) % pageCount);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [pageCount]);

  if (loading || nearbyClinics.length === 0) return null;

  const start = page * visibleCount;
  const visibleClinics = nearbyClinics.slice(start, start + visibleCount);

  const goPrev = () => setPage((prev) => (prev - 1 + pageCount) % pageCount);
  const goNext = () => setPage((prev) => (prev + 1) % pageCount);
  const openClinic = (clinic: Clinic) => router.push(`/clinics/${clinic.slug || clinic._id}`);

  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>Recommended Clinics</h2>
      <p className={styles.subheading}>Hand-picked clinics near you</p>

      <div className={styles.carousel}>
        {pageCount > 1 && (
          <button
            type="button"
            className={styles.navBtn}
            onClick={goPrev}
            aria-label="Previous recommended clinics"
          >
            <FiChevronLeft size={20} />
          </button>
        )}

        <div className={styles.cardsRow}>
          {visibleClinics.map((clinic) => (
            <div
              key={clinic._id}
              className={styles.miniCard}
              onClick={() => openClinic(clinic)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openClinic(clinic);
                }
              }}
            >
              <div className={styles.miniCardImage}>
                <img
                  src={resolveMediaUrl(clinic.bannerImage) || "/placeholder-clinic.jpg"}
                  alt={clinic.clinicName}
                  loading="lazy"
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).src = "/placeholder-clinic.jpg";
                  }}
                />
                {clinic.verifiedBadgeVisible && (
                  <span className={styles.verifiedTag}>✔ Verified</span>
                )}
              </div>
              <div className={styles.miniCardBody}>
                <p className={styles.miniCardName}>{clinic.clinicName}</p>
                <p className={styles.miniCardAddress}>
                  <FiMapPin size={13} />
                  {[clinic.sector, clinic.city].filter(Boolean).join(", ") ||
                    clinic.address ||
                    "Address not available"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {pageCount > 1 && (
          <button
            type="button"
            className={styles.navBtn}
            onClick={goNext}
            aria-label="Next recommended clinics"
          >
            <FiChevronRight size={20} />
          </button>
        )}
      </div>

      {pageCount > 1 && (
        <div className={styles.dots}>
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot} ${i === page ? styles.dotActive : ""}`}
              onClick={() => setPage(i)}
              aria-label={`Go to recommended clinics page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendedClinicsSection;
