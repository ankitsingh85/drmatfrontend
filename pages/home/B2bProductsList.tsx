"use client";

import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";
import Footer from "@/components/Layout/Footer";
import Topbar from "@/components/Layout/Topbar";
import { useCart } from "@/context/CartContext";
import productImg from "@/public/product1.png";
import styles from "@/styles/ProductList.module.css";
import { resolveMediaUrl } from "@/lib/media";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

interface Category {
  _id: string;
  name: string;
  imageUrl?: string;
}

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

interface B2BProductWithCategory extends B2BProduct {
  categoryObj?: Category | null;
}

interface StoredB2BCategory {
  _id?: string;
  id?: string;
  name?: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const B2bProductsList = () => {
  const router = useRouter();
  const { addToCart, cartItems } = useCart();
  const [products, setProducts] = useState<B2BProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const extractArray = (payload: unknown): any[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      if (Array.isArray(obj.products)) return obj.products as any[];
      if (Array.isArray(obj.data)) return obj.data as any[];
      if (Array.isArray(obj.categories)) return obj.categories as any[];
    }
    return [];
  };

  const normalizeCategories = (raw: unknown): Category[] =>
    extractArray(raw)
      .map((cat: any) => ({
        _id: String(cat?._id ?? cat?.id ?? "").trim(),
        name: String(cat?.name ?? "").trim(),
        imageUrl: cat?.imageUrl,
      }))
      .filter((cat: Category) => cat._id && cat.name);

