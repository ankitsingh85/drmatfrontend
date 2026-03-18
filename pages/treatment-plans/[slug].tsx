"use client";

import Link from "next/link";
import { API_URL } from "@/config/api";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  FaBolt,
  FaCheckCircle,
  FaClock,
  FaInfoCircle,
  FaShoppingCart,
  FaStar,
  FaTags,
  FaUserAlt,
  FaVideo,
} from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import styles from "@/styles/pages/treatmentPlanDetail.module.css";

interface TreatmentPlan {
  _id: string;
  tuc: string;
  treatmentName: string;
  clinic?:
    | {
        _id: string;
        clinicName?: string;
        email?: string;
      }
    | string;
  description?: string;
  treatmentImages?: string[];
  beforeImages?: string[];
  afterImages?: string[];
  shortReelUrl?: string;
  serviceCategory?: string;
  categoryIcons?: string[];
  mrp?: number;
  offerPrice?: number;
  pricePerSession?: number;
  discountPercent?: number;
  sessions?: string;
  duration?: string;
  validity?: string;
  technologyUsed?: string;
  instructions?: string;
  disclaimer?: string;
  inclusions?: string;
  exclusions?: string;
  gender?: "Unisex" | "Male" | "Female";
  promoCode?: string;
  addToCart?: boolean;
  isActive?: boolean;
  rating?: number;
  reviews?: string;
  patientFeedback?: string;
}

type DetailSection = {
  id: string;
  title: string;
  content: string;
};

