"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Offer.module.css";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";

interface ClinicRef {
  _id: string;
  slug?: string;
  clinicName?: string;
}

interface ClinicLight {
  _id: string;
  slug?: string;
  clinicName?: string;
  dermaCategory?: string | { _id?: string; id?: string; name?: string };
}

interface Offer {
  _id: string;
  imageBase64: string;
  clinicId?: string | ClinicRef | null;
  categoryId?: string | { _id?: string; id?: string; name?: string } | null;
}

const AUTO_DELAY = 3000;

const ClinicOffer = () => {
  const router = useRouter();

  const getVisibleCount = () => {
    if (typeof window === "undefined") return 3;
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  };

  const [visibleCount, setVisibleCount] = useState(3);
  const [slides, setSlides] = useState<Offer[]>([]);
  const [clinics, setClinics] = useState<ClinicLight[]>([]);
  const [index, setIndex] = useState(3);
  const [isPlaying, setIsPlaying] = useState(true);
  const [enableTransition, setEnableTransition] = useState(true);

  const sliderRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<NodeJS.Timeout | null>(null);

  /* ================= FETCH ================= */
  const fetchOffers = async () => {
    try {
      const res = await fetch(`${API_URL}/offer3`);
      const data: Offer[] = await res.json();
      setSlides(data);
    } catch (err) {
      console.error("Offer fetch error:", err);
    }
  };

  const fetchClinics = async () => {
    try {
      const res = await fetch(`${API_URL}/clinics?light=true`);
      const data = await res.json();
      setClinics(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Clinic fetch error:", err);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchClinics();
  }, []);

  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIndex(visibleCount);
  }, [visibleCount, slides.length]);

  /* ================= CLONED SLIDES ================= */
  const extendedSlides = [
    ...slides.slice(-visibleCount),
    ...slides,
    ...slides.slice(0, visibleCount),
  ];

  /* ================= AUTOPLAY ================= */
  const clearAuto = () => {
    if (autoRef.current) clearInterval(autoRef.current);
  };

  const stopAuto = () => {
    clearAuto();
    setIsPlaying(false);
  };

  useEffect(() => {
    clearAuto();
    if (slides.length > visibleCount && isPlaying) {
      autoRef.current = setInterval(() => {
        setIndex((prev) => prev + 1);
      }, AUTO_DELAY);
    }
    return () => clearAuto();
  }, [slides.length, isPlaying, visibleCount]);

  /* ================= LOOP FIX ================= */
  useEffect(() => {
    if (!sliderRef.current) return;

    if (index === slides.length + visibleCount) {
      setTimeout(() => {
        setEnableTransition(false);
        setIndex(visibleCount);
      }, 600);
    }

    if (index === 0) {
      setTimeout(() => {
        setEnableTransition(false);
        setIndex(slides.length);
      }, 600);
    }

    setTimeout(() => setEnableTransition(true), 650);
  }, [index, slides.length, visibleCount]);

  /* ================= CONTROLS ================= */
  const next = () => {
    stopAuto();
    setIndex((prev) => prev + 1);
  };

  const prev = () => {
    stopAuto();
    setIndex((prev) => prev - 1);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  /* ================= NAVIGATION FIX ================= */
  const resolveClinicPath = (offer: Offer) => {
    if (!offer.clinicId) return null;

    if (typeof offer.clinicId === "object") {
      return offer.clinicId.slug || offer.clinicId._id || null;
    }

    return offer.clinicId;
  };

  const resolveCategoryId = (offer: Offer) => {
    if (!offer.categoryId) return null;
    if (typeof offer.categoryId === "object") {
      return offer.categoryId._id || offer.categoryId.id || offer.categoryId.name || null;
    }
    return offer.categoryId;
  };

  const resolveClinicFromCategory = (offer: Offer) => {
    const categoryKey = resolveCategoryId(offer);
    if (!categoryKey) return null;

    const normalized = String(categoryKey).trim().toLowerCase();
    return (
      clinics.find((clinic) => {
        const clinicCategory =
          typeof clinic.dermaCategory === "object"
            ? clinic.dermaCategory?._id ||
              clinic.dermaCategory?.id ||
              clinic.dermaCategory?.name ||
              ""
            : clinic.dermaCategory || "";

        return String(clinicCategory).trim().toLowerCase() === normalized;
      }) || null
    );
  };

  const handleSlideClick = async (offer: Offer) => {
    const directClinicPath = resolveClinicPath(offer);
    let categoryClinic = directClinicPath ? null : resolveClinicFromCategory(offer);

    if (!directClinicPath && !categoryClinic && clinics.length === 0) {
      try {
        const res = await fetch(`${API_URL}/clinics?light=true`);
        const data = await res.json();
        const nextClinics = Array.isArray(data) ? data : [];
        setClinics(nextClinics);
        categoryClinic =
          nextClinics.find((clinic) => {
            const categoryKey = resolveCategoryId(offer);
            if (!categoryKey) return false;
            const normalized = String(categoryKey).trim().toLowerCase();
            const clinicCategory =
              typeof clinic.dermaCategory === "object"
                ? clinic.dermaCategory?._id ||
                  clinic.dermaCategory?.id ||
                  clinic.dermaCategory?.name ||
                  ""
                : clinic.dermaCategory || "";

            return String(clinicCategory).trim().toLowerCase() === normalized;
          }) || null;
      } catch (err) {
        console.error("Clinic fallback fetch error:", err);
      }
    }

    const clinicPath = directClinicPath || categoryClinic?.slug || categoryClinic?._id || null;
    if (!clinicPath) return;

    router.push(`/clinics/${clinicPath}`);
  };

  if (slides.length === 0) {
    return <p style={{ textAlign: "center" }}>No offers available</p>;
  }

  return (
    <div className={styles.sliderWrapper}>
      {/* TOP CONTROLS */}
      <div className={styles.topControls}>
        <button onClick={prev}>
          <ChevronLeft size={18} />
        </button>
        <button onClick={next}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* SLIDER */}
      <div className={styles.viewport}>
        <div
          ref={sliderRef}
          className={styles.slider}
          style={{
            transform: `translateX(-${index * (100 / visibleCount)}%)`,
            transition: enableTransition ? "transform 0.6s ease" : "none",
          }}
        >
          {extendedSlides.map((slide, i) => (
            <div
              className={styles.slide}
              key={`${slide._id}-${i}`}
              onClick={() => handleSlideClick(slide)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSlideClick(slide);
                }
              }}
              role="button"
              tabIndex={0}
              style={{ flex: `0 0 calc(100% / ${visibleCount})`, cursor: "pointer" }}
            >
              <img
                src={resolveMediaUrl(slide.imageBase64) || slide.imageBase64}
                alt="Offer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className={styles.bottomBar}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progress}
            style={{
              width: `${((index - visibleCount + 1) / slides.length) * 100}%`,
            }}
          />
        </div>

        <button className={styles.playPause} onClick={togglePlay}>
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>
    </div>
  );
};

export default ClinicOffer;
