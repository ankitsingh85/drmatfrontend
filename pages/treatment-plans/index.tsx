"use client";

import { API_URL } from "@/config/api";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/ProductList.module.css";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import FullPageLoader from "@/components/common/FullPageLoader";
import { FaEye } from "react-icons/fa";
import { useCart } from "@/context/CartContext";

interface Category {
  _id: string;
  name: string;
  imageUrl?: string;
}

interface TreatmentPlan {
  _id: string;
  treatmentName: string;
  slug?: string;
  serviceCategory?: string;
  clinic?:
    | {
        _id: string;
        clinicName?: string;
      }
    | string;
  mrp?: number;
  offerPrice?: number;
  treatmentImages?: string[];
  isActive?: boolean;
  createdAt?: string;
}

interface TreatmentWithCategory extends TreatmentPlan {
  categoryObj?: Category | null;
}

interface StoredCategory {
  _id?: string;
  id?: string;
  name?: string;
}

const TreatmentListingPage: React.FC = () => {
  const router = useRouter();
  const { cartItems, addToCart } = useCart();

  const [treatments, setTreatments] = useState<TreatmentWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const apiBaseUrl = API_URL.replace(/\/api\/?$/, "");

  const extractArray = (payload: unknown): any[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      if (Array.isArray(obj.treatmentPlans)) return obj.treatmentPlans as any[];
      if (Array.isArray(obj.data)) return obj.data as any[];
    }
    return [];
  };

  const resolveImage = (img?: string) => {
    if (!img) return "/skin_hair.jpg";
    if (img.startsWith("data:")) return img;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    if (img.startsWith("/")) return `${apiBaseUrl}${img}`;
    return `data:image/jpeg;base64,${img}`;
  };

  const resolveInitialCategoryId = (catData: Category[]): string | null => {
    const savedId = localStorage.getItem("selectedTreatmentCategoryId");
    if (savedId && catData.some((c) => c._id === savedId)) return savedId;

    const storedCategory = localStorage.getItem("selectedTreatmentCategory");
    if (!storedCategory) return null;

    try {
      const parsed: StoredCategory = JSON.parse(storedCategory);
      const wantedId = parsed?._id ?? parsed?.id;
      if (wantedId && catData.some((c) => c._id === wantedId)) return wantedId;

      if (parsed?.name) {
        const byName = catData.find(
          (c) => c.name.toLowerCase() === parsed.name?.toLowerCase()
        );
        if (byName) return byName._id;
      }
    } catch (error) {
      console.error("Invalid selectedTreatmentCategory in localStorage:", error);
    }

    return null;
  };

  const normalizeTreatments = (raw: unknown, cats: Category[]): TreatmentWithCategory[] =>
    extractArray(raw)
      .map((plan: any) => {
        const serviceCategoryName =
          typeof plan?.serviceCategory === "string" ? plan.serviceCategory : "";
        const categoryObj =
          cats.find(
            (cat) => cat.name.toLowerCase() === serviceCategoryName.toLowerCase()
          ) || null;

        return {
          _id: String(plan?._id ?? ""),
          treatmentName: String(plan?.treatmentName ?? ""),
          slug: plan?.slug,
          serviceCategory: serviceCategoryName,
          clinic: plan?.clinic,
          mrp: Number(plan?.mrp ?? 0),
          offerPrice:
            plan?.offerPrice !== undefined ? Number(plan.offerPrice) : undefined,
          treatmentImages: Array.isArray(plan?.treatmentImages)
            ? plan.treatmentImages
            : [],
          isActive: plan?.isActive,
          createdAt: String(plan?.createdAt ?? ""),
          categoryObj,
        };
      })
      .filter((plan) => plan._id && plan.treatmentName);

  const getTreatmentSlug = (plan: TreatmentPlan) =>
    plan.slug ||
    plan.treatmentName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") ||
    "treatment-plan-details";

  const buildTreatmentCartItem = (plan: TreatmentWithCategory) => {
    const mrp = Number(plan.mrp || 0);
    const offer =
      plan.offerPrice !== undefined ? Number(plan.offerPrice) : undefined;
    const sale = offer !== undefined && offer > 0 ? offer : mrp;

    return {
      id: plan._id,
      name: plan.treatmentName,
      price: sale || 0,
      mrp: mrp || undefined,
      discount:
        offer !== undefined && offer > 0 && mrp > 0 && offer < mrp
          ? `${Math.round(((mrp - offer) / mrp) * 100)}% OFF`
          : undefined,
      discountPrice: offer,
      company:
        typeof plan.clinic === "object"
          ? plan.clinic?.clinicName || plan.serviceCategory || "Treatment Plan"
          : plan.serviceCategory || "Treatment Plan",
      image: resolveImage(plan.treatmentImages?.[0]),
      itemType: "treatment" as const,
    };
  };

  const handleTreatmentAction = (plan: TreatmentWithCategory) => {
    if (plan.isActive === false) return;
    const item = buildTreatmentCartItem(plan);
    if (cartItems.some((existing) => existing.id === plan._id)) {
      router.push("/home/Cart");
      return;
    }
    addToCart(item);
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [catRes, planRes] = await Promise.all([
          fetch(`${API_URL}/service-categories`),
          fetch(`${API_URL}/treatment-plans`),
        ]);

        if (!catRes.ok || !planRes.ok) {
          throw new Error("Failed to fetch treatment data");
        }

        const catRaw = await catRes.json();
        const planRaw = await planRes.json();

        const catData = Array.isArray(catRaw) ? catRaw : [];
        const normalizedCategories = catData
          .map((cat: any) => ({
            _id: String(cat?._id ?? cat?.id ?? ""),
            name: String(cat?.name ?? ""),
            imageUrl: cat?.imageUrl,
          }))
          .filter((cat: Category) => cat._id && cat.name);

        const normalizedTreatments = normalizeTreatments(
          planRaw,
          normalizedCategories
        );

        setCategories(normalizedCategories);
        setTreatments(normalizedTreatments);

        const initialCategoryId = resolveInitialCategoryId(normalizedCategories);
        if (initialCategoryId) {
          setSelectedCategoryId(initialCategoryId);
          localStorage.setItem("selectedTreatmentCategoryId", initialCategoryId);
        }
      } catch (error) {
        console.error("Failed to fetch treatment plans:", error);
        setCategories([]);
        setTreatments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const selectedCategory =
    categories.find((cat) => cat._id === selectedCategoryId) || null;

  const filteredTreatments = useMemo(
    () =>
      treatments.filter((plan) => {
        const matchesSearch =
          plan.treatmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (plan.clinic &&
            typeof plan.clinic === "object" &&
            (plan.clinic?.clinicName || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (plan.serviceCategory || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategoryId
          ? plan.categoryObj?._id === selectedCategoryId ||
            plan.serviceCategory?.toLowerCase() ===
              selectedCategory?.name?.toLowerCase()
          : true;

        return matchesSearch && matchesCategory;
      }),
    [treatments, searchTerm, selectedCategoryId, selectedCategory]
  );

  if (loading) {
    return (
      <>
        <Topbar hideHamburgerOnMobile />
        <FullPageLoader />
      </>
    );
  }

  return (
    <>
      <Topbar hideHamburgerOnMobile />

      <section className={styles.shopSection}>
        <div className={styles.layoutWrapper}>
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Treatment Types</h3>

            <div
              className={`${styles.sidebarCard} ${
                !selectedCategoryId ? styles.activeCategory : ""
              }`}
              onClick={() => {
                setSelectedCategoryId(null);
                localStorage.removeItem("selectedTreatmentCategory");
                localStorage.removeItem("selectedTreatmentCategoryId");
              }}
            >
              <img
                src="/skin_hair.jpg"
                alt="All"
                className={styles.sidebarImage}
              />
              <p className={styles.sidebarName}>All</p>
            </div>

            {categories.map((cat) => (
              <div
                key={cat._id}
                className={`${styles.sidebarCard} ${
                  selectedCategory?._id === cat._id ? styles.activeCategory : ""
                }`}
                onClick={() => {
                  setSelectedCategoryId(cat._id);
                  localStorage.setItem("selectedTreatmentCategoryId", cat._id);
                  localStorage.setItem(
                    "selectedTreatmentCategory",
                    JSON.stringify(cat)
                  );
                }}
              >
                <img
                  src={resolveImage(cat.imageUrl)}
                  alt={cat.name}
                  className={styles.sidebarImage}
                />
                <p className={styles.sidebarName}>{cat.name}</p>
              </div>
            ))}
          </aside>

          <div style={{ width: "100%" }}>
            <div className={styles.headerRow}>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="Search treatment plans..."
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className={styles.searchIcon}>Search</span>
              </div>
            </div>

            {filteredTreatments.length === 0 ? (
              <p style={{ padding: 20 }}>No treatment plans found.</p>
            ) : (
              <div className={styles.productGrid}>
                {filteredTreatments.map((plan) => {
                  const image = resolveImage(plan.treatmentImages?.[0]);
                  const price = Number(plan.mrp) || 0;
                  const discount = Number(plan.offerPrice) || price;
                  const hasDiscount = discount < price;
                  const isAvailable = plan.isActive !== false;
                  const clinicName =
                    typeof plan.clinic === "object"
                      ? plan.clinic?.clinicName || ""
                      : "";

                  return (
                    <div
                      key={plan._id}
                      className={styles.productCard}
                      onClick={() =>
                        router.push(`/treatment-plans/${getTreatmentSlug(plan)}`)
                      }
                    >
                      <div className={styles.productItem}>
                        <img
                          src={image}
                          alt={plan.treatmentName}
                          className={styles.productImage}
                        />

                        <h3 className={styles.productName}>{plan.treatmentName}</h3>

                        <p className={styles.productSize}>
                          {clinicName || plan.serviceCategory || "Treatment Plan"}
                        </p>

                        {plan.categoryObj && (
                          <p className={styles.categoryName}>
                            Category: {plan.categoryObj.name}
                          </p>
                        )}

                        <div className={styles.productPriceContainer}>
                          {hasDiscount ? (
                            <>
                              <p className={styles.productPrice}>Rs. {discount}</p>
                              <p className={styles.productMrp}>Rs. {price}</p>
                              <span className={styles.discountTag}>
                                {Math.round(((price - discount) / price) * 100)}% OFF
                              </span>
                            </>
                          ) : (
                            <p className={styles.productPrice}>Rs. {price}</p>
                          )}
                        </div>

                        <div className={styles.productActionsRow}>
                          <button
                            className={styles.productButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTreatmentAction(plan);
                            }}
                          >
                            {isAvailable
                              ? cartItems.some((item) => item.id === plan._id)
                                ? "Go to Cart"
                                : "Add to Cart"
                              : "Unavailable"}
                          </button>

                          <button
                            className={styles.wishlistBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isAvailable) return;
                              addToCart(buildTreatmentCartItem(plan));
                            }}
                            aria-label="Add to cart"
                            title="Add to cart"
                          >
                            +
                          </button>

                          <button
                            className={styles.wishlistBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/treatment-plans/${getTreatmentSlug(plan)}`);
                            }}
                            aria-label="View details"
                            title="View details"
                          >
                            <FaEye />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <MobileNavbar />
    </>
  );
};

export default TreatmentListingPage;
