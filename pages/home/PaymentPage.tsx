"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Cookies from "js-cookie";
import styles from "@/styles/user/paymentpage.module.css";
import { CartItem, useCart } from "@/context/CartContext";
import { useOrder } from "@/context/OrderContext";
import Topbar from "@/components/Layout/Topbar";
import {
  FaArrowRight,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaShieldAlt,
} from "react-icons/fa";
import { GoLocation } from "react-icons/go";
import FullPageLoader from "@/components/common/FullPageLoader";

const TREATMENT_CHECKOUT_KEY = "treatmentCheckout";

const PaymentPage: React.FC = () => {
  const router = useRouter();
  const { type, address, flow } = router.query;

  const { cartItems, clearCart, hydrated: cartHydrated } = useCart();
  const { createOrder } = useOrder();

  const [isHydrated, setIsHydrated] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [checkoutLoaded, setCheckoutLoaded] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [paymentSnapshot, setPaymentSnapshot] = useState<{
    items: CartItem[];
    total: number;
    addressType: string;
    addressText: string;
    flowLabel: string;
    clinicName?: string;
  } | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(TREATMENT_CHECKOUT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setCheckoutItems(parsed);
      }
    } catch {
      setCheckoutItems([]);
    } finally {
      setCheckoutLoaded(true);
    }
  }, []);

  const flowMode = Array.isArray(flow) ? flow[0] : flow;
  const currentRole = isHydrated ? Cookies.get("role")?.toLowerCase() : null;
  const isClinicCheckout = flowMode === "clinic" || currentRole === "clinic";
  const activeItems = checkoutItems.length > 0 ? checkoutItems : cartItems;
  const hasProductItems = activeItems.some((item) => item.itemType !== "treatment");
  const hasTreatmentItems = activeItems.some((item) => item.itemType === "treatment");
  const isTreatmentCheckout =
    flowMode === "treatment" ||
    (checkoutLoaded && checkoutItems.length > 0 && cartItems.length === 0) ||
    (activeItems.length > 0 && hasTreatmentItems && !hasProductItems);

  const subtotal = useMemo(
    () => activeItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [activeItems]
  );

  const grandTotal = subtotal;

  const deliveryType = Array.isArray(type) ? type[0] : type;
  const deliveryAddress = Array.isArray(address) ? address[0] : address;

  const orderAddressType = isClinicCheckout ? "Clinic" : isTreatmentCheckout ? "Other" : deliveryType;
  const orderAddressText = isTreatmentCheckout
    ? "Treatment booking - no delivery address required"
    : isClinicCheckout
    ? clinicAddress || deliveryAddress
    : deliveryAddress;

  const displayAddressType = isClinicCheckout
    ? "Clinic"
    : isTreatmentCheckout
    ? "Treatment booking"
    : deliveryType;
  const displayAddressText = isTreatmentCheckout
    ? "No delivery address required"
    : isClinicCheckout
    ? clinicAddress || deliveryAddress
    : deliveryAddress;

  useEffect(() => {
    if (!isHydrated || !isClinicCheckout) return;
    const nextClinicName = Array.isArray(router.query.clinicName)
      ? router.query.clinicName[0]
      : (router.query.clinicName as string) || Cookies.get("clinicName") || "";
    const nextClinicAddress = Array.isArray(router.query.address)
      ? router.query.address[0]
      : (router.query.address as string) || "";
    const nextClinicId = Array.isArray(router.query.clinicId)
      ? router.query.clinicId[0]
      : (router.query.clinicId as string) || Cookies.get("clinicId") || "";
    setClinicName(nextClinicName);
    setClinicAddress(nextClinicAddress);
    setClinicId(nextClinicId);
  }, [isClinicCheckout, isHydrated, router.query.address, router.query.clinicId, router.query.clinicName]);

  const handlePayment = async () => {
    if (!orderAddressType || !orderAddressText) {
      alert("Please go back and select a delivery address.");
      return;
    }

    try {
      setLoading(true);
      const snapshotItems = [...activeItems];
      const snapshotTotal = grandTotal;
      setPaymentSnapshot({
        items: snapshotItems,
        total: snapshotTotal,
        addressType: String(displayAddressType || orderAddressType),
        addressText: String(displayAddressText || orderAddressText),
        flowLabel: isClinicCheckout
          ? "Clinic billing"
          : isTreatmentCheckout
          ? "Treatment booking"
          : "Delivery address",
        clinicName: clinicName || Cookies.get("clinicName") || "",
      });
      await createOrder(
        activeItems,
        grandTotal,
        {
          type: String(orderAddressType),
          address: String(orderAddressText),
        },
        isTreatmentCheckout ? "treatment" : "product",
        isClinicCheckout
          ? { ownerType: "clinic", clinicId: clinicId || Cookies.get("clinicId") || "" }
          : { ownerType: "user" }
      );

      if (isTreatmentCheckout) {
        sessionStorage.removeItem(TREATMENT_CHECKOUT_KEY);
      } else {
        clearCart();
      }
      setPaymentSuccess(true);
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Something went wrong! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Cookies.get("token")) {
      const nextPath = isClinicCheckout
        ? "/home/PaymentPage?flow=clinic"
        : isTreatmentCheckout
        ? "/home/PaymentPage?flow=treatment"
        : "/home/Address";
      router.replace(
        isClinicCheckout
          ? `/cliniclogin?next=${encodeURIComponent(nextPath)}`
          : `/Login?next=${encodeURIComponent(nextPath)}`
      );
      return;
    }

    if (!checkoutLoaded || !cartHydrated) return;
    if (activeItems.length === 0 && !paymentSuccess) {
      router.push(isTreatmentCheckout ? "/home/TreatmentPlans" : "/home/Cart");
    }
  }, [activeItems.length, checkoutLoaded, cartHydrated, isClinicCheckout, isTreatmentCheckout, paymentSuccess, router]);

  if (!checkoutLoaded || !cartHydrated) {
    return <FullPageLoader />;
  }

  if (paymentSuccess) {
    const summaryItems = paymentSnapshot?.items || activeItems;
    const summaryTotal = paymentSnapshot?.total ?? grandTotal;
    const summaryAddressType = paymentSnapshot?.addressType || displayAddressType;
    const summaryAddressText = paymentSnapshot?.addressText || displayAddressText;

    return (
      <div className={styles.wrapper}>
        <Topbar />
        <div className={styles.successBackdrop} />
        <div className={styles.successShell}>
          <div className={styles.paymentSuccess}>
            <div className={styles.successIcon}>
              <FaCheckCircle />
            </div>
            <p className={styles.successPill}>
              {isClinicCheckout
                ? "Clinic payment complete"
                : isTreatmentCheckout
                ? "Treatment booked"
                : "Payment complete"}
            </p>
            <h2>
              {isClinicCheckout
                ? "Your clinic purchase is confirmed"
                : isTreatmentCheckout
                ? "Your treatment booking is confirmed"
                : "Payment successful"}
            </h2>
            <p className={styles.successText}>
              {isClinicCheckout
                ? "We have received your clinic order and will process it shortly."
                : isTreatmentCheckout
                ? "We have received your treatment booking and will contact you with the next steps shortly."
                : "Your order has been placed successfully. Thank you for shopping with us."}
            </p>

            <div className={styles.successMeta}>
              <div className={styles.successMetaItem}>
                <span>
                  {paymentSnapshot?.flowLabel ||
                    (isClinicCheckout
                      ? "Clinic details"
                      : isTreatmentCheckout
                      ? "Booking type"
                      : "Delivery address")}
                </span>
                <strong>{summaryAddressType}</strong>
                <p>{summaryAddressText}</p>
                {paymentSnapshot?.clinicName && <p>{paymentSnapshot.clinicName}</p>}
              </div>
              <div className={styles.successMetaItem}>
                <span>Amount paid</span>
                <strong>₹{summaryTotal}</strong>
                <p>{summaryItems.length} item(s)</p>
              </div>
            </div>

            <div className={styles.successActions}>
              <button
                onClick={() => router.push("/home")}
                className={styles.primaryAction}
              >
                Continue Shopping
              </button>
              <button
                onClick={() =>
                  router.push(isTreatmentCheckout ? "/home/TreatmentPlans" : "/home")
                }
                className={styles.secondaryAction}
              >
                {isTreatmentCheckout ? "Browse Treatments" : "Explore More"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Topbar />
      <div className={styles.backdrop} />

      <div className={styles.topbar}>
        <div className={styles.brandWrap}>
          {/* <Image
            src="/logo.jpeg"
            alt="Logo"
            width={155}
            height={120}
            className={styles.logo}
            onClick={() => router.push("/home")}
          /> */}
          <div className={styles.brandCopy}>
            <p className={styles.brandPill}>Secure checkout</p>
            <h1 className={styles.brandTitle}>
              {isTreatmentCheckout ? "Treatment booking" : "Checkout"}
            </h1>
          </div>
        </div>

        <div className={styles.steps}>
          <div className={styles.stepChip}>
            <span className={styles.stepDot}>1</span>
            <span>{isTreatmentCheckout ? "Treatment" : "Cart"}</span>
          </div>
          {!isTreatmentCheckout && (
            <>
              <FaArrowRight className={styles.stepArrow} />
              <div className={styles.stepChip}>
                <span className={styles.stepDot}>2</span>
                <span>Address</span>
              </div>
            </>
          )}
          <FaArrowRight className={styles.stepArrow} />
          <div className={`${styles.stepChip} ${styles.stepChipActive}`}>
            <span className={styles.stepDot}>{isTreatmentCheckout ? "2" : "3"}</span>
            <span>Payment</span>
          </div>
        </div>
      </div>

      <div className={styles.heroBand}>
        <div>
          <p className={styles.heroEyebrow}>
            {isClinicCheckout
              ? "Clinic checkout"
              : isTreatmentCheckout
              ? "Treatment checkout"
              : "Order checkout"}
          </p>
          <h2 className={styles.heroTitle}>
            {isClinicCheckout
              ? "Confirm your clinic purchase and pay securely"
              : isTreatmentCheckout
              ? "Confirm your treatment booking and pay securely"
              : "Review your order and complete payment"}
          </h2>
          <p className={styles.heroCopy}>
            {isClinicCheckout
              ? "Your clinic profile and billing address will be used for this payment."
              : isTreatmentCheckout
              ? "No address selection is needed here. Review the treatment summary and continue to secure payment."
              : "Double-check the items below, confirm the address, and finish the payment securely."}
          </p>
        </div>
        <div className={styles.heroBadge}>
          <FaShieldAlt />
          <span>Encrypted payment</span>
        </div>
      </div>

      <div className={styles.checkoutGrid}>
        <section className={styles.leftCard}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.sectionKicker}>Delivery details</p>
              <h3>
                {isClinicCheckout
                  ? "Clinic details"
                  : isTreatmentCheckout
                  ? "Booking details"
                  : "Confirm the address"}
              </h3>
            </div>
            <div className={styles.cardStatus}>
              <FaMapMarkerAlt />
              <span>{isClinicCheckout ? "Clinic flow" : isTreatmentCheckout ? "Booking flow" : "Verified flow"}</span>
            </div>
          </div>

          <div className={styles.addressBox}>
            <div className={styles.addressPin}>
              <GoLocation />
            </div>
            <div>
              <p className={styles.addressLabel}>
                {isClinicCheckout
                  ? "Clinic billing"
                  : isTreatmentCheckout
                  ? "Treatment booking"
                  : "Deliver to"}
              </p>
              <p className={styles.addressType}>
                {isClinicCheckout
                  ? clinicName || Cookies.get("clinicName") || "Clinic"
                  : isTreatmentCheckout
                  ? "No address required"
                  : deliveryType}
              </p>
              <p className={styles.addressText}>
                {isClinicCheckout
                  ? clinicAddress || deliveryAddress
                  : isTreatmentCheckout
                  ? "You are paying directly for the treatment plan. No address selection is needed."
                  : deliveryAddress}
              </p>
            </div>
          </div>

         
        </section>

        <aside className={styles.rightCard}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.sectionKicker}>Order summary</p>
              <h3>{isClinicCheckout ? "Clinic checkout" : isTreatmentCheckout ? "Treatment booking" : "Cart checkout"}</h3>
            </div>
            <div className={styles.summaryPill}>{activeItems.length} items</div>
          </div>

          <div className={styles.itemsList}>
            {activeItems.map((item) => (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemVisual}>
                  <img
                    src={item.image || "/skin_hair.jpg"}
                    alt={item.name}
                    className={styles.itemImage}
                  />
                </div>
                <div className={styles.itemCopy}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemMeta}>Qty {item.quantity}</span>
                </div>
                <span className={styles.itemAmount}>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className={styles.breakdown}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <strong>₹{subtotal}</strong>
            </div>
            <div className={styles.grandTotal}>
              <span>Payable amount</span>
              <strong>₹{grandTotal}</strong>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className={styles.payButton}
          >
            {loading ? "Processing..." : `Pay ₹${grandTotal}`}
          </button>

          <p className={styles.checkoutNote}>
            Secure payment, fast confirmation, and no extra checkout steps.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default PaymentPage;
