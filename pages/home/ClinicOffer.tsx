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

interface Offer {
  _id: string;
  imageBase64: string;
  clinicId?: string | ClinicRef | null;
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

  useEffect(() => {
    fetchOffers();
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

  const getClinicPath = (offer: Offer) => {
    if (!offer.clinicId) return null;

    if (typeof offer.clinicId === "object") {
      return offer.clinicId.slug || offer.clinicId._id;
    }

    return offer.clinicId; // string id
  };

  const handleSlideClick = async (offer: Offer) => {
  console.log("FULL OFFER:", offer);

  try {
    let clinicPath = null;

    if (!offer.clinicId) {
      console.log("No clinicId found");
      return;
    }

    // CASE 1: populated object
    if (typeof offer.clinicId === "object") {
      clinicPath = offer.clinicId.slug || offer.clinicId._id;
      console.log("Using object clinic:", clinicPath);
    }

    // CASE 2: string ID
    if (typeof offer.clinicId === "string") {
      console.log("Fetching clinic from API:", offer.clinicId);

      const res = await fetch(`${API_URL}/clinics/${offer.clinicId}`);
      const data = await res.json();

      console.log("Clinic API response:", data);

      clinicPath = data.slug || data._id;
    }

    if (!clinicPath) {
      console.log("No clinicPath generated");
      return;
    }

    console.log("FINAL REDIRECT:", `/clinics/${clinicPath}`);

    router.push(`/clinics/${clinicPath}`);

  } catch (err) {
    console.error("Navigation error:", err);
  }
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
              style={{ flex: `0 0 calc(100% / ${visibleCount})` }}
              onClick={() => handleSlideClick(slide)}
              role="button"
              tabIndex={0}
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