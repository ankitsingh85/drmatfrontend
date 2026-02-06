import React from "react";
import styles from "@/styles/pages/ProductListingPage.module.css";
import { useRouter } from "next/router";
import { Product } from "../types/product";
import fallbackImg from "@/public/product1.png";

interface ProductCardProps {
  products: Product[];
}

const ProductCard: React.FC<ProductCardProps> = ({ products }) => {
  const router = useRouter();

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>, product: Product) => {
    event.stopPropagation();
    alert(`${product.name} added to cart!`);
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
              onClick={() => router.push(`/product-detail/${product.id}`)}
            >
              <div className={styles.productItem}>
                {product.isBestseller && (
                  <span className={styles.bestsellerBadge}>
                    Bestseller <sup style={{ fontSize: "0.8em" }}>✶</sup>
                  </span>
                )}

                <img
                  src={
                    mainImage.startsWith("data:")
                      ? mainImage
                      : `data:image/jpeg;base64,${mainImage}`
                  }
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
