"use client";

import React, { useEffect, useState } from "react";
import { API_URL } from "@/config/api";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import FullPageLoader from "@/components/common/FullPageLoader";
import { useToast } from "@/context/ToastContext";
import { FiCopy, FiTag, FiClock } from "react-icons/fi";
import styles from "@/styles/pages/CouponList.module.css";

interface Coupon {
  _id: string;
  couponCode: string;
  couponName: string;
  discountType: "percent" | "amount";
  discountValue: number;
  serviceSection?: string;
  subService?: string;
  cartValue?: number;
  maxDiscount?: number;
  expiryDate?: string;
}

const formatDiscount = (coupon: Coupon) =>
  coupon.discountType === "percent"
    ? `${coupon.discountValue}% OFF`
    : `₹${coupon.discountValue} OFF`;

const formatExpiry = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function CouponListPage() {
  const toast = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_URL}/coupons/public`);
        if (!res.ok) throw new Error("Failed to load coupons");
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch coupons:", err);
        setError("Failed to load coupons");
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied "${code}" to clipboard`);
    } catch {
      toast.error("Couldn't copy the code — please copy it manually");
    }
  };

  return (
    <>
      <Topbar />

      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Coupons &amp; Offers</h1>
          <p>Grab a code and save on your next booking or purchase.</p>
        </div>

        {loading ? (
          <FullPageLoader />
        ) : error ? (
          <p className={styles.status}>{error}</p>
        ) : coupons.length === 0 ? (
          <p className={styles.status}>No coupons available right now — check back soon!</p>
        ) : (
          <div className={styles.grid}>
            {coupons.map((coupon) => (
              <div key={coupon._id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.discountBadge}>{formatDiscount(coupon)}</span>
                  {coupon.serviceSection && (
                    <span className={styles.sectionBadge}>
                      <FiTag size={12} />
                      {coupon.serviceSection === "All" ? "All Purchases" : coupon.serviceSection}
                      {coupon.subService ? ` · ${coupon.subService}` : ""}
                    </span>
                  )}
                </div>

                <h3 className={styles.couponName}>{coupon.couponName}</h3>

                <ul className={styles.detailsList}>
                  {coupon.cartValue ? (
                    <li>Minimum cart value: ₹{coupon.cartValue.toLocaleString("en-IN")}</li>
                  ) : null}
                  {coupon.discountType === "percent" && coupon.maxDiscount ? (
                    <li>Max discount: ₹{coupon.maxDiscount.toLocaleString("en-IN")}</li>
                  ) : null}
                  {coupon.expiryDate ? (
                    <li className={styles.expiryLine}>
                      <FiClock size={12} /> Valid till {formatExpiry(coupon.expiryDate)}
                    </li>
                  ) : null}
                </ul>

                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => handleCopy(coupon.couponCode)}
                >
                  <span className={styles.code}>{coupon.couponCode}</span>
                  <span className={styles.copyLabel}>
                    <FiCopy size={14} /> Copy
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
      <MobileNavbar />
    </>
  );
}
