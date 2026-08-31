"use client";

import React, { useEffect, useState } from "react";
import { CartItem, useCart } from "@/context/CartContext";
import styles from "@/styles/Cart.module.css";
import { FaTrashAlt, FaShoppingCart, FaCreditCard } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { GoLocation } from "react-icons/go";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import Topbar from "@/components/Layout/Topbar";
import FullPageLoader from "@/components/common/FullPageLoader";
import TreatmentClinicModal, {
  TreatmentClinicOption,
} from "@/components/modal/TreatmentClinicModal";
import { API_URL } from "@/config/api";

const TREATMENT_CHECKOUT_KEY = "treatmentCheckout";

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const CartPage: React.FC = () => {
  const router = useRouter();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    addToWishlist,
    wishlistItems,
    removeFromWishlist,
    addToCart,
    setCartItemClinic,
    hydrated: cartHydrated,
  } = useCart();

  const token = Cookies.get("token");
  const currentRole = (Cookies.get("role") || "").toLowerCase();

  const [clinicQueue, setClinicQueue] = useState<CartItem[]>([]);
  const [activeClinicItem, setActiveClinicItem] = useState<CartItem | null>(null);
  const [clinicSelections, setClinicSelections] = useState<
    Record<string, { clinicId: string; clinicName: string; clinicAddress?: string }>
  >({});

  useEffect(() => {
    // Guests can review cart items; login is required at checkout.
  }, []);

  if (!cartHydrated) return <FullPageLoader />;

  const totalMRP = cartItems.reduce(
    (acc, item) => acc + (item.mrp ?? item.price) * item.quantity,
    0
  );
  const totalPrice = cartItems.reduce(
    (acc, item) => acc + (item.price ?? 0) * item.quantity,
    0
  );
  const discount = totalMRP - totalPrice;

  const finalizeCheckout = async (
    selections: Record<
      string,
      { clinicId: string; clinicName: string; clinicAddress?: string }
    >
  ) => {
    const allTreatment =
      cartItems.length > 0 && cartItems.every((item) => item.itemType === "treatment");

    if (allTreatment) {
      const itemsWithClinics = cartItems.map((item) => {
        const selection = selections[item.id];
        return selection ? { ...item, ...selection } : item;
      });
      try {
        sessionStorage.setItem(TREATMENT_CHECKOUT_KEY, JSON.stringify(itemsWithClinics));
      } catch {
        // Ignore storage failures; PaymentPage falls back to the real cart.
      }
      router.push("/home/PaymentPage?flow=treatment");
      return;
    }

    if (currentRole === "b2buser") {
      // B2BUser has a single flat address (no addresses[] array), so it
      // skips the multi-address Address.tsx flow entirely and goes
      // straight to PaymentPage with its profile address as query params.
      const b2bUserId = Cookies.get("b2bUserId");
      let address = "";
      try {
        if (b2bUserId) {
          const res = await fetch(`${API_URL}/b2b-users/${b2bUserId}`);
          if (res.ok) {
            const data = await res.json();
            address = [data.address, data.city, data.state, data.pincode]
              .filter(Boolean)
              .join(", ");
          }
        }
      } catch {
        // Ignore fetch failures; PaymentPage still works without a prefilled address.
      }

      const query = new URLSearchParams({ type: "Business", address }).toString();
      router.push(`/home/PaymentPage?${query}`);
      return;
    }

    router.push("/home/Address");
  };

  const handleProceedToPay = () => {
    if (!token) {
      router.push(
        currentRole === "clinic" || currentRole === "doctor" || currentRole === "b2buser"
          ? "/businesslogin?next=/home/Cart"
          : "/Login?next=/home/Cart"
      );
      return;
    }

    const needsClinic = cartItems.filter(
      (item) => item.itemType === "treatment" && !item.clinicId
    );

    if (needsClinic.length > 0) {
      setClinicSelections({});
      setClinicQueue(needsClinic.slice(1));
      setActiveClinicItem(needsClinic[0]);
      return;
    }

    finalizeCheckout({});
  };

  const handleClinicConfirm = (clinic: TreatmentClinicOption) => {
    if (!activeClinicItem) return;

    const addressLine =
      [clinic.sector, clinic.city].filter(Boolean).join(", ") || clinic.address || "";

    const nextSelections = {
      ...clinicSelections,
      [activeClinicItem.id]: {
        clinicId: clinic._id,
        clinicName: clinic.clinicName,
        clinicAddress: addressLine,
      },
    };

    setClinicSelections(nextSelections);
    setCartItemClinic(activeClinicItem.id, nextSelections[activeClinicItem.id]);

    if (clinicQueue.length > 0) {
      const [next, ...rest] = clinicQueue;
      setClinicQueue(rest);
      setActiveClinicItem(next);
    } else {
      setActiveClinicItem(null);
      finalizeCheckout(nextSelections);
    }
  };

  const handleClinicModalClose = () => {
    setActiveClinicItem(null);
    setClinicQueue([]);
  };

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
                  <FiHeart
                    className={styles.icon}
                    onClick={() => {
                      addToWishlist({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        mrp: item.mrp,
                        discount: item.discount,
                        discountPrice: item.discountPrice,
                        company: item.company,
                        image: item.image,
                      });
                      removeFromCart(item.id);
                    }}
                  />
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

          <div className={styles.wishlistSection}>
            <h3 className={styles.title}>Wishlist ({wishlistItems.length})</h3>
            {wishlistItems.length === 0 ? (
              <p className={styles.message}>No products in wishlist.</p>
            ) : (
              wishlistItems.map((item) => {
                const inCart = cartItems.some((c) => c.id === item.id);
                return (
                  <div key={`wish-${item.id}`} className={styles.card}>
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
                          <span className={styles.discount}>{item.discount}</span>
                        )}
                      </div>
                      <div className={styles.qtyRow}>
                        <button
                          className={styles.payBtn}
                          style={{ marginBottom: 0, padding: "8px 14px", width: "auto" }}
                          onClick={() => {
                            if (inCart) {
                              router.push("/home/Cart");
                              return;
                            }
                            addToCart({
                              id: item.id,
                              name: item.name,
                              price: item.price,
                              mrp: item.mrp,
                              discount: item.discount,
                              discountPrice: item.discountPrice,
                              company: item.company,
                              image: item.image,
                            });
                          }}
                        >
                          {inCart ? "Go to Cart" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <FaTrashAlt
                        className={styles.icon}
                        onClick={() => removeFromWishlist(item.id)}
                      />
                    </div>
                  </div>
                );
              })
            )}
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
          <button className={styles.payBtn} onClick={handleProceedToPay}>
            Proceed to Pay ₹{totalPrice}
          </button>
        </div>
      </div>

      {activeClinicItem && (
        <TreatmentClinicModal
          treatmentId={activeClinicItem.id}
          treatmentName={activeClinicItem.name}
          price={activeClinicItem.price}
          onConfirm={handleClinicConfirm}
          onClose={handleClinicModalClose}
        />
      )}

      <MobileNavbar />
    </>
  );
};

export default CartPage;
