"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { FiCheckCircle } from "react-icons/fi";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";
import { loadRazorpayScript } from "@/lib/loadRazorpay";
import styles from "@/styles/clinicdashboard/subscriptionPlan.module.css";

type BillingCycle = "monthly" | "quarterly" | "yearly";

type Plan = {
  planName: string;
  description: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
  features: string[];
};

type Addon = {
  _id: string;
  name: string;
  description: string;
  price: number;
};

type SubscriptionStatus = {
  subscription: {
    billingCycle: BillingCycle;
    amount: number;
    planAmount?: number;
    addonsAmount?: number;
    addons?: { name: string; price: number }[];
    startDate: string;
    endDate: string;
    status: "active" | "expired" | "cancelled";
  } | null;
  isActive: boolean;
  whatsappVisible: boolean;
  leadAccessVisible: boolean;
  verifiedBadgeVisible: boolean;
};

type SubscriptionPlanProps = {
  clinicId: string;
};

const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

const CYCLE_SUBTEXT: Record<BillingCycle, string> = {
  monthly: "billed every month",
  quarterly: "billed every 3 months",
  yearly: "billed every 12 months",
};

export default function SubscriptionPlan({ clinicId }: SubscriptionPlanProps) {
  const toast = useToast();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>("monthly");
  const [paying, setPaying] = useState(false);

  const token = Cookies.get("token") || "";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [planRes, addonsRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/clinic-subscriptions/plan`),
        fetch(`${API_URL}/clinic-subscriptions/addons`),
        clinicId
          ? fetch(`${API_URL}/clinic-subscriptions/clinic/${clinicId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : Promise.resolve(null),
      ]);

      setPlan(await planRes.json());

      const addonsData = await addonsRes.json();
      setAddons(Array.isArray(addonsData) ? addonsData : []);

      if (statusRes) {
        const statusData = await statusRes.json();
        if (statusRes.ok) setStatus(statusData);
      }
    } catch (err) {
      console.error("Failed to load subscription plan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  const priceForCycle = (cycle: BillingCycle) =>
    plan ? (cycle === "monthly" ? plan.monthlyPrice : cycle === "quarterly" ? plan.quarterlyPrice : plan.yearlyPrice) : 0;

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const selectedAddons = addons.filter((addon) => selectedAddonIds.includes(addon._id));
  const planPrice = priceForCycle(selectedCycle);
  const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const grandTotal = planPrice + addonsTotal;

  const handleSubscribe = async () => {
    if (!plan || !clinicId) return;

    setPaying(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load payment gateway. Please check your internet connection.");
      }

      const createRes = await fetch(`${API_URL}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: grandTotal }),
      });
      const razorpayOrder = await createRes.json();
      if (!createRes.ok) throw new Error(razorpayOrder.message || "Failed to start payment");

      await new Promise<void>((resolve, reject) => {
        const razorpay = new (window as any).Razorpay({
          key: razorpayOrder.keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          order_id: razorpayOrder.orderId,
          name: "DrDermat",
          description: `${plan.planName} — ${CYCLE_LABELS[selectedCycle]}`,
          prefill: { name: Cookies.get("clinicName") || "" },
          theme: { color: "#0f9d58" },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch(`${API_URL}/payments/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verification = await verifyRes.json();
              if (!verification.verified) {
                reject(new Error("Payment verification failed"));
                return;
              }

              const purchaseRes = await fetch(`${API_URL}/clinic-subscriptions/purchase`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  billingCycle: selectedCycle,
                  addonIds: selectedAddonIds,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              const purchaseData = await purchaseRes.json();
              if (!purchaseRes.ok) {
                reject(new Error(purchaseData.message || "Failed to activate subscription"));
                return;
              }

              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
        });

        razorpay.on("payment.failed", () => reject(new Error("Payment failed")));
        razorpay.open();
      });

      toast.success("Subscription activated successfully");
      setSelectedAddonIds([]);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to activate subscription");
    } finally {
      setPaying(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
  };

  const cycles: BillingCycle[] = ["monthly", "quarterly", "yearly"];

  if (loading) {
    return <p>Loading subscription plan...</p>;
  }

  if (!plan) {
    return <p>Unable to load the subscription plan right now.</p>;
  }

  return (
    <div className={styles.page}>
      {status && (
        <div className={`${styles.statusHero} ${status.isActive ? "" : styles.inactive}`}>
          <div className={styles.statusHeroTop}>
            <span className={styles.statusBadge}>
              {status.subscription ? (status.isActive ? "● Plan Active" : "○ Plan Expired") : "○ No Plan Yet"}
            </span>
            {status.subscription && (
              <span className={styles.statusExpiry}>
                {CYCLE_LABELS[status.subscription.billingCycle]} · Valid {formatDate(status.subscription.startDate)} to{" "}
                {formatDate(status.subscription.endDate)}
                {status.subscription.addons && status.subscription.addons.length > 0 && (
                  <> · {status.subscription.addons.length} add-on{status.subscription.addons.length === 1 ? "" : "s"}</>
                )}
              </span>
            )}
          </div>
          <div className={styles.perkRow}>
            <span className={`${styles.perkChip} ${status.whatsappVisible ? styles.on : ""}`}>
              <span className={styles.perkDot} /> WhatsApp Button
            </span>
            <span className={`${styles.perkChip} ${status.leadAccessVisible ? styles.on : ""}`}>
              <span className={styles.perkDot} /> Lead Dashboard
            </span>
            <span className={`${styles.perkChip} ${status.verifiedBadgeVisible ? styles.on : ""}`}>
              <span className={styles.perkDot} /> Verified Badge
            </span>
          </div>
        </div>
      )}

      <div className={styles.planCard}>
        <div className={styles.planHeaderRow}>
          <div>
            <span className={styles.kicker}>Subscription Plan</span>
            <h2 className={styles.planName}>{plan.planName}</h2>
            {plan.description && <p className={styles.planDescription}>{plan.description}</p>}
          </div>
        </div>

        <div className={styles.featureGrid}>
          {plan.features.map((feature) => (
            <div key={feature} className={styles.featureItem}>
              <FiCheckCircle className={styles.featureCheck} />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {!plan.isActive ? (
          <p className={styles.disabledNotice}>This plan isn&apos;t available for purchase right now.</p>
        ) : (
          <>
            <p className={styles.cycleLabel}>Choose a billing cycle</p>
            <div className={styles.cycleRow}>
              {cycles.map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setSelectedCycle(cycle)}
                  className={`${styles.cycleButton} ${selectedCycle === cycle ? styles.active : ""}`}
                >
                  <div className={styles.cycleTitle}>{CYCLE_LABELS[cycle]}</div>
                  <div className={styles.cyclePrice}>₹{priceForCycle(cycle)}</div>
                  <div className={styles.cycleSub}>{CYCLE_SUBTEXT[cycle]}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {plan.isActive && addons.length > 0 && (
        <div className={styles.addonsSection}>
          <h3 className={styles.addonsHeading}>Add-on services</h3>
          <p className={styles.addonsSubtext}>
            Optional extras you can attach to your plan — charged together with your subscription.
          </p>
          <div className={styles.addonsGrid}>
            {addons.map((addon) => {
              const selected = selectedAddonIds.includes(addon._id);
              return (
                <label
                  key={addon._id}
                  className={`${styles.addonCard} ${selected ? styles.selected : ""}`}
                >
                  <input
                    type="checkbox"
                    className={styles.addonCheckbox}
                    checked={selected}
                    onChange={() => toggleAddon(addon._id)}
                  />
                  <div className={styles.addonBody}>
                    <div className={styles.addonName}>{addon.name}</div>
                    {addon.description && (
                      <p className={styles.addonDescription}>{addon.description}</p>
                    )}
                    <div className={styles.addonPrice}>+₹{addon.price}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {plan.isActive && (
        <div className={styles.summaryBar}>
          <div className={styles.summaryLines}>
            <div className={styles.summaryLine}>
              <span>
                {plan.planName} ({CYCLE_LABELS[selectedCycle]})
              </span>
              <span>₹{planPrice}</span>
            </div>
            {selectedAddons.map((addon) => (
              <div key={addon._id} className={styles.summaryLine}>
                <span>{addon.name}</span>
                <span>₹{addon.price}</span>
              </div>
            ))}
            <div className={styles.summaryTotalLine}>
              <span className={styles.summaryTotalLabel}>Total</span>
              <span className={styles.summaryTotalValue}>₹{grandTotal}</span>
            </div>
          </div>

          <button type="button" onClick={handleSubscribe} disabled={paying} className={styles.subscribeBtn}>
            {paying ? "Processing..." : status?.isActive ? "Renew Plan" : "Subscribe Now"}
          </button>
        </div>
      )}
    </div>
  );
}
