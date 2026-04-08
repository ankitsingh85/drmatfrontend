import React from "react";
import styles from "@/styles/pages/ProductListingPage.module.css";
import { useRouter } from "next/router";
import { Product } from "../types/product";
import fallbackImg from "@/public/product1.png";
import { resolveMediaUrl } from "@/lib/media";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  products: Product[];
}

const ProductCard: React.FC<ProductCardProps> = ({ products }) => {
  const router = useRouter();
  const { addToCart, cartItems } = useCart();
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>, product: Product) => {
    event.stopPropagation();
    const payload = {
      id: String(product.id),
      name: product.name,
      price: Number(product.price || 0),
      mrp: product.mrp,
      discount: product.discount,
      company: product.category?.name,
      image: product.image?.[0] || fallbackImg.src,
      itemType: "product" as const,
    };

    if (cartItems.some((item) => item.id === payload.id)) {
      router.push("/home/Cart");
      return;
    }

    addToCart(payload);
  };

  return (
    <section className={styles.shopSection}>
      <div className={styles.productGrid}>
        {products.map((product) => {
          const mainImage =
            product.image && product.image.length > 0 ? product.image[0] : fallbackImg.src;

          return (
            <div
              key={product.id}
              className={styles.productCard}
              onClick={() => router.push(`/product/${slugify(product.name || String(product.id))}`)}
            >
              <div className={styles.productItem}>
                {product.isBestseller && (
                  <span className={styles.bestsellerBadge}>
                    Bestseller <sup style={{ fontSize: "0.8em" }}>✶</sup>
                  </span>
                )}

                <img
                  src={resolveMediaUrl(mainImage) || fallbackImg.src}
                  alt={product.name}
                  className={styles.productImage}
                />

                <h3 className={styles.productName}>{product.name}</h3>
                <p className={styles.productSize}>{product.size}</p>
                <p className={styles.productCategory}>{product.category?.name}</p>

                <div className={styles.productPriceContainer}>
                  <p className={styles.productPrice}>₹{product.price}</p>
                  <p className={styles.productMrp}>₹{product.mrp}</p>
                  <p className={styles.productDiscount}>{product.discount}</p>
                </div>

                <button
                  className={styles.productButton}
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  {product.buttonText || "Add to Cart"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ProductCard;
