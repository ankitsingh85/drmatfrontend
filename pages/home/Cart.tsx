"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import styles from "@/styles/Cart.module.css";
import { FaTrashAlt, FaShoppingCart, FaCreditCard } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { GoLocation } from "react-icons/go";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import Topbar from "@/components/Layout/Topbar";
import { API_URL } from "@/config/api";

interface IUserProfile {
  _id?: string;
  email: string;
  name: string;
  addresses: { type: string; address: string }[];
}

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const CartPage: React.FC = () => {
  const router = useRouter();
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const [user, setUser] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const email = Cookies.get("email");
  const token = Cookies.get("token");

  useEffect(() => {
    if (!email || !token) {
      // Don't clear cart — preserve items. Redirect to Login with return URL.
      router.replace("/Login?next=/home/Cart");
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/users/by-email/${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          setUser({
            _id: data._id,
            email: data.email,
            name: data.name,
            addresses: data.addresses || [],
          });
          Cookies.set("userId", data._id);
          localStorage.setItem("userId", data._id);
        } else {
          Cookies.remove("email");
          Cookies.remove("userId");
          Cookies.remove("token");
          localStorage.removeItem("userId");
          router.replace("/Login?next=/home/Cart");
        }
      } catch (err) {
        console.error(err);
        router.replace("/Login?next=/home/Cart");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [email, token, router]);

  if (loading) return <p className={styles.message}>Loading...</p>;
  if (!user) return null; // redirecting to Login

  const totalMRP = cartItems.reduce(
    (acc, item) => acc + (item.mrp ?? item.price) * item.quantity,
    0
  );
  const totalPrice = cartItems.reduce(
    (acc, item) => acc + (item.price ?? 0) * item.quantity,
    0
  );
  const discount = totalMRP - totalPrice;

  return (
    <>
      <Topbar />
      {/* Header */}
      <div className={styles.header}>
        <Image
          className={styles.logo}
          src="/logo.png"
          alt="Logo"
          width={155}
          height={45}
          onClick={() => router.push("/home")}
        />
        <div className={styles.steps}>
          <div className={`${styles.step} ${styles.active}`}>
            <div className={styles.circle}>
              <FaShoppingCart />
            </div>
            <div className={styles.stepLabelActive}>Cart</div>
          </div>
          <div className={styles.line}></div>
          <div className={styles.step}>
            <div className={styles.circleGrey}>
              <GoLocation />
            </div>
            <div className={styles.stepLabel}>Address</div>
          </div>
          <div className={styles.line}></div>
          <div className={styles.step}>
            <div className={styles.circleGrey}>
              <FaCreditCard />
            </div>
            <div className={styles.stepLabel}>Payment</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.container}>
        <div className={styles.left}>
          <h2 className={styles.title}>Shopping Cart</h2>
          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className={styles.card}>
                <Image
                  src={item.image ?? "/product1.png"}
                  alt={item.name}
                  width={100}
                  height={100}
                />
                <div className={styles.details}>
                  <div className={styles.name}>{item.name}</div>
                  <div className={styles.priceRow}>
                    <span className={styles.price}>₹{item.price}</span>
                    {item.discount && (
                      <span className={styles.discount}>
                        {item.discount} OFF
                      </span>
                    )}
                  </div>
                  {item.mrp && (
                    <div className={styles.mrp}>
                      MRP: <s>₹{item.mrp}</s>
                    </div>
                  )}
                  <div className={styles.qtyRow}>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, Math.max(1, item.quantity - 1))
                      }
                      className={styles.qtyBtn}
                    >
                      −
                    </button>
                    <span className={styles.qty}>{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                      className={styles.qtyBtn}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className={styles.actions}>
                  <FaTrashAlt
                    className={styles.icon}
                    onClick={() => removeFromCart(item.id)}
                  />
                  <FiHeart className={styles.icon} />
                </div>
              </div>
            ))
          )}
          <div
            className={styles.continue}
            onClick={() => router.push("/home")}
          >
            Continue Shopping
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.summaryBox}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>
            <div className={styles.summaryRow}>
              <span>Total MRP</span>
              <span>₹{totalMRP}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Total Discounts</span>
              <span className={styles.green}>- ₹{discount}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Convenience Fee</span>
              <span>₹0</span>
            </div>
            <hr />
            <div className={styles.totalPay}>
              <span>Payable Amount</span>
              <span>₹{totalPrice}</span>
            </div>
          </div>
          <button
            className={styles.payBtn}
            onClick={() => router.push("/home/Address")}
          >
            Proceed to Pay ₹{totalPrice}
          </button>
        </div>
      </div>

      <MobileNavbar />
    </>
  );
};

export default CartPage;
