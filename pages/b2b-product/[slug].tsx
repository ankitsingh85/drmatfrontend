"use client";

import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";
import Footer from "@/components/Layout/Footer";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import Topbar from "@/components/Layout/Topbar";
import { useCart } from "@/context/CartContext";
import { resolveMediaUrl } from "@/lib/media";
import productImg from "@/public/product1.png";
import styles from "@/styles/Products.module.css";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { FaRegHeart, FaStar } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";

interface B2BProduct {
  _id: string;
  sku?: string;
  productName: string;
  category: string;
  brandName?: string;
  pricePerUnit?: number;
  mrp?: number;
  discountedPrice?: number;
  stockAvailable?: number;
  moq?: number;
  productImages?: string[];
  description?: string;
  certifications?: string;
  manufacturerName?: string;
}

interface ApiB2BProduct {
  _id?: string;
  sku?: string;
  productName?: string;
  category?: string | { _id?: string; id?: string; name?: string };
  brandName?: string;
  pricePerUnit?: number;
  mrp?: number;
  discountedPrice?: number;
  stockAvailable?: number;
  moq?: number;
  productImages?: string[];
  description?: string;
  certifications?: string;
  manufacturerName?: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeProduct = (raw: ApiB2BProduct): B2BProduct => {
  const category =
    typeof raw.category === "string"
      ? raw.category
      : raw.category?.name || raw.category?.id || raw.category?._id || "";

  return {
    _id: String(raw._id || ""),
    sku: raw.sku,
    productName: raw.productName || "",
    category: String(category || ""),
    brandName: raw.brandName || "",
    pricePerUnit: Number(raw.pricePerUnit || 0),
    mrp: Number(raw.mrp || 0),
    discountedPrice: Number(raw.discountedPrice || 0),
    stockAvailable: Number(raw.stockAvailable || 0),
    moq: Number(raw.moq || 0),
    productImages: Array.isArray(raw.productImages) ? raw.productImages : [],
    description: raw.description || "",
    certifications: raw.certifications || "",
    manufacturerName: raw.manufacturerName || "",
  };
};

export default function B2BProductDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { addToCart, cartItems } = useCart();

