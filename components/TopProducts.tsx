"use client";

import { API_URL } from "@/config/api";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/topproducts.module.css";
import { useCart } from "@/context/CartContext";
import { FaCartPlus, FaHeart, FaSearch, FaArrowRight } from "react-icons/fa";

/* ================= ADMIN PRODUCT SHAPE ================= */
interface AdminProduct {
  _id: string;
  productName: string;
  brandName?: string;
  mrpPrice?: number;
  discountedPrice?: number;
  productImages?: string[];
}

/* ================= FRONTEND PRODUCT SHAPE ================= */
interface Product {
  id: string;
  name: string;
  company?: string;
  price: number;
  discountPrice?: number;
  images?: string[];
}

const MAX_TOP_PRODUCTS = 17;
const TOP_PRODUCTS_CACHE_KEY = "top-products-cache-v1";
const TOP_PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000;

const TopProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const router = useRouter();
  const { addToCart } = useCart();

  const normalizeProducts = (data: unknown): Product[] => {
    const arrayData = Array.isArray(data)
      ? (data as (AdminProduct | null)[])
      : [];

    return arrayData
      .filter((item): item is AdminProduct => Boolean(item && item._id))
      .slice(0, MAX_TOP_PRODUCTS)
      .map((p) => ({
        id: p._id,
        name: p.productName,
        company: p.brandName,
        price: Number(p.mrpPrice || 0),
        discountPrice: Number(p.discountedPrice || 0),
        images: p.productImages || [],
      }));
  };

  /* ================= IMAGE HANDLER ================= */
  const getImage = (img?: string) => {
    if (!img) return "/product1.png";
    if (img.startsWith("data:")) return img;
    return img;
  };

  /* ================= FETCH TOP PRODUCTS ================= */
  useEffect(() => {
    const fetchTopProducts = async () => {
      let hasFreshCache = false;

      try {
        const cached = localStorage.getItem(TOP_PRODUCTS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as {
            ts: number;
            products: Product[];
          };
          if (
            parsed &&
            Array.isArray(parsed.products) &&
            Date.now() - parsed.ts < TOP_PRODUCTS_CACHE_TTL_MS
          ) {
            setProducts(parsed.products);
            hasFreshCache = true;
          }
        }
      } catch {
        // ignore cache read errors
      }

      try {
        if (!hasFreshCache) setLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}/top-products`);
        if (!res.ok) throw new Error("Failed to fetch top products");

        const data = await res.json();
        const normalized = normalizeProducts(data);
        setProducts(normalized);

        try {
          localStorage.setItem(
            TOP_PRODUCTS_CACHE_KEY,
            JSON.stringify({ ts: Date.now(), products: normalized })
          );
        } catch {
          // ignore cache write errors
        }
      } catch (err: any) {
        if (!hasFreshCache) {
          setError(err.message || "Failed to load top products");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  /* ================= CART ================= */
  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();

    const rawPrice = product.price;
    const rawDiscount = product.discountPrice ?? rawPrice;
    const originalPrice = Math.max(rawPrice, rawDiscount);
    const salePrice = Math.min(rawPrice, rawDiscount);
    const hasDiscount = salePrice < originalPrice && originalPrice > 0;
    const discountPercent = hasDiscount
      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      : 0;

    addToCart({
      id: product.id,
      name: product.name,
      price: salePrice,
      mrp: originalPrice,
      discount: hasDiscount ? `${discountPercent}% OFF` : undefined,
    
      company: product.company,
      image: product.images?.[0],
    });
  };

  const handleBuyNow = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    router.push(`/checkout?product=${product.id}`);
  };

  return (
    <div className={styles.container}>
      {loading && products.length === 0 && <p>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        {products.map((product, idx) => {
          const rawPrice = product.price;
          const rawDiscount = product.discountPrice ?? rawPrice;
          const originalPrice = Math.max(rawPrice, rawDiscount);
          const salePrice = Math.min(rawPrice, rawDiscount);
          const hasDiscount = salePrice < originalPrice && originalPrice > 0;
          const discountPercent = hasDiscount
            ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
            : 0;

          return (
            <div
              key={product.id}
              className={styles.card}
              onClick={() => router.push(`/product-detail/${product.id}`)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className={styles.imageWrapper}>
                <img
                  src={getImage(product.images?.[0])}
                  className={styles.image}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                />

                {hasDiscount && (
                  <span className={styles.badge}>-{discountPercent}%</span>
                )}

                {hoveredIndex === idx && (
                  <div className={styles.overlay}>
                    <div className={styles.iconContainer}>
                      <FaCartPlus
                        className={styles.icon}
                        onClick={(e) => handleAddToCart(e, product)}
                      />
                      <FaHeart className={styles.icon} />
                      <FaSearch className={styles.icon} />
                    </div>
                  </div>
                )}
              </div>

              <h3 className={styles.name}>{product.name}</h3>

              {product.company && (
                <p className={styles.company}>{product.company}</p>
              )}

              <div className={styles.priceRow}>
                {hasDiscount ? (
                  <>
                    <span className={styles.discountPrice}>₹{salePrice}</span>
                    <span className={styles.originalPrice}>₹{originalPrice}</span>
                  </>
                ) : (
                  <span className={styles.discountPrice}>₹{originalPrice}</span>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.addToCart}
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  Add to Cart
                </button>
                <button
                  className={styles.buyNow}
                  onClick={(e) => handleBuyNow(e, product)}
                >
                  Buy Now
                </button>
              </div>
            </div>
          );
        })}

        {/* 🔥 SHOW MORE */}
        <div
          className={`${styles.card} ${styles.showMore}`}
          onClick={() => router.push("/products")}
        >
          <FaArrowRight size={32} />
          <span>Show More</span>
        </div>
      </div>
    </div>
  );
};

export default TopProducts;