const stripHtml = (value?: string) =>
  (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const TreatmentPlanDetailPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const planSlug = Array.isArray(slug) ? slug[0] : slug;
  const { cartItems, addToCart } = useCart();

  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSection, setOpenSection] = useState("overview");
  const [selectedImage, setSelectedImage] = useState(0);

  const apiBaseUrl = API_URL.replace(/\/api\/?$/, "");

  const resolveImage = (img?: string) => {
    if (!img) return "/placeholder.png";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    if (img.startsWith("data:")) return img;
    if (img.startsWith("/")) return `${apiBaseUrl}${img}`;
    return `data:image/jpeg;base64,${img}`;
  };

  useEffect(() => {
    if (!planSlug) return;

    let canceled = false;
    const controller = new AbortController();

    const fetchPlan = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_URL}/treatment-plans/${planSlug}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error("Failed to fetch treatment plan");
        }
        const data: TreatmentPlan = await res.json();
        if (canceled) return;
        setPlan(data);
      } catch (err: unknown) {
        if (canceled) return;
        const message = err instanceof Error ? err.message : "Unable to load treatment plan";
        setError(message);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchPlan();

    return () => {
      canceled = true;
      controller.abort();
    };
  }, [planSlug]);

  useEffect(() => {
    setSelectedImage(0);
  }, [plan?._id]);

  const price = useMemo(() => {
    const mrp = Number(plan?.mrp || 0);
    const offer = plan?.offerPrice !== undefined ? Number(plan.offerPrice) : undefined;
    const sale = offer !== undefined && offer > 0 ? offer : mrp;
    return { mrp, offer, sale };
  }, [plan]);

  const savings = useMemo(() => {
    if (!price.offer || !price.mrp || price.offer >= price.mrp) return undefined;
    return Math.round(((price.mrp - price.offer) / price.mrp) * 100);
  }, [price]);

  const images = plan?.treatmentImages?.length ? plan.treatmentImages : [undefined];
  const beforeImages = plan?.beforeImages ?? [];
  const afterImages = plan?.afterImages ?? [];
  const activeImage = images[selectedImage]?.toString() ?? "";

  const inCart = cartItems.some((item) => item.id === plan?._id);
  const isAvailable = plan?.isActive !== false;
  const canAddToCart = plan?.addToCart !== false && isAvailable;

  const clinicName =
    typeof plan?.clinic === "object"
      ? plan.clinic?.clinicName || ""
      : typeof plan?.clinic === "string"
      ? plan.clinic
      : "";

  const plainDescription = stripHtml(plan?.description);
  const plainInstructions = stripHtml(plan?.instructions);
  const plainDisclaimer = stripHtml(plan?.disclaimer);
  const plainInclusions = stripHtml(plan?.inclusions);
  const plainExclusions = stripHtml(plan?.exclusions);
  const plainFeedback = stripHtml(plan?.patientFeedback);

  const sections = useMemo<DetailSection[]>(
    () =>
      [
        {
          id: "overview",
          title: "Treatment overview",
          content:
            plainDescription ||
            "A clear overview of the treatment plan, its purpose, and who it is best suited for.",
        },
        {
          id: "prep",
          title: "Before your visit",
          content: plainInstructions,
        },
        {
          id: "results",
          title: "What to expect",
          content: plainDisclaimer,
        },
        {
          id: "inclusions",
          title: "Inclusions",
          content: plainInclusions,
        },
        {
          id: "exclusions",
          title: "Exclusions",
          content: plainExclusions,
        },
        {
          id: "feedback",
          title: "Patient feedback",
          content: plainFeedback,
        },
      ].filter((section) => section.content),
    [plainDescription, plainInstructions, plainDisclaimer, plainInclusions, plainExclusions, plainFeedback]
  );

  const infoItems = useMemo(() => {
    const items: Array<{ label: string; value: string | number; icon: ReactNode }> = [];

    if (plan?.serviceCategory) {
      items.push({
        label: "Category",
        value: plan.serviceCategory,
        icon: <FaInfoCircle />,
      });
    }
    if (plan?.sessions) {
      items.push({
        label: "Sessions",
        value: plan.sessions,
        icon: <FaClock />,
      });
    }
    if (plan?.duration) {
      items.push({
        label: "Duration",
        value: plan.duration,
        icon: <FaClock />,
      });
    }
    if (plan?.validity) {
      items.push({
        label: "Validity",
        value: plan.validity,
        icon: <FaClock />,
      });
    }
    if (plan?.technologyUsed) {
      items.push({
        label: "Technology",
        value: plan.technologyUsed,
        icon: <FaBolt />,
      });
    }
    if (plan?.gender) {
      items.push({
        label: "Gender",
        value: plan.gender,
        icon: <FaUserAlt />,
      });
    }
    if (plan?.promoCode) {
      items.push({
        label: "Promo code",
        value: plan.promoCode,
        icon: <FaTags />,
      });
    }
    if (plan?.pricePerSession) {
      items.push({
        label: "Per session",
        value: `Rs. ${Number(plan.pricePerSession).toFixed(0)}`,
        icon: <FaInfoCircle />,
      });
    }

    return items;
  }, [plan]);

  const handleAddToCart = () => {
    if (!canAddToCart || inCart || !plan) return;

    addToCart(
      {
        id: plan._id,
        name: plan.treatmentName,
        price: price.sale || 0,
        mrp: price.mrp || undefined,
        discount: savings && savings > 0 ? `${savings}% OFF` : undefined,
        discountPrice: price.offer,
        company: clinicName,
        image: resolveImage(images[0]),
      },
      1
    );
  };

  const handleBookNow = () => {
    if (!inCart) handleAddToCart();
    router.push("/home/Cart");
  };

  const summaryText =
    plainDescription ||
    "Treatment details, pricing, and booking options are shown below so the plan feels clear from the first glance.";

  if (loading || error || !plan) {
    return (
      <>
        <Topbar />
        <main className={styles.page}>
          <div className={styles.state}>
            <div className={styles.stateCard}>
              <p className={styles.stateTitle}>
                {loading ? "Loading treatment plan..." : error || "Treatment plan not found."}
              </p>
              <p className={styles.stateText}>
                We are pulling the latest treatment plan details and images right now.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Topbar />
      <main className={styles.page}>
        <section className={styles.shell}>
          <div className={styles.pageIntro}>
            <div className={styles.introCopy}>
              <p className={styles.eyebrow}>Treatment plan details</p>
              <h1 className={styles.pageTitle}>{plan.treatmentName}</h1>
              <p className={styles.pageLead}>{summaryText}</p>

              <div className={styles.metaPills}>
                {plan.serviceCategory && (
                  <span className={styles.metaPill}>{plan.serviceCategory}</span>
                )}
                {clinicName && <span className={styles.metaPill}>{clinicName}</span>}
                {plan.rating !== undefined && (
                  <span className={styles.ratingPill}>
                    <FaStar /> {plan.rating.toFixed(1)}
                    {plan.reviews ? <span>({plan.reviews})</span> : null}
                  </span>
                )}
                <span className={isAvailable ? styles.statusPill : styles.statusPillMuted}>
                  {isAvailable ? "Available for booking" : "Currently unavailable"}
                </span>
              </div>
            </div>

            <aside className={styles.priceCard}>
              <p className={styles.priceLabel}>Plan price</p>
              <div className={styles.priceStack}>
                <p className={styles.mainPrice}>Rs. {price.sale || 0}</p>
                {price.offer !== undefined && price.offer < price.mrp && (
                  <p className={styles.cutPrice}>Rs. {price.mrp}</p>
                )}
              </div>
              {savings && (
                <div className={styles.saveChip}>
                  <FaCheckCircle /> Save {savings}% on this plan
                </div>
              )}
              <div className={styles.priceNote}>
                Clear pricing, plan details, and booking flow in one place.
              </div>
            </aside>
          </div>

          <div className={styles.heroGrid}>
            <div className={styles.leftColumn}>
              <section className={styles.galleryCard}>
                <div className={styles.galleryFrame}>
                  <div className={styles.statusBadge}>
                    {isAvailable ? "Available" : "Unavailable"}
                  </div>

                  <img
                    src={resolveImage(activeImage)}
                    alt={plan.treatmentName}
                    className={styles.heroImage}
                  />
                </div>

                {images.length > 1 && (
                  <div className={styles.thumbnails}>
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={
                          idx === selectedImage
                            ? `${styles.thumb} ${styles.thumbActive}`
                            : styles.thumb
                        }
                        onClick={() => setSelectedImage(idx)}
                        aria-label={`Show image ${idx + 1}`}
                      >
                        <img
                          src={resolveImage(img)}
                          alt={`${plan.treatmentName} ${idx + 1}`}
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {plan.shortReelUrl && (
                  <a
                    href={plan.shortReelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.shortReel}
                  >
                    <FaVideo /> Watch short reel
                  </a>
                )}
              </section>

              {sections.length > 0 && (
                <section className={styles.accordionSection}>
                  <div className={styles.sectionHeader}>
                    <p className={styles.sectionEyebrow}>Plan details</p>
                    <h2 className={styles.sectionTitle}>Understand the treatment plan</h2>
                  </div>

                  <div className={styles.accordion}>
                    {sections.map((section) => {
                      const isOpen = openSection === section.id;
                      return (
                        <div key={section.id} className={styles.accordionItem}>
                          <button
                            type="button"
                            className={styles.accordionHead}
                            onClick={() => setOpenSection(isOpen ? "" : section.id)}
                          >
                            <span>{section.title}</span>
                            <FiChevronDown
                              className={isOpen ? styles.chevronOpen : styles.chevron}
                            />
                          </button>
                          {isOpen && <p className={styles.accordionBody}>{section.content}</p>}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            <aside className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <p className={styles.sideCardEyebrow}>Quick highlights</p>
                <h2 className={styles.sideCardTitle}>Everything you need before booking</h2>
              </div>

              <div className={styles.sidePoints}>
                <div className={styles.sidePoint}>
                  <FaCheckCircle />
                  <span>Transparent plan pricing with savings shown upfront.</span>
                </div>
                <div className={styles.sidePoint}>
                  <FaClock />
                  <span>Useful details like sessions, duration, and validity.</span>
                </div>
                <div className={styles.sidePoint}>
                  <FaInfoCircle />
                  <span>Accordion sections keep the page clean but informative.</span>
                </div>
              </div>

              <div className={styles.ctaGroup}>
                <button
                  className={styles.secondaryBtn}
                  disabled={!canAddToCart}
                  onClick={() => (inCart ? router.push("/home/Cart") : handleAddToCart())}
                >
                  <FaShoppingCart /> {inCart ? "Go to Cart" : "Add to Cart"}
                </button>
                <button
                  className={styles.primaryBtn}
                  onClick={handleBookNow}
                  disabled={!isAvailable}
                >
                  Book Now
                </button>
              </div>

              {infoItems.length > 0 && (
                <div className={styles.infoGrid}>
                  {infoItems.map((item) => (
                    <div key={item.label} className={styles.infoItem}>
                      <span className={styles.infoIcon}>{item.icon}</span>
                      <div>
                        <p className={styles.infoLabel}>{item.label}</p>
                        <p className={styles.infoValue}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>

          {(beforeImages.length > 0 || afterImages.length > 0) && (
            <section className={styles.beforeAfter}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionEyebrow}>Visual proof</p>
                <h2 className={styles.sectionTitle}>Before and after gallery</h2>
              </div>

              <div className={styles.beforeAfterGrid}>
                {Array.from({
                  length: Math.max(beforeImages.length, afterImages.length),
                }).map((_, idx) => (
                  <div key={idx} className={styles.compareCard}>
                    <div className={styles.comparePanel}>
                      <p className={styles.compareLabel}>Before</p>
                      <img
                        src={resolveImage(beforeImages[idx])}
                        alt={`${plan.treatmentName} before ${idx + 1}`}
                        className={styles.beforeAfterImage}
                      />
                    </div>
                    <div className={styles.comparePanel}>
                      <p className={styles.compareLabel}>After</p>
                      <img
                        src={resolveImage(afterImages[idx])}
                        alt={`${plan.treatmentName} after ${idx + 1}`}
                        className={styles.beforeAfterImage}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
};

export default TreatmentPlanDetailPage;
