"use client";

import { API_URL } from "@/config/api";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/ProductList.module.css";
import productImg from "@/public/product1.png";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import { useCart } from "@/context/CartContext";

/* ================= CATEGORY ================= */
interface Category {
  _id: string;
  name: string;
  imageUrl?: string;
}

/* ================= PRODUCT (ADMIN SHAPE) ================= */
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

/* ================= EXTENDED ================= */
interface ProductWithCategory extends Product {
  categoryObj?: Category | null;
}

const ProductListingPage: React.FC = () => {
  const router = useRouter();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  /* ================= IMAGE HANDLER ================= */
  const getImage = (img?: string) => {
    if (!img) return productImg.src;
    if (img.startsWith("data:")) return img;
    return img;
  };

  /* ================= NORMALIZE ================= */
  const normalizeProduct = (
    p: Product,
    cats: Category[]
  ): ProductWithCategory => {
    const categoryObj = cats.find((c) => c._id === p.category) || null;
    return { ...p, categoryObj };
  };

  /* ================= FETCH ================= */
  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/products`),
      ]);

      const catData: Category[] = await catRes.json();
      const prodData: Product[] = await prodRes.json();

      const normalized = prodData.map((p) =>
        normalizeProduct(p, catData)
      );

      setCategories(catData);
      setProducts(normalized);

      const storedCat = localStorage.getItem("selectedCategory");
      if (storedCat) {
        setSelectedCategory(JSON.parse(storedCat));
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  /* ================= FILTER ================= */
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brandName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory
      ? p.category === selectedCategory._id
      : true;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Topbar hideHamburgerOnMobile />

      <section className={styles.shopSection}>
        <div className={styles.layoutWrapper}>
          {/* ================= SIDEBAR ================= */}
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Categories</h3>

            <div
              className={`${styles.sidebarCard} ${
                !selectedCategory ? styles.activeCategory : ""
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              <img
                src={productImg.src}
                alt="All"
                className={styles.sidebarImage}
              />
            </div>

            {categories.map((cat) => (
              <div
                key={cat._id}
                className={`${styles.sidebarCard} ${
                  selectedCategory?._id === cat._id
                    ? styles.activeCategory
                    : ""
                }`}
                onClick={() => {
                  setSelectedCategory(cat);
                  localStorage.setItem(
                    "selectedCategory",
                    JSON.stringify(cat)
                  );
                }}
              >
                <img
                  src={getImage(cat.imageUrl)}
                  alt={cat.name}
                  className={styles.sidebarImage}
                />
              </div>
            ))}
          </aside>

          {/* ================= MAIN ================= */}
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
                <span className={styles.searchIcon}>🔍</span>
              </div>
            </div>

            {loading ? (
              <p style={{ padding: 20 }}>Loading products…</p>
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
                      onClick={() =>
                        router.push(`/product-detail/${product._id}`)
                      }
                    >
                      <div className={styles.productItem}>
                        <img
                          src={image}
                          alt={product.productName}
                          className={styles.productImage}
                        />

                        <h3 className={styles.productName}>
                          {product.productName}
                        </h3>

                        <p className={styles.productSize}>
                          {product.brandName}
                        </p>

                        {product.categoryObj && (
                          <p className={styles.categoryName}>
                            Category: {product.categoryObj.name}
                          </p>
                        )}

                        <div className={styles.productPriceContainer}>
                          {hasDiscount ? (
                            <>
                              <p className={styles.productPrice}>
                                ₹{discount}
                              </p>
                              <p className={styles.productMrp}>
                                ₹{price}
                              </p>
                              <span className={styles.discountTag}>
                                {Math.round(
                                  ((price - discount) / price) * 100
                                )}
                                % OFF
                              </span>
                            </>
                          ) : (
                            <p className={styles.productPrice}>
                              ₹{price}
                            </p>
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
                                ? `${Math.round(
                                    ((price - discount) / price) * 100
                                  )}% OFF`
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