  const normalizeProduct = (
    product: any,
    categoryList: Category[]
  ): B2BProductWithCategory => {
    const rawCategory = product?.category;
    const categoryName =
      typeof rawCategory === "string"
        ? rawCategory.trim()
        : String(rawCategory?.name ?? rawCategory?.label ?? "").trim();
    const categoryId =
      typeof rawCategory === "object" && rawCategory !== null
        ? String(rawCategory?._id ?? rawCategory?.id ?? "").trim()
        : "";

    const categoryObj =
      categoryList.find((cat) => cat._id === categoryId) ||
      categoryList.find(
        (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
      ) ||
      null;

    return {
      _id: String(product?._id ?? product?.id ?? "").trim(),
      sku: String(product?.sku ?? "").trim(),
      productName: String(product?.productName ?? "").trim(),
      category: categoryName || categoryObj?.name || "",
      brandName: String(product?.brandName ?? "").trim(),
      pricePerUnit:
        product?.pricePerUnit !== undefined ? Number(product.pricePerUnit) : 0,
      mrp: product?.mrp !== undefined ? Number(product.mrp) : 0,
      discountedPrice:
        product?.discountedPrice !== undefined
          ? Number(product.discountedPrice)
          : 0,
      stockAvailable:
        product?.stockAvailable !== undefined
          ? Number(product.stockAvailable)
          : 0,
      moq: product?.moq !== undefined ? Number(product.moq) : 0,
      productImages: Array.isArray(product?.productImages)
        ? product.productImages
        : [],
      description: String(product?.description ?? "").trim(),
      certifications: String(product?.certifications ?? "").trim(),
      manufacturerName: String(product?.manufacturerName ?? "").trim(),
      categoryObj,
    };
  };

  const resolveInitialCategoryName = (catData: Category[]): string | null => {
    const storedCategory = localStorage.getItem("selectedB2BCategory");
    const storedCategoryId = localStorage.getItem("selectedB2BCategoryId");

    if (storedCategory) {
      try {
        const parsed: StoredB2BCategory = JSON.parse(storedCategory);
        if (parsed?.name) {
          const byName = catData.find(
            (cat) => cat.name.toLowerCase() === parsed.name?.toLowerCase()
          );
          if (byName) return byName.name;
        }

        const wantedId = parsed?._id ?? parsed?.id;
        if (wantedId) {
          const byId = catData.find((cat) => cat._id === wantedId);
          if (byId) return byId.name;
        }
      } catch (error) {
        console.error("Invalid selectedB2BCategory in localStorage:", error);
      }
    }

    if (storedCategoryId) {
      const byId = catData.find((cat) => cat._id === storedCategoryId);
      if (byId) return byId.name;
    }

    return null;
  };

  useEffect(() => {
    const ac = new AbortController();

    const fetchAll = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch(`${API_URL}/b2b-categories`, { signal: ac.signal }),
          fetch(`${API_URL}/b2b-products`, { signal: ac.signal }),
        ]);

        if (!catRes.ok || !prodRes.ok) {
          throw new Error("Failed to fetch B2B categories or products");
        }

        const catRaw = await catRes.json();
        const prodRaw = await prodRes.json();

        const catData = normalizeCategories(catRaw);
        const prodData = extractArray(prodRaw)
          .map((product) => normalizeProduct(product, catData))
          .filter((product) => product._id && product.productName);

        setCategories(catData);
        setProducts(prodData);
        setSelectedCategoryName(resolveInitialCategoryName(catData));
      } catch (error) {
        if ((error as any)?.name !== "AbortError") {
          console.error("Failed to fetch B2B products:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    return () => ac.abort();
  }, []);

  const getImage = (img?: string) => {
    if (!img) return productImg.src;
    return resolveMediaUrl(img) || productImg.src;
  };

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          product.productName.toLowerCase().includes(search) ||
          (product.brandName || "").toLowerCase().includes(search) ||
          (product.sku || "").toLowerCase().includes(search);

        const matchesCategory = selectedCategoryName
          ? product.category.toLowerCase() === selectedCategoryName.toLowerCase() ||
            product.categoryObj?.name?.toLowerCase() ===
              selectedCategoryName.toLowerCase()
          : true;

        return matchesSearch && matchesCategory;
      }),
    [products, searchTerm, selectedCategoryName]
  );

  const selectedCategory =
    categories.find(
      (category) =>
        category.name.toLowerCase() ===
        (selectedCategoryName || "").toLowerCase()
    ) || null;

  const handleCategoryClick = (category: Category | null) => {
    if (!category) {
      setSelectedCategoryName(null);
      localStorage.removeItem("selectedB2BCategory");
      localStorage.removeItem("selectedB2BCategoryId");
      return;
    }

    setSelectedCategoryName(category.name);
    localStorage.setItem(
      "selectedB2BCategory",
      JSON.stringify({
        _id: category._id,
        id: category._id,
        name: category.name,
      })
    );
    localStorage.setItem("selectedB2BCategoryId", category._id);
  };

  const getCartPayload = (product: B2BProductWithCategory) => {
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

  const openProduct = (product: B2BProductWithCategory) => {
    router.push(
      `/b2b-product/${slugify(product.productName || product._id || "b2b-product")}`
    );
  };

  const handleAddToCart = (
    event: React.MouseEvent<HTMLButtonElement>,
    product: B2BProductWithCategory
  ) => {
    event.stopPropagation();

    const payload = getCartPayload(product);
    const alreadyInCart = cartItems.some((item) => item.id === payload.id);
    if (alreadyInCart) {
      router.push("/home/Cart");
      return;
    }

    addToCart(payload);
  };

  if (loading) return <FullPageLoader />;

  return (
    <>
      <Topbar hideHamburgerOnMobile />

      <section className={styles.shopSection}>
        <div className={styles.layoutWrapper}>
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>B2B Categories</h3>

            <div
              className={`${styles.sidebarCard} ${
                !selectedCategoryName ? styles.activeCategory : ""
              }`}
              onClick={() => handleCategoryClick(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleCategoryClick(null);
                }
              }}
            >
              <img
                src={productImg.src}
                alt="All"
                className={styles.sidebarImage}
              />
              <p className={styles.sidebarName}>All</p>
            </div>

            {categories.map((category) => (
              <div
                key={category._id}
                className={`${styles.sidebarCard} ${
                  selectedCategory?._id === category._id ? styles.activeCategory : ""
                }`}
                onClick={() => handleCategoryClick(category)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleCategoryClick(category);
                  }
                }}
              >
                <img
                  src={getImage(category.imageUrl)}
                  alt={category.name}
                  className={styles.sidebarImage}
                />
                <p className={styles.sidebarName}>{category.name}</p>
              </div>
            ))}
          </aside>

          <div style={{ width: "100%" }}>
            <div className={styles.headerRow}>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="Search B2B products..."
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className={styles.searchIcon}>Search</span>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <p style={{ padding: 20 }}>No B2B products found.</p>
            ) : (
              <div className={styles.productGrid}>
                {filteredProducts.map((product) => {
                  const price = Number(
                    product.discountedPrice || product.pricePerUnit || product.mrp || 0
                  );
                  const mrp = Number(product.mrp || product.pricePerUnit || price);
                  const hasDiscount = price > 0 && mrp > price;
                  const image = getImage(product.productImages?.[0]);

                  return (
                    <div
                      key={product._id}
                      className={styles.productCard}
                      onClick={() => openProduct(product)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openProduct(product);
                        }
                      }}
                    >
                      <div className={styles.productImageWrap}>
                        <img
                          src={image}
                          alt={product.productName}
                          className={styles.productImage}
                        />
                      </div>

                      <div className={styles.productInfo}>
                        <h3 className={styles.productName}>{product.productName}</h3>
                        <p className={styles.productSize}>{product.brandName}</p>
                        <p className={styles.productSize}>
                          Category: {product.categoryObj?.name || product.category}
                        </p>

                        <div className={styles.productPriceContainer}>
                          {hasDiscount ? (
                            <>
                              <p className={styles.productPrice}>Rs. {price}</p>
                              <p className={styles.productMrp}>Rs. {mrp}</p>
                              <span className={styles.productDiscount}>
                                {Math.round(((mrp - price) / mrp) * 100)}% OFF
                              </span>
                            </>
                          ) : (
                            <p className={styles.productPrice}>Rs. {price}</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.productButton}
                        onClick={(event) => {
                          handleAddToCart(event, product);
                        }}
                      >
                        {cartItems.some((item) => item.id === product._id)
                          ? "Go to Cart"
                          : "Add to Cart"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default B2bProductsList;
