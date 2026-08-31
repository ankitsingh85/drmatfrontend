"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import styles from "@/styles/Dashboard/productlist.module.css";
import formStyles from "@/styles/Dashboard/createb2bproduct.module.css";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import TableActions from "@/components/AdminPanel/common/TableActions";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface B2BCategory {
  _id: string;
  name: string;
}

interface B2BProduct {
  _id: string;
  sku: string;
  productName: string;
  category: string[];
  subCategory?: string;
  hsnCode?: string;
  brandName?: string;
  packSize?: string;
  pricePerUnit?: number;
  bulkPriceTier?: string;
  moq?: number;
  stockAvailable?: number;
  expiryDate?: string;
  shelfLife?: string;
  description?: string;
  ingredients?: string;
  usageInstructions?: string;
  treatmentIndications?: string;
  certifications?: string;
  manufacturerName?: string;
  licenseNumber?: string;
  mrp?: number;
  discountedPrice: number;
  gst: number;
  taxIncluded?: boolean;
  productImages?: string[];
  productVideoUrl?: string;
  msds?: string;
  customerReviews?: string;
  relatedProducts?: string;
  promotionalTags?: string[];
  createdAt?: string;
}

type GstOption = "5" | "12" | "18" | "28" | "custom";
const GST_PRESETS: GstOption[] = ["5", "12", "18", "28"];

type B2BProductEditForm = {
  productName: string;
  category: string[];
  subCategory: string;
  hsnCode: string;
  brandName: string;
  packSize: string;
  pricePerUnit: string;
  bulkPriceTier: string;
  moq: string;
  stockAvailable: string;
  expiryDate: string;
  shelfLife: string;
  description: string;
  ingredients: string;
  usageInstructions: string;
  treatmentIndications: string;
  certifications: string;
  manufacturerName: string;
  licenseNumber: string;
  mrp: string;
  discountedPrice: string;
  gstOption: GstOption;
  customGst: string;
  taxIncluded: boolean;
  productVideoUrl: string;
  customerReviews: string;
  relatedProducts: string;
  promotionalTags: string[];
};

const emptyEditForm: B2BProductEditForm = {
  productName: "",
  category: [],
  subCategory: "",
  hsnCode: "",
  brandName: "",
  packSize: "",
  pricePerUnit: "",
  bulkPriceTier: "",
  moq: "",
  stockAvailable: "",
  expiryDate: "",
  shelfLife: "",
  description: "",
  ingredients: "",
  usageInstructions: "",
  treatmentIndications: "",
  certifications: "",
  manufacturerName: "",
  licenseNumber: "",
  mrp: "",
  discountedPrice: "",
  gstOption: "5",
  customGst: "",
  taxIncluded: true,
  productVideoUrl: "",
  customerReviews: "",
  relatedProducts: "",
  promotionalTags: [],
};

const toDateInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const infoCardStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
};

const infoValueStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#0f172a",
  marginTop: 2,
  whiteSpace: "pre-wrap",
};

const InfoCard = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={infoCardStyle}>
    <div style={infoLabelStyle}>{label}</div>
    <div style={infoValueStyle}>{value}</div>
  </div>
);

type ListOfB2BProductProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

