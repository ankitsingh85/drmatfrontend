"use client";

import { API_URL } from "@/config/api";
import React, { useEffect, useState } from "react";

// @ts-ignore
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";

import styles from "@/styles/Dashboard/listoftopproducts.module.css";

interface Product {
  _id: string;
  productName: string;
  brandName?: string;
  mrpPrice?: number;
  discountedPrice?: number;
  productImages?: string[];
}

const MAX_TOP_PRODUCTS = 17;

const ListOfTopProduct: React.FC = () => {
  const [topProducts, setTopProducts] = useState<(Product | null)[]>(
    Array(MAX_TOP_PRODUCTS).fill(null)
  );
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchData = async () => {
      const resProducts = await fetch(`${API_URL}/products`);
      const products = await resProducts.json();
      setAllProducts(products);

      const resTop = await fetch(`${API_URL}/top-products`);
      const topData: (Product | null)[] = await resTop.json();

      const padded = [...topData];
      while (padded.length < MAX_TOP_PRODUCTS) padded.push(null);

      setTopProducts(padded.slice(0, MAX_TOP_PRODUCTS));
    };

    fetchData();
  }, []);

  /* ================= SAVE ================= */
  const saveTopProducts = async (products: (Product | null)[]) => {
    await fetch(`${API_URL}/top-products`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(products),
    });
  };

  /* ================= ADD ================= */
  const handleAddProduct = (product: Product) => {
    const firstEmpty = topProducts.findIndex((p) => p === null);
    if (firstEmpty === -1) {
      alert(`Only ${MAX_TOP_PRODUCTS} products allowed`);
      return;
    }

    const updated = [...topProducts];
    updated[firstEmpty] = product;

    setTopProducts(updated);
    saveTopProducts(updated);

    setShowModal(false);
    setSearchTerm("");
  };

  /* ================= DELETE ================= */
  const handleDeleteProduct = (index: number) => {
    const updated = [...topProducts];
    updated[index] = null;

    setTopProducts(updated);
    saveTopProducts(updated);
  };

  /* ================= DRAG ================= */
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(topProducts);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    setTopProducts(items);
    saveTopProducts(items);
  };

  return (
    <div className={styles.topProductContainer}>
      <h2>Top Products (17 Slots)</h2>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="topProducts" direction="horizontal">
          {(provided) => (
            <div
              className={styles.topProductGrid}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {topProducts.map((product, idx) => (
                <Draggable key={idx} draggableId={String(idx)} index={idx}>
                  {(drag) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      {...drag.dragHandleProps}
                      className={`${styles.productCard} ${
                        !product ? styles.emptyCard : ""
                      }`}
                      onClick={() => !product && setShowModal(true)}
                    >
                      {product ? (
                        <>
                          <img
                            src={
                              product.productImages?.[0] ||
                              "/fallback.png"
                            }
                            className={styles.mainImage}
                          />

                          <h3 className={styles.productName}>
                            {product.productName}
                          </h3>

                          <p className={styles.productCompany}>
                            {product.brandName || "-"}
                          </p>

                          <p className={styles.productPrice}>
                            ₹{product.discountedPrice || product.mrpPrice}
                          </p>

                          <button
                            className={styles.deleteButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(idx);
                            }}
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <p>Empty Slot</p>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}

              {/* FRONTEND PREVIEW SLOT */}
              <div className={styles.showMoreCard}>
                <span>Explore More</span>
                <small>Frontend View</small>
              </div>

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button
        className={styles.addProductButton}
        onClick={() => setShowModal(true)}
      >
        Add Product
      </button>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              className={styles.searchInput}
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className={styles.modalProductGrid}>
              {allProducts
                .filter((p) =>
                  p.productName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                )
                .map((product) => (
                  <div
                    key={product._id}
                    className={styles.modalProductCard}
                    onClick={() => handleAddProduct(product)}
                  >
                    <img
                      src={
                        product.productImages?.[0] ||
                        "/fallback.png"
                      }
                    />
                    <p>{product.productName}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListOfTopProduct;