  const [product, setProduct] = useState<B2BProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] =
    useState<"details" | "information" | "reviews">("details");
  const [mainImage, setMainImage] = useState<string | null>(null);

  useEffect(() => {
    const key = Array.isArray(slug) ? slug[0] : slug;
    if (!key) return;

    const ac = new AbortController();

    const fetchProduct = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_URL}/b2b-products`, { signal: ac.signal });
        if (!res.ok) throw new Error("Failed to fetch B2B products");

        const data = await res.json();
        const list: ApiB2BProduct[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const normalized: B2BProduct[] = list
          .map((item: ApiB2BProduct) => normalizeProduct(item))
          .filter((item: B2BProduct) => item._id && item.productName);

        const resolvedKey = slugify(String(key));
        const matched =
          normalized.find((item: B2BProduct) => item._id === key) ||
          normalized.find((item: B2BProduct) => slugify(item.productName) === resolvedKey) ||
          normalized.find((item: B2BProduct) => slugify(item.sku || "") === resolvedKey);

        setProduct(matched || null);
        setMainImage(matched?.productImages?.[0] ? resolveMediaUrl(matched.productImages[0]) || matched.productImages[0] : null);
      } catch (error) {
        if ((error as any)?.name !== "AbortError") {
          console.error("Error fetching B2B product:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    return () => ac.abort();
  }, [slug]);

  const getImage = (img?: string) => {
    if (!img) return productImg.src;
    return resolveMediaUrl(img) || productImg.src;
  };

  const getCartPayload = () => {
    if (!product) return null;

    const salePrice = Number(
      product.discountedPrice ?? product.pricePerUnit ?? product.mrp ?? 0
    );
    const originalPrice = Number(product.mrp ?? product.pricePerUnit ?? salePrice);
    const actualSalePrice = Math.min(originalPrice, salePrice);
    const actualOriginalPrice = Math.max(originalPrice, salePrice);
    const hasDiscount = actualSalePrice < actualOriginalPrice && actualOriginalPrice > 0;
    const discountPercent = hasDiscount
      ? Math.round(((actualOriginalPrice - actualSalePrice) / actualOriginalPrice) * 100)
      : 0;

    return {
      id: product._id,
      name: product.productName,
      price: actualSalePrice,
      mrp: actualOriginalPrice,
      discount: hasDiscount ? `${discountPercent}% OFF` : undefined,
      company: product.brandName,
      image: product.productImages?.[0],
    };
  };

  const handleAddToCart = () => {
    const payload = getCartPayload();
    if (!payload) return;
    if (cartItems.some((item) => item.id === payload.id)) {
      router.push("/home/Cart");
      return;
    }
    addToCart(payload, quantity);
  };

  if (loading) return <FullPageLoader />;
  if (!product) return <p style={{ padding: 20 }}>B2B product not found</p>;

  const salePrice = Number(product.discountedPrice || product.pricePerUnit || product.mrp || 0);
  const mrp = Number(product.mrp || product.pricePerUnit || salePrice);
  const hasDiscount = salePrice > 0 && mrp > salePrice;
  const inCart = cartItems.some((item) => item.id === product._id);
  const thumbnails = product.productImages?.length ? product.productImages : [""];

  return (
    <>
      <Topbar />

      <div className={styles.wrapper}>
        <div className={styles.topSection}>
            <div className={styles.leftColumn}>
              <div className={styles.thumbnailWrapper}>
                {thumbnails.map((img, index) => (
                  <img
                    key={`${img}-${index}`}
                    src={getImage(img)}
                    alt={`${product.productName} ${index + 1}`}
                    className={styles.thumbnail}
                  onClick={() => setMainImage(getImage(img))}
                  />
                ))}
              </div>

              <div className={styles.mediaColumn}>
                <div className={styles.mainImageWrapper}>
                  <img
                  src={mainImage || getImage(product.productImages?.[0])}
                    alt={product.productName}
                    className={styles.mainImage}
                  />
                </div>
              </div>
          </div>

          <div className={styles.rightColumn}>
            <p className={styles.breadcrumb}>{product.category}</p>
            <h1 className={styles.title}>{product.productName}</h1>
            <p className={styles.brand}>
              By <span>{product.brandName || "Unknown"}</span>
            </p>

            <div className={styles.rating}>
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className={styles.star} />
              ))}
              <span>4.8 (B2B catalog)</span>
              <FaRegHeart className={styles.icon} />
              <FiShare2 className={styles.icon} />
            </div>

            <div className={styles.priceBox}>
              {hasDiscount && (
                <p className={styles.mrp}>
                  MRP: <span>Rs. {mrp}</span>
                </p>
              )}
              <p className={styles.price}>
                Price: <span>Rs. {salePrice}</span>
                {hasDiscount && (
                  <span className={styles.discount}>
                    {Math.round(((mrp - salePrice) / mrp) * 100)}% off
                  </span>
                )}
              </p>
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

              <button
                className={styles.buyNow}
                onClick={() => {
                  if (!inCart) handleAddToCart();
                  router.push("/home/Cart");
                }}
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        <div className={styles.tabContainer}>
          <button
            type="button"
            className={`${styles.tabButton} ${
              activeTab === "details" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${
              activeTab === "information" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("information")}
          >
            Product Information
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${
              activeTab === "reviews" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews
          </button>
        </div>

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

          {activeTab === "information" && (
            <section className={styles.detailsSection}>
              <h2 className={styles.title}>Product Information</h2>
              <ul>
                <li>
                  <strong>Category:</strong> {product.category}
                </li>
                <li>
                  <strong>Company:</strong> {product.brandName || "-"}
                </li>
                <li>
                  <strong>MOQ:</strong> {product.moq || 0}
                </li>
                <li>
                  <strong>Stock:</strong> {product.stockAvailable || 0}
                </li>
                <li>
                  <strong>SKU:</strong> {product.sku || "-"}
                </li>
                <li>
                  <strong>Manufacturer:</strong> {product.manufacturerName || "-"}
                </li>
                <li>
                  <strong>Certifications:</strong> {product.certifications || "-"}
                </li>
              </ul>
            </section>
          )}

          {activeTab === "reviews" && (
            <section className={styles.detailsSection}>
              <h2 className={styles.title}>Reviews</h2>
              <p>No reviews available for B2B products yet.</p>
            </section>
          )}
        </div>
      </div>

      <MobileNavbar />
      <Footer />
    </>
  );
}
