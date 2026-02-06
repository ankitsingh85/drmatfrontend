"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/Offer.module.css";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { API_URL } from "@/config/api";

interface Offer {
  _id: string;
  imageBase64: string;
}

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/ap";

const VISIBLE = 3;
const AUTO_DELAY = 3000;

const OfferComponent = () => {
  const [slides, setSlides] = useState<Offer[]>([]);
  const [index, setIndex] = useState(VISIBLE); // start after clones
  const [isPlaying, setIsPlaying] = useState(true);
  const [enableTransition, setEnableTransition] = useState(true);

  const sliderRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<NodeJS.Timeout | null>(null);
  const fetchRef = useRef<NodeJS.Timeout | null>(null);

  /* ================= FETCH ================= */
  const fetchOffers = async () => {
    try {
      const res = await fetch(`${API_URL}/offers`);
      const data: Offer[] = await res.json();
      setSlides(data);
    } catch (err) {
      console.error(err);
    }
  };

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
    ...slides.slice(-VISIBLE),
    ...slides,
    ...slides.slice(0, VISIBLE),
  ];

  /* ================= AUTOPLAY ================= */
  const startAuto = () => {
    stopAuto();
    autoRef.current = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, AUTO_DELAY);
    setIsPlaying(true);
  };

  const stopAuto = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = null;
    setIsPlaying(false);
  };

  useEffect(() => {
    if (slides.length > VISIBLE && isPlaying) startAuto();
    return () => stopAuto();
  }, [slides, isPlaying]);

  /* ================= LOOP FIX ================= */
  useEffect(() => {
    if (!sliderRef.current) return;

    if (index === slides.length + VISIBLE) {
      setTimeout(() => {
        setEnableTransition(false);
        setIndex(VISIBLE);
      }, 600);
    }

    if (index === 0) {
      setTimeout(() => {
        setEnableTransition(false);
        setIndex(slides.length);
      }, 600);
    }

    setTimeout(() => setEnableTransition(true), 650);
  }, [index, slides.length]);

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
    isPlaying ? stopAuto() : startAuto();
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
            transform: `translateX(-${index * (100 / VISIBLE)}%)`,
            transition: enableTransition ? "transform 0.6s ease" : "none",
          }}
        >
          {extendedSlides.map((slide, i) => (
            <div className={styles.slide} key={`${slide._id}-${i}`}>
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
              width: `${((index - VISIBLE + 1) / slides.length) * 100}%`,
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

export default OfferComponent;
