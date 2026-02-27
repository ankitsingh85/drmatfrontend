"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { API_URL } from "@/config/api";
import styles from "@/styles/pages/treatmentPlansSection.module.css";

interface Treatment {
  _id: string;
  treatmentName: string;
  description?: string;
  serviceCategory?: string;
  mrp?: number;
  offerPrice?: number;
}

const stripHtml = (value?: string) =>
  (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const TreatmentPlans = () => {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const visibleTreatments = useMemo(() => treatments.slice(0, 12), [treatments]);

  const updateArrows = () => {
    const el = sliderRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    const fetchTreatments = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/treatment-plans`);
        if (!res.ok) throw new Error("Failed to fetch treatment plans");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid data format");
        setTreatments(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch treatment plans";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchTreatments();
  }, []);

  useEffect(() => {
    updateArrows();
    const el = sliderRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [visibleTreatments.length]);

  const scrollByCards = (direction: "left" | "right") => {
    const el = sliderRef.current;
    if (!el) return;
    const cardWidth = 200;
    el.scrollBy({
      left: direction === "right" ? cardWidth : -cardWidth,
      behavior: "smooth",
    });
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Top Treatment Plans</h2>
      </div>

      {loading && <p className={styles.state}>Loading treatment plans...</p>}
      {!loading && error && <p className={styles.state}>{error}</p>}

      {!loading && !error && (
        <div className={styles.sliderWrap}>
          {canScrollLeft && (
            <button
              type="button"
              className={`${styles.arrow} ${styles.left}`}
              onClick={() => scrollByCards("left")}
              aria-label="Scroll left"
            >
              &#8249;
            </button>
          )}

          <div className={styles.slider} ref={sliderRef}>
            {visibleTreatments.map((treatment) => {
              const sale = Number(
                treatment.offerPrice !== undefined
                  ? treatment.offerPrice
                  : treatment.mrp || 0
              );
              const mrp = Number(treatment.mrp || 0);
              const displayPrice = Math.max(sale, mrp, 0);

              return (
                <article key={treatment._id} className={styles.card}>
                  <div className={styles.content}>
                    <div className={styles.headingRow}>
                      <h3 className={styles.cardTitle}>{treatment.treatmentName}</h3>
                      <p className={styles.price}>Rs. {displayPrice}</p>
                    </div>
                    <p className={styles.meta}>
                      {stripHtml(treatment.description) ||
                        treatment.serviceCategory ||
                        "Known as treatment plan"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.cta}
                    onClick={() => router.push(`/treatment-plans/${treatment._id}`)}
                  >
                    ADD TO CART
                  </button>
                </article>
              );
            })}
            {visibleTreatments.length === 0 && (
              <p className={styles.state}>No treatment plans available right now.</p>
            )}
          </div>

          {canScrollRight && (
            <button
              type="button"
              className={`${styles.arrow} ${styles.right}`}
              onClick={() => scrollByCards("right")}
              aria-label="Scroll right"
            >
              &#8250;
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default TreatmentPlans;
