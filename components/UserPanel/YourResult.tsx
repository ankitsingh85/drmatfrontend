"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import {
  FiClipboard,
  FiFileText,
  FiImage,
  FiPackage,
  FiShoppingBag,
  FiStar,
  FiTag,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import styles from "@/styles/userresult.module.css";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import { useCart } from "@/context/CartContext";

type TabKey =
  | "gallery"
  | "prescriptions"
  | "orders"
  | "reports"
  | "products"
  | "treatments"
  | "offers";

interface GalleryItem {
  _id?: string;
  title?: string;
  note?: string;
  beforeImage?: string;
  afterImage?: string;
  uploadedAt?: string;
}

interface MediaFileItem {
  _id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt?: string;
}

interface OrderProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  itemType?: "product" | "treatment";
}

interface OrderItem {
  _id: string;
  orderType?: "product" | "treatment";
  products: OrderProduct[];
  totalAmount: number;
  address: { type: string; address: string };
  createdAt: string;
  paymentStatus?: string;
  status?: "Pending" | "Shipped" | "Delivered" | "Cancelled";
}

interface RecommendedProduct {
  _id?: string;
  name?: string;
  productName?: string;
  company?: string;
  brandName?: string;
  price?: number | string;
  mrpPrice?: number | string;
  discountPrice?: number | string;
  discountedPrice?: number | string;
  image?: string;
  images?: string[] | null;
  productImages?: string[] | null;
}

interface RecommendedTreatment {
  _id: string;
  treatmentName: string;
  serviceCategory?: string;
  mrp?: number;
  offerPrice?: number;
  treatmentImages?: string[];
}

interface OfferClinicRef {
  _id?: string;
  slug?: string;
  clinicName?: string;
}

interface OfferProductRef {
  _id?: string;
  productName?: string;
}

interface Offer {
  _id: string;
  imageBase64: string;
  clinicId?: string | OfferClinicRef | null;
  productId?: string | OfferProductRef | null;
}

interface UserResultProps {
  userId?: string;
  userName?: string;
  initialTab?: TabKey;
}

