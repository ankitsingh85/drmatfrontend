"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { API_URL } from "@/config/api";
import { FaArrowRight } from "react-icons/fa";
import styles from "@/styles/pages/treatmentPlansSection.module.css";

interface Treatment {
  _id: string;
  treatmentName: string;
  slug?: string;
  description?: string;
  serviceCategory?: string;
  mrp?: number;
  offerPrice?: number;
  treatmentImages?: string[];
  addToCart?: boolean;
  isActive?: boolean;
  clinic?:
    | {
        _id: string;
        clinicName?: string;
      }
    | string;
}

const stripHtml = (value?: string) =>
  (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const slugifyTreatmentName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "treatment-plan-details";

const MAX_HOME_TREATMENTS = 17;
const TREATMENT_CHECKOUT_KEY = "treatmentCheckout";

interface TreatmentPlansProps {
  limit?: number;
  showExploreCard?: boolean;
  title?: string;
}

const TreatmentPlans = ({
  limit = MAX_HOME_TREATMENTS,
  showExploreCard = true,
  title = "Top Treatment Plans",
}: TreatmentPlansProps) => {
  const router = useRouter();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const visibleTreatments = useMemo(() => treatments.slice(0, limit), [treatments, limit]);
  const apiBaseUrl = API_URL.replace(/\/api\/?$/, "");

  const getTreatmentSlug = (treatment: Treatment) =>
    treatment.slug || slugifyTreatmentName(treatment.treatmentName);

  const resolveImage = (img?: string) => {
    if (!img) return "/skin_hair.jpg";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    if (img.startsWith("data:")) return img;
    if (img.startsWith("/")) return `${apiBaseUrl}${img}`;
    return `data:image/jpeg;base64,${img}`;
  };

  const startTreatmentCheckout = (treatment: Treatment) => {
    const mrp = Number(treatment.mrp || 0);
    const offer =
      treatment.offerPrice !== undefined ? Number(treatment.offerPrice) : undefined;
    const sale = offer !== undefined && offer > 0 ? offer : mrp;
    const checkoutItem = {
      id: treatment._id,
      name: treatment.treatmentName,
      price: sale || 0,
      mrp: mrp || undefined,
      discount:
        offer !== undefined && offer > 0 && mrp > 0 && offer < mrp
          ? `${Math.round(((mrp - offer) / mrp) * 100)}% OFF`
          : undefined,
      discountPrice: offer,
      company:
        typeof treatment.clinic === "object"
          ? treatment.clinic?.clinicName || ""
          : treatment.serviceCategory,
      image: resolveImage(treatment.treatmentImages?.[0]),
      quantity: 1,
    };

    sessionStorage.setItem(TREATMENT_CHECKOUT_KEY, JSON.stringify([checkoutItem]));
    router.push("/home/PaymentPage?flow=treatment");
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

  const handleBuyNow = (e: React.MouseEvent, treatment: Treatment) => {
    e.stopPropagation();
    startTreatmentCheckout(treatment);
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
      </div>

      {loading && <p className={styles.state}>Loading treatment plans...</p>}
      {!loading && error && <p className={styles.state}>{error}</p>}

      {!loading && !error && (
        <div className={styles.gridWrap}>
          <div className={styles.grid}>
            {visibleTreatments.map((treatment) => {
              const mrp = Number(treatment.mrp || 0);
              const offer =
                treatment.offerPrice !== undefined
                  ? Number(treatment.offerPrice)
                  : undefined;
              const sale = offer !== undefined && offer > 0 ? offer : mrp;
              const hasDiscount = sale < mrp && mrp > 0;
              const discountPercent = hasDiscount
                ? Math.round(((mrp - sale) / mrp) * 100)
                : 0;
              const canBuyNow = treatment.isActive !== false;
              const subtext =
                stripHtml(treatment.description) ||
                treatment.serviceCategory ||
                "Known as treatment plan";

              return (
                <article
                  key={treatment._id}
                  className={styles.card}
                  onClick={() =>
                    router.push(`/treatment-plans/${getTreatmentSlug(treatment)}`)
                  }
                >
                  <div className={styles.imageBlock}>
                    <img
                      src={resolveImage(treatment.treatmentImages?.[0])}
                      alt={treatment.treatmentName}
                      className={styles.image}
                      loading="lazy"
                      decoding="async"
                    />
                    {hasDiscount && (
                      <span className={styles.badge}>Save {discountPercent}%</span>
                    )}
                  </div>

                  <div className={styles.content}>
                    <h3 className={styles.cardTitle}>{treatment.treatmentName}</h3>
                    <p className={styles.meta}>{subtext}</p>

                    <div className={styles.metaRow}>
                      <div className={styles.priceGroup}>
                        <span className={styles.salePrice}>Rs. {sale.toFixed(0)}</span>
                        {hasDiscount && (
                          <span className={styles.originalPrice}>
                            Rs. {mrp.toFixed(0)}
                          </span>
                        )}
                      </div>
                      <span className={styles.unit}>Treatment Plan</span>
                    </div>

                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.detailBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/treatment-plans/${getTreatmentSlug(treatment)}`
                          );
                        }}
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        className={styles.cta}
                        onClick={(e) => handleBuyNow(e, treatment)}
                        disabled={!canBuyNow}
                      >
                        {!canBuyNow
                          ? "Unavailable"
                          : "Buy Now"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {/* {showExploreCard && (
              <article
                className={`${styles.card} ${styles.showMore}`}
                onClick={() => router.push("/treatment-plans")}
              >
                <div className={`${styles.content} ${styles.showMoreContent}`}>
                  <div className={styles.showMoreAction}>
                    <FaArrowRight size={20} />
                    <span>Explore More</span>
                  </div>
                </div>
              </article>
            )} */}

            {visibleTreatments.length === 0 && (
              <p className={styles.state}>No treatment plans available right now.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default TreatmentPlans;
