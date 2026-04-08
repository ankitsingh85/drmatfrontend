"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import styles from "@/styles/Dashboard/createb2bproduct.module.css";
import "react-quill/dist/quill.snow.css";
import { API_URL } from "@/config/api";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface B2BCategory {
  _id: string;
  name: string;
}

type FormState = {
  sku: string;
  productName: string;
  category: string;
  subCategory: string;
  hsnCode: string;
  brandName: string;
  packSize: string;
  pricePerUnit: string;
  bulkPriceTier: string;
  moq: string;
  stockAvailable: string;
  expiryDate: string;
  description: string;
  ingredients: string;
  usageInstructions: string;
  treatmentIndications: string;
  certifications: string;
  manufacturerName: string;
  licenseNumber: string;
  mrp: string;
  discountedPrice: string;
  gst: "5" | "12" | "18" | "28";
  taxIncluded: boolean;
  productImages: File[];
  productVideoUrl: string;
  msds: string;
  customerReviews: string;
  relatedProducts: string;
  promotionalTags: string;
};

type ErrorState = Partial<Record<keyof FormState, string>>;
type TouchedState = Partial<Record<keyof FormState, boolean>>;

const textOnlyRegex = /^[A-Za-z ]+$/;
const digitsOnlyRegex = /^\d+$/;

