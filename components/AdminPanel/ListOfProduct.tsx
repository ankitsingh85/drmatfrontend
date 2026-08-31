"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import styles from "@/styles/Dashboard/productlist.module.css";
import createStyles from "@/styles/Dashboard/createproduct.module.css";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import TableActions from "@/components/AdminPanel/common/TableActions";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface Category {
  _id: string;
  name: string;
}
interface Product {

  _id:string;

  productSKU:string;

  productName:string;
 category: string[];
  mrpPrice: number;
  discountedPrice: number;
  brandName: string;
  description: string;
  ingredients: string;
  targetConcerns: string;
  usageInstructions: string;
  netQuantity: string;
  quantityUnit?: string;
  discountPercent?: number;
  expiryDate: string;
  manufacturerName: string;
 licenseNumber:string;

hsnCode:string;

packagingType:string;
  taxPercent?: number;
  productImages: string[];
  productShortVideo: string;
  benefits: string;
  certifications: string;
  gender: string;
  skinHairType: string;
  barcode: string;
  stockStatus?: string;
  activeStatus?: boolean;
  dermatologistRecommended?: boolean;
  createdAt: string;
}

type ListOfProductProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

const ListOfProduct: React.FC<ListOfProductProps> = ({ canEdit = true, canDelete = true }) => {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isEditing, setIsEditing] = useState(false);

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [prodRes, catRes] = await Promise.all([
      fetch(`${API_URL}/products`),
      fetch(`${API_URL}/categories`),
    ]);

    setProducts(await prodRes.json());
    setCategories(await catRes.json());
  };

