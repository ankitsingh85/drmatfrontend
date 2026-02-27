"use client";

import { API_URL } from "@/config/api";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import styles from "@/styles/pages/treatmentPlanDetail.module.css";

interface TreatmentPlan {
  _id: string;
  treatmentName: string;
  description?: string;
  clinic?:
    | {
        _id: string;
        clinicName?: string;
      }
    | string;
  treatmentImages?: string[];
  serviceCategory?: string;
  mrp?: number;
  offerPrice?: number;
  addToCart?: boolean;
  isActive?: boolean;
  instructions?: string;
  disclaimer?: string;
  inclusions?: string;
  exclusions?: string;
}

const stripHtml = (value?: string) =>
  (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const TreatmentPlanDetailPage = () => {
  const router = useRouter();
  const { treatmentId } = router.query;
  const planId = Array.isArray(treatmentId) ? treatmentId[0] : treatmentId;
  const { cartItems, addToCart } = useCart();

  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSection, setOpenSection] = useState("what");

  const apiBaseUrl = API_URL.replace(/\/api\/?$/, "");

  const resolveImage = (img?: string) => {
    if (!img) return "/placeholder.png";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    if (img.startsWith("data:")) return img;
    if (img.startsWith("/")) return `${apiBaseUrl}${img}`;
    return `data:image/jpeg;base64,${img}`;
  };

  useEffect(() => {
    if (!planId) return;
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/treatment-plans/${planId}`);
        if (!res.ok) throw new Error("Failed to fetch treatment plan");
        const data: TreatmentPlan = await res.json();
        setPlan(data);
      } catch (err: any) {
        setError(err.message || "Unable to load treatment plan");
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [planId]);

  const price = useMemo(() => {
    const mrp = Number(plan?.mrp || 0);
    const offer = plan?.offerPrice !== undefined ? Number(plan.offerPrice) : undefined;
    const sale = offer !== undefined && offer > 0 ? offer : mrp;
    return { mrp, offer, sale };
  }, [plan]);

  if (loading || error || !plan) {
    return (
      <>
        <Topbar />
        <main className={styles.page}>
          <div className={styles.state}>
            {loading
              ? "Loading treatment plan..."
              : error || "Treatment plan not found."}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const inCart = cartItems.some((item) => item.id === plan._id);
  const canAddToCart = plan.addToCart !== false && plan.isActive !== false;
  const clinicName =
    typeof plan.clinic === "object" ? plan.clinic?.clinicName || "" : "";
  const plainDescription = stripHtml(plan.description);
  const plainInstructions = stripHtml(plan.instructions);
  const plainDisclaimer = stripHtml(plan.disclaimer);
  const plainInclusions = stripHtml(plan.inclusions);
  const plainExclusions = stripHtml(plan.exclusions);

  const handleAddToCart = () => {
    if (!canAddToCart || inCart) return;
    addToCart(
      {
        id: plan._id,
        name: plan.treatmentName,
        price: price.sale || 0,
        mrp: price.mrp || undefined,
        discount:
          price.offer !== undefined &&
          price.offer > 0 &&
          price.mrp > 0 &&
          price.offer < price.mrp
            ? `${Math.round(((price.mrp - price.offer) / price.mrp) * 100)}% OFF`
            : undefined,
        discountPrice: price.offer,
        company: clinicName,
        image: resolveImage(plan.treatmentImages?.[0]),
      },
      1
    );
  };

  const handleBookNow = () => {
    if (!inCart) handleAddToCart();
    router.push("/home/Cart");
  };

  const sections = [
    {
      id: "what",
      title: "What is this test?",
      content: plainDescription,
    },
    {
      id: "prep",
      title: "Test Preparation",
      content: plainInstructions,
    },
    {
      id: "results",
      title: "Understanding your test results",
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
  ].filter((section) => section.content);

  return (
    <>
      <Topbar />
      <main className={styles.page}>
        <section className={styles.card}>
          <div className={styles.hero}>
            <img
              src={resolveImage(plan.treatmentImages?.[0])}
              alt={plan.treatmentName}
              className={styles.heroImage}
            />
            <div className={styles.heroContent}>
              <h1>{plan.treatmentName}</h1>
              {plainDescription && (
                <p className={styles.alias}>
                  Also known as <strong>{plainDescription}</strong>
                </p>
              )}

              <div className={styles.priceRow}>
                <div>
                  <p className={styles.mainPrice}>Rs. {price.sale || 0}</p>
                  {price.offer !== undefined && price.offer < price.mrp && (
                    <p className={styles.cutPrice}>Rs. {price.mrp}</p>
                  )}
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.secondaryBtn}
                    disabled={!canAddToCart}
                    onClick={() => (inCart ? router.push("/home/Cart") : handleAddToCart())}
                  >
                    <FaShoppingCart /> {inCart ? "Go to Cart" : "Add to Cart"}
                  </button>
                  <button className={styles.primaryBtn} onClick={handleBookNow}>
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {clinicName && (
            <section className={styles.partner}>
              
              <div className={styles.partnerRow}>
                <div>
                  <p className={styles.partnerName}>{clinicName}</p>
                </div>
              </div>
            </section>
          )}

          {sections.length > 0 && (
            <section className={styles.accordion}>
              {sections.map((section) => {
                const isOpen = openSection === section.id;
                return (
                  <div key={section.id} className={styles.accordionItem}>
                    <button
                      className={styles.accordionHead}
                      onClick={() => setOpenSection(isOpen ? "" : section.id)}
                    >
                      <span>{section.title}</span>
                      <FiChevronDown className={isOpen ? styles.chevronOpen : styles.chevron} />
                    </button>
                    {isOpen && <p className={styles.accordionBody}>{section.content}</p>}
                  </div>
                );
              })}
            </section>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
};

export default TreatmentPlanDetailPage;
