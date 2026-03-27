"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import styles from "@/styles/Products.module.css";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { FaStar, FaRegHeart } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl } from "@/lib/media";
import { useCart } from "@/context/CartContext";

interface Review {
  rating: number;
  comment: string;
  user?: string;
  createdAt?: string;
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  company?: string;
  price?: number;
  discountPrice?: number;
  quantity?: number;
  images?: string[];
  reviews: Review[];
}

interface ApiProduct {
  _id?: string;
  name?: string;
  productName?: string;
  description?: string;
  category?: string;
  company?: string;
  brandName?: string;
  price?: number;
  mrpPrice?: number;
  discountPrice?: number;
  discountedPrice?: number;
  quantity?: number;
  images?: string[];
  productImages?: string[];
  reviews?: Review[];
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function ProductDetail() {
  const router = useRouter();
  const { productid } = router.query;
  const { addToCart, cartItems } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [resolvedProductId, setResolvedProductId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "services" | "reviews">("details");
  const [mainImage, setMainImage] = useState<string | null>(null);

  // Zoom
  const [isZooming, setIsZooming] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  // New review form
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(0);
// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

  const getProductSlug = (raw: ApiProduct | Product) =>
    slugify(
      String(
        (raw as ApiProduct).name ||
          (raw as ApiProduct).productName ||
          (raw as Product).name ||
          (raw as Product)._id ||
          ""
      )
    );

  const normalizeProduct = (raw: ApiProduct): Product => ({
    _id: String(raw._id || ""),
    name: raw.name || raw.productName || "",
    description: raw.description,
    category: raw.category,
    company: raw.company || raw.brandName,
    price: Number(raw.price ?? raw.mrpPrice ?? 0),
    discountPrice: Number(
      raw.discountPrice ?? raw.discountedPrice ?? raw.price ?? raw.mrpPrice ?? 0
    ),
    quantity: raw.quantity,
    images: (raw.images || raw.productImages || []).map((img) => resolveMediaUrl(img) || img),
    reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
  });

  // Fetch product with reviews
  useEffect(() => {
    const key = Array.isArray(productid) ? productid[0] : productid;
    if (!key) return;
    setLoading(true);
    setResolvedProductId("");
    setProduct(null);

    const fetchProduct = async () => {
      try {
        const resolvedKey = slugify(String(key));
        const listRes = await axios.get(`${API_URL}/products`);
        const list = Array.isArray(listRes.data) ? listRes.data : [];
        const matched = list.find((item: ApiProduct) => {
          const itemSlug = getProductSlug(item);
          return item._id === key || itemSlug === resolvedKey;
        });

        const productId = String(matched?._id || key);
        setResolvedProductId(productId);
        const res = await axios.get(`${API_URL}/products/${productId}`);
        const normalized = normalizeProduct(res.data as ApiProduct);
        setProduct(normalized);
        setMainImage(normalized.images?.[0] || null);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productid]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const lensX = Math.max(0, Math.min(x, width));
    const lensY = Math.max(0, Math.min(y, height));
    setLensPosition({ x: lensX, y: lensY });
  };

  const handleReviewSubmit = async () => {
    const id = resolvedProductId || (Array.isArray(productid) ? productid[0] : productid);
    if (!newComment.trim() || newRating === 0 || !id) return;
    try {
      const res = await axios.post(`${API_URL}/products/${id}/reviews`, {
        rating: newRating,
        comment: newComment,
        user: "Guest User", // Replace with logged-in user if available
      });
      const normalized = normalizeProduct(res.data as ApiProduct);
      setProduct(normalized);
      setNewComment("");
      setNewRating(0);
    } catch (err) {
      console.error("Error submitting review:", err);
    }
  };

  if (loading) return <FullPageLoader />;
  if (!product) return <p style={{ padding: 20 }}>Product not found</p>;

  // Average rating
  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  const routeKey = Array.isArray(productid) ? productid[0] : productid;
  const cartProductId = String(product._id || resolvedProductId || routeKey || "");
  const mrp = Number(product.price ?? 0);
  const salePrice = Number(product.discountPrice ?? mrp);
  const hasDiscount = salePrice < mrp;
  const inCart = cartItems.some((item) => item.id === cartProductId);

  const buildCartPayload = () => ({
    id: cartProductId,
    name: product.name,
    price: salePrice,
    mrp: mrp || salePrice,
    discount: hasDiscount ? `${Math.round(((mrp - salePrice) / mrp) * 100)}% OFF` : undefined,
    discountPrice: salePrice,
    company: product.company,
    image: product.images?.[0],
    itemType: "product" as const,
  });

  const handleAddToCart = () => {
    if (!cartProductId) {
      alert("Unable to add this product right now. Please refresh and try again.");
      return;
    }
    if (inCart) {
      router.push("/home/Cart");
      return;
    }
    addToCart(buildCartPayload(), quantity);
  };

  const handleBuyNow = () => {
    if (!cartProductId) {
      alert("Unable to continue right now. Please refresh and try again.");
      return;
    }
    if (!inCart) {
      addToCart(buildCartPayload(), quantity);
    }
    router.push("/home/Cart");
  };

  return (
    <>
      <Topbar />
      <div className={styles.wrapper}>
        {/* TOP SECTION */}
        <div className={styles.topSection}>
          {/* LEFT COLUMN */}
          <div className={styles.leftColumn}>
            <div className={styles.thumbnailWrapper}>
              {product.images?.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${product.name} ${i}`}
                  className={`${styles.thumbnail} ${mainImage === img ? styles.activeThumbnail : ""}`}
                  onClick={() => setMainImage(img)}
                />
              ))}
            </div>

            <div className={styles.mediaColumn}>
              <div
                className={styles.mainImageWrapper}
                ref={imageRef}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleMouseMove}
              >
                {mainImage ? (
                  <img src={mainImage} alt={product.name} className={styles.mainImage} />
                ) : (
                  <div className={styles.noImage}>No Image</div>
                )}

                {isZooming && mainImage && (
                  <div
                    className={styles.lens}
                    style={{
                      left: Math.max(
                        0,
                        Math.min(
                          lensPosition.x - 110,
                          (imageRef.current?.offsetWidth || 0) - 220
                        )
                      ),
                      top: Math.max(
                        0,
                        Math.min(
                          lensPosition.y - 110,
                          (imageRef.current?.offsetHeight || 0) - 220
                        )
                      ),
                    }}
                  />
                )}
              </div>

              {mainImage && (
                <div
                  className={`${styles.zoomPane} ${isZooming ? styles.zoomPaneActive : ""}`}
                  style={{
                    backgroundImage: `url(${mainImage})`,
                    backgroundPosition: `${(lensPosition.x / (imageRef.current?.offsetWidth || 1)) * 100}% ${(lensPosition.y / (imageRef.current?.offsetHeight || 1)) * 100}%`,
                  }}
                >
                  <div className={styles.zoomPaneLabel}>
                    <span>Zoom View</span>
                    <small>Move over the image</small>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className={styles.rightColumn}>
            <p className={styles.breadcrumb}>{product.category}</p>
            <h1 className={styles.title}>{product.name}</h1>
            <p className={styles.brand}>
              By <span>{product.company || "Unknown"}</span>
            </p>

            <div className={styles.rating}>
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={`${styles.star} ${i < Math.round(averageRating) ? styles.starActive : ""}`}
                />
              ))}
              <span>
                {averageRating.toFixed(1)} ({product.reviews.length} reviews)
              </span>
              <FaRegHeart className={styles.icon} />
              <FiShare2 className={styles.icon} />
            </div>

            <div className={styles.priceBox}>
              {product.discountPrice && (
                <p className={styles.mrp}>
                  MRP: <span>₹{product.discountPrice}</span>
                </p>
              )}
              {product.price && (
                <p className={styles.price}>
                  Price: <span>₹{product.price}</span>
                  {product.discountPrice && (
                    <span className={styles.discount}>
                      {Math.round(((product.discountPrice - product.price) / product.discountPrice) * 100)}% off
                    </span>
                  )}
                </p>
              )}
              <p className={styles.tax}>Inclusive of all taxes</p>
            </div>

            <div className={styles.actions}>
              <div className={styles.quantity}>
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  <AiOutlineMinus />
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)}>
                  <AiOutlinePlus />
                </button>
              </div>
              <button className={styles.addToCart} onClick={handleAddToCart}>
                {inCart ? "Go To Cart" : "Add To Cart"}
              </button>
              <button className={styles.buyNow} onClick={handleBuyNow}>Buy Now</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === "details" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "services" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("services")}
          >
            Product Information
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "reviews" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === "details" && (
            <section className={styles.detailsSection}>
              <h2 className={styles.title}>Product Details</h2>
              {product.description ? (
                <div
                  className={styles.description}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p>No details available.</p>
              )}
            </section>
          )}

          {activeTab === "services" && (
            <section className={styles.detailsSection}>
              <h2 className={styles.title}>Product Information</h2>
              <ul>
                <li><strong>Category:</strong> {product.category}</li>
                <li><strong>Company:</strong> {product.company}</li>
                <li><strong>Quantity in Stock:</strong> {product.quantity}</li>
              </ul>
            </section>
          )}

          {activeTab === "reviews" && (
            <section className={styles.detailsSection}>
              <h2 className={styles.title}>Customer Reviews</h2>

              {/* Review Form */}
              <div className={styles.reviewForm}>
                <div className={styles.starsInput}>
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`${styles.starInput} ${i < newRating ? styles.starActive : ""}`}
                      onClick={() => setNewRating(i + 1)}
                    />
                  ))}
                </div>
                <textarea
                  className={styles.commentBox}
                  placeholder="Write your review..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button className={styles.submitReview} onClick={handleReviewSubmit}>
                  Submit Review
                </button>
              </div>

              {/* Reviews List */}
              <div className={styles.reviewsList}>
                {product.reviews.length === 0 ? (
                  <p>No reviews yet.</p>
                ) : (
                  product.reviews.map((rev, idx) => (
                    <div key={idx} className={styles.reviewItem}>
                      <div className={styles.reviewStars}>
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`${styles.starInput} ${i < rev.rating ? styles.starActive : ""}`}
                          />
                        ))}
                      </div>
                      <p className={styles.reviewComment}>{rev.comment}</p>
                      <small>{rev.user ?? "Anonymous"} •{" "}
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ""}
                      </small>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      </div>
      <MobileNavbar />
      <Footer />
    </>
  );
}
