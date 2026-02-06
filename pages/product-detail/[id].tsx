"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/ProductDetailPage/ProductDetailPage.module.css";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { FaStar, FaRegHeart } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import { API_URL } from "@/config/api";

/* ================= REVIEW ================= */
interface Review {
  _id: string;
  user?: { name: string };
  rating: number;
  comment: string;
  createdAt: string;
}

/* ================= PRODUCT (ADMIN SCHEMA) ================= */
interface Product {
  _id: string;
  productName: string;
  brandName: string;
  category?: string;
  mrpPrice: number;
  discountedPrice: number;
  description?: string;
  productImages?: string[];
  quantity?: number;
  reviews?: Review[];
}

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] =
    useState<"details" | "services" | "reviews">("details");
  const [mainImage, setMainImage] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});

  /* ================= FETCH PRODUCT ================= */
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_URL}/products/${id}`);
        if (!res.ok) throw new Error("Product not found");

        const data: Product = await res.json();
        setProduct(data);
        setMainImage(data.productImages?.[0] || null);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  /* ================= REVIEW SUBMIT ================= */
  const handleSubmitReview = async () => {
    if (!rating || !comment.trim()) {
      alert("Please provide rating and comment");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/products/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, user: "Guest User" }),
      });

      if (!res.ok) throw new Error("Failed to submit review");

      const updated: Product = await res.json();
      setProduct(updated);
      setRating(0);
      setComment("");
    } catch (err) {
      alert("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= IMAGE ZOOM ================= */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImage) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;

    setZoomStyle({
      backgroundImage: `url(${mainImage})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "200%",
    });
  };

  const handleMouseLeave = () => setZoomStyle({});

  if (loading) return <p style={{ padding: 20 }}>Loading…</p>;
  if (!product) return <p style={{ padding: 20 }}>Product not found</p>;

  const price = product.mrpPrice || 0;
  const discount = product.discountedPrice || price;
  const hasDiscount = discount < price;

  const avgRating =
    product.reviews && product.reviews.length
      ? (
          product.reviews.reduce((a, b) => a + b.rating, 0) /
          product.reviews.length
        ).toFixed(1)
      : "0.0";

  return (
    <>
      <Topbar />

      <div className={styles.wrapper}>
        {/* ================= TOP ================= */}
        <div className={styles.topSection}>
          {/* LEFT */}
          <div className={styles.leftColumn}>
            {product.productImages && product.productImages.length > 1 && (
              <div className={styles.thumbnailList}>
                {product.productImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    className={`${styles.thumbnail} ${
                      mainImage === img ? styles.activeThumb : ""
                    }`}
                    onClick={() => setMainImage(img)}
                  />
                ))}
              </div>
            )}

            <div
              className={styles.mainImageWrapper}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={zoomStyle}
            >
              {mainImage ? (
                <img src={mainImage} className={styles.mainImage} />
              ) : (
                <div className={styles.noImage}>No Image</div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className={styles.rightColumn}>
            <p className={styles.breadcrumb}>{product.category}</p>
            <h1 className={styles.title}>{product.productName}</h1>
            <p className={styles.brand}>
              By <span>{product.brandName}</span>
            </p>

            {/* Rating */}
            <div className={styles.rating}>
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={`${styles.star} ${
                    i < Math.round(Number(avgRating))
                      ? styles.filledStar
                      : ""
                  }`}
                />
              ))}
              <span>
                {avgRating} ({product.reviews?.length || 0} reviews)
              </span>
              <FaRegHeart className={styles.icon} />
              <FiShare2 className={styles.icon} />
            </div>

            {/* PRICE */}
            <div className={styles.priceBox}>
              {hasDiscount && (
                <p className={styles.mrp}>
                  MRP <span>₹{price}</span>
                </p>
              )}

              <p className={styles.price}>
                ₹{discount}
                {hasDiscount && (
                  <span className={styles.discount}>
                    {Math.round(((price - discount) / price) * 100)}% OFF
                  </span>
                )}
              </p>

              <p className={styles.tax}>Inclusive of all taxes</p>
              <div className={styles.memberPrice}>
                ₹{Math.round(discount * 0.95)} for Premium Member
              </div>
            </div>

            {/* ACTIONS */}
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

              <button className={styles.addToCart}>Add To Cart</button>
              <button className={styles.buyNow}>Buy Now</button>
            </div>
          </div>
        </div>

        {/* ================= TABS ================= */}
        <div className={styles.tabContainer}>
          {["details", "services", "reviews"].map((t) => (
            <button
              key={t}
              className={`${styles.tabButton} ${
                activeTab === t ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab(t as any)}
            >
              {t === "details"
                ? "Details"
                : t === "services"
                ? "Product Information"
                : "Reviews"}
            </button>
          ))}
        </div>

        {/* ================= CONTENT ================= */}
        <div className={styles.tabContent}>
          {activeTab === "details" && (
            <div
              className={styles.description}
              dangerouslySetInnerHTML={{
                __html: product.description || "No details available",
              }}
            />
          )}

          {activeTab === "services" && (
            <ul>
              <li>
                <strong>Category:</strong> {product.category}
              </li>
              <li>
                <strong>Brand:</strong> {product.brandName}
              </li>
            </ul>
          )}

          {activeTab === "reviews" && (
            <>
              {product.reviews?.map((rev) => (
                <div key={rev._id} className={styles.reviewCard}>
                  <strong>{rev.user?.name || "Anonymous"}</strong>
                  <p>{rev.comment}</p>
                </div>
              ))}

              <div className={styles.addReview}>
                <div className={styles.ratingInput}>
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      onClick={() => setRating(i + 1)}
                      className={`${styles.star} ${
                        i < rating ? styles.filledStar : ""
                      }`}
                    />
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={styles.commentBox}
                />

                <button
                  className={styles.submitButton}
                  onClick={handleSubmitReview}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <MobileNavbar />
      <Footer />
    </>
  );
}
