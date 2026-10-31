"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { FiCheckCircle, FiDownload } from "react-icons/fi";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";
import { loadRazorpayScript } from "@/lib/loadRazorpay";
import { formatInvoiceDate, printInvoice } from "@/lib/invoiceTemplate";
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
    _id: string;
    billingCycle: BillingCycle;
    amount: number;
    planAmount?: number;
    addonsAmount?: number;
    addons?: { addonId?: string; name: string; price: number }[];
    startDate: string;
    endDate: string;
    status: "active" | "expired" | "cancelled";
  } | null;
  isActive: boolean;
  whatsappVisible: boolean;
  leadAccessVisible: boolean;
  verifiedBadgeVisible: boolean;
  callButtonVisible: boolean;
};

type SubscriptionHistoryRow = {
  _id: string;
  planName: string;
  billingCycle: BillingCycle;
  planAmount?: number;
  addonsAmount?: number;
  amount: number;
  addons?: { name: string; price: number }[];
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled" | "paused";
  createdAt: string;
};

type ClinicProfile = {
  clinicName?: string;
  email?: string;
  contactNumber?: string;
  address?: string;
};

type SubscriptionPlanProps = {
  clinicId: string;
};

const HISTORY_STATUS_LABELS: Record<SubscriptionHistoryRow["status"], string> = {
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
  paused: "Paused",
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
  const [history, setHistory] = useState<SubscriptionHistoryRow[]>([]);
  const [clinicProfile, setClinicProfile] = useState<ClinicProfile>({});
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>("monthly");
  const [paying, setPaying] = useState(false);

  const token = Cookies.get("token") || "";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [planRes, addonsRes, statusRes, historyRes, clinicRes] = await Promise.all([
        fetch(`${API_URL}/clinic-subscriptions/plan`),
        fetch(`${API_URL}/clinic-subscriptions/addons`),
        clinicId
          ? fetch(`${API_URL}/clinic-subscriptions/clinic/${clinicId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : Promise.resolve(null),
        clinicId
          ? fetch(`${API_URL}/clinic-subscriptions/clinic/${clinicId}/history`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : Promise.resolve(null),
        clinicId ? fetch(`${API_URL}/clinics/${clinicId}`) : Promise.resolve(null),
      ]);

      setPlan(await planRes.json());

      const addonsData = await addonsRes.json();
      setAddons(Array.isArray(addonsData) ? addonsData : []);

      if (statusRes) {
        const statusData = await statusRes.json();
        if (statusRes.ok) setStatus(statusData);
      }

      if (historyRes) {
        const historyData = await historyRes.json();
        if (historyRes.ok) setHistory(Array.isArray(historyData) ? historyData : []);
      }

      if (clinicRes) {
        const clinicData = await clinicRes.json();
        if (clinicRes.ok) {
          setClinicProfile({
            clinicName: clinicData.clinicName,
            email: clinicData.email,
            contactNumber: clinicData.contactNumber,
            address: clinicData.address,
          });
        }
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

  // Add-ons already on the clinic's current active subscription — shown as
  // checked-and-locked in the picker, and never re-charged or re-sent to
  // the backend.
  const activeAddonIds = new Set(
    status?.isActive ? (status.subscription?.addons || []).map((a) => String(a.addonId || "")) : []
  );

  // While a plan is already active, selecting an add-on should only ever
  // buy *new* add-ons — never re-buy the plan itself or reset its cycle.
  const newlySelectedAddons = addons.filter(
    (addon) => selectedAddonIds.includes(addon._id) && !activeAddonIds.has(addon._id)
  );
  const selectedAddons = status?.isActive
    ? newlySelectedAddons
    : addons.filter((addon) => selectedAddonIds.includes(addon._id));
  const planPrice = priceForCycle(selectedCycle);
  const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const grandTotal = (status?.isActive ? 0 : planPrice) + addonsTotal;

  /** Shared Razorpay checkout: opens the widget for `amount`, verifies the
   * payment server-side, and resolves with the verified payment ids for
   * the caller to post onward (either /purchase or /add-addons). */
  const payViaRazorpay = (amount: number, description: string) =>
    new Promise<{ razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }>(
      async (resolve, reject) => {
        try {
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            throw new Error("Unable to load payment gateway. Please check your internet connection.");
          }

          const createRes = await fetch(`${API_URL}/payments/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount }),
          });
          const razorpayOrder = await createRes.json();
          if (!createRes.ok) throw new Error(razorpayOrder.message || "Failed to start payment");

          const razorpay = new (window as any).Razorpay({
            key: razorpayOrder.keyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            order_id: razorpayOrder.orderId,
            name: "DrDermat",
            description,
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

                resolve({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
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
        } catch (err) {
          reject(err);
        }
      }
    );

  const handleSubscribe = async () => {
    if (!plan || !clinicId) return;

    setPaying(true);
    try {
      const payment = await payViaRazorpay(grandTotal, `${plan.planName} — ${CYCLE_LABELS[selectedCycle]}`);

      const purchaseRes = await fetch(`${API_URL}/clinic-subscriptions/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          billingCycle: selectedCycle,
          addonIds: selectedAddonIds,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          razorpaySignature: payment.razorpaySignature,
        }),
      });
      const purchaseData = await purchaseRes.json();
      if (!purchaseRes.ok) {
        throw new Error(purchaseData.message || "Failed to activate subscription");
      }

      toast.success("Subscription activated successfully");
      setSelectedAddonIds([]);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to activate subscription");
    } finally {
      setPaying(false);
    }
  };

  // Plan is already active: attach only the newly selected add-ons to the
  // current cycle instead of re-buying the plan and resetting its dates.
  const handleAddAddons = async () => {
    if (!clinicId || newlySelectedAddons.length === 0) return;

    setPaying(true);
    try {
      const payment = await payViaRazorpay(
        addonsTotal,
        `Add-on${newlySelectedAddons.length === 1 ? "" : "s"}: ${newlySelectedAddons
          .map((a) => a.name)
          .join(", ")}`
      );

      const addRes = await fetch(`${API_URL}/clinic-subscriptions/add-addons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addonIds: newlySelectedAddons.map((a) => a._id),
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          razorpaySignature: payment.razorpaySignature,
        }),
      });
      const addData = await addRes.json();
      if (!addRes.ok) {
        throw new Error(addData.message || "Failed to add add-ons");
      }

      toast.success("Add-on(s) added to your active plan");
      setSelectedAddonIds([]);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add add-ons");
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

  const handleDownloadInvoice = (row: SubscriptionHistoryRow) => {
    const ok = printInvoice({
      invoiceNo: `SUB-${row._id.slice(-8).toUpperCase()}`,
      orderNo: row._id.slice(-8).toUpperCase(),
      invoiceDate: formatInvoiceDate(new Date()),
      orderDate: formatInvoiceDate(row.createdAt),
      docSubtitle: "Clinic subscription invoice",
      orderTypeLabel: "Clinic Subscription",
      paymentStatus: "Success",
      paymentMethod: "Online payment",
      logoUrl: `${window.location.origin}/logo.jpeg`,
      billTo: {
        name: clinicProfile.clinicName || "Clinic",
        email: clinicProfile.email,
        phone: clinicProfile.contactNumber,
        address: clinicProfile.address,
      },
      shipTo: { name: clinicProfile.clinicName || "Clinic", address: "Subscription service — no delivery address required" },
      items: [
        {
          name: `${row.planName} (${CYCLE_LABELS[row.billingCycle]})`,
          meta: `Valid ${formatDate(row.startDate)} to ${formatDate(row.endDate)}`,
          unitPrice: row.planAmount ?? row.amount,
          quantity: 1,
          amount: row.planAmount ?? row.amount,
        },
        ...(row.addons || []).map((addon) => ({
          name: `Add-on: ${addon.name}`,
          unitPrice: addon.price,
          quantity: 1,
          amount: addon.price,
        })),
      ],
      total: row.amount,
      footerNote:
        "This invoice is generated for your clinic subscription records. Please keep this copy for future reference.",
    });

    if (!ok) {
      toast.error("Unable to open print window. Please allow popups.");
    }
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
            <span className={`${styles.perkChip} ${status.callButtonVisible ? styles.on : ""}`}>
              <span className={styles.perkDot} /> Call Button
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
        ) : status?.isActive && status.subscription ? (
          <p className={styles.activeNotice}>
            Your {CYCLE_LABELS[status.subscription.billingCycle]} plan is active until{" "}
            {formatDate(status.subscription.endDate)}. Select an add-on below to attach it to your
            current plan — you&apos;ll only be charged for the new add-on, not the plan again.
          </p>
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
              const alreadyActive = activeAddonIds.has(addon._id);
              const selected = alreadyActive || selectedAddonIds.includes(addon._id);
              return (
                <label
                  key={addon._id}
                  className={`${styles.addonCard} ${selected ? styles.selected : ""} ${
                    alreadyActive ? styles.addonCardLocked : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className={styles.addonCheckbox}
                    checked={selected}
                    disabled={alreadyActive}
                    onChange={() => toggleAddon(addon._id)}
                  />
                  <div className={styles.addonBody}>
                    <div className={styles.addonName}>
                      {addon.name}
                      {alreadyActive && <span className={styles.addonActiveTag}>Already active</span>}
                    </div>
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
            {!status?.isActive && (
              <div className={styles.summaryLine}>
                <span>
                  {plan.planName} ({CYCLE_LABELS[selectedCycle]})
                </span>
                <span>₹{planPrice}</span>
              </div>
            )}
            {selectedAddons.map((addon) => (
              <div key={addon._id} className={styles.summaryLine}>
                <span>{addon.name}</span>
                <span>₹{addon.price}</span>
              </div>
            ))}
            {status?.isActive && selectedAddons.length === 0 && (
              <div className={styles.summaryLine}>
                <span>Select an add-on above to continue</span>
              </div>
            )}
            <div className={styles.summaryTotalLine}>
              <span className={styles.summaryTotalLabel}>Total</span>
              <span className={styles.summaryTotalValue}>₹{grandTotal}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={status?.isActive ? handleAddAddons : handleSubscribe}
            disabled={paying || (status?.isActive && selectedAddons.length === 0)}
            className={styles.subscribeBtn}
          >
            {paying
              ? "Processing..."
              : status?.isActive
              ? "Add Add-on(s)"
              : status?.subscription
              ? "Renew Plan"
              : "Subscribe Now"}
          </button>
        </div>
      )}

      <div className={styles.historySection}>
        <h3 className={styles.historyHeading}>Billing History</h3>
        <p className={styles.historySubtext}>
          Every plan and add-on purchase on this account — download the invoice for any of them.
        </p>
        {history.length === 0 ? (
          <p className={styles.historyEmpty}>No purchases yet.</p>
        ) : (
          <div className={styles.historyList}>
            {history.map((row) => (
              <div key={row._id} className={styles.historyRow}>
                <div className={styles.historyRowMain}>
                  <span className={styles.historyRowTitle}>
                    {row.planName} ({CYCLE_LABELS[row.billingCycle]})
                    {row.addons && row.addons.length > 0 ? ` + ${row.addons.length} add-on${row.addons.length === 1 ? "" : "s"}` : ""}
                  </span>
                  <span className={styles.historyRowMeta}>
                    Purchased {formatDate(row.createdAt)} · Valid {formatDate(row.startDate)} to {formatDate(row.endDate)}
                  </span>
                </div>
                <div className={styles.historyRowRight}>
                  <span className={styles.historyAmount}>₹{row.amount}</span>
                  <span
                    className={`${styles.historyStatus} ${
                      row.status === "active"
                        ? styles.historyStatusActive
                        : row.status === "paused"
                        ? styles.historyStatusPaused
                        : row.status === "cancelled"
                        ? styles.historyStatusCancelled
                        : styles.historyStatusExpired
                    }`}
                  >
                    {HISTORY_STATUS_LABELS[row.status]}
                  </span>
                  <button
                    type="button"
                    className={styles.historyInvoiceBtn}
                    onClick={() => handleDownloadInvoice(row)}
                  >
                    <FiDownload /> Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
