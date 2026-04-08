"use client";

import React, { useEffect, useState } from "react";
import { CART_TOAST_EVENT } from "@/context/CartContext";
import styles from "@/styles/components/common/cartToast.module.css";

type CartToastDetail = {
  message?: string;
};

export default function CartToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("Item added to cart");

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const handleCartToast = (event: Event) => {
      const customEvent = event as CustomEvent<CartToastDetail>;
      setMessage(customEvent.detail?.message || "Item added to cart");
      setVisible(true);

      if (hideTimer) {
        clearTimeout(hideTimer);
      }

      hideTimer = setTimeout(() => {
        setVisible(false);
      }, 1000);
    };

    window.addEventListener(CART_TOAST_EVENT, handleCartToast);

    return () => {
      window.removeEventListener(CART_TOAST_EVENT, handleCartToast);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div
      className={`${styles.toast} ${visible ? styles.toastVisible : ""}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={styles.dot} />
      <span className={styles.message}>{message}</span>
    </div>
  );
}