export default function ListOfB2BProduct({ canEdit = true, canDelete = true }: ListOfB2BProductProps) {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [products, setProducts] = useState<B2BProduct[]>([]);
  const [allCategories, setAllCategories] = useState<B2BCategory[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewProduct, setViewProduct] = useState<B2BProduct | null>(null);

  const [editingProduct, setEditingProduct] = useState<B2BProduct | null>(null);
  const [editForm, setEditForm] = useState<B2BProductEditForm>(emptyEditForm);
  const [isEditing, setIsEditing] = useState(false);

  const [editKeptImages, setEditKeptImages] = useState<string[]>([]);
  const [editNewImages, setEditNewImages] = useState<File[]>([]);
  const [editKeptMsds, setEditKeptMsds] = useState("");
  const [editNewMsds, setEditNewMsds] = useState<File | null>(null);
  const [editTagInput, setEditTagInput] = useState("");

  /* ================= FETCH ================= */
  useEffect(() => {
    fetch(`${API_URL}/b2b-products`)
      .then((res) => res.json())
      .then((data) => {
        const normalized = (Array.isArray(data) ? data : []).map(
          (p: any) => ({
            ...p,
            category: Array.isArray(p.category) ? p.category : p.category ? [p.category] : [],
          })
        );
        setProducts(normalized);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/b2b-categories`)
      .then((res) => res.json())
      .then((data) => {
        const rawCategories = Array.isArray(data) ? data : data?.categories || data?.data || [];
        const normalized = rawCategories
          .map((cat: any) => ({
            _id: String(cat._id || cat.id || "").trim(),
            name: String(cat.name || "").trim(),
          }))
          .filter((cat: B2BCategory) => cat._id && cat.name);
        setAllCategories(normalized);
      })
      .catch(console.error);
  }, []);

  /* ================= DERIVED ================= */
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => (p.category || []).forEach((c) => set.add(c)));
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let data = [...products];

    if (search) {
      data = data.filter(
        (p) =>
          p.productName.toLowerCase().includes(search.toLowerCase()) ||
          p.brandName?.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      data = data.filter((p) => (p.category || []).includes(categoryFilter));
    }

    if (sortKey === "name") {
      data.sort((a, b) => a.productName.localeCompare(b.productName));
    } else if (sortKey === "price") {
      data.sort((a, b) => (a.pricePerUnit || 0) - (b.pricePerUnit || 0));
    } else if (sortKey === "stock") {
      data.sort((a, b) => (a.stockAvailable || 0) - (b.stockAvailable || 0));
    }

    return data;
  }, [products, search, categoryFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, sortKey, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleDownloadCSV = () => {
    const rows = [
      ["SKU", "Name", "Category", "Brand", "Price", "Stock", "MOQ", "GST"],
      ...filteredProducts.map((p) => [
        p.sku,
        p.productName,
        (p.category || []).join(", "),
        p.brandName || "",
        String(p.pricePerUnit || 0),
        String(p.stockAvailable || 0),
        String(p.moq || 0),
        String(p.gst || 0),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "b2b-products.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const printable = window.open("", "_blank");
    if (!printable) {
      toast.error("Unable to open print window. Please allow popups.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const rows = filteredProducts
      .map(
        (p) => `<tr>
          <td>${escapeHtml(p.sku)}</td>
          <td>${escapeHtml(p.productName)}</td>
          <td>${escapeHtml((p.category || []).join(", "))}</td>
          <td>${escapeHtml(p.brandName || "-")}</td>
          <td>Rs ${escapeHtml(String(p.pricePerUnit || 0))}</td>
          <td>${escapeHtml(String(p.stockAvailable || 0))}</td>
          <td>${escapeHtml(String(p.moq || 0))}</td>
          <td>${escapeHtml(String(p.gst || 0))}%</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>B2B Products List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>B2B Products List</h2>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>MOQ</th>
                <th>GST</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    if (!(await confirmDialog("Delete this B2B product?", { danger: true }))) return;
    await fetch(`${API_URL}/b2b-products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  /* ================= EDIT ================= */
  const handleEdit = (product: B2BProduct) => {
    setEditingProduct(product);

    const presetMatch = GST_PRESETS.includes(String(product.gst) as GstOption)
      ? (String(product.gst) as GstOption)
      : "custom";

    setEditForm({
      productName: product.productName || "",
      category: product.category || [],
      subCategory: product.subCategory || "",
      hsnCode: product.hsnCode || "",
      brandName: product.brandName || "",
      packSize: product.packSize || "",
      pricePerUnit: product.pricePerUnit !== undefined ? String(product.pricePerUnit) : "",
      bulkPriceTier: product.bulkPriceTier || "",
      moq: product.moq !== undefined ? String(product.moq) : "",
      stockAvailable: product.stockAvailable !== undefined ? String(product.stockAvailable) : "",
      expiryDate: toDateInputValue(product.expiryDate),
      shelfLife: product.shelfLife || "",
      description: product.description || "",
      ingredients: product.ingredients || "",
      usageInstructions: product.usageInstructions || "",
      treatmentIndications: product.treatmentIndications || "",
      certifications: product.certifications || "",
      manufacturerName: product.manufacturerName || "",
      licenseNumber: product.licenseNumber || "",
      mrp: product.mrp !== undefined ? String(product.mrp) : "",
      discountedPrice: String(product.discountedPrice ?? ""),
      gstOption: presetMatch,
      customGst: presetMatch === "custom" ? String(product.gst ?? "") : "",
      taxIncluded: product.taxIncluded !== false,
      productVideoUrl: product.productVideoUrl || "",
      customerReviews: product.customerReviews || "",
      relatedProducts: product.relatedProducts || "",
      promotionalTags: product.promotionalTags || [],
    });
    setEditKeptImages(product.productImages || []);
    setEditNewImages([]);
    setEditKeptMsds(product.msds || "");
    setEditNewMsds(null);
    setEditTagInput("");
    setIsEditing(true);
  };

  const setEditValue = (key: keyof B2BProductEditForm, value: any) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditValue(name as keyof B2BProductEditForm, value);
  };

  const handleEditNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  const toggleEditCategory = (categoryName: string) => {
    setEditForm((prev) => {
      const exists = prev.category.includes(categoryName);
      return {
        ...prev,
        category: exists
          ? prev.category.filter((c) => c !== categoryName)
          : [...prev.category, categoryName],
      };
    });
  };

  const onEditImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter((file) => /^image\/(jpeg|jpg|png|webp)$/i.test(file.type));
    if (validFiles.length !== files.length) {
      toast.error("Only JPG, JPEG, PNG, or WEBP images are allowed");
    }
    setEditNewImages((prev) => [...prev, ...validFiles]);
    e.target.value = "";
  };

  const removeEditKeptImage = (index: number) => {
    setEditKeptImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeEditNewImage = (index: number) => {
    setEditNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onEditMsdsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("MSDS / Product Datasheet must be a PDF file");
      e.target.value = "";
      return;
    }
    setEditNewMsds(file);
    e.target.value = "";
  };

  const addEditTag = () => {
    const nextTag = editTagInput.trim();
    if (!nextTag) return;
    if (editForm.promotionalTags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) {
      setEditTagInput("");
      return;
    }
    setEditValue("promotionalTags", [...editForm.promotionalTags, nextTag]);
    setEditTagInput("");
  };

  const removeEditTag = (tag: string) => {
    setEditValue(
      "promotionalTags",
      editForm.promotionalTags.filter((t) => t !== tag)
    );
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (editForm.category.length === 0) {
      toast.error("Please select at least one category");
      return;
    }
    if (!editForm.productName.trim() || !editForm.discountedPrice.trim()) {
      toast.error("Please fill Product Name and Discounted Price before saving.");
      return;
    }

    try {
      const finalGst = editForm.gstOption === "custom" ? editForm.customGst.trim() : editForm.gstOption;

      const payload = new FormData();
      payload.append("productName", editForm.productName.trim());
      payload.append("category", JSON.stringify(editForm.category));
      payload.append("subCategory", editForm.subCategory.trim());
      payload.append("hsnCode", editForm.hsnCode.trim());
      payload.append("brandName", editForm.brandName.trim());
      payload.append("packSize", editForm.packSize.trim());
      payload.append("pricePerUnit", editForm.pricePerUnit.trim());
      payload.append("bulkPriceTier", editForm.bulkPriceTier.trim());
      payload.append("moq", editForm.moq.trim());
      payload.append("stockAvailable", editForm.stockAvailable.trim());
      payload.append("expiryDate", editForm.expiryDate);
      payload.append("shelfLife", editForm.shelfLife.trim());
      payload.append("description", editForm.description);
      payload.append("ingredients", editForm.ingredients);
      payload.append("usageInstructions", editForm.usageInstructions);
      payload.append("treatmentIndications", editForm.treatmentIndications);
      payload.append("certifications", editForm.certifications);
      payload.append("manufacturerName", editForm.manufacturerName.trim());
      payload.append("licenseNumber", editForm.licenseNumber.trim());
      payload.append("mrp", editForm.mrp.trim());
      payload.append("discountedPrice", editForm.discountedPrice.trim());
      payload.append("gst", finalGst);
      payload.append("taxIncluded", String(editForm.taxIncluded));
      payload.append("productVideoUrl", editForm.productVideoUrl.trim());
      payload.append("customerReviews", editForm.customerReviews);
      payload.append("relatedProducts", editForm.relatedProducts);
      payload.append("promotionalTags", JSON.stringify(editForm.promotionalTags));

      // Images: new uploads replace the whole array server-side, so when
      // there are no new files we resend the kept (possibly trimmed)
      // existing list instead, to preserve removals.
      if (editNewImages.length > 0) {
        editNewImages.forEach((file) => payload.append("productImages", file));
      } else {
        payload.append("productImages", JSON.stringify(editKeptImages));
      }

      if (editNewMsds) {
        payload.append("msds", editNewMsds);
      }

      const res = await fetch(`${API_URL}/b2b-products/${editingProduct._id}`, {
        method: "PUT",
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update B2B product");

      const normalizedData = {
        ...data,
        category: Array.isArray(data.category) ? data.category : data.category ? [data.category] : [],
      };

      setProducts((prev) => prev.map((p) => (p._id === normalizedData._id ? normalizedData : p)));
      setIsEditing(false);
      setEditingProduct(null);
      toast.success("Product updated successfully");
    } catch (error: any) {
      toast.error(error?.message || "Update failed");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingProduct(null);
    setEditForm(emptyEditForm);
    setEditKeptImages([]);
    setEditNewImages([]);
    setEditKeptMsds("");
    setEditNewMsds(null);
  };

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

  return (
    <div className={styles.container}>
      {/* CONTROLS */}
      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="Search by name, brand or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select className={styles.filter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select className={styles.filter} onChange={(e) => setSortKey(e.target.value)}>
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
          <option value="stock">Sort by Stock</option>
        </select>
        <select
          className={`${styles.filter} ${styles.pageFilter}`}
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}/page
            </option>
          ))}
        </select>
        <button type="button" className={styles.premiumButton} onClick={handleDownloadCSV}>
          Download CSV
        </button>
        <button type="button" className={styles.premiumButton} onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>

      {/* TABLE — wrapped so the horizontal scrollbar stays scoped to the
          table itself instead of dragging the whole admin page/sidebar. */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Stock</th>
              <th>MOQ</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedProducts.map((p) => (
              <tr key={p._id}>
                <td>{p.sku}</td>
                <td>{p.productName}</td>
                <td>{(p.category || []).join(", ") || "-"}</td>
                <td>{p.brandName || "-"}</td>
                <td>Rs {p.pricePerUnit || 0}</td>
                <td>{p.stockAvailable || 0}</td>
                <td>{p.moq || 0}</td>
                <td className={styles.actions}>
                  <TableActions
                    onView={() => setViewProduct(p)}
                    onEdit={() => handleEdit(p)}
                    onDelete={() => handleDelete(p._id)}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                </td>
              </tr>
            ))}
            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan={8}>No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <p style={{ margin: 0 }}>
          Showing {paginatedProducts.length} of {filteredProducts.length}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`${styles.premiumButton} ${currentPage === 1 ? styles.premiumButtonDisabled : ""}`}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span style={{ alignSelf: "center" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className={`${styles.premiumButton} ${currentPage === totalPages ? styles.premiumButtonDisabled : ""}`}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* ================= EDIT PRODUCT MODAL ================= */}
      {isEditing && editingProduct && (
        <div className={styles.modalOverlay} onClick={handleCancelEdit}>
          <div
            className={formStyles.container}
            style={{ margin: 0, width: "100%", maxWidth: 1100, maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>Edit B2B Product</h1>
              <button
                type="button"
                onClick={handleCancelEdit}
                aria-label="Close"
                style={{
                  border: "none",
                  background: "#f1f5f9",
                  borderRadius: 999,
                  width: 36,
                  height: 36,
                  fontSize: 18,
                  fontWeight: 800,
                  cursor: "pointer",
                  color: "#334155",
                }}
              >
                ×
              </button>
            </div>

            <form className={formStyles.form} onSubmit={handleEditSubmit}>
              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Basic Information</h3>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>SKU / Product Code</label>
                  <input className={formStyles.readonlyInput} value={editingProduct.sku} disabled />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Product Name<span className={formStyles.required}>*</span>
                  </label>
                  <input
                    className={formStyles.input}
                    name="productName"
                    value={editForm.productName}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Category (select one or more)<span className={formStyles.required}>*</span>
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {allCategories.map((cat) => {
                      const selected = editForm.category.includes(cat.name);
                      return (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => toggleEditCategory(cat.name)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 16,
                            border: selected ? "1px solid #2563eb" : "1px solid #ccc",
                            background: selected ? "#dbeafe" : "#fff",
                            color: selected ? "#1e40af" : "#333",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Sub Category</label>
                  <input className={formStyles.input} name="subCategory" value={editForm.subCategory} onChange={handleEditChange} />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>HSN Code</label>
                  <input
                    className={formStyles.input}
                    name="hsnCode"
                    value={editForm.hsnCode}
                    onChange={(e) => setEditValue("hsnCode", e.target.value.replace(/\D/g, ""))}
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Brand Name</label>
                  <input className={formStyles.input} name="brandName" value={editForm.brandName} onChange={handleEditChange} />
                </div>
              </div>

              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Pricing &amp; Quantity</h3>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Pack Size / Quantity</label>
                  <input className={formStyles.input} name="packSize" value={editForm.packSize} onChange={handleEditChange} />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Price per Unit</label>
                  <input
                    type="number"
                    min="0"
                    className={formStyles.input}
                    name="pricePerUnit"
                    value={editForm.pricePerUnit}
                    onKeyDown={handleEditNumberKeyDown}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Bulk Price Tier</label>
                  <input
                    className={formStyles.input}
                    name="bulkPriceTier"
                    value={editForm.bulkPriceTier}
                    onChange={(e) => setEditValue("bulkPriceTier", e.target.value.replace(/\D/g, ""))}
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>MOQ</label>
                  <input
                    type="number"
                    min="0"
                    className={formStyles.input}
                    name="moq"
                    value={editForm.moq}
                    onKeyDown={handleEditNumberKeyDown}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Stock Available</label>
                  <input
                    type="number"
                    min="0"
                    className={formStyles.input}
                    name="stockAvailable"
                    value={editForm.stockAvailable}
                    onKeyDown={handleEditNumberKeyDown}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Expiry Date</label>
                  <input
                    type="date"
                    className={formStyles.input}
                    name="expiryDate"
                    value={editForm.expiryDate}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Shelf Life</label>
                  <input className={formStyles.input} name="shelfLife" value={editForm.shelfLife} onChange={handleEditChange} />
                </div>
              </div>

              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Product Details</h3>

                {[
                  ["description", "Product Description"],
                  ["ingredients", "Key Ingredients / Components"],
                  ["usageInstructions", "Usage Instructions"],
                  ["treatmentIndications", "Treatment Indications"],
                ].map(([name, label]) => (
                  <div className={formStyles.field} key={name}>
                    <label className={formStyles.label}>{label}</label>
                    <ReactQuill
                      className={formStyles.quill}
                      value={editForm[name as keyof B2BProductEditForm] as string}
                      onChange={(v) => setEditValue(name as keyof B2BProductEditForm, v)}
                      modules={quillModules}
                    />
                  </div>
                ))}

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Certifications</label>
                  <input
                    className={formStyles.input}
                    name="certifications"
                    value={editForm.certifications}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Manufacturer &amp; Tax</h3>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Manufacturer Name</label>
                  <input
                    className={formStyles.input}
                    name="manufacturerName"
                    value={editForm.manufacturerName}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>License Number</label>
                  <input
                    className={formStyles.input}
                    name="licenseNumber"
                    value={editForm.licenseNumber}
                    onChange={(e) => setEditValue("licenseNumber", e.target.value.replace(/\D/g, ""))}
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>MRP</label>
                  <input
                    type="number"
                    min="0"
                    className={formStyles.input}
                    name="mrp"
                    value={editForm.mrp}
                    onKeyDown={handleEditNumberKeyDown}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>
                    Discounted Price<span className={formStyles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={formStyles.input}
                    name="discountedPrice"
                    value={editForm.discountedPrice}
                    onKeyDown={handleEditNumberKeyDown}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>GST %</label>
                  <select
                    className={formStyles.select}
                    value={editForm.gstOption}
                    onChange={(e) => {
                      const value = e.target.value as GstOption;
                      setEditValue("gstOption", value);
                      if (value !== "custom") setEditValue("customGst", "");
                    }}
                  >
                    {GST_PRESETS.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}%
                      </option>
                    ))}
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {editForm.gstOption === "custom" && (
                  <div className={formStyles.field}>
                    <label className={formStyles.label}>Custom GST %</label>
                    <input
                      type="text"
                      className={formStyles.input}
                      value={editForm.customGst}
                      onChange={(e) => setEditValue("customGst", e.target.value.replace(/[^0-9.]/g, ""))}
                      inputMode="decimal"
                      required
                    />
                  </div>
                )}

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Tax Included</label>
                  <select
                    className={formStyles.select}
                    value={String(editForm.taxIncluded)}
                    onChange={(e) => setEditValue("taxIncluded", e.target.value === "true")}
                  >
                    <option value="true">Tax Included</option>
                    <option value="false">Tax Excluded</option>
                  </select>
                </div>
              </div>

              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Media</h3>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Product Images</label>
                  {(editKeptImages.length > 0 || editNewImages.length > 0) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                      {editKeptImages.map((img, index) => (
                        <div key={`kept-${index}`} style={{ position: "relative" }}>
                          <img
                            src={resolveMediaUrl(img) || img}
                            alt={`Product ${index + 1}`}
                            style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 12, border: "1px solid #cbd5f5" }}
                          />
                          <button
                            type="button"
                            onClick={() => removeEditKeptImage(index)}
                            aria-label="Remove image"
                            style={{
                              position: "absolute",
                              top: -8,
                              right: -8,
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              border: "none",
                              background: "#dc2626",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {editNewImages.map((file, index) => (
                        <div key={`new-${index}`} style={{ position: "relative" }}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 12, border: "1px solid #cbd5f5" }}
                          />
                          <button
                            type="button"
                            onClick={() => removeEditNewImage(index)}
                            aria-label="Remove image"
                            style={{
                              position: "absolute",
                              top: -8,
                              right: -8,
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              border: "none",
                              background: "#dc2626",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className={formStyles.fileInput}
                    onChange={onEditImagesUpload}
                  />
                  <p className={formStyles.uploadHint} style={{ marginTop: 6 }}>
                    Uploading new images here replaces all product images (kept ones above are preserved unless removed).
                  </p>
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Product Video URL</label>
                  <input
                    type="url"
                    className={formStyles.input}
                    name="productVideoUrl"
                    value={editForm.productVideoUrl}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>MSDS / Product Datasheet</label>
                  {editNewMsds ? (
                    <p className={formStyles.uploadHint}>New file: {editNewMsds.name}</p>
                  ) : editKeptMsds ? (
                    <a href={resolveMediaUrl(editKeptMsds) || editKeptMsds} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 700 }}>
                      View current MSDS PDF
                    </a>
                  ) : (
                    <p className={formStyles.uploadHint}>No MSDS uploaded</p>
                  )}
                  <input
                    type="file"
                    accept="application/pdf"
                    className={formStyles.fileInput}
                    onChange={onEditMsdsUpload}
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Customer Reviews</label>
                  <textarea
                    className={formStyles.textarea}
                    name="customerReviews"
                    value={editForm.customerReviews}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Related Products</label>
                  <input
                    className={formStyles.input}
                    name="relatedProducts"
                    value={editForm.relatedProducts}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={formStyles.field}>
                  <label className={formStyles.label}>Promotional Tags</label>
                  <div className={formStyles.tagInputRow}>
                    <input
                      className={formStyles.input}
                      value={editTagInput}
                      onChange={(e) => setEditTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addEditTag();
                        }
                      }}
                      placeholder="Add promotional tag"
                    />
                    <button type="button" className={formStyles.tagAddButton} onClick={addEditTag}>
                      Add
                    </button>
                  </div>
                  {editForm.promotionalTags.length > 0 && (
                    <div className={formStyles.tagChips}>
                      {editForm.promotionalTags.map((tag) => (
                        <div key={tag} className={formStyles.tagChip}>
                          <span className={formStyles.tagChipText}>{tag}</span>
                          <button
                            type="button"
                            className={formStyles.tagChipRemove}
                            onClick={() => removeEditTag(tag)}
                            aria-label={`Remove ${tag}`}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button type="submit" className={formStyles.submitBtn}>
                  Update Product
                </button>
                <button
                  type="button"
                  className={formStyles.submitBtn}
                  style={{ background: "#e2e8f0", color: "#334155", boxShadow: "none" }}
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW PRODUCT MODAL ================= */}
      {viewProduct && (
        <div className={styles.modalOverlay} onClick={() => setViewProduct(null)}>
          <div className={styles.modal} style={{ maxWidth: 960 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>{viewProduct.productName}</h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>SKU: {viewProduct.sku}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewProduct(null)}
                aria-label="Close"
                style={{
                  border: "none",
                  background: "#f1f5f9",
                  borderRadius: 999,
                  width: 32,
                  height: 32,
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: "pointer",
                  color: "#334155",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0 20px" }}>
              {(viewProduct.category || []).map((cat) => (
                <span
                  key={cat}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: "rgba(59, 130, 246, 0.12)",
                    color: "#1d4ed8",
                  }}
                >
                  {cat}
                </span>
              ))}
              <span
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  background: viewProduct.taxIncluded === false ? "rgba(245, 158, 11, 0.14)" : "rgba(22, 163, 74, 0.12)",
                  color: viewProduct.taxIncluded === false ? "#b45309" : "#15803d",
                }}
              >
                {viewProduct.taxIncluded === false ? "Tax Excluded" : "Tax Included"}
              </span>
            </div>

            {viewProduct.productImages && viewProduct.productImages.length > 0 && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                {viewProduct.productImages.map((img, i) => (
                  <img
                    key={i}
                    src={resolveMediaUrl(img) || img}
                    alt="Product"
                    style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 10, border: "1px solid #e5e7eb" }}
                  />
                ))}
              </div>
            )}

            <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#173252" }}>Basic Info</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
              <InfoCard label="Brand" value={viewProduct.brandName || "-"} />
              <InfoCard label="Sub Category" value={viewProduct.subCategory || "-"} />
              <InfoCard label="HSN Code" value={viewProduct.hsnCode || "-"} />
              <InfoCard label="Pack Size" value={viewProduct.packSize || "-"} />
              <InfoCard label="Manufacturer" value={viewProduct.manufacturerName || "-"} />
              <InfoCard label="License Number" value={viewProduct.licenseNumber || "-"} />
              <InfoCard label="Certifications" value={viewProduct.certifications || "-"} />
            </div>

            <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#173252" }}>Pricing &amp; Stock</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
              <InfoCard label="MRP" value={viewProduct.mrp !== undefined ? `₹${viewProduct.mrp}` : "-"} />
              <InfoCard label="Discounted Price" value={`₹${viewProduct.discountedPrice ?? 0}`} />
              <InfoCard label="Price Per Unit" value={viewProduct.pricePerUnit !== undefined ? `₹${viewProduct.pricePerUnit}` : "-"} />
              <InfoCard label="Bulk Price Tier" value={viewProduct.bulkPriceTier || "-"} />
              <InfoCard label="GST" value={`${viewProduct.gst ?? 0}%`} />
              <InfoCard label="MOQ" value={viewProduct.moq ?? "-"} />
              <InfoCard label="Stock Available" value={viewProduct.stockAvailable ?? "-"} />
              <InfoCard label="Expiry Date" value={viewProduct.expiryDate ? String(viewProduct.expiryDate).slice(0, 10) : "-"} />
              <InfoCard label="Shelf Life" value={viewProduct.shelfLife || "-"} />
            </div>

            {[
              ["Description", viewProduct.description],
              ["Ingredients", viewProduct.ingredients],
              ["Usage Instructions", viewProduct.usageInstructions],
              ["Treatment Indications", viewProduct.treatmentIndications],
            ].map(([label, value]) =>
              value ? (
                <div key={label} style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: "#173252" }}>{label}</h4>
                  <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: value }} />
                </div>
              ) : null
            )}

            {viewProduct.customerReviews && (
              <p style={{ fontSize: 14 }}>
                <b>Customer Reviews:</b> {viewProduct.customerReviews}
              </p>
            )}
            {viewProduct.relatedProducts && (
              <p style={{ fontSize: 14 }}>
                <b>Related Products:</b> {viewProduct.relatedProducts}
              </p>
            )}
            {viewProduct.promotionalTags && viewProduct.promotionalTags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {viewProduct.promotionalTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      background: "rgba(100, 116, 139, 0.12)",
                      color: "#475569",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {viewProduct.productVideoUrl && (
              <p style={{ fontSize: 14 }}>
                <b>Video:</b>{" "}
                <a href={viewProduct.productVideoUrl} target="_blank" rel="noreferrer">
                  {viewProduct.productVideoUrl}
                </a>
              </p>
            )}
            {viewProduct.msds && (
              <p style={{ fontSize: 14 }}>
                <b>MSDS / Datasheet:</b>{" "}
                <a href={resolveMediaUrl(viewProduct.msds) || viewProduct.msds} target="_blank" rel="noreferrer">
                  View PDF
                </a>
              </p>
            )}

            <div className={styles.modalActions}>
              <button onClick={() => setViewProduct(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
