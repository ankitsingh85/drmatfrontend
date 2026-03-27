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
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl } from "@/lib/media";
import { useCart } from "@/context/CartContext";

interface Review {
  _id: string;
  user?: { name: string };
  rating: number;
  comment: string;
  createdAt: string;
}

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
  const resolvedId = Array.isArray(id) ? id[0] : id;
  const { addToCart, cartItems } = useCart();

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

  useEffect(() => {
    if (!resolvedId) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_URL}/products/${resolvedId}`);
        if (!res.ok) throw new Error("Product not found");

        const data: Product = await res.json();
        setProduct(data);
        setMainImage(resolveMediaUrl(data.productImages?.[0]) || null);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [resolvedId]);

  const handleSubmitReview = async () => {
    if (!rating || !comment.trim()) {
      alert("Please provide rating and comment");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/products/${resolvedId}/reviews`, {
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

  if (loading) return <FullPageLoader />;
  if (!product) return <p style={{ padding: 20 }}>Product not found</p>;

  const price = product.mrpPrice || 0;
  const discount = product.discountedPrice || price;
  const hasDiscount = discount < price;
  const inCart = cartItems.some((item) => item.id === product._id);

  const buildCartPayload = () => ({
    id: product._id,
    name: product.productName,
    price: discount,
    mrp: price,
    discount: hasDiscount ? `${Math.round(((price - discount) / price) * 100)}% OFF` : undefined,
    discountPrice: discount,
    company: product.brandName,
    image: resolveMediaUrl(product.productImages?.[0]) || product.productImages?.[0],
    itemType: "product" as const,
  });

  const handleAddToCart = () => {
    if (inCart) {
      router.push("/home/Cart");
      return;
    }
    addToCart(buildCartPayload(), quantity);
  };

  const handleBuyNow = () => {
    if (!inCart) {
      addToCart(buildCartPayload(), quantity);
    }
    router.push("/home/Cart");
  };

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
        <div className={styles.topSection}>
          <div className={styles.leftColumn}>
            {product.productImages && product.productImages.length > 1 && (
              <div className={styles.thumbnailList}>
                {product.productImages.map((img, idx) => {
                  const resolvedImg = resolveMediaUrl(img) || img;
                  return (
                    <img
                      key={idx}
                      src={resolvedImg}
                      className={`${styles.thumbnail} ${
                        mainImage === resolvedImg ? styles.activeThumb : ""
                      }`}
                      onClick={() => setMainImage(resolvedImg)}
                    />
                  );
                })}
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

          <div className={styles.rightColumn}>
            <p className={styles.breadcrumb}>{product.category}</p>
            <h1 className={styles.title}>{product.productName}</h1>
            <p className={styles.brand}>
              By <span>{product.brandName}</span>
            </p>

            <div className={styles.rating}>
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={`${styles.star} ${
                    i < Math.round(Number(avgRating)) ? styles.filledStar : ""
                  }`}
                />
              ))}
              <span>
                {avgRating} ({product.reviews?.length || 0} reviews)
              </span>
              <FaRegHeart className={styles.icon} />
              <FiShare2 className={styles.icon} />
            </div>

            <div className={styles.priceBox}>
              {hasDiscount && (
                <p className={styles.mrp}>
                  MRP <span>Rs. {price}</span>
                </p>
              )}

              <p className={styles.price}>
                Rs. {discount}
                {hasDiscount && (
                  <span className={styles.discount}>
                    {Math.round(((price - discount) / price) * 100)}% OFF
                  </span>
                )}
              </p>

              <p className={styles.tax}>Inclusive of all taxes</p>
              <div className={styles.memberPrice}>
                Rs. {Math.round(discount * 0.95)} for Premium Member
              </div>
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
              <button className={styles.buyNow} onClick={handleBuyNow}>
                Buy Now
              </button>
            </div>
          </div>
        </div>

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
