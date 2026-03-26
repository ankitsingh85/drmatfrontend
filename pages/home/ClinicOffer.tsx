"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Offer.module.css";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { API_URL } from "@/config/api";

interface ClinicRef {
  _id: string;
  slug?: string;
  clinicName?: string;
  cuc?: string;
}

interface Offer {
  _id: string;
  imageBase64: string;
  clinicId?: string | ClinicRef;
}

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

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
  const [index, setIndex] = useState(3); // start after clones
  const [isPlaying, setIsPlaying] = useState(true);
  const [enableTransition, setEnableTransition] = useState(true);

  const sliderRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<NodeJS.Timeout | null>(null);
  const fetchRef = useRef<NodeJS.Timeout | null>(null);

  /* ================= FETCH ================= */
  const fetchOffers = async () => {
    try {
      const res = await fetch(`${API_URL}/offer3`);
      const data: Offer[] = await res.json();
      setSlides(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIndex(visibleCount);
  }, [visibleCount, slides.length]);

  useEffect(() => {
    fetchOffers();
    fetchRef.current = setInterval(fetchOffers, 3000);
    return () => {
      if (fetchRef.current) {
        clearInterval(fetchRef.current);
      }
    };
  }, []);

  /* ================= CLONED SLIDES ================= */
  const extendedSlides = [
    ...slides.slice(-visibleCount),
    ...slides,
    ...slides.slice(0, visibleCount),
  ];

  /* ================= AUTOPLAY ================= */
  const clearAuto = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = null;
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

  const getClinicId = (offer: Offer) =>
    typeof offer.clinicId === "object" ? offer.clinicId._id : offer.clinicId;

  const handleSlideClick = (offer: Offer) => {
    const clinic =
      typeof offer.clinicId === "object" ? offer.clinicId : undefined;
    const clinicSlug = clinic?.slug || clinic?._id || getClinicId(offer);
    if (!clinicSlug) return;

    router.push(`/clinics/${clinicSlug}`);
  };

  if (slides.length === 0) {
    return <p style={{ textAlign: "center" }}>No offers available</p>;
  }

  return (
    <div className={styles.sliderWrapper}>
      {/* TOP RIGHT ARROWS */}
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
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSlideClick(slide);
                }
              }}
            >
              <img src={slide.imageBase64} alt="Offer" />
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