const isValidUrl = (value: string) => {
  if (!value.trim()) return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const sanitizeTextOnly = (value: string) => value.replace(/[^A-Za-z ]/g, "");
const sanitizeDigitsOnly = (value: string) => value.replace(/\D/g, "");

const validateField = (
  name: keyof FormState,
  value: FormState[keyof FormState],
  form: FormState
) => {
  if (name === "productImages" && (!Array.isArray(value) || value.length === 0)) {
    return "At least one product image is required";
  }

  const requiredTextFields: Array<keyof FormState> = [
    "productName",
    "category",
    "hsnCode",
    "brandName",
    "packSize",
    "pricePerUnit",
    "bulkPriceTier",
    "moq",
    "stockAvailable",
    "expiryDate",
    "description",
    "ingredients",
    "usageInstructions",
    "treatmentIndications",
    "manufacturerName",
    "licenseNumber",
    "mrp",
    "discountedPrice",
    "productVideoUrl",
  ];

  if (requiredTextFields.includes(name)) {
    const stringValue = String(value ?? "").trim();
    if (!stringValue) {
      const labels: Record<string, string> = {
        productName: "Product name",
        category: "Category",
        hsnCode: "HSN code",
        brandName: "Brand name",
        packSize: "Pack size",
        pricePerUnit: "Price per unit",
        bulkPriceTier: "Bulk price tier",
        moq: "MOQ",
        stockAvailable: "Stock available",
        expiryDate: "Expiry date",
        description: "Description",
        ingredients: "Ingredients",
        usageInstructions: "Usage instructions",
        treatmentIndications: "Treatment indications",
        manufacturerName: "Manufacturer name",
        licenseNumber: "License number",
        mrp: "MRP",
        discountedPrice: "Discounted price",
        productVideoUrl: "Product video URL",
      };
      return `${labels[name]} is required`;
    }
  }

  if (name === "productName" && !textOnlyRegex.test(String(value))) {
    return "Product name should contain only letters and spaces";
  }

  if (name === "brandName" && !textOnlyRegex.test(String(value))) {
    return "Brand name should contain only letters and spaces";
  }

  if (name === "manufacturerName" && !textOnlyRegex.test(String(value))) {
    return "Manufacturer name should contain only letters and spaces";
  }

  if (name === "hsnCode" && !digitsOnlyRegex.test(String(value))) {
    return "HSN code must contain digits only";
  }

  if (name === "packSize" && !digitsOnlyRegex.test(String(value))) {
    return "Pack size must contain digits only";
  }

  if (name === "bulkPriceTier" && !digitsOnlyRegex.test(String(value))) {
    return "Bulk price tier must contain digits only";
  }

  if (name === "licenseNumber" && !digitsOnlyRegex.test(String(value))) {
    return "License number must contain digits only";
  }

  if (
    ["pricePerUnit", "moq", "stockAvailable", "mrp", "discountedPrice"].includes(
      String(name)
    ) &&
    String(value) &&
    Number.isNaN(Number(value))
  ) {
    return `${String(name)} must be a valid number`;
  }

  if (name === "productVideoUrl" && !isValidUrl(String(value))) {
    return "Product video URL must be a valid URL";
  }

  if (
    ["description", "ingredients", "usageInstructions", "treatmentIndications"].includes(
      String(name)
    ) &&
    !stripHtml(String(value))
  ) {
    return `${String(name).replace(/([A-Z])/g, " $1")} is required`;
  }

  if (name === "gst" && !["5", "12", "18", "28"].includes(String(value))) {
    return "GST must be 5, 12, 18, or 28";
  }

  if (name === "category" && !String(value).trim()) {
    return "Category is required";
  }

  return "";
};

export default function CreateB2BProduct() {
  const [categories, setCategories] = useState<B2BCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [success, setSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState<ErrorState>({});
  const [touched, setTouched] = useState<TouchedState>({});

  const [form, setForm] = useState<FormState>({
    sku: `B2B-${Date.now().toString().slice(-6)}`,
    productName: "",
    category: "",
    subCategory: "",
    hsnCode: "",
    brandName: "",
    packSize: "",
    pricePerUnit: "",
    bulkPriceTier: "",
    moq: "",
    stockAvailable: "",
    expiryDate: "",
    description: "",
    ingredients: "",
    usageInstructions: "",
    treatmentIndications: "",
    certifications: "",
    manufacturerName: "",
    licenseNumber: "",
    mrp: "",
    discountedPrice: "",
    gst: "5",
    taxIncluded: true,
    productImages: [],
    productVideoUrl: "",
    msds: "",
    customerReviews: "",
    relatedProducts: "",
    promotionalTags: "",
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await fetch(`${API_URL}/b2b-categories`);
        const data = await res.json();
        const rawCategories = Array.isArray(data) ? data : data?.categories || data?.data || [];
        const normalized = rawCategories
          .map((cat: any) => ({
            _id: String(cat._id || cat.id || "").trim(),
            name: String(cat.name || "").trim(),
          }))
          .filter((cat: B2BCategory) => cat._id && cat.name);

        setCategories(normalized);
        setForm((prev) => ({
          ...prev,
          category: prev.category || normalized[0]?.name || "",
        }));
      } catch (error) {
        console.error("Failed to fetch B2B categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const quillModules = useMemo(
    () => ({
      toolbar: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  const setField = (name: keyof FormState, value: FormState[keyof FormState]) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value } as FormState;
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: validateField(name, value, next),
      }));
      return next;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;

    if (!name) return;

    let nextValue: string | boolean = value;

    if (["productName", "brandName", "manufacturerName"].includes(name)) {
      nextValue = sanitizeTextOnly(value);
    }

    if (
      [
        "hsnCode",
        "packSize",
        "pricePerUnit",
        "bulkPriceTier",
        "moq",
        "stockAvailable",
        "mrp",
        "discountedPrice",
        "licenseNumber",
      ].includes(name)
    ) {
      nextValue = sanitizeDigitsOnly(value);
    }

    if (name === "taxIncluded") {
      nextValue = value === "true";
    }

    if (type === "checkbox") {
      nextValue = target.checked;
    }

    setTouched((prev) => ({ ...prev, [name]: true }));
    setField(name as keyof FormState, nextValue as FormState[keyof FormState]);
    setSuccess("");
    setSubmitError("");
  };

  const handleQuillChange = (name: keyof FormState, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setField(name, value);
    setSuccess("");
    setSubmitError("");
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    if (!name) return;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof FormState, form[name as keyof FormState], form),
    }));
  };

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles: File[] = [];

    for (const file of files) {
      if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) continue;
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError("Each image must be 5MB or smaller");
        continue;
      }
      validFiles.push(file);
    }

    if (!validFiles.length) {
      setTouched((prev) => ({ ...prev, productImages: true }));
      setErrors((prev) => ({
        ...prev,
        productImages: "Please upload a valid image file",
      }));
      e.target.value = "";
      return;
    }

    setForm((prev) => {
      const next = { ...prev, productImages: [...prev.productImages, ...validFiles] };
      setErrors((prevErrors) => ({
        ...prevErrors,
        productImages: validateField("productImages", next.productImages, next),
      }));
      return next;
    });

    setTouched((prev) => ({ ...prev, productImages: true }));
    setSuccess("");
    setSubmitError("");
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setForm((prev) => {
      const nextFiles = prev.productImages.filter((_, i) => i !== index);
      setErrors((prevErrors) => ({
        ...prevErrors,
        productImages: validateField("productImages", nextFiles, {
          ...prev,
          productImages: nextFiles,
        }),
      }));
      return { ...prev, productImages: nextFiles };
    });
  };

  const validateAll = (current: FormState) => {
    const nextErrors: ErrorState = {};
    (Object.keys(current) as Array<keyof FormState>).forEach((key) => {
      const error = validateField(key, current[key], current);
      if (error) nextErrors[key] = error;
    });
    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateAll(form);
    setErrors(nextErrors);
    setTouched(
      Object.keys(form).reduce((acc, key) => {
        acc[key as keyof FormState] = true;
        return acc;
      }, {} as TouchedState)
    );

    if (Object.keys(nextErrors).length > 0) return;

    const payload = new FormData();
    payload.append("sku", form.sku);
    payload.append("productName", form.productName.trim());
    payload.append("category", form.category.trim());
    payload.append("subCategory", form.subCategory.trim());
    payload.append("hsnCode", form.hsnCode.trim());
    payload.append("brandName", form.brandName.trim());
    payload.append("packSize", form.packSize.trim());
    payload.append("pricePerUnit", form.pricePerUnit.trim());
    payload.append("bulkPriceTier", form.bulkPriceTier.trim());
    payload.append("moq", form.moq.trim());
    payload.append("stockAvailable", form.stockAvailable.trim());
    payload.append("expiryDate", form.expiryDate);
    payload.append("description", form.description);
    payload.append("ingredients", form.ingredients);
    payload.append("usageInstructions", form.usageInstructions);
    payload.append("treatmentIndications", form.treatmentIndications);
    payload.append("certifications", form.certifications);
    payload.append("manufacturerName", form.manufacturerName.trim());
    payload.append("licenseNumber", form.licenseNumber.trim());
    payload.append("mrp", form.mrp.trim());
    payload.append("discountedPrice", form.discountedPrice.trim());
    payload.append("gst", form.gst);
    payload.append("taxIncluded", String(form.taxIncluded));
    payload.append("productVideoUrl", form.productVideoUrl.trim());
    payload.append("msds", form.msds);
    payload.append("customerReviews", form.customerReviews);
    payload.append("relatedProducts", form.relatedProducts);
    payload.append("promotionalTags", form.promotionalTags);

    form.productImages.forEach((file) => {
      payload.append("productImages", file);
    });

    try {
      const res = await fetch(`${API_URL}/b2b-products`, {
        method: "POST",
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create B2B product");

      setSuccess("B2B Product saved successfully");
      setSubmitError("");
      window.dispatchEvent(new Event("admin-dashboard:create-success"));

      setForm({
        sku: `B2B-${Date.now().toString().slice(-6)}`,
        productName: "",
        category: categories[0]?.name || "",
        subCategory: "",
        hsnCode: "",
        brandName: "",
        packSize: "",
        pricePerUnit: "",
        bulkPriceTier: "",
        moq: "",
        stockAvailable: "",
        expiryDate: "",
        description: "",
        ingredients: "",
        usageInstructions: "",
        treatmentIndications: "",
        certifications: "",
        manufacturerName: "",
        licenseNumber: "",
        mrp: "",
        discountedPrice: "",
        gst: "5",
        taxIncluded: true,
        productImages: [],
        productVideoUrl: "",
        msds: "",
        customerReviews: "",
        relatedProducts: "",
        promotionalTags: "",
      });
      setErrors({});
      setTouched({});
    } catch (error: any) {
      setSubmitError(error.message || "Failed to create B2B product");
    }
  };

  const showError = (name: keyof FormState) => (touched[name] ? errors[name] : "");

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Basic Information</h3>

          <div className={styles.field}>
            <label className={styles.label}>SKU / Product Code</label>
            <input className={styles.readonlyInput} value={form.sku} disabled />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Product Name</label>
            <input
              className={styles.input}
              name="productName"
              value={form.productName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Product Name"
              required
            />
            {showError("productName") && <p className={styles.fieldError}>{showError("productName")}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <select
              className={styles.select}
              name="category"
              value={form.category}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loadingCategories}
              required
            >
              <option value="">
                {loadingCategories ? "Loading categories..." : "Select Category"}
              </option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            {showError("category") && <p className={styles.fieldError}>{showError("category")}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Sub Category</label>
            <input
              className={styles.input}
              name="subCategory"
              value={form.subCategory}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Sub Category"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>HSN Code</label>
            <input
              className={styles.input}
              name="hsnCode"
              value={form.hsnCode}
              onChange={handleChange}
              onBlur={handleBlur}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="HSN Code"
              onKeyDown={handleNumberKeyDown}
              required
            />
            {showError("hsnCode") && <p className={styles.fieldError}>{showError("hsnCode")}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Brand Name</label>
            <input
              className={styles.input}
              name="brandName"
              value={form.brandName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Brand Name"
              required
            />
            {showError("brandName") && <p className={styles.fieldError}>{showError("brandName")}</p>}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Pricing & Quantity</h3>

          {[
            ["packSize", "Pack Size / Quantity"],
            ["pricePerUnit", "Price per Unit"],
            ["bulkPriceTier", "Bulk Price Tier"],
            ["moq", "MOQ"],
            ["stockAvailable", "Stock Available"],
          ].map(([name, label]) => (
            <div className={styles.field} key={name}>
              <label className={styles.label}>{label}</label>
              <input
                type="number"
                min="0"
                step="1"
                className={styles.input}
                name={name}
                value={form[name as keyof FormState] as string}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={handleNumberKeyDown}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {showError(name as keyof FormState) && (
                <p className={styles.fieldError}>{showError(name as keyof FormState)}</p>
              )}
            </div>
          ))}

          <div className={styles.field}>
            <label className={styles.label}>Expiry Date</label>
            <input
              type="date"
              className={styles.input}
              name="expiryDate"
              value={form.expiryDate}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {showError("expiryDate") && <p className={styles.fieldError}>{showError("expiryDate")}</p>}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Product Details</h3>

          {[
            ["description", "Product Description"],
            ["ingredients", "Key Ingredients / Components"],
            ["usageInstructions", "Usage Instructions"],
            ["treatmentIndications", "Treatment Indications"],
          ].map(([name, label]) => (
            <div className={styles.field} key={name}>
              <label className={styles.label}>{label}</label>
              <ReactQuill
                className={styles.quill}
                value={form[name as keyof FormState] as string}
                onChange={(v) => handleQuillChange(name as keyof FormState, v)}
                onBlur={() => setTouched((prev) => ({ ...prev, [name]: true }))}
                modules={quillModules}
              />
              {showError(name as keyof FormState) && (
                <p className={styles.fieldError}>{showError(name as keyof FormState)}</p>
              )}
            </div>
          ))}

          <div className={styles.field}>
            <label className={styles.label}>Certifications</label>
            <input
              className={styles.input}
              name="certifications"
              value={form.certifications}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Certifications"
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Manufacturer & Tax</h3>

          <div className={styles.field}>
            <label className={styles.label}>Manufacturer Name</label>
            <input
              className={styles.input}
              name="manufacturerName"
              value={form.manufacturerName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Manufacturer Name"
              required
            />
            {showError("manufacturerName") && (
              <p className={styles.fieldError}>{showError("manufacturerName")}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>License Number</label>
            <input
              className={styles.input}
              name="licenseNumber"
              value={form.licenseNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="License Number"
              onKeyDown={handleNumberKeyDown}
              required
            />
            {showError("licenseNumber") && (
              <p className={styles.fieldError}>{showError("licenseNumber")}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>MRP</label>
            <input
              type="number"
              min="0"
              step="1"
              className={styles.input}
              name="mrp"
              value={form.mrp}
              inputMode="numeric"
              pattern="[0-9]*"
              onKeyDown={handleNumberKeyDown}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {showError("mrp") && <p className={styles.fieldError}>{showError("mrp")}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Discounted Price</label>
            <input
              type="number"
              min="0"
              step="1"
              className={styles.input}
              name="discountedPrice"
              value={form.discountedPrice}
              inputMode="numeric"
              pattern="[0-9]*"
              onKeyDown={handleNumberKeyDown}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {showError("discountedPrice") && (
              <p className={styles.fieldError}>{showError("discountedPrice")}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>GST</label>
            <select
              className={styles.select}
              name="gst"
              value={form.gst}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
            {showError("gst") && <p className={styles.fieldError}>{showError("gst")}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Tax Included</label>
            <select
              className={styles.select}
              name="taxIncluded"
              value={String(form.taxIncluded)}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="true">Tax Included</option>
              <option value="false">Tax Excluded</option>
            </select>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Media</h3>

          <div className={styles.field}>
            <label className={styles.label}>Product Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className={styles.fileInput}
              onChange={handleImageUpload}
            />
            {showError("productImages") && (
              <p className={styles.fieldError}>{showError("productImages")}</p>
            )}
            {form.productImages.length > 0 && (
              <div className={styles.uploadSummary}>
                <div className={styles.uploadSummaryHeader}>
                  <span className={styles.uploadCount}>
                    {form.productImages.length} images uploaded
                  </span>
                  <span className={styles.uploadHint}>Files ready for submission</span>
                </div>

                <div className={styles.uploadChips}>
                  {form.productImages.map((file, index) => (
                    <div key={`${file.name}-${index}`} className={styles.uploadChip}>
                      <span className={styles.uploadChipName}>{file.name}</span>
                      <button
                        type="button"
                        className={styles.uploadChipRemove}
                        onClick={() => removeImage(index)}
                        aria-label={`Remove ${file.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Product Video URL</label>
            <input
              type="url"
              className={styles.input}
              name="productVideoUrl"
              value={form.productVideoUrl}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://example.com/video"
              required
            />
            {showError("productVideoUrl") && (
              <p className={styles.fieldError}>{showError("productVideoUrl")}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>MSDS</label>
            <input
              className={styles.input}
              name="msds"
              value={form.msds}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="MSDS / Product Datasheet"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Customer Reviews</label>
            <textarea
              className={styles.textarea}
              name="customerReviews"
              value={form.customerReviews}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Customer Ratings / Reviews"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Related Products</label>
            <input
              className={styles.input}
              name="relatedProducts"
              value={form.relatedProducts}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Related Products / Add-ons"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Promotional Tags</label>
            <input
              className={styles.input}
              name="promotionalTags"
              value={form.promotionalTags}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Promotional Tags"
            />
          </div>
        </div>

        {submitError && <p className={styles.submitError}>{submitError}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <button className={styles.submitBtn} type="submit">
          Submit B2B Product
        </button>
      </form>
    </div>
  );
}