const emptyGalleryForm = {
  title: "",
  note: "",
  beforeImage: null as File | null,
  afterImage: null as File | null,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatMoney = (value?: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function YourResult({ userId, userName, initialTab }: UserResultProps) {
  const router = useRouter();
  const { addToCart, cartItems, toggleWishlist, wishlistItems } = useCart();
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab || "gallery");
  const [loading, setLoading] = useState(true);
  const [savingGallery, setSavingGallery] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [savingTestReport, setSavingTestReport] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<MediaFileItem[]>([]);
  const [testReports, setTestReports] = useState<MediaFileItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [recommendedTreatments, setRecommendedTreatments] = useState<RecommendedTreatment[]>(
    []
  );
  const [specialOffers, setSpecialOffers] = useState<Offer[]>([]);
  const [galleryForm, setGalleryForm] = useState(emptyGalleryForm);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [testReportFile, setTestReportFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [beforePreview, setBeforePreview] = useState("");
  const [afterPreview, setAfterPreview] = useState("");

  const counts = useMemo(
    () => ({
      gallery: galleryItems.length,
      prescriptions: prescriptions.length,
      testReports: testReports.length,
      orders: orders.length,
    }),
    [galleryItems.length, prescriptions.length, testReports.length, orders.length]
  );

  useEffect(() => {
    setActiveTab(initialTab || "gallery");
  }, [initialTab]);

  useEffect(() => {
    if (!galleryForm.beforeImage) {
      setBeforePreview("");
      return;
    }
    const url = URL.createObjectURL(galleryForm.beforeImage);
    setBeforePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [galleryForm.beforeImage]);

  useEffect(() => {
    if (!galleryForm.afterImage) {
      setAfterPreview("");
      return;
    }
    const url = URL.createObjectURL(galleryForm.afterImage);
    setAfterPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [galleryForm.afterImage]);

  useEffect(() => {
    const fetchResultMedia = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_URL}/users/${userId}`);
        if (!res.ok) throw new Error("Failed to load result media");

        const data = await res.json();
        setGalleryItems(Array.isArray(data.resultGallery) ? data.resultGallery : []);
        setPrescriptions(Array.isArray(data.prescriptions) ? data.prescriptions : []);
        setTestReports(Array.isArray(data.testReports) ? data.testReports : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load your results");
      } finally {
        setLoading(false);
      }
    };
    

    fetchResultMedia();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const token = typeof window !== "undefined" ? Cookies.get("token") || "" : "";

    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${API_URL}/orders/my`, {
          headers: {
            "x-user-id": userId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch user orders:", err);
      }
    };

    fetchOrders();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const fetchRecommendations = async () => {
      try {
        const [productsRes, treatmentRes, specialOfferRes] =
          await Promise.all([
            fetch(`${API_URL}/top-products`),
            fetch(`${API_URL}/treatment-plans`),
            fetch(`${API_URL}/offer1`),
          ]);

        const products = await productsRes.json().catch(() => []);
        const treatments = await treatmentRes.json().catch(() => []);
        const special = await specialOfferRes.json().catch(() => []);

        const normalizedProducts = Array.isArray(products)
          ? products
              .filter((item: any) => Boolean(item))
              .map((item: any) => ({
                _id: item._id || item.id || item.name,
                name: item.name || item.productName || "Product",
                productName: item.productName || item.name || "Product",
                company: item.company || item.brandName || "",
                brandName: item.brandName || item.company || "",
                price: item.price ?? item.mrpPrice ?? item.discountPrice ?? item.discountedPrice ?? 0,
                mrpPrice: item.mrpPrice ?? item.price ?? 0,
                discountPrice: item.discountPrice ?? item.discountedPrice ?? item.price ?? 0,
                discountedPrice: item.discountedPrice ?? item.discountPrice ?? item.price ?? 0,
                image:
                  item.image ||
                  item.images?.[0] ||
                  item.productImages?.[0] ||
                  "",
              }))
              .slice(0, 8)
          : [];

        setRecommendedProducts(normalizedProducts);
        setRecommendedTreatments(
          Array.isArray(treatments) ? treatments.slice(0, 8) : []
        );
        setSpecialOffers(Array.isArray(special) ? special.slice(0, 8) : []);
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
      }
    };

    fetchRecommendations();
  }, [userId]);

  const handleGalleryFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "beforeImage" || name === "afterImage") {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setGalleryForm((prev) => ({ ...prev, [name]: file }));
      return;
    }

    setGalleryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrescriptionFile(e.target.files?.[0] || null);
  };

  const handleTestReportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestReportFile(e.target.files?.[0] || null);
  };

  const uploadGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!galleryForm.beforeImage && !galleryForm.afterImage) {
      alert("Please choose at least one image");
      return;
    }

    const formData = new FormData();
    formData.append("title", galleryForm.title.trim());
    formData.append("note", galleryForm.note.trim());
    if (galleryForm.beforeImage) formData.append("beforeImage", galleryForm.beforeImage);
    if (galleryForm.afterImage) formData.append("afterImage", galleryForm.afterImage);

    try {
      setSavingGallery(true);
      const res = await fetch(`${API_URL}/users/${userId}/result-gallery`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload gallery item");

      setGalleryItems(Array.isArray(data.resultGallery) ? data.resultGallery : []);
      setGalleryForm(emptyGalleryForm);
      alert("Gallery item uploaded successfully");
    } catch (err: any) {
      alert(err.message || "Failed to upload gallery item");
    } finally {
      setSavingGallery(false);
    }
  };

  const uploadPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !prescriptionFile) return;

    const formData = new FormData();
    formData.append("file", prescriptionFile);

    try {
      setSavingPrescription(true);
      const res = await fetch(`${API_URL}/users/${userId}/prescriptions`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload prescription");

      setPrescriptions(Array.isArray(data.prescriptions) ? data.prescriptions : []);
      setPrescriptionFile(null);
      alert("Prescription uploaded successfully");
    } catch (err: any) {
      alert(err.message || "Failed to upload prescription");
    } finally {
      setSavingPrescription(false);
    }
  };

  const uploadTestReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !testReportFile) return;

    const formData = new FormData();
    formData.append("file", testReportFile);

    try {
      setSavingTestReport(true);
      const res = await fetch(`${API_URL}/users/${userId}/test-reports`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload test report");

      setTestReports(Array.isArray(data.testReports) ? data.testReports : []);
      setTestReportFile(null);
      alert("Test report uploaded successfully");
    } catch (err: any) {
      alert(err.message || "Failed to upload test report");
    } finally {
      setSavingTestReport(false);
    }
  };

  const deleteGalleryItem = async (itemId?: string, side?: "before" | "after") => {
    if (!userId || !itemId) return;

    try {
      const res = await fetch(
        `${API_URL}/users/${userId}/result-gallery/${itemId}${side ? `?side=${side}` : ""}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete gallery item");
      setGalleryItems(Array.isArray(data.resultGallery) ? data.resultGallery : []);
    } catch (err: any) {
      alert(err.message || "Failed to delete gallery item");
    }
  };

  const deletePrescription = async (itemId?: string) => {
    if (!userId || !itemId) return;

    try {
      const res = await fetch(`${API_URL}/users/${userId}/prescriptions/${itemId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete prescription");
      setPrescriptions(Array.isArray(data.prescriptions) ? data.prescriptions : []);
    } catch (err: any) {
      alert(err.message || "Failed to delete prescription");
    }
  };

  const deleteTestReport = async (itemId?: string) => {
    if (!userId || !itemId) return;

    try {
      const res = await fetch(`${API_URL}/users/${userId}/test-reports/${itemId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete test report");
      setTestReports(Array.isArray(data.testReports) ? data.testReports : []);
    } catch (err: any) {
      alert(err.message || "Failed to delete test report");
    }
  };

  const openProduct = (product: RecommendedProduct) => {
    router.push(`/product/${slugify(product.productName || product.name || product._id || "product")}`);
  };

  const openTreatment = (treatment: RecommendedTreatment) => {
    router.push(`/treatment-plans/${slugify(treatment.treatmentName || treatment._id)}`);
  };

  const openSpecialOffer = (offer: Offer) => {
    const product =
      offer.productId && typeof offer.productId === "object"
        ? offer.productId
        : undefined;
    const productId = typeof offer.productId === "string" ? offer.productId : "";
    const slugSource = product?.productName || product?._id || productId || offer._id;
    router.push(`/product/${slugify(String(slugSource))}`);
  };

  const getProductCartPayload = (product: RecommendedProduct) => {
    const salePrice = Number(
      product.discountedPrice ??
        product.discountPrice ??
        product.price ??
        product.mrpPrice ??
        0
    );
    const originalPrice = Number(product.mrpPrice ?? product.price ?? salePrice);
    const actualSalePrice = Math.min(originalPrice, salePrice);
    const actualOriginalPrice = Math.max(originalPrice, salePrice);
    const hasDiscount = actualSalePrice < actualOriginalPrice && actualOriginalPrice > 0;
    const discountPercent = hasDiscount
      ? Math.round(((actualOriginalPrice - actualSalePrice) / actualOriginalPrice) * 100)
      : 0;

    return {
      id: String(product._id || product.name || "product"),
      name: product.productName || product.name || "Product",
      price: actualSalePrice,
      mrp: actualOriginalPrice,
      discount: hasDiscount ? `${discountPercent}% OFF` : undefined,
      company: product.brandName || product.company,
      image:
        resolveMediaUrl(product.image || product.images?.[0] || product.productImages?.[0]) ||
        product.image ||
        product.images?.[0] ||
        product.productImages?.[0],
    };
  };

  const handleAddToCart = (
    e: React.MouseEvent<HTMLButtonElement>,
    product: RecommendedProduct
  ) => {
    e.stopPropagation();
    const payload = getProductCartPayload(product);
    const alreadyInCart = cartItems.some((item) => item.id === payload.id);
    if (alreadyInCart) {
      router.push("/home/Cart");
      return;
    }

    addToCart(payload);
  };

  const handleWishlistClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    product: RecommendedProduct
  ) => {
    e.stopPropagation();
    toggleWishlist(getProductCartPayload(product));
  };

  const getOrderTitle = (order: OrderItem) => order.products?.[0]?.name || "order";

  if (!userId) {
    return (
      <div className={styles.shell}>
        <div className={styles.emptyState}>
          <h2>Your Result</h2>
          <p>We need a logged in user before we can show result uploads.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.shell}>
        <div className={styles.loadingCard}>Loading your results...</div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.hero}>
        <div>
          <p className={styles.kicker}>Patient media center</p>
          <h2 className={styles.title}>Your Result</h2>
          <p className={styles.subtitle}>
            Keep a clean record of your progress, media, orders, and recommendations.
          </p>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span>{counts.gallery}</span>
            <small>Gallery items</small>
          </div>
          <div className={styles.statCard}>
            <span>{counts.prescriptions}</span>
            <small>Prescriptions</small>
          </div>
          <div className={styles.statCard}>
            <span>{counts.testReports}</span>
            <small>Test reports</small>
          </div>
          <div className={styles.statCard}>
            <span>{counts.orders}</span>
            <small>Your orders</small>
          </div>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.tabBar} role="tablist" aria-label="Your result tabs">
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "gallery" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("gallery")}
        >
          <FiImage />
          <span>Your Gallery</span>
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${
            activeTab === "prescriptions" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("prescriptions")}
        >
          <FiFileText />
          <span>Prescriptions</span>
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "orders" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <FiShoppingBag />
          <span>Your Order</span>
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "reports" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          <FiClipboard />
          <span>Online Test Report</span>
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "products" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <FiPackage />
          <span>Recommended Products</span>
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${
            activeTab === "treatments" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("treatments")}
        >
          <FiTag />
          <span>Recommended Treatments</span>
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "offers" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("offers")}
        >
          <FiStar />
          <span>Special Offers</span>
        </button>
      </div>

      {activeTab === "gallery" && (
        <div className={styles.galleryLayout}>
          <form className={`${styles.panelCard} ${styles.galleryUploadCard}`} onSubmit={uploadGallery}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Before and after gallery</h3>
                <p>Upload both images as one smooth story, then keep them together below.</p>
              </div>
              <FiUpload className={styles.panelIcon} />
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Title</span>
                <input
                  name="title"
                  value={galleryForm.title}
                  onChange={handleGalleryFieldChange}
                  placeholder="Example: Acne improvement"
                />
              </label>

              <label className={styles.field}>
                <span>Note</span>
                <textarea
                  name="note"
                  value={galleryForm.note}
                  onChange={handleGalleryFieldChange}
                  placeholder="Short note about this progress"
                  rows={4}
                />
              </label>
            </div>

            <div className={styles.galleryUploadGrid}>
              <label className={styles.dropzone}>
                <input
                  type="file"
                  accept="image/*"
                  name="beforeImage"
                  onChange={handleGalleryFieldChange}
                />
                {beforePreview ? (
                  <img src={beforePreview} alt="Before preview" />
                ) : (
                  <div>
                    <FiImage />
                    <strong>Before image</strong>
                    <span>Click to choose a file</span>
                  </div>
                )}
              </label>

              <label className={styles.dropzone}>
                <input
                  type="file"
                  accept="image/*"
                  name="afterImage"
                  onChange={handleGalleryFieldChange}
                />
                {afterPreview ? (
                  <img src={afterPreview} alt="After preview" />
                ) : (
                  <div>
                    <FiImage />
                    <strong>After image</strong>
                    <span>Click to choose a file</span>
                  </div>
                )}
              </label>
            </div>

            <button type="submit" className={styles.primaryBtn} disabled={savingGallery}>
              {savingGallery ? "Uploading..." : "Save Gallery Entry"}
            </button>
          </form>

          <div className={styles.gallerySavedSection}>
            <div className={styles.sectionHeading}>
              <h3>Saved gallery entries</h3>
              <p>Latest uploads appear first.</p>
            </div>

            {galleryItems.length === 0 ? (
              <div className={styles.emptyState}>
                <h4>No gallery items yet</h4>
                <p>Your before and after photos will show here after upload.</p>
              </div>
            ) : (
              <div className={styles.galleryList}>
                {galleryItems.map((item) => (
                  <article className={styles.resultCard} key={item._id}>
                    <div className={styles.resultMediaGrid}>
                      <figure className={styles.mediaBox}>
                        <span>Before</span>
                        {item.beforeImage ? (
                          <img
                            src={resolveMediaUrl(item.beforeImage) || item.beforeImage}
                            alt="Before"
                          />
                        ) : (
                          <div className={styles.mediaFallback}>No before image</div>
                        )}
                      </figure>

                      <figure className={styles.mediaBox}>
                        <span>After</span>
                        {item.afterImage ? (
                          <img
                            src={resolveMediaUrl(item.afterImage) || item.afterImage}
                            alt="After"
                          />
                        ) : (
                          <div className={styles.mediaFallback}>No after image</div>
                        )}
                      </figure>
                    </div>

                    <div className={styles.resultMeta}>
                      <div>
                        <h4>{item.title || "Untitled progress"}</h4>
                        <p>{item.note || "No note added for this entry."}</p>
                      </div>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => deleteGalleryItem(item._id)}
                      >
                        <FiTrash2 />
                        Delete Entry
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "prescriptions" && (
        <div className={styles.contentGrid}>
          <form className={styles.panelCard} onSubmit={uploadPrescription}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Upload a prescription</h3>
                <p>Keep your medicine history in one place.</p>
              </div>
              <FiFileText className={styles.panelIcon} />
            </div>

            <label className={styles.pdfDropzone}>
              <input type="file" accept="application/pdf" onChange={handlePrescriptionChange} />
              <div>
                <FiFileText />
                <strong>{prescriptionFile ? prescriptionFile.name : "Choose a PDF file"}</strong>
                <span>{prescriptionFile ? "Ready to upload" : "Click to attach prescription PDF"}</span>
              </div>
            </label>

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={savingPrescription || !prescriptionFile}
            >
              {savingPrescription ? "Uploading..." : "Upload Prescription"}
            </button>
          </form>

          <div className={styles.listColumn}>
            <div className={styles.sectionHeading}>
              <h3>Uploaded prescriptions</h3>
              <p>Open the PDF or remove it anytime.</p>
            </div>

            {prescriptions.length === 0 ? (
              <div className={styles.emptyState}>
                <h4>No prescriptions uploaded</h4>
                <p>Your uploaded prescription PDFs will appear here.</p>
              </div>
            ) : (
              <div className={styles.prescriptionList}>
                {prescriptions.map((item) => {
                  const fileUrl = resolveMediaUrl(item.fileUrl) || item.fileUrl;
                  return (
                    <article className={styles.prescriptionCard} key={item._id}>
                      <div className={styles.prescriptionInfo}>
                        <FiFileText className={styles.prescriptionIcon} />
                        <div>
                          <h4>{item.fileName}</h4>
                          <p>PDF prescription</p>
                        </div>
                      </div>

                      <div className={styles.prescriptionActions}>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.linkBtn}
                        >
                          Open PDF
                        </a>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => deletePrescription(item._id)}
                        >
                          <FiTrash2 />
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className={styles.listColumn}>
          <div className={styles.sectionHeading}>
            <h3>Your Orders</h3>
            <p>Only orders linked to your account are shown here.</p>
          </div>

          {orders.length === 0 ? (
            <div className={styles.emptyState}>
              <h4>No orders found</h4>
              <p>Once you place an order, it will appear here automatically.</p>
            </div>
          ) : (
            <div className={styles.orderList}>
              {orders.map((order) => (
                <article key={order._id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div>
                      <h4>{getOrderTitle(order)}</h4>
                      <p>Order #{order._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <span className={styles.orderBadge}>{order.orderType || "product"}</span>
                  </div>

                  <div className={styles.orderMetaGrid}>
                    <div>
                      <small>Date</small>
                      <strong>{new Date(order.createdAt).toLocaleDateString("en-IN")}</strong>
                    </div>
                    <div>
                      <small>Total</small>
                      <strong>{formatMoney(order.totalAmount)}</strong>
                    </div>
                    <div>
                      <small>Payment</small>
                      <strong>{order.paymentStatus || "Pending"}</strong>
                    </div>
                    
                  </div>

                  <p className={styles.orderAddress}>
                    {order.address?.type || "Address"}: {order.address?.address || "-"}
                  </p>

                  <div className={styles.orderItems}>
                    {order.products.map((item) => (
                      <div key={`${order._id}-${item.id}`} className={styles.orderItem}>
                        {item.image ? (
                          <img
                            src={resolveMediaUrl(item.image) || item.image}
                            alt={item.name}
                            className={styles.orderItemImage}
                          />
                        ) : (
                          <div className={styles.orderItemFallback}>No image</div>
                        )}
                        <div className={styles.orderItemText}>
                          <strong>{item.name}</strong>
                          <span>
                            {item.quantity} x {formatMoney(item.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* {activeTab === "reports" && (
        <div className={styles.contentGrid}>
          <form className={styles.panelCard} onSubmit={uploadTestReport}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Online test report</h3>
                <p>Upload PDF or image reports for quick reference.</p>
              </div>
              <FiClipboard className={styles.panelIcon} />
            </div>

            <label className={styles.pdfDropzone}>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleTestReportChange}
              />
              <div>
                <FiClipboard />
                <strong>{testReportFile ? testReportFile.name : "Choose a file"}</strong>
                <span>{testReportFile ? "Ready to upload" : "Click to attach test report"}</span>
              </div>
            </label>

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={savingTestReport || !testReportFile}
            >
              {savingTestReport ? "Uploading..." : "Upload Test Report"}
            </button>
          </form>

          <div className={styles.listColumn}>
            <div className={styles.sectionHeading}>
              <h3>Uploaded reports</h3>
              <p>Open, review, or remove them anytime.</p>
            </div>

            {testReports.length === 0 ? (
              <div className={styles.emptyState}>
                <h4>No reports uploaded</h4>
                <p>Your uploaded test reports will appear here.</p>
              </div>
            ) : (
              <div className={styles.prescriptionList}>
                {testReports.map((item) => {
                  const fileUrl = resolveMediaUrl(item.fileUrl) || item.fileUrl;
                  const isPdf = item.fileType === "application/pdf";
                  return (
                    <article className={styles.prescriptionCard} key={item._id}>
                      <div className={styles.prescriptionInfo}>
                        <FiFileText className={styles.prescriptionIcon} />
                        <div>
                          <h4>{item.fileName}</h4>
                          <p>{isPdf ? "PDF report" : "Image report"}</p>
                        </div>
                      </div>

                      <div className={styles.prescriptionActions}>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.linkBtn}
                        >
                          Open Report
                        </a>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => deleteTestReport(item._id)}
                        >
                          <FiTrash2 />
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )} */}

      {activeTab === "products" && (
        <div className={styles.listColumn}>
          <div className={styles.sectionHeading}>
            <h3>Recommended products</h3>
            <p>Some products we think may be relevant for you.</p>
          </div>

          {recommendedProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <h4>No product recommendations</h4>
              <p>Recommended products will appear here.</p>
            </div>
          ) : (
            <div className={styles.topProductGrid}>
              {recommendedProducts
                .filter((product): product is RecommendedProduct => Boolean(product && product._id))
                .map((product) => {
                const payload = getProductCartPayload(product);
                const imageSource = payload.image;
                const image = resolveMediaUrl(imageSource) || imageSource;
                const rawPrice = Number(product.price ?? product.mrpPrice ?? 0);
                const rawDiscount = Number(
                  product.discountedPrice ?? product.discountPrice ?? rawPrice
                );
                const originalPrice = Math.max(rawPrice, rawDiscount);
                const salePrice = Math.min(rawPrice, rawDiscount);
                const hasDiscount = salePrice < originalPrice && originalPrice > 0;
                const discountPercent = hasDiscount
                  ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
                  : 0;
                const inWishlist = wishlistItems.some((item) => item.id === payload.id);
                return (
                  <article
                    key={product._id}
                    className={styles.topProductCard}
                    onClick={() => openProduct(product)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openProduct(product);
                    }}
                  >
                    <div className={styles.topProductImageWrap}>
                      {image ? (
                        <img
                          src={image}
                          alt={product.productName || product.name || "Product"}
                          className={styles.topProductImage}
                        />
                      ) : (
                        <div className={styles.mediaFallback}>No image</div>
                      )}
                      {hasDiscount && (
                        <span className={styles.topProductBadge}>Save {discountPercent}%</span>
                      )}
                    </div>

                    <div className={styles.topProductBody}>
                      <h4 className={styles.topProductName}>
                        {product.productName || product.name}
                      </h4>
                      <p className={styles.topProductCompany}>
                        {product.brandName || product.company || ""}
                      </p>

                      <div className={styles.topProductMetaRow}>
                        <div className={styles.topProductPriceGroup}>
                          <span className={styles.topProductPrice}>
                            Rs. {salePrice.toFixed(0)}
                          </span>
                          {hasDiscount && (
                            <span className={styles.topProductOriginalPrice}>
                              Rs. {originalPrice.toFixed(0)}
                            </span>
                          )}
                        </div>
                        <span className={styles.topProductUnit}>1 piece</span>
                      </div>

                      <div className={styles.topProductActions}>
                        <button
                          type="button"
                          className={styles.topProductAddBtn}
                          onClick={(e) => handleAddToCart(e, product)}
                        >
                          {cartItems.some((item) => item.id === payload.id)
                            ? "Go to Cart"
                            : "Add to Cart"}
                        </button>

                        <button
                          type="button"
                          className={styles.topProductWishBtn}
                          aria-label="Add to wishlist"
                          onClick={(e) => handleWishlistClick(e, product)}
                        >
                          {inWishlist ? <FaHeart /> : <FaRegHeart />}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "treatments" && (
        <div className={styles.listColumn}>
          <div className={styles.sectionHeading}>
            <h3>Recommended treatments</h3>
            <p>Useful treatment plans from the clinic catalog.</p>
          </div>

          {recommendedTreatments.length === 0 ? (
            <div className={styles.emptyState}>
              <h4>No treatment recommendations</h4>
              <p>Recommended treatment plans will appear here.</p>
            </div>
          ) : (
            <div className={styles.topProductGrid}>
              {recommendedTreatments.map((treatment) => {
                const image =
                  resolveMediaUrl(treatment.treatmentImages?.[0]) ||
                  treatment.treatmentImages?.[0];
                const rawPrice = Number(treatment.mrp ?? 0);
                const rawDiscount = Number(treatment.offerPrice ?? rawPrice);
                const originalPrice = Math.max(rawPrice, rawDiscount);
                const salePrice = Math.min(rawPrice, rawDiscount);
                const hasDiscount = salePrice < originalPrice && originalPrice > 0;
                const discountPercent = hasDiscount
                  ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
                  : 0;
                return (
                  <article
                    key={treatment._id}
                    className={styles.topProductCard}
                    onClick={() => openTreatment(treatment)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openTreatment(treatment);
                    }}
                  >
                    <div className={styles.topProductImageWrap}>
                      {image ? (
                        <img
                          src={image}
                          alt={treatment.treatmentName}
                          className={styles.topProductImage}
                        />
                      ) : (
                        <div className={styles.mediaFallback}>No image</div>
                      )}
                      {hasDiscount && (
                        <span className={styles.topProductBadge}>Save {discountPercent}%</span>
                      )}
                    </div>

                    <div className={styles.topProductBody}>
                      <h4 className={styles.topProductName}>{treatment.treatmentName}</h4>
                      <p className={styles.topProductCompany}>
                        {treatment.serviceCategory || "Treatment plan"}
                      </p>

                      <div className={styles.topProductMetaRow}>
                        <div className={styles.topProductPriceGroup}>
                          <span className={styles.topProductPrice}>
                            Rs. {salePrice.toFixed(0)}
                          </span>
                          {hasDiscount && (
                            <span className={styles.topProductOriginalPrice}>
                              Rs. {originalPrice.toFixed(0)}
                            </span>
                          )}
                        </div>
                        <span className={styles.topProductUnit}>1 piece</span>
                      </div>

                      <div className={styles.topProductActions}>
                        <button
                          type="button"
                          className={styles.topProductAddBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/treatment-plans/${slugify(treatment.treatmentName || treatment._id)}`);
                          }}
                        >
                          View Treatment
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "offers" && (
        <div className={styles.listColumn}>
          <div className={styles.sectionHeading}>
            <h3>Special offers</h3>
            <p>Current product offers available in the system.</p>
          </div>

          {specialOffers.length === 0 ? (
            <div className={styles.emptyState}>
              <h4>No special offers</h4>
              <p>Special product offers will appear here.</p>
            </div>
          ) : (
            <div className={styles.specialOfferGrid}>
              {specialOffers.map((offer) => (
                <article
                  key={offer._id}
                  className={styles.topProductCard}
                  onClick={() => openSpecialOffer(offer)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openSpecialOffer(offer);
                  }}
                >
                  <div className={styles.topProductImageWrap}>
                    <img
                      src={resolveMediaUrl(offer.imageBase64) || offer.imageBase64}
                      alt="Special offer"
                      className={styles.topProductImage}
                    />
                    <span className={styles.topProductBadge}>Offer</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {userName && (
        <p className={styles.footerNote}>
          Viewing result records for <strong>{userName}</strong>.
        </p>
      )}
    </div>
  );
}
