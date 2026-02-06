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

export default function ProductDetail() {
  const router = useRouter();
  const { productid } = router.query;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "services" | "reviews">("details");
  const [mainImage, setMainImage] = useState<string | null>(null);

  // Zoom
  const [isZooming, setIsZooming] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  // New review form
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(0);
// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

  // Fetch product with reviews
  useEffect(() => {
    if (!productid) return;
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_URL}/products/${productid}`);
        setProduct(res.data);
        setMainImage(res.data.images?.[0] || null);
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
    const x = e.pageX - left;
    const y = e.pageY - top;
    const lensX = Math.max(0, Math.min(x, width));
    const lensY = Math.max(0, Math.min(y, height));
    setLensPosition({ x: lensX, y: lensY });
    setCursorPos({ x: e.pageX, y: e.pageY });
  };

  const handleReviewSubmit = async () => {
    if (!newComment.trim() || newRating === 0 || !productid) return;
    try {
      const res = await axios.post(`${API_URL}/products/${productid}/reviews`, {
        rating: newRating,
        comment: newComment,
        user: "Guest User", // Replace with logged-in user if available
      });
      setProduct((prev) => (prev ? { ...prev, reviews: res.data } : null));
      setNewComment("");
      setNewRating(0);
    } catch (err) {
      console.error("Error submitting review:", err);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (!product) return <p style={{ padding: 20 }}>Product not found</p>;

  // Average rating
  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

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
            </div>

            {isZooming && mainImage && (
              <div
                className={styles.zoomBox}
                style={{
                  top: cursorPos.y + 20,
                  left: cursorPos.x + 20,
                  backgroundImage: `url(${mainImage})`,
                  backgroundPosition: `${(lensPosition.x / (imageRef.current?.offsetWidth || 1)) * 100}% ${(lensPosition.y / (imageRef.current?.offsetHeight || 1)) * 100}%`,
                }}
              />
            )}
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
              <button className={styles.addToCart}>Add To Cart</button>
              <button className={styles.buyNow}>Buy Now</button>
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
