"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { API_URL } from "@/config/api";
import { useCart } from "@/context/CartContext";
import { resolveMediaUrl } from "@/lib/media";
import { FiBookOpen, FiCalendar } from "react-icons/fi";

type WorkshopTraining = {
  _id: string;
  trainingName?: string;
  trainingUniqueCode?: string;
  trainingType?: string | string[];
  instituteName?: string;
  trainingDuration?: string;
  modeOfTraining?: string;
  startDate?: string;
  endDate?: string;
  trainerInstructorName?: string;
  currentAvailability?: string;
  feesInr?: number;
  trainingImage?: string;
};

type TraningWorkshopProps = {
  title?: string;
  showAll?: boolean;
  showSeeMore?: boolean;
  seeMoreHref?: string;
  seeMoreLabel?: string;
  // When set, only shows trainings tagged with this training type name
  // (case-insensitive) — used by the per-category workshop trainings page.
  filterTrainingType?: string;
};

const endpointCandidates = [
  `${API_URL}/workshop-trainings`,
  `${API_URL}/workshop-tranings`,
  `${API_URL}/workshop-training`,
];

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

const getPrice = (item: WorkshopTraining) => {
  const price = Number(item.feesInr || 0);
  return Number.isFinite(price) && price > 0 ? price : 0;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const cardLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

const FEATURED_CARD_COUNT = 4;

const footerActionStyle: React.CSSProperties = {
  marginTop: 24,
  display: "flex",
  justifyContent: "center",
};

const seeMoreLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 180,
  padding: "12px 22px",
  borderRadius: 999,
  background: "linear-gradient(90deg, #0d5d8f 0%, #18d6a2 100%)",
  color: "#ffffff",
  fontSize: 15,
  fontWeight: 800,
  textDecoration: "none",
  boxShadow: "0 14px 26px rgba(13, 93, 143, 0.24)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
};

