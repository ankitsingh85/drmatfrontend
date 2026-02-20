"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/components/Layout/clinicCard.module.css";
import { useRouter } from "next/navigation";
import { FaWhatsapp, FaMap } from "react-icons/fa";
import { IoCall } from "react-icons/io5";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ================= TYPES ================= */
type Clinic = {
  _id: string;
  name: string;
  mobile?: string;
  whatsapp?: string;

  /* 🔥 IMAGE SOURCES (ANY ONE CAN COME) */
  images?: string[];       // gallery
  image?: string;          // from FindClinic normalize
  imageUrl?: string;       // legacy
  clinicLogo?: string;     // admin
  bannerImage?: string;

  reviews?: number;
  address?: string;
  description?: string;
  verified?: boolean;
  trusted?: boolean;
  mapLink?: string;
};

interface ClinicCardProps {
  clinic: Clinic;
}

/* ================= COMPONENT ================= */
const ClinicCard: React.FC<ClinicCardProps> = ({ clinic }) => {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  /* ================= IMAGE NORMALIZATION ================= */
  const images: string[] =
    clinic.images && clinic.images.length > 0
      ? clinic.images
      : clinic.image
      ? [clinic.image]
      : clinic.clinicLogo
      ? [clinic.clinicLogo]
      : clinic.bannerImage
      ? [clinic.bannerImage]
      : clinic.imageUrl
      ? [clinic.imageUrl]
      : ["/placeholder-clinic.jpg"];

  /* ================= AUTO SLIDE ================= */
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [images.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handleCardClick = () => {
    router.push(`/clinics/${clinic._id}`);
  };

  const handleThumbnailClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    index: number
  ) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  return (
    <div
      className={styles.card}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
    >
      {/* ================= IMAGE ================= */}
      <div className={styles.leftSection}>
        <div className={styles.mediaPanel}>
          {images.length > 1 && (
            <div className={styles.thumbnailRail}>
              {images.map((img, index) => (
                <button
                  key={`${clinic._id}-${index}`}
                  type="button"
                  className={`${styles.thumbnailBtn} ${
                    index === currentImageIndex ? styles.activeThumb : ""
                  }`}
                  onClick={(e) => handleThumbnailClick(e, index)}
                  aria-label={`View clinic image ${index + 1}`}
                >
                  <img
                    src={img}
                    alt={`${clinic.name || "Clinic"} thumbnail ${index + 1}`}
                    className={styles.thumbnailImg}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          <div className={styles.imageWrapper}>
            <img
              src={images[currentImageIndex]}
              alt={clinic.name || "Clinic"}
              className={styles.image}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "/placeholder-clinic.jpg";
              }}
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className={styles.prevBtn}
                  onClick={handlePrev}
                  aria-label="Previous clinic image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className={styles.nextBtn}
                  onClick={handleNext}
                  aria-label="Next clinic image"
                >
                  <ChevronRight size={20} />
                </button>
                <span className={styles.imageCounter}>
                  {currentImageIndex + 1}/{images.length}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ================= DETAILS ================= */}
      <div className={styles.rightSection}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{clinic.name}</span>
          {clinic.verified && (
            <span className={styles.verified}>✔ Verified</span>
          )}
        </div>

        <div className={styles.ratingReviewRow}>
          <span className={styles.rating}>⭐ 4.5</span>
          <span className={styles.reviews}>
            {clinic.reviews ?? 0} Reviews
          </span>
          {clinic.trusted && <span className={styles.trust}>Trusted</span>}
          <span className={styles.topSearch}>🔍 Top Search</span>
        </div>

        <div className={styles.addressRow}>
          📍 {clinic.address ?? "Address not available"}
        </div>

        <div className={styles.descriptionRow}>
          {clinic.description ?? "Open 24 Hrs • Experienced doctors"}
        </div>

        {/* ================= ACTIONS ================= */}
        <div className={styles.buttons}>
          <a
            href={clinic.mobile ? `tel:${clinic.mobile}` : undefined}
            onClick={(e) => e.stopPropagation()}
            className={styles.call}
          >
            <IoCall className={styles.icons} /> Call
          </a>

          <a
            href={
              clinic.whatsapp
                ? `https://wa.me/${clinic.whatsapp.replace(/\D/g, "")}`
                : undefined
            }
            onClick={(e) => e.stopPropagation()}
            className={styles.whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            <FaWhatsapp className={styles.icons} /> WhatsApp
          </a>

          {clinic.mapLink && (
            <a
              href={clinic.mapLink}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={styles.call}
            >
              <FaMap className={styles.icons} /> Direction
            </a>
          )}

          <button
            className={styles.details}
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            See Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;
