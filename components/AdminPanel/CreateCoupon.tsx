"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/Dashboard/createcategory.module.css";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";

type SubServiceOption = { id: string; name: string };

// Each service section's "subservice" list is pulled from the category
// data the admin already added in that section elsewhere in the panel —
// not free text — so a coupon can only ever point at something real.
const SERVICE_SECTIONS: { value: string; label: string; endpoint: string }[] = [
  { value: "All", label: "All (site-wide)", endpoint: "" },
  { value: "Product", label: "Product", endpoint: "categories" },
  { value: "Treatment", label: "Treatment", endpoint: "service-categories" },
  { value: "Course", label: "Course", endpoint: "course-types" },
  { value: "Training", label: "Training", endpoint: "training-types" },
  { value: "Clinic", label: "Clinic", endpoint: "clinic-categories" },
  { value: "B2B Product", label: "B2B Product", endpoint: "b2b-categories" },
  { value: "Online Consultation", label: "Online Consultation", endpoint: "" },
];

const CreateCoupon = () => {
  const toast = useToast();
  const [couponId, setCouponId] = useState("Auto-assigned on save");
  const [loadingCode, setLoadingCode] = useState(true);

  const [form, setForm] = useState({
    couponName: "",
    couponCode: "",
    discountType: "percent",
    discountValue: "",
    startDate: "",
    expiryDate: "",
    isActive: true,
    usageLimit: "",
    perCustomerLimit: "",
    serviceSection: "",
    subService: "",
    cartValue: "",
    newUserOnly: false,
    maxDiscount: "",
    isPublic: false,
  });

  const [subServiceOptions, setSubServiceOptions] = useState<SubServiceOption[]>([]);
  const [loadingSubServices, setLoadingSubServices] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const loadNextCode = async () => {
    try {
      setLoadingCode(true);
      const res = await fetch(`${API_URL}/coupons/next-code`);
      const data = await res.json().catch(() => ({}));
      setCouponId(res.ok ? data.couponId || "Auto-assigned on save" : "Auto-assigned on save");
    } catch {
      setCouponId("Auto-assigned on save");
    } finally {
      setLoadingCode(false);
    }
  };

  useEffect(() => {
    loadNextCode();
  }, []);

  useEffect(() => {
    const section = SERVICE_SECTIONS.find((s) => s.value === form.serviceSection);
    setForm((prev) => ({ ...prev, subService: "" }));
    setSubServiceOptions([]);
    if (!section || !section.endpoint) return;

    const fetchSubServices = async () => {
      try {
        setLoadingSubServices(true);
        const res = await fetch(`${API_URL}/${section.endpoint}`);
        const data = await res.json();
        const raw = Array.isArray(data) ? data : data?.data || [];
        const normalized = raw
          .map((item: any) => ({
            id: item._id || item.id,
            name: item.name,
          }))
          .filter((item: SubServiceOption) => item.id && item.name);
        setSubServiceOptions(normalized);
      } catch (err) {
        console.error("Failed to fetch sub-services:", err);
        setSubServiceOptions([]);
      } finally {
        setLoadingSubServices(false);
      }
    };

    fetchSubServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.serviceSection]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm({
      couponName: "",
      couponCode: "",
      discountType: "percent",
      discountValue: "",
      startDate: "",
      expiryDate: "",
      isActive: true,
      usageLimit: "",
      perCustomerLimit: "",
      serviceSection: "",
      subService: "",
      cartValue: "",
      newUserOnly: false,
      maxDiscount: "",
      isPublic: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!form.couponName.trim() || !form.couponCode.trim() || !form.discountValue.trim() || !form.serviceSection) {
      const err = "Please fill Coupon Name, Coupon Code, Amount and Service Section before creating the coupon.";
      setMessage(err);
      setMessageIsError(true);
      toast.error(err);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create coupon");

      const successMessage = `Coupon created successfully. ID: ${data.couponId}`;
      setMessage(successMessage);
      setMessageIsError(false);
      toast.success(successMessage);
      window.dispatchEvent(new Event("admin-dashboard:create-success"));

      resetForm();
      loadNextCode();
    } catch (err: any) {
      const errMessage = err.message || "Failed to create coupon";
      setMessage(errMessage);
      setMessageIsError(true);
      toast.error(errMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {message && (
        <p
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 700,
            color: messageIsError ? "#991b1b" : "#166534",
            background: messageIsError ? "#fee2e2" : "#dcfce7",
            border: `1px solid ${messageIsError ? "#fca5a5" : "#86efac"}`,
          }}
        >
          {message}
        </p>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Coupon Details</h3>

          <div className={styles.field}>
            <label className={styles.label}>Coupon ID</label>
            <input className={styles.readOnlyInput} value={couponId} readOnly placeholder={loadingCode ? "Generating..." : ""} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Coupon Name<span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              name="couponName"
              value={form.couponName}
              onChange={handleChange}
              placeholder="e.g. Festive Discount"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Coupon Code<span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              name="couponCode"
              value={form.couponCode}
              onChange={handleChange}
              placeholder="e.g. FESTIVE20"
              required
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Discount</h3>

          <div className={styles.field}>
            <label className={styles.label}>Discount Type</label>
            <select className={styles.select} name="discountType" value={form.discountType} onChange={handleChange}>
              <option value="percent">Percent (%)</option>
              <option value="amount">Flat Amount (₹)</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Amount{form.discountType === "percent" ? " (%)" : " (₹)"}
              <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              min="0"
              max={form.discountType === "percent" ? 100 : undefined}
              className={styles.input}
              name="discountValue"
              value={form.discountValue}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Maximum Coupon Discount (₹)</label>
            <input
              type="number"
              min="0"
              className={styles.input}
              name="maxDiscount"
              value={form.maxDiscount}
              onChange={handleChange}
              placeholder="Cap on total discount (optional)"
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Validity</h3>

          <div className={styles.field}>
            <label className={styles.label}>Start Date</label>
            <input type="date" className={styles.input} name="startDate" value={form.startDate} onChange={handleChange} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Expiry Date</label>
            <input type="date" className={styles.input} name="expiryDate" value={form.expiryDate} onChange={handleChange} />
          </div>

          <div className={styles.field}>
            <label className={styles.checkboxRow}>
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              Coupon Active (uncheck to disable)
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Usage Limits</h3>

          <div className={styles.field}>
            <label className={styles.label}>No. of Uses</label>
            <input
              type="number"
              min="0"
              className={styles.input}
              name="usageLimit"
              value={form.usageLimit}
              onChange={handleChange}
              placeholder="Total allowed uses (blank = unlimited)"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Customer No. Allocation</label>
            <input
              type="number"
              min="0"
              className={styles.input}
              name="perCustomerLimit"
              value={form.perCustomerLimit}
              onChange={handleChange}
              placeholder="Max uses per customer (blank = unlimited)"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Cart Value (₹)</label>
            <input
              type="number"
              min="0"
              className={styles.input}
              name="cartValue"
              value={form.cartValue}
              onChange={handleChange}
              placeholder="Minimum cart value to apply (optional)"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.checkboxRow}>
              <input type="checkbox" name="newUserOnly" checked={form.newUserOnly} onChange={handleChange} />
              Applicable to new users only
            </label>
          </div>

          <div className={styles.field}>
            <label className={styles.checkboxRow}>
              <input type="checkbox" name="isPublic" checked={form.isPublic} onChange={handleChange} />
              Show this coupon to users in their cart (advertised offer)
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Applies To</h3>

          <div className={styles.field}>
            <label className={styles.label}>
              Service Section<span className={styles.required}>*</span>
            </label>
            <select className={styles.select} name="serviceSection" value={form.serviceSection} onChange={handleChange} required>
              <option value="">Select service section</option>
              {SERVICE_SECTIONS.map((section) => (
                <option key={section.value} value={section.value}>
                  {section.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Sub-service</label>
            <select
              className={styles.select}
              name="subService"
              value={form.subService}
              onChange={handleChange}
              disabled={!form.serviceSection || loadingSubServices}
            >
              <option value="">
                {!form.serviceSection
                  ? "Select a service section first"
                  : loadingSubServices
                  ? "Loading..."
                  : "All / Not specific"}
              </option>
              {subServiceOptions.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating..." : "Create Coupon"}
        </button>
      </form>
    </div>
  );
};

export default CreateCoupon;
