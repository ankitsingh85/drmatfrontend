"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "@/styles/user/paymentpage.module.css";
import { useCart } from "@/context/CartContext";
import { useOrder } from "@/context/OrderContext";
import { FaShoppingCart, FaCreditCard } from "react-icons/fa";
import { GoLocation } from "react-icons/go";

const PaymentPage: React.FC = () => {
  const router = useRouter();
  const { type, address } = router.query;

  const { cartItems, clearCart } = useCart();
  const { createOrder } = useOrder();

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handlePayment = async () => {
    if (!type || !address) {
      alert("Please go back and select a delivery address.");
      return;
    }

    try {
      setLoading(true);
      await createOrder(cartItems, totalPrice, {
        type: String(type),
        address: String(address),
      });

      clearCart();
      setPaymentSuccess(true);
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Something went wrong! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prevent accessing payment page without cart
    if (cartItems.length === 0 && !paymentSuccess) {
      router.push("/cart");
    }
  }, [cartItems, paymentSuccess, router]);

  if (paymentSuccess) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.paymentSuccess}>
          <h2>✅ Payment Successful!</h2>
          <p>Your order will be delivered to:</p>
          <p>
            <strong>{type}</strong> - {address}
          </p>
          <button
            onClick={() => router.push("/home")}
            className={styles.continueBtn}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* 🔹 Topbar */}
      <div className={styles.topbar}>
        <Image
          src="/logo.png"
          alt="Logo"
          width={155}
          height={45}
          className={styles.logo}
          onClick={() => router.push("/home")}
        />

        <div className={styles.steps}>
          <FaShoppingCart /> <span>→</span> <GoLocation /> <span>→</span>{" "}
          <FaCreditCard />
        </div>
      </div>

      {/* 🔹 Main Section */}
      <div className={styles.mainContent}>
        {/* Left Card */}
        <div className={styles.leftCard}>
          <h3>Deliver To</h3>
          <p>
            <strong>{type}</strong>: {address}
          </p>
        </div>

        {/* Right Card */}
        <div className={styles.rightCard}>
          <h3>Order Summary ({cartItems.length} items)</h3>

          <div className={styles.itemsList}>
            {cartItems.map((item) => (
              <div key={item.id} className={styles.itemRow}>
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <hr className={styles.divider} />

          <div className={styles.totalRow}>
            <span>Total:</span>
            <strong>₹{totalPrice}</strong>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className={styles.payButton}
          >
            {loading ? "Processing..." : `Pay ₹${totalPrice}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
