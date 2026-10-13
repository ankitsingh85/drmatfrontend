"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Cookies from "js-cookie";
import styles from "@/styles/user/paymentpage.module.css";
import { CartItem, useCart } from "@/context/CartContext";
import { useOrder } from "@/context/OrderContext";
import { API_URL } from "@/config/api";
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
const CONSULTATION_CHECKOUT_KEY = "consultationCheckout";

const PaymentPage: React.FC = () => {
  const router = useRouter();
  const { type, address, flow } = router.query;

  const { cartItems, clearCart, hydrated: cartHydrated } = useCart();
  const { createOrder } = useOrder();

  const [isHydrated, setIsHydrated] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [checkoutLoaded, setCheckoutLoaded] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorAddress, setDoctorAddress] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [publicCoupons, setPublicCoupons] = useState<
    {
      couponCode: string;
      couponName: string;
      discountType: "percent" | "amount";
      discountValue: number;
      cartValue?: number;
      maxDiscount?: number;
    }[]
  >([]);
  const [paymentSnapshot, setPaymentSnapshot] = useState<{
    items: CartItem[];
    total: number;
    addressType: string;
    addressText: string;
    flowLabel: string;
    clinicName?: string;
    doctorName?: string;
  } | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const flowMode = Array.isArray(flow) ? flow[0] : flow;
  const isConsultationCheckout = flowMode === "consultation";

  useEffect(() => {
    // router.query (and therefore flowMode/isConsultationCheckout) is empty
    // until the router is ready on a fresh/hard navigation — e.g. right
    // after login does a window.location.replace(...) back to this page.
    // Reading sessionStorage before that resolves picks the wrong key and
    // silently falls back to the real cart. Wait for isReady first.
    if (!router.isReady) return;

    try {
      const key = isConsultationCheckout ? CONSULTATION_CHECKOUT_KEY : TREATMENT_CHECKOUT_KEY;
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setCheckoutItems(parsed);
      }
    } catch {
      setCheckoutItems([]);
    } finally {
      setCheckoutLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, isConsultationCheckout]);

  const currentRole = isHydrated ? Cookies.get("role")?.toLowerCase() : null;
  const isClinicCheckout = flowMode === "clinic" || currentRole === "clinic";
  const isDoctorCheckout = flowMode === "doctor" || currentRole === "doctor";
  const isB2BCheckout = flowMode === "b2b" || currentRole === "b2buser";
  const isBusinessCheckout = isClinicCheckout || isDoctorCheckout || isB2BCheckout;
  const activeItems = checkoutItems.length > 0 ? checkoutItems : cartItems;
  const hasProductItems = activeItems.some((item) => item.itemType !== "treatment");
  const hasTreatmentItems = activeItems.some((item) => item.itemType === "treatment");
  const isTreatmentCheckout =
    !isConsultationCheckout &&
    (flowMode === "treatment" ||
      (checkoutLoaded && checkoutItems.length > 0 && cartItems.length === 0) ||
      (activeItems.length > 0 && hasTreatmentItems && !hasProductItems));

  const needsLogin = isHydrated && !Cookies.get("token");
  const loginNextPath = isClinicCheckout
    ? "/home/PaymentPage?flow=clinic"
    : isDoctorCheckout
    ? "/home/PaymentPage?flow=doctor"
    : isB2BCheckout
    ? "/home/PaymentPage?flow=b2b"
    : isConsultationCheckout
    ? "/home/PaymentPage?flow=consultation"
    : isTreatmentCheckout
    ? "/home/PaymentPage?flow=treatment"
    : "/home/Address";
  const loginHref = isBusinessCheckout
    ? `/businesslogin?next=${encodeURIComponent(loginNextPath)}`
    : `/Login?next=${encodeURIComponent(loginNextPath)}`;

  const treatmentClinicItem = isTreatmentCheckout
    ? activeItems.find((item) => item.itemType === "treatment" && item.clinicName)
    : undefined;

  const subtotal = useMemo(
    () => activeItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [activeItems]
  );

  const couponServiceSection = isConsultationCheckout
    ? "Online Consultation"
    : isTreatmentCheckout
    ? "Treatment"
    : isB2BCheckout
    ? "B2B Product"
    : "Product";

  const discountAmount = appliedCoupon?.discount || 0;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // The applied coupon stops making sense once the cart or checkout type
  // it was validated against changes (e.g. the user goes back and edits
  // the cart) — clear it rather than silently keep charging a stale
  // discount.
  useEffect(() => {
    setAppliedCoupon(null);
    setCouponError("");
  }, [subtotal, couponServiceSection]);

  // Coupons the admin has flagged "isPublic" are advertised directly in the
  // cart for this checkout's service section (or site-wide "All" coupons)
  // instead of only working for someone who already knows the code.
  useEffect(() => {
    if (!couponServiceSection) return;
    let cancelled = false;

    const fetchPublicCoupons = async () => {
      try {
        const res = await fetch(
          `${API_URL}/coupons/public?serviceSection=${encodeURIComponent(couponServiceSection)}`
        );
        const data = await res.json().catch(() => []);
        if (!cancelled) setPublicCoupons(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch public coupons:", err);
        if (!cancelled) setPublicCoupons([]);
      }
    };

    fetchPublicCoupons();
    return () => {
      cancelled = true;
    };
  }, [couponServiceSection]);

  const handleApplyCoupon = async (codeOverride?: string) => {
    const code = (codeOverride ?? couponInput).trim();
    if (!code) {
      setCouponError("Enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch(`${API_URL}/coupons/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: code,
          serviceSection: couponServiceSection,
          cartValue: subtotal,
          userId: Cookies.get("userId") || localStorage.getItem("userId") || undefined,
          itemIds: activeItems.map((item) => item.id),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.message || "Unable to apply this coupon");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({ code: data.couponCode, discount: data.discount });
    } catch (err) {
      console.error("Failed to apply coupon:", err);
      setCouponError("Something went wrong while applying the coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const handleApplyPublicCoupon = (code: string) => {
    setCouponInput(code);
    handleApplyCoupon(code);
  };

  const deliveryType = Array.isArray(type) ? type[0] : type;
  const deliveryAddress = Array.isArray(address) ? address[0] : address;

  const orderAddressType = isClinicCheckout
    ? "Clinic"
    : isDoctorCheckout
    ? "Doctor"
    : isTreatmentCheckout || isConsultationCheckout
    ? "Other"
    : deliveryType;
  const orderAddressText = isConsultationCheckout
    ? "Online consultation booking - no delivery address required"
    : isTreatmentCheckout
    ? treatmentClinicItem
      ? `Treatment booking at ${treatmentClinicItem.clinicName}${
          treatmentClinicItem.clinicAddress ? `, ${treatmentClinicItem.clinicAddress}` : ""
        }`
      : "Treatment booking - no delivery address required"
    : isClinicCheckout
    ? clinicAddress || deliveryAddress
    : isDoctorCheckout
    ? doctorAddress || deliveryAddress
    : deliveryAddress;

  const displayAddressType = isClinicCheckout
    ? "Clinic"
    : isDoctorCheckout
    ? "Doctor"
    : isConsultationCheckout
    ? "Consultation booking"
    : isTreatmentCheckout
    ? treatmentClinicItem
      ? "Visiting clinic"
      : "Treatment booking"
    : deliveryType;
  const displayAddressText = isConsultationCheckout
    ? "No delivery address required"
    : isTreatmentCheckout
    ? treatmentClinicItem
      ? `${treatmentClinicItem.clinicName}${
          treatmentClinicItem.clinicAddress ? ` — ${treatmentClinicItem.clinicAddress}` : ""
        }`
      : "No delivery address required"
    : isClinicCheckout
    ? clinicAddress || deliveryAddress
    : isDoctorCheckout
    ? doctorAddress || deliveryAddress
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

  useEffect(() => {
    if (!isHydrated || !isDoctorCheckout) return;
    const nextDoctorName = Array.isArray(router.query.doctorName)
      ? router.query.doctorName[0]
      : (router.query.doctorName as string) || Cookies.get("username") || "";
    const nextDoctorAddress = Array.isArray(router.query.address)
      ? router.query.address[0]
      : (router.query.address as string) || "";
    const nextDoctorId = Array.isArray(router.query.doctorId)
      ? router.query.doctorId[0]
      : (router.query.doctorId as string) || Cookies.get("doctorId") || "";
    setDoctorName(nextDoctorName);
    setDoctorAddress(nextDoctorAddress);
    setDoctorId(nextDoctorId);
  }, [isDoctorCheckout, isHydrated, router.query.address, router.query.doctorId, router.query.doctorName]);

  const handlePayment = async () => {
    if (!Cookies.get("token")) {
      router.push(loginHref);
      return;
    }

    if (!orderAddressType || !orderAddressText) {
      setPaymentError("Please go back and select a delivery address.");
      return;
    }

    try {
      setLoading(true);
      setPaymentError("");
      const snapshotItems = [...activeItems];
      const snapshotTotal = grandTotal;
      setPaymentSnapshot({
        items: snapshotItems,
        total: snapshotTotal,
        addressType: String(displayAddressType || orderAddressType),
        addressText: String(displayAddressText || orderAddressText),
        flowLabel: isClinicCheckout
          ? "Clinic billing"
          : isDoctorCheckout
          ? "Doctor billing"
          : isConsultationCheckout
          ? "Online consultation booking"
          : isTreatmentCheckout
          ? "Treatment booking"
          : "Delivery address",
        clinicName: clinicName || Cookies.get("clinicName") || "",
        doctorName: doctorName || Cookies.get("username") || "",
      });
      const couponOptions = appliedCoupon
        ? { couponCode: appliedCoupon.code, discountAmount: appliedCoupon.discount }
        : {};

      await createOrder(
        activeItems,
        grandTotal,
        {
          type: String(orderAddressType),
          address: String(orderAddressText),
        },
        isConsultationCheckout ? "consultation" : isTreatmentCheckout ? "treatment" : "product",
        isClinicCheckout
          ? { ownerType: "clinic", clinicId: clinicId || Cookies.get("clinicId") || "", ...couponOptions }
          : isDoctorCheckout
          ? { ownerType: "doctor", doctorId: doctorId || Cookies.get("doctorId") || "", ...couponOptions }
          : currentRole === "b2buser"
          ? { ownerType: "b2buser", b2bUserId: Cookies.get("b2bUserId") || "", ...couponOptions }
          : { ownerType: "user", ...couponOptions }
      );

      if (isConsultationCheckout) {
        sessionStorage.removeItem(CONSULTATION_CHECKOUT_KEY);
      } else if (isTreatmentCheckout) {
        sessionStorage.removeItem(TREATMENT_CHECKOUT_KEY);
      } else {
        clearCart();
      }
      setPaymentSuccess(true);
    } catch (error: any) {
      console.error("Payment failed:", error);
      const message = String(error?.message || "");
      if (message.toLowerCase().includes("log in")) {
        router.push(loginHref);
        return;
      }
      setPaymentError(
        message === "Payment cancelled"
          ? "Payment was cancelled."
          : "Something went wrong while processing your payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isHydrated) return;
    if (needsLogin) {
      router.replace(loginHref);
      return;
    }

    if (!checkoutLoaded || !cartHydrated) return;
    if (activeItems.length === 0 && !paymentSuccess) {
      router.push(
        isConsultationCheckout
          ? "/video-consultation"
          : isTreatmentCheckout
          ? "/home/TreatmentPlans"
          : "/home/Cart"
      );
    }
  }, [
    isHydrated,
    needsLogin,
    loginHref,
    activeItems.length,
    checkoutLoaded,
    cartHydrated,
    isConsultationCheckout,
    isTreatmentCheckout,
    paymentSuccess,
    router,
  ]);

  if (!isHydrated || !checkoutLoaded || !cartHydrated) {
    return <FullPageLoader />;
  }

  if (needsLogin) {
    return (
      <div className={styles.wrapper}>
        <Topbar />
        <div className={styles.successBackdrop} />
        <div className={styles.successShell}>
          <div className={styles.paymentSuccess}>
            <div className={styles.successIcon}>
              <FaShieldAlt />
            </div>
            <p className={styles.successPill}>Login required</p>
            <h2>Please log in to continue</h2>
            <p className={styles.successText}>
              {isConsultationCheckout
                ? "You need to be logged in to book and pay for a video consultation."
                : isTreatmentCheckout
                ? "You need to be logged in to book and pay for this treatment."
                : "You need to be logged in to complete this checkout."}
            </p>
            <div className={styles.successActions}>
              <button
                type="button"
                className={styles.primaryAction}
                onClick={() => router.push(loginHref)}
              >
                Log in to continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
                : isDoctorCheckout
                ? "Doctor payment complete"
                : isConsultationCheckout
                ? "Consultation booked"
                : isTreatmentCheckout
                ? "Treatment booked"
                : "Payment complete"}
            </p>
            <h2>
              {isClinicCheckout
                ? "Your clinic purchase is confirmed"
                : isDoctorCheckout
                ? "Your doctor purchase is confirmed"
                : isConsultationCheckout
                ? "Your video consultation is confirmed"
                : isTreatmentCheckout
                ? "Your treatment booking is confirmed"
                : "Payment successful"}
            </h2>
            <p className={styles.successText}>
              {isClinicCheckout
                ? "We have received your clinic order and will process it shortly."
                : isDoctorCheckout
                ? "We have received your doctor order and will process it shortly."
                : isConsultationCheckout
                ? "We have received your booking and will confirm your doctor and time slot shortly."
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
                      : isConsultationCheckout
                      ? "Booking type"
                      : isTreatmentCheckout
                      ? "Booking type"
                      : "Delivery address")}
                </span>
                <strong>{summaryAddressType}</strong>
                <p>{summaryAddressText}</p>
                {paymentSnapshot?.clinicName && <p>{paymentSnapshot.clinicName}</p>}
                {paymentSnapshot?.doctorName && <p>{paymentSnapshot.doctorName}</p>}
              </div>
              <div className={styles.successMetaItem}>
                <span>Amount paid</span>
                <strong>₹{summaryTotal}</strong>
                <p>{summaryItems.length} item(s)</p>
              </div>
            </div>

            <div className={styles.successActions}>
              {isBusinessCheckout ? (
                <>
                  <button
                    onClick={() =>
                      router.push(
                        isDoctorCheckout
                          ? "/DoctorDashboard?section=orders"
                          : isB2BCheckout
                          ? "/B2BUserDashboard?section=orders"
                          : "/ClinicDashboard?section=orders"
                      )
                    }
                    className={styles.primaryAction}
                  >
                    {isDoctorCheckout
                      ? "Open Doctor Orders"
                      : isB2BCheckout
                      ? "Open My Orders"
                      : "Open Clinic Orders"}
                  </button>
                  <button
                    onClick={() => router.push("/home")}
                    className={styles.secondaryAction}
                  >
                    Back to Home
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push("/home")}
                    className={styles.primaryAction}
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={() =>
                      router.push(
                        isConsultationCheckout
                          ? "/video-consultation"
                          : isTreatmentCheckout
                          ? "/home/TreatmentPlans"
                          : "/home"
                      )
                    }
                    className={styles.secondaryAction}
                  >
                    {isConsultationCheckout
                      ? "Book Another Consultation"
                      : isTreatmentCheckout
                      ? "Browse Treatments"
                      : "Explore More"}
                  </button>
                </>
              )}
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
              {isConsultationCheckout
                ? "Consultation booking"
                : isTreatmentCheckout
                ? "Treatment booking"
                : "Checkout"}
            </h1>
          </div>
        </div>

        <div className={styles.steps}>
          <div className={styles.stepChip}>
            <span className={styles.stepDot}>1</span>
            <span>
              {isConsultationCheckout ? "Consultation" : isTreatmentCheckout ? "Treatment" : "Cart"}
            </span>
          </div>
          {!isTreatmentCheckout && !isConsultationCheckout && (
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
            <span className={styles.stepDot}>
              {isTreatmentCheckout || isConsultationCheckout ? "2" : "3"}
            </span>
            <span>Payment</span>
          </div>
        </div>
      </div>

      <div className={styles.heroBand}>
        <div>
          <p className={styles.heroEyebrow}>
            {isClinicCheckout
              ? "Clinic checkout"
              : isDoctorCheckout
              ? "Doctor checkout"
              : isConsultationCheckout
              ? "Consultation checkout"
              : isTreatmentCheckout
              ? "Treatment checkout"
              : "Order checkout"}
          </p>
          <h2 className={styles.heroTitle}>
            {isClinicCheckout
              ? "Confirm your clinic purchase and pay securely"
              : isDoctorCheckout
              ? "Confirm your doctor purchase and pay securely"
              : isConsultationCheckout
              ? "Confirm your video consultation and pay securely"
              : isTreatmentCheckout
              ? "Confirm your treatment booking and pay securely"
              : "Review your order and complete payment"}
          </h2>
          <p className={styles.heroCopy}>
            {isClinicCheckout
              ? "Your clinic profile and billing address will be used for this payment."
              : isDoctorCheckout
              ? "Your doctor profile and billing address will be used for this payment."
              : isConsultationCheckout
              ? "No address selection is needed here. Review the consultation summary and continue to secure payment."
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
                  : isDoctorCheckout
                  ? "Doctor details"
                  : isConsultationCheckout
                  ? "Consultation details"
                  : isTreatmentCheckout
                  ? "Booking details"
                  : "Confirm the address"}
              </h3>
            </div>
            <div className={styles.cardStatus}>
              <FaMapMarkerAlt />
              <span>
                {isBusinessCheckout
                  ? "Business flow"
                  : isConsultationCheckout || isTreatmentCheckout
                  ? "Booking flow"
                  : "Verified flow"}
              </span>
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
                  : isDoctorCheckout
                  ? "Doctor billing"
                  : isConsultationCheckout
                  ? "Consultation booking"
                  : isTreatmentCheckout
                  ? treatmentClinicItem
                    ? "Visiting clinic"
                    : "Treatment booking"
                  : "Deliver to"}
              </p>
              <p className={styles.addressType}>
                {isClinicCheckout
                  ? clinicName || Cookies.get("clinicName") || "Clinic"
                  : isDoctorCheckout
                  ? doctorName || Cookies.get("username") || "Doctor"
                  : isConsultationCheckout
                  ? "No address required"
                  : isTreatmentCheckout
                  ? treatmentClinicItem?.clinicName || "No address required"
                  : deliveryType}
              </p>
              <p className={styles.addressText}>
                {isClinicCheckout
                  ? clinicAddress || deliveryAddress
                  : isDoctorCheckout
                  ? doctorAddress || deliveryAddress
                  : isConsultationCheckout
                  ? "You are paying directly for the video consultation. No address selection is needed."
                  : isTreatmentCheckout
                  ? treatmentClinicItem?.clinicAddress ||
                    "You are paying directly for the treatment plan. No address selection is needed."
                  : deliveryAddress}
              </p>
            </div>
          </div>


        </section>

        <aside className={styles.rightCard}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.sectionKicker}>Order summary</p>
              <h3>
                {isClinicCheckout
                  ? "Clinic checkout"
                  : isDoctorCheckout
                  ? "Doctor checkout"
                  : isConsultationCheckout
                  ? "Consultation booking"
                  : isTreatmentCheckout
                  ? "Treatment booking"
                  : "Cart checkout"}
              </h3>
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

          {!appliedCoupon && publicCoupons.length > 0 && (
            <div style={{ margin: "16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
              {publicCoupons.map((coupon) => (
                <div
                  key={coupon.couponCode}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "#eff6ff",
                    border: "1px dashed #93c5fd",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "#1d4ed8" }}>
                      {coupon.couponCode} — {coupon.couponName}
                    </div>
                    <div style={{ fontSize: 13, color: "#1e40af" }}>
                      {coupon.discountType === "percent"
                        ? `${coupon.discountValue}% off`
                        : `₹${coupon.discountValue} off`}
                      {coupon.maxDiscount ? ` (up to ₹${coupon.maxDiscount})` : ""}
                      {coupon.cartValue ? ` on orders above ₹${coupon.cartValue}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyPublicCoupon(coupon.couponCode)}
                    disabled={couponLoading}
                    style={{
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 14px",
                      background: "#1d4ed8",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: couponLoading ? "default" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ margin: "16px 0" }}>
            {appliedCoupon ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#dcfce7",
                  border: "1px solid #86efac",
                }}
              >
                <span style={{ fontWeight: 700, color: "#166534" }}>
                  "{appliedCoupon.code}" applied — you saved ₹{appliedCoupon.discount}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#166534",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Have a coupon code?"
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  disabled={couponLoading}
                  style={{
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 18px",
                    background: "linear-gradient(180deg, #2981b7 0%, #10678c 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: couponLoading ? "default" : "pointer",
                  }}
                >
                  {couponLoading ? "Checking..." : "Apply"}
                </button>
              </div>
            )}
            {couponError && (
              <p style={{ color: "#991b1b", fontWeight: 600, marginTop: 8 }}>{couponError}</p>
            )}
          </div>

          <div className={styles.breakdown}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <strong>₹{subtotal}</strong>
            </div>
            {discountAmount > 0 && (
              <div className={styles.totalRow}>
                <span>Coupon discount</span>
                <strong style={{ color: "#166534" }}>−₹{discountAmount}</strong>
              </div>
            )}
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

          {paymentError && <p className={styles.paymentErrorText}>{paymentError}</p>}

          <p className={styles.checkoutNote}>
            Secure payment, fast confirmation, and no extra checkout steps.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default PaymentPage;
