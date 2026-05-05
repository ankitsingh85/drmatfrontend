"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiArrowRight, FiShoppingCart, FiX } from "react-icons/fi";
import { useCart } from "@/context/CartContext";
import styles from "@/styles/components/common/cartToast.module.css";

const AUTO_CLOSE_MS = 20000;

const formatMoney = (value?: number) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "Rs. 0";
  return `Rs. ${amount.toLocaleString("en-IN")}`;
};

export default function CartToast() {
  const { cartPreview, dismissCartPreview } = useCart();
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleHide = () => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      setVisible(false);
      dismissCartPreview();
    }, AUTO_CLOSE_MS);
  };

  const handleClose = () => {
    clearHideTimer();
    setVisible(false);
    dismissCartPreview();
  };

  const handleViewCart = () => {
    handleClose();
    window.location.href = "/home/Cart";
  };

  useEffect(() => {
    if (!cartPreview) {
      clearHideTimer();
      setVisible(false);
      return;
    }

    setVisible(true);
    scheduleHide();

    return () => {
      clearHideTimer();
    };
  }, [cartPreview]);

  const item = cartPreview?.item;
  const itemTypeLabel = item?.itemType === "treatment" ? "Treatment" : "Product";
  const displayMessage = cartPreview?.message || "Added to cart";
  const priceLabel = formatMoney(item?.price);
  const mrpLabel =
    item?.mrp != null && Number(item.mrp) > Number(item.price || 0)
      ? formatMoney(item.mrp)
      : "";

  return (
    <div
      className={`${styles.toast} ${visible ? styles.toastVisible : styles.toastHidden}`}
      role="dialog"
      aria-modal="false"
      aria-label="Cart item preview"
      aria-hidden={!visible}
      onMouseEnter={clearHideTimer}
      onMouseLeave={() => {
        if (visible) scheduleHide();
      }}
    >
      <div className={styles.card}>
        <div className={styles.topRow}>
          <div className={styles.statusWrap}>
            <span className={styles.statusIcon} aria-hidden="true">
              <FiShoppingCart />
            </span>
            <div className={styles.statusTextWrap}>
              <span className={styles.statusText}>{displayMessage}</span>
              <span className={styles.statusSubtext}>
                Review the item in the cart drawer or close this alert.
              </span>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close cart preview"
            tabIndex={visible ? 0 : -1}
          >
            <FiX />
          </button>
        </div>

        <div className={styles.badgeRow}>
          <span className={styles.typeBadge}>{itemTypeLabel}</span>
          {item?.discount ? <span className={styles.discountBadge}>{item.discount}</span> : null}
        </div>

        <div className={styles.content}>
          <div className={styles.imageWrap}>
            {item?.image ? (
              <img
                src={item.image}
                alt={item.name || "Cart item"}
                className={styles.image}
              />
            ) : (
              <div className={styles.placeholder}>{itemTypeLabel}</div>
            )}
          </div>

          <div className={styles.info}>
            <h4 className={styles.itemName}>{item?.name || "Item added to cart"}</h4>
            <p className={styles.itemMeta}>
              {item?.company || (item?.itemType === "treatment" ? "Treatment plan" : "Catalog item")}
            </p>

            <div className={styles.priceRow}>
              <span className={styles.price}>{priceLabel}</span>
              {mrpLabel ? <span className={styles.mrp}>{mrpLabel}</span> : null}
            </div>

            <div className={styles.quantityRow}>
              <span>Qty: {item?.quantity || 1}</span>
              <span>{itemTypeLabel} ready for checkout</span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleViewCart}
            tabIndex={visible ? 0 : -1}
          >
            <FiArrowRight />
            <span>View Cart</span>
          </button>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleClose}
            tabIndex={visible ? 0 : -1}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