const getCategoryName = (ids: string[]) => {

  if (!Array.isArray(ids)) {
    return "-";
  }

  return ids
    .map(
      (id) =>
        categories.find(
          (c) => c._id === id
        )?.name || id
    )
    .join(", ");

};

  /* ================= FILTER ================= */
  const filteredProducts = useMemo(() => {
    let data = [...products];

    if (search) {
      data = data.filter((p) =>
        p.productName.toLowerCase().includes(search.toLowerCase())
      );
    }

 if (filterCategory !== "all") {

  data = data.filter(
    (p) =>
      p.category?.includes(filterCategory)
  );

}

    if (sortBy === "name") {
      data.sort((a, b) => a.productName.localeCompare(b.productName));
    } else {
      data.sort((a, b) => a.mrpPrice - b.mrpPrice);
    }

    return data;
  }, [products, search, sortBy, filterCategory]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / itemsPerPage)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, filterCategory, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleDownloadCSV = () => {
    const rows = [
      ["Name", "Category", "MRP", "Discounted", "Brand"],
      ...filteredProducts.map((p) => [
        p.productName,
        getCategoryName(p.category),
        String(p.mrpPrice),
        String(p.discountedPrice),
        p.brandName || "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products.csv";
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
          <td>${escapeHtml(p.productName)}</td>
          <td>${escapeHtml(getCategoryName(p.category))}</td>
          <td>Rs. ${escapeHtml(String(p.mrpPrice))}</td>
          <td>Rs. ${escapeHtml(String(p.discountedPrice))}</td>
          <td>${escapeHtml(p.brandName || "-")}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Products List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Products List</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>MRP</th>
                <th>Discounted</th>
                <th>Brand</th>
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
    if (!(await confirmDialog("Delete this product?", { danger: true }))) return;
    await fetch(`${API_URL}/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  /* ================= EDIT ================= */
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({ ...product });
    setIsEditing(true);
  };

  const numericEditFields = new Set([
    "netQuantity",
    "mrpPrice",
    "discountedPrice",
    "discountPercent",
    "taxPercent",
  ]);

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    let nextValue: string | boolean = value;
    if (numericEditFields.has(name)) {
      nextValue = value.replace(/\D/g, "");
    }

    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : nextValue,
    }));
  };

  const handleEditNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleEditQuillChange = (field: keyof Product, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
    setEditForm((prev) => ({ ...prev, category: selected }));
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) return;
      const reader = new FileReader();
      reader.onload = () => {
        setEditForm((prev) => ({
          ...prev,
          productImages: [...(prev.productImages || []), reader.result as string],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveEditImage = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      productImages: (prev.productImages || []).filter((_, i) => i !== index),
    }));
  };

  const editQuillModules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const payload = {
      ...editForm,
      mrpPrice: Number(editForm.mrpPrice) || 0,
      discountedPrice: Number(editForm.discountedPrice) || 0,
      discountPercent: Number(editForm.discountPercent) || 0,
      taxPercent: Number(editForm.taxPercent) || 0,
    };

    try {
      const res = await fetch(`${API_URL}/products/${editingProduct._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated?.message || "Failed to update product");

      setProducts((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );

      setIsEditing(false);
      setEditingProduct(null);
      setEditForm({});
      toast.success("Product updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update product");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingProduct(null);
    setEditForm({});
  };

  return (
    <div className={styles.container}>
      {/* <h2 className={styles.heading}>List Of Products</h2> */}

      {/* CONTROLS */}
      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className={styles.filter}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
        </select>

        {/* <select
          className={styles.filter}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select> */}

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

        <button
          type="button"
          className={styles.premiumButton}
          onClick={handleDownloadCSV}
        >
          Download CSV
        </button>
        <button
          type="button"
          className={styles.premiumButton}
          onClick={handleDownloadPDF}
        >
          Download PDF
        </button>
      </div>

      {/* TABLE */}
      {/* TABLE */}

<div className={styles.tableWrapper}>

<table className={styles.table}>

<thead>

<tr>

<th>SKU Code</th>

<th>Image</th>

<th>Product Name</th>

<th>Brand</th>

<th>MRP</th>

<th>Selling Price</th>

<th>Stock</th>

<th>HSN Code</th>

<th>License/FSSAI</th>

<th>Status</th>

<th>Actions</th>

</tr>

</thead>


<tbody>

{paginatedProducts.map((p)=>(

<tr key={p._id}>


<td>
{p.productSKU || "-"}
</td>


<td>

{p.productImages?.length ? (

<img

src={resolveMediaUrl(p.productImages[0]) || undefined}

alt={p.productName}

width={50}

height={50}

/>

):(

"-"

)}

</td>


<td>
{p.productName}
</td>


<td>
{p.brandName || "-"}
</td>


<td>
₹{p.mrpPrice}
</td>


<td>
₹{p.discountedPrice}
</td>


<td>
{p.stockStatus || "-"}
</td>


<td>
{p.hsnCode || "-"}
</td>


<td>
{p.licenseNumber || "-"}
</td>


<td>

{p.activeStatus ? "Active" : "Inactive"}

</td>


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


{paginatedProducts.length===0 && (

<tr>

<td colSpan={11}>
No products found.
</td>

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
            className={`${styles.premiumButton} ${
              currentPage === 1 ? styles.premiumButtonDisabled : ""
            }`}
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
            className={`${styles.premiumButton} ${
              currentPage === totalPages ? styles.premiumButtonDisabled : ""
            }`}
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
            className={createStyles.container}
            style={{
              margin: 0,
              width: "100%",
              maxWidth: 1100,
              maxHeight: "92vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h1 className={createStyles.heading} style={{ margin: 0 }}>
                Edit Product
              </h1>
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

            <form className={createStyles.form} onSubmit={handleEditSubmit}>
              {/* ===== BASIC INFO ===== */}
              <div className={createStyles.section}>
                <h3 className={createStyles.sectionTitle}>Basic Information</h3>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Product SKU</label>
                  <input
                    className={createStyles.readonlyInput}
                    value={editForm.productSKU || ""}
                    disabled
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>
                    Product Name<span className={createStyles.required}>*</span>
                  </label>
                  <input
                    className={createStyles.input}
                    name="productName"
                    value={editForm.productName || ""}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>
                    Product Categories<span className={createStyles.required}>*</span>
                  </label>
                  <select
                    multiple
                    className={createStyles.select}
                    name="category"
                    value={editForm.category || []}
                    onChange={handleEditCategoryChange}
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Brand Name</label>
                  <input
                    className={createStyles.input}
                    name="brandName"
                    value={editForm.brandName || ""}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              {/* ===== DESCRIPTION ===== */}
              <div className={createStyles.section}>
                <h3 className={createStyles.sectionTitle}>Description</h3>

                <div className={createStyles.fullField}>
                  <label className={createStyles.label}>Product Description</label>
                  <ReactQuill
                    className={createStyles.quillLarge}
                    value={editForm.description || ""}
                    onChange={(v) => handleEditQuillChange("description", v)}
                    modules={editQuillModules}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Ingredients</label>
                  <ReactQuill
                    className={createStyles.quillCompact}
                    value={editForm.ingredients || ""}
                    onChange={(v) => handleEditQuillChange("ingredients", v)}
                    modules={editQuillModules}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Target Concerns</label>
                  <ReactQuill
                    className={createStyles.quillCompact}
                    value={editForm.targetConcerns || ""}
                    onChange={(v) => handleEditQuillChange("targetConcerns", v)}
                    modules={editQuillModules}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Usage Instructions</label>
                  <ReactQuill
                    className={createStyles.quillCompact}
                    value={editForm.usageInstructions || ""}
                    onChange={(v) => handleEditQuillChange("usageInstructions", v)}
                    modules={editQuillModules}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Benefits</label>
                  <ReactQuill
                    className={createStyles.quillCompact}
                    value={editForm.benefits || ""}
                    onChange={(v) => handleEditQuillChange("benefits", v)}
                    modules={editQuillModules}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Certifications</label>
                  <input
                    className={createStyles.input}
                    name="certifications"
                    value={editForm.certifications || ""}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              {/* ===== PRICING ===== */}
              <div className={createStyles.section}>
                <h3 className={createStyles.sectionTitle}>Pricing</h3>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Net Quantity</label>
                  <div className={createStyles.quantityBox}>
                    <input
                      type="number"
                      className={createStyles.input}
                      name="netQuantity"
                      value={editForm.netQuantity || ""}
                      onChange={handleEditChange}
                      onKeyDown={handleEditNumberKeyDown}
                    />
                    <select
                      className={createStyles.select}
                      name="quantityUnit"
                      value={editForm.quantityUnit || "Nos"}
                      onChange={handleEditChange}
                    >
                      <option value="Nos">Nos</option>
                      <option value="Qty">Qty</option>
                      <option value="ML">ML</option>
                      <option value="Grams">Grams</option>
                      <option value="KG">KG</option>
                      <option value="Litre">Litre</option>
                    </select>
                  </div>
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>MRP Price</label>
                  <input
                    type="number"
                    min="0"
                    className={createStyles.input}
                    name="mrpPrice"
                    value={editForm.mrpPrice ?? ""}
                    onKeyDown={handleEditNumberKeyDown}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>
                    Discounted Price<span className={createStyles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={createStyles.input}
                    name="discountedPrice"
                    value={editForm.discountedPrice ?? ""}
                    onKeyDown={handleEditNumberKeyDown}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    className={createStyles.input}
                    name="discountPercent"
                    value={editForm.discountPercent ?? ""}
                    onKeyDown={handleEditNumberKeyDown}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>GST / Tax (%)</label>
                  <select
                    className={createStyles.select}
                    name="taxPercent"
                    value={editForm.taxPercent ?? ""}
                    onChange={handleEditChange}
                  >
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>HSN Code</label>
                  <input
                    className={createStyles.input}
                    name="hsnCode"
                    value={editForm.hsnCode || ""}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              {/* ===== COMPLIANCE ===== */}
              <div className={createStyles.section}>
                <h3 className={createStyles.sectionTitle}>Compliance &amp; Packaging</h3>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Expiry Date</label>
                  <input
                    type="date"
                    className={createStyles.input}
                    name="expiryDate"
                    value={(editForm.expiryDate || "").slice(0, 10)}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Manufacturer Name</label>
                  <input
                    className={createStyles.input}
                    name="manufacturerName"
                    value={editForm.manufacturerName || ""}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>License / FSSAI No.</label>
                  <input
                    className={createStyles.input}
                    name="licenseNumber"
                    value={editForm.licenseNumber || ""}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Packaging Type</label>
                  <input
                    className={createStyles.input}
                    name="packagingType"
                    value={editForm.packagingType || ""}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              {/* ===== MEDIA ===== */}
              <div className={createStyles.section}>
                <h3 className={createStyles.sectionTitle}>Media</h3>

                <div className={createStyles.fullField}>
                  {editForm.productImages && editForm.productImages.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                      {editForm.productImages.map((img, index) => (
                        <div key={index} style={{ position: "relative" }}>
                          <img
                            src={resolveMediaUrl(img) || img}
                            alt={`Product ${index + 1}`}
                            style={{
                              width: 84,
                              height: 84,
                              objectFit: "cover",
                              borderRadius: 12,
                              border: "1px solid #cbd5f5",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveEditImage(index)}
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
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png,image/webp"
                    className={createStyles.fileInput}
                    onChange={handleEditImageUpload}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Product Short Video URL</label>
                  <input
                    className={createStyles.input}
                    type="url"
                    name="productShortVideo"
                    value={editForm.productShortVideo || ""}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              {/* ===== META ===== */}
              <div className={createStyles.section}>
                <h3 className={createStyles.sectionTitle}>Product Meta</h3>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Gender</label>
                  <select
                    className={createStyles.select}
                    name="gender"
                    value={editForm.gender || "Unisex"}
                    onChange={handleEditChange}
                  >
                    <option>Unisex</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Skin / Hair Type</label>
                  <input
                    className={createStyles.input}
                    name="skinHairType"
                    value={editForm.skinHairType || ""}
                    onChange={handleEditChange}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Barcode / SKU</label>
                  <input
                    className={createStyles.input}
                    name="barcode"
                    value={editForm.barcode || ""}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              {/* ===== STATUS ===== */}
              <div className={createStyles.section}>
                <h3 className={createStyles.sectionTitle}>Product Status</h3>

                <div className={createStyles.switchRow}>
                  <label>
                    <input
                      type="checkbox"
                      checked={editForm.stockStatus === "In Stock"}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          stockStatus: e.target.checked ? "In Stock" : "Out of Stock",
                        }))
                      }
                    />
                    In Stock
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="activeStatus"
                      checked={!!editForm.activeStatus}
                      onChange={handleEditChange}
                    />
                    Active
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="dermatologistRecommended"
                      checked={!!editForm.dermatologistRecommended}
                      onChange={handleEditChange}
                    />
                    Dermatologist Recommended
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button type="submit" className={createStyles.submitBtn}>
                  Update Product
                </button>
                <button
                  type="button"
                  className={createStyles.submitBtn}
                  style={{ background: "#e2e8f0", color: "#334155" }}
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
          <div
            className={styles.modal}
            style={{ maxWidth: 960 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: 4,
              }}
            >
              <div>
                <h3 style={{ marginBottom: 4 }}>{viewProduct.productName}</h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  SKU: {viewProduct.productSKU || "-"}
                </p>
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
              <span
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  background: viewProduct.activeStatus
                    ? "rgba(22, 163, 74, 0.12)"
                    : "rgba(220, 38, 38, 0.1)",
                  color: viewProduct.activeStatus ? "#15803d" : "#dc2626",
                }}
              >
                {viewProduct.activeStatus ? "Active" : "Inactive"}
              </span>
              <span
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  background:
                    viewProduct.stockStatus === "In Stock"
                      ? "rgba(22, 163, 74, 0.12)"
                      : "rgba(245, 158, 11, 0.14)",
                  color: viewProduct.stockStatus === "In Stock" ? "#15803d" : "#b45309",
                }}
              >
                {viewProduct.stockStatus || "Unknown"}
              </span>
              {viewProduct.dermatologistRecommended && (
                <span
                  style={{
                    padding: "5px 12px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: "rgba(13, 93, 143, 0.12)",
                    color: "#0d5d8f",
                  }}
                >
                  Dermatologist Recommended
                </span>
              )}
            </div>

            {viewProduct.productImages?.length > 0 && (
              <div className={styles.modalImages} style={{ marginBottom: 20 }}>
                {viewProduct.productImages.map((img, i) => (
                  <img key={i} src={resolveMediaUrl(img) || img} alt="Product" />
                ))}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                ["Brand", viewProduct.brandName || "-"],
                ["Category", getCategoryName(viewProduct.category)],
                ["Gender", viewProduct.gender || "-"],
                ["Skin / Hair Type", viewProduct.skinHairType || "-"],
                ["Barcode", viewProduct.barcode || "-"],
                ["Certifications", viewProduct.certifications || "-"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 14, color: "#0f172a", marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>

            <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
              Pricing
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                ["Net Quantity", `${viewProduct.netQuantity || "-"} ${(viewProduct as any).quantityUnit || ""}`.trim()],
                ["MRP", `₹${viewProduct.mrpPrice ?? "-"}`],
                ["Discounted Price", `₹${viewProduct.discountedPrice ?? "-"}`],
                ["Discount", (viewProduct as any).discountPercent ? `${(viewProduct as any).discountPercent}%` : "-"],
                ["GST / Tax", viewProduct.taxPercent ? `${viewProduct.taxPercent}%` : "-"],
                ["HSN Code", viewProduct.hsnCode || "-"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 14, color: "#0f172a", marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>

            <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
              Compliance &amp; Packaging
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                ["Expiry Date", viewProduct.expiryDate ? String(viewProduct.expiryDate).slice(0, 10) : "-"],
                ["Manufacturer", viewProduct.manufacturerName || "-"],
                ["License / FSSAI No.", viewProduct.licenseNumber || "-"],
                ["Packaging Type", viewProduct.packagingType || "-"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 14, color: "#0f172a", marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>

            {[
              ["Description", viewProduct.description],
              ["Ingredients", viewProduct.ingredients],
              ["Target Concerns", viewProduct.targetConcerns],
              ["Usage Instructions", viewProduct.usageInstructions],
              ["Benefits", viewProduct.benefits],
            ].map(([label, value]) =>
              value ? (
                <div key={label} style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
                    {label}
                  </h4>
                  <div
                    style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: value }}
                  />
                </div>
              ) : null
            )}

            {viewProduct.productShortVideo && (
              <p style={{ fontSize: 14 }}>
                <b>Short Video:</b>{" "}
                <a href={viewProduct.productShortVideo} target="_blank" rel="noreferrer">
                  {viewProduct.productShortVideo}
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
};

export default ListOfProduct;