export default function TraningWorkshop({
  title = "Workshop Trainings",
  showAll = false,
  showSeeMore = true,
  seeMoreHref = "/workshop-trainings",
  seeMoreLabel = "See More",
  filterTrainingType,
}: TraningWorkshopProps) {
  const router = useRouter();
  const { addToCart, cartItems } = useCart();
  const [items, setItems] = useState<WorkshopTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isWideScreen, setIsWideScreen] = useState(false);

  const filteredItems = useMemo(() => {
    if (!filterTrainingType) return items;
    const wanted = filterTrainingType.toLowerCase();
    return items.filter((item) => {
      const types = Array.isArray(item.trainingType)
        ? item.trainingType
        : item.trainingType
        ? [item.trainingType]
        : [];
      return types.some((type) => String(type).toLowerCase() === wanted);
    });
  }, [items, filterTrainingType]);

  const displayItems = useMemo<Array<WorkshopTraining | null>>(() => {
    if (showAll) return filteredItems;

    const paddedItems: Array<WorkshopTraining | null> = [...filteredItems];
    while (paddedItems.length < FEATURED_CARD_COUNT) {
      paddedItems.push(null);
    }
    return paddedItems;
  }, [filteredItems, showAll]);

  useEffect(() => {
    let mounted = true;

    const fetchWorkshopTrainings = async () => {
      try {
        setLoading(true);
        setError("");

        let lastError = "Failed to load workshop trainings";

        for (const endpoint of endpointCandidates) {
          const res = await fetch(endpoint);
          const data = await res.json().catch(() => []);

          if (res.ok) {
            if (mounted) setItems(Array.isArray(data) ? data : []);
            return;
          }

          lastError = data?.message || lastError;
        }

        throw new Error(lastError);
      } catch (err: any) {
        if (mounted) {
          setItems([]);
          setError(err?.message || "Failed to load workshop trainings");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWorkshopTrainings();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const updateScreenState = () => {
      setIsWideScreen(window.innerWidth >= 1200);
    };

    updateScreenState();
    window.addEventListener("resize", updateScreenState);

    return () => window.removeEventListener("resize", updateScreenState);
  }, []);

  const handleAddToCart = (training: WorkshopTraining) => {
    const cartId = `workshop:${training._id}`;
    if (cartItems.some((item) => item.id === cartId)) {
      router.push("/home/Cart");
      return;
    }

    const price = getPrice(training);
    addToCart({
      id: cartId,
      name: training.trainingName || "Workshop Training",
      price,
      mrp: undefined,
      company: training.instituteName,
      image: resolveMediaUrl(training.trainingImage || undefined) || undefined,
      itemType: "product",
    });
  };

  const handleOpenDetails = (training: WorkshopTraining) => {
    const slugSource = training.trainingName || training.trainingUniqueCode || training._id;
    router.push(`/workshop-trainings/${slugify(String(slugSource))}`);
  };

  return (
    <section
      style={{
        width: "91%",
        maxWidth: 1290,
        margin: "0 auto",
        padding: "10px 0 26px",
      }}
    >
      <div
        style={{
          marginBottom: 18,
          padding: "10px 0 12px",
          borderRadius: 0,
          background: "transparent",
          color: "#111827",
          boxShadow: "none",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            margin: 0,
            display: "inline-block",
            fontSize: 31,
            lineHeight: 1.15,
            fontWeight: 700,
            textDecorationLine: "underline",
            textDecorationThickness: "3px",
            textUnderlineOffset: "8px",
            // textDecorationColor: "#1d4ed8",
          }}
        >
          {title}
        </h2>
      </div>

      {error ? (
        <p style={{ margin: "0 0 14px", color: "#b91c1c", fontWeight: 600 }}>{error}</p>
      ) : null}

      {loading ? <p style={{ margin: 0 }}>Loading workshop trainings...</p> : null}

      {!loading && filteredItems.length === 0 ? (
        <p style={{ margin: 0, color: "#64748b" }}>No workshop trainings found.</p>
      ) : null}

      {!loading && filteredItems.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: 22,
            alignItems: "stretch",
            gridTemplateColumns:
              showAll && isWideScreen
                ? "repeat(4, minmax(0, 1fr))"
                : "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {displayItems.map((item, index) => {
            if (!item) {
              return (
                <article
                  key={`workshop-placeholder-${index}`}
                  aria-hidden="true"
                  style={{
                    visibility: "hidden",
                    pointerEvents: "none",
                    borderRadius: 28,
                    minHeight: "100%",
                  }}
                />
              );
            }

            const cartId = `workshop:${item._id}`;
            const inCart = cartItems.some((entry) => entry.id === cartId);
            const price = getPrice(item);
            const image = resolveMediaUrl(item.trainingImage || undefined);
            return (
              <article
                key={item._id}
                role="link"
                tabIndex={0}
                onClick={() => handleOpenDetails(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenDetails(item);
                  }
                }}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 28,
                  overflow: "hidden",
                  boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  minHeight: "100%",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    background: "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(15,23,42,0.04) 100%)",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "5px 10px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.95)",
                      color: "#ef4444",
                      fontSize: 11,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <FiBookOpen />
                    Enroll
                  </span>
                  {image ? (
                    <img
                      src={image}
                      alt={item.trainingName || "Workshop training"}
                      style={{
                        width: "100%",
                        height: 112,
                        objectFit: "fill",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 112,
                        display: "grid",
                        placeItems: "center",
                        padding: 14,
                        textAlign: "center",
                        color: "#334155",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {item.trainingName || "Workshop Training"}
                    </div>
                  )}
                </div>

                <div style={{ padding: "14px 16px 16px", display: "grid", gap: 10, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        flexShrink: 0,
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #c4b5fd, #60a5fa)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                        fontSize: 15,
                      }}
                    >
                      {item.trainerInstructorName?.charAt(0) || "T"}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#111827",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.trainerInstructorName || "Expert Trainer"}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "#98a2b3",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.instituteName || "Institute not specified"}
                      </p>
                    </div>
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 800,
                      lineHeight: 1.3,
                      color: "#080f3a",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as any,
                      overflow: "hidden",
                      minHeight: 42,
                    }}
                  >
                    {item.trainingName || "Workshop Training"}
                  </h3>

                  <div style={{ display: "flex", gap: 6, alignItems: "center", color: "#667085", fontSize: 12, fontWeight: 600 }}>
                    <FiCalendar />
                    <span>
                      {formatDate(item.startDate)} - {formatDate(item.endDate)}
                    </span>
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid #ececec",
                      paddingTop: 10,
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Fee</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
                        {price > 0 ? `INR ${price}` : "Free"}
                      </div>
                    </div>

                    <span
                      style={{
                        ...cardLabelStyle,
                        flexShrink: 0,
                        maxWidth: 140,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        background: "#f3f4f6",
                        color: "#374151",
                      }}
                    >
                      {item.modeOfTraining || "Mode not specified"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAddToCart(item);
                    }}
                    style={{
                      border: "none",
                      borderRadius: 999,
                      padding: "9px 16px",
                      background: inCart ? "#0f172a" : "#1d4ed8",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                      width: "100%",
                      fontSize: 14,
                    }}
                  >
                    {inCart ? "Go to Cart" : "Enroll Now"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {!loading && !error && showSeeMore && !showAll ? (
        <div style={footerActionStyle}>
          <Link href={seeMoreHref} style={seeMoreLinkStyle}>
            {seeMoreLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
