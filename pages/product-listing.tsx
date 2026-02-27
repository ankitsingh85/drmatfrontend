"use client";

import { API_URL } from "@/config/api";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/ProductList.module.css";
import productImg from "@/public/product1.png";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import { useCart } from "@/context/CartContext";

interface Category {
  _id: string;
  name: string;
  imageUrl?: string;
}

interface Product {
  _id: string;
  productName: string;
  brandName: string;
  category: string;
  mrpPrice: number;
  discountedPrice: number;
  productImages: string[];
  createdAt: string;
}

interface ProductWithCategory extends Product {
  categoryObj?: Category | null;
}

interface StoredCategory {
  _id?: string;
  id?: string;
  name?: string;
}

const ProductListingPage: React.FC = () => {
  const router = useRouter();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const apiBaseUrl = API_URL.replace(/\/api\/?$/, "");

  const extractArray = (payload: unknown): any[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      if (Array.isArray(obj.products)) return obj.products as any[];
      if (Array.isArray(obj.data)) return obj.data as any[];
    }
    return [];
  };

  const normalizeCategories = (raw: unknown): Category[] =>
    extractArray(raw)
      .map((cat: any) => ({
        _id: String(cat?._id ?? cat?.id ?? ""),
        name: String(cat?.name ?? ""),
        imageUrl: cat?.imageUrl,
      }))
      .filter((cat) => cat._id && cat.name);

  const normalizeIdLike = (value: unknown): string => {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      const fromKnown =
        obj._id ?? obj.id ?? obj.$oid ?? (obj.valueOf && obj.valueOf());
      if (
        typeof fromKnown === "string" ||
        typeof fromKnown === "number"
      ) {
        return String(fromKnown).trim();
      }
    }
    return "";
  };

  const getImage = (img?: string) => {
    if (!img) return productImg.src;
    if (img.startsWith("data:")) return img;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    if (img.startsWith("/")) return `${apiBaseUrl}${img}`;
    return `data:image/jpeg;base64,${img}`;
  };

  const normalizeProduct = (p: any, cats: Category[]): ProductWithCategory => {
    const rawCategory = p?.category;
    const directCategoryId = normalizeIdLike(
      rawCategory?._id ?? rawCategory?.id ?? rawCategory
    );
    const rawCategoryName =
      typeof rawCategory === "string"
        ? rawCategory
        : String(rawCategory?.name ?? "");

    const categoryObjById =
      cats.find((c) => c._id === directCategoryId) || null;
    const categoryObjByName =
      !categoryObjById && rawCategoryName
        ? cats.find(
            (c) => c.name.toLowerCase() === rawCategoryName.toLowerCase()
          ) || null
        : null;

    const categoryObj = categoryObjById || categoryObjByName;
    const productCategoryId = categoryObj?._id ?? directCategoryId;

    return {
      _id: String(p?._id ?? p?.id ?? ""),
      productName: String(p?.productName ?? ""),
      brandName: String(p?.brandName ?? ""),
      category: productCategoryId,
      mrpPrice: Number(p?.mrpPrice ?? 0),
      discountedPrice: Number(p?.discountedPrice ?? p?.mrpPrice ?? 0),
      productImages: Array.isArray(p?.productImages) ? p.productImages : [],
      createdAt: String(p?.createdAt ?? ""),
      categoryObj,
    };
  };

  const resolveInitialCategoryId = (catData: Category[]): string | null => {
    const savedId = localStorage.getItem("selectedCategoryId");
    if (savedId && catData.some((c) => c._id === savedId)) return savedId;

    const storedCategory = localStorage.getItem("selectedCategory");
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
      console.error("Invalid selectedCategory in localStorage:", error);
    }

    return null;
  };

  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/products`),
      ]);

      if (!catRes.ok || !prodRes.ok) {
        throw new Error("Failed to fetch categories or products");
      }

      const catRaw = await catRes.json();
      const prodRaw = await prodRes.json();

      const catData = normalizeCategories(catRaw);
      const prodData = extractArray(prodRaw);

      const normalizedProducts = prodData
        .map((p) => normalizeProduct(p, catData))
        .filter((p) => p._id && p.productName);

      setCategories(catData);
      setProducts(normalizedProducts);

      const initialCategoryId = resolveInitialCategoryId(catData);
      if (initialCategoryId) {
        setSelectedCategoryId(initialCategoryId);
        localStorage.setItem("selectedCategoryId", initialCategoryId);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const selectedCategory =
    categories.find((cat) => cat._id === selectedCategoryId) || null;

  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        const matchesSearch =
          p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brandName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategoryId
          ? p.category === selectedCategoryId ||
            p.categoryObj?._id === selectedCategoryId
          : true;

        return matchesSearch && matchesCategory;
      }),
    [products, searchTerm, selectedCategoryId]
  );

  return (
    <>
      <Topbar hideHamburgerOnMobile />

      <section className={styles.shopSection}>
        <div className={styles.layoutWrapper}>
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Categories</h3>

            <div
              className={`${styles.sidebarCard} ${
                !selectedCategoryId ? styles.activeCategory : ""
              }`}
              onClick={() => {
                setSelectedCategoryId(null);
                localStorage.removeItem("selectedCategory");
                localStorage.removeItem("selectedCategoryId");
              }}
            >
              <img src={productImg.src} alt="All" className={styles.sidebarImage} />
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
                  localStorage.setItem("selectedCategoryId", cat._id);
                  localStorage.setItem("selectedCategory", JSON.stringify(cat));
                }}
              >
                <img
                  src={getImage(cat.imageUrl)}
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
                  placeholder="Search products..."
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className={styles.searchIcon}>Search</span>
              </div>
            </div>

            {loading ? (
              <p style={{ padding: 20 }}>Loading products...</p>
            ) : filteredProducts.length === 0 ? (
              <p style={{ padding: 20 }}>No products found.</p>
            ) : (
              <div className={styles.productGrid}>
                {filteredProducts.map((product) => {
                  const image = getImage(product.productImages?.[0]);
                  const price = Number(product.mrpPrice) || 0;
                  const discount = Number(product.discountedPrice) || price;
                  const hasDiscount = discount < price;

                  return (
                    <div
                      key={product._id}
                      className={styles.productCard}
                      onClick={() => router.push(`/product-detail/${product._id}`)}
                    >
                      <div className={styles.productItem}>
                        <img
                          src={image}
                          alt={product.productName}
                          className={styles.productImage}
                        />

                        <h3 className={styles.productName}>{product.productName}</h3>

                        <p className={styles.productSize}>{product.brandName}</p>

                        {product.categoryObj && (
                          <p className={styles.categoryName}>
                            Category: {product.categoryObj.name}
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

                        <button
                          className={styles.productButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart({
                              id: product._id,
                              name: product.productName,
                              price: discount,
                              mrp: price,
                              discount: hasDiscount
                                ? `${Math.round(((price - discount) / price) * 100)}% OFF`
                                : undefined,
                              discountPrice: discount,
                              company: product.brandName,
                              image: product.productImages?.[0],
                            });
                          }}
                        >
                          Add to Cart
                        </button>
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

export default ProductListingPage;
