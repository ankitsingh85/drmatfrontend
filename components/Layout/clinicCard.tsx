"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/components/Layout/clinicCard.module.css";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { FaWhatsapp, FaMap } from "react-icons/fa";
import { IoCall } from "react-icons/io5";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";

/* ================= TYPES ================= */
type Clinic = {
  _id: string;
  slug?: string;
  name: string;
  mobile?: string;
  contactNumber?: string;
  whatsapp?: string;

  /* 🔥 IMAGE SOURCES (ANY ONE CAN COME) */
  photos?: string[];       // backend clinic photos
  images?: string[];       // legacy gallery
  image?: string;          // from FindClinic normalize
  imageUrl?: string;       // legacy

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
  const [loginModalAction, setLoginModalAction] = useState<string | null>(null);
  const callNumber = clinic.mobile || clinic.contactNumber;

  const redirectToLogin = () => {
    if (typeof window === "undefined") return;
    const nextPath = `${window.location.pathname}${window.location.search}`;
    router.push(`/Login?next=${encodeURIComponent(nextPath)}`);
  };

  const closeLoginModal = () => {
    setLoginModalAction(null);
  };

  const requireUserLogin = (
    e: React.MouseEvent<HTMLAnchorElement>,
    actionLabel: string,
    href?: string
  ) => {
    e.stopPropagation();

    if (!href) {
      e.preventDefault();
      return;
    }

    const token = Cookies.get("token");
    if (!token) {
      e.preventDefault();
      setLoginModalAction(actionLabel);
    }
  };

  /* ================= IMAGE NORMALIZATION ================= */
  const images: string[] =
    clinic.photos && clinic.photos.length > 0
      ? clinic.photos.map((img) => resolveMediaUrl(img) || img)
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
    router.push(`/clinics/${clinic.slug || clinic._id}`);
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
            href={callNumber ? `tel:${callNumber}` : undefined}
            onClick={(e) =>
              requireUserLogin(
                e,
                "call this clinic",
                callNumber ? `tel:${callNumber}` : undefined
              )
            }
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
            onClick={(e) =>
              requireUserLogin(
                e,
                "chat on WhatsApp",
                clinic.whatsapp
                  ? `https://wa.me/${clinic.whatsapp.replace(/\D/g, "")}`
                  : undefined
              )
            }
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
              // onClick={(e) =>
              //   requireUserLogin(e, "view directions", clinic.mapLink)
              // }
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

      {loginModalAction && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            e.stopPropagation();
            closeLoginModal();
          }}
          role="presentation"
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`clinic-login-modal-${clinic._id}`}
          >
            <button
              type="button"
              className={styles.closeModal}
              onClick={closeLoginModal}
              aria-label="Close login prompt"
            >
              x
            </button>
            <h3
              id={`clinic-login-modal-${clinic._id}`}
              className={styles.modalTitle}
            >
              Login Required
            </h3>
            <p className={styles.modalText}>
              You need to login first to {loginModalAction}.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.loginButton}
                onClick={redirectToLogin}
              >
                Login
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closeLoginModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicCard;
