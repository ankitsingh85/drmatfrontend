"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/productlist.module.css";
import createStyles from "@/styles/Dashboard/createproduct.module.css";
import { API_URL } from "@/config/api";

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  productName: string;
  category: string;
  mrpPrice: number;
  discountedPrice: number;
  brandName: string;
  description: string;
  ingredients: string;
  targetConcerns: string;
  usageInstructions: string;
  netQuantity: string;
  expiryDate: string;
  manufacturerName: string;
  licenseNumber: string;
  packagingType: string;
  productImages: string[];
  productShortVideo: string;
  howToUseVideo: string;
  benefits: string;
  certifications: string;
  gender: string;
  skinHairType: string;
  barcode: string;
  productURL: string;
  createdAt: string;
}

const ListOfProduct: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [filterCategory, setFilterCategory] = useState("all");

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

  const getCategoryName = (id: string) =>
    categories.find((c) => c._id === id)?.name || id;

  /* ================= FILTER ================= */
  const filteredProducts = useMemo(() => {
    let data = [...products];

    if (search) {
      data = data.filter((p) =>
        p.productName.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterCategory !== "all") {
      data = data.filter((p) => p.category === filterCategory);
    }

    if (sortBy === "name") {
      data.sort((a, b) => a.productName.localeCompare(b.productName));
    } else {
      data.sort((a, b) => a.mrpPrice - b.mrpPrice);
    }

    return data;
  }, [products, search, sortBy, filterCategory]);

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`${API_URL}/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  /* ================= EDIT ================= */
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({ ...product });
    setIsEditing(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const res = await fetch(`${API_URL}/products/${editingProduct._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    const updated = await res.json();

    setProducts((prev) =>
      prev.map((p) => (p._id === updated._id ? updated : p))
    );

    setIsEditing(false);
    setEditingProduct(null);
    setEditForm({});
    alert("✅ Product updated successfully");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingProduct(null);
    setEditForm({});
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Product List</h2>

      {/* CONTROLS */}
      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
        </select>

        <select onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Category</th>
            <th>MRP</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredProducts.map((p, i) => (
            <tr key={p._id}>
              <td>{i + 1}</td>
              <td>{p.productName}</td>
              <td>{getCategoryName(p.category)}</td>
              <td>₹{p.mrpPrice}</td>
              <td className={styles.actions}>
                <button className={styles.eye} onClick={() => setViewProduct(p)}>
                  👁
                </button>
                <button className={styles.edit} onClick={() => handleEdit(p)}>
                  ✏️
                </button>
                <button
                  className={styles.delete}
                  onClick={() => handleDelete(p._id)}
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================= INLINE EDIT FORM ================= */}
      {isEditing && editingProduct && (
        <div className={createStyles.container} style={{ marginTop: 40 }}>
          <h1 className={createStyles.heading}>Edit Product</h1>

          <form className={createStyles.form} onSubmit={handleEditSubmit}>
            <div className={createStyles.section}>
              <label>Product Name</label>
              <input name="productName" value={editForm.productName || ""} onChange={handleEditChange}  className={createStyles.input} />

              <label>Brand Name</label>
              <input name="brandName" value={editForm.brandName || ""} onChange={handleEditChange} className={createStyles.input}/>

              <label>Category</label>
              <select name="category" value={editForm.category || ""} onChange={handleEditChange}className={createStyles.input}>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>

              <label>MRP Price</label>
              <input type="number" name="mrpPrice" value={editForm.mrpPrice || ""} onChange={handleEditChange} className={createStyles.input}/>

              <label>Discounted Price</label>
              <input type="number" name="discountedPrice" value={editForm.discountedPrice || ""} onChange={handleEditChange} className={createStyles.input}/>

              <label>Net Quantity</label>
              <input name="netQuantity" value={editForm.netQuantity || ""} onChange={handleEditChange} className={createStyles.input} />

              <label>Expiry Date</label>
              <input type="date" name="expiryDate" value={editForm.expiryDate || ""} onChange={handleEditChange} className={createStyles.input} />

              <label>Manufacturer</label>
              <input name="manufacturerName" value={editForm.manufacturerName || ""} onChange={handleEditChange} className={createStyles.input}/>

              <label>License Number</label>
              <input name="licenseNumber" value={editForm.licenseNumber || ""} onChange={handleEditChange} className={createStyles.input}/>

              <label>Packaging Type</label>
              <input name="packagingType" value={editForm.packagingType || ""} onChange={handleEditChange}className={createStyles.input} />

              <label>Ingredients</label>
              <textarea name="ingredients" value={editForm.ingredients || ""} onChange={handleEditChange} className={createStyles.input}/>

              <label>Usage Instructions</label>
              <textarea name="usageInstructions" value={editForm.usageInstructions || ""} onChange={handleEditChange} className={createStyles.input} />

              {/* <label>Benefits</label>
              <textarea name="benefits" value={editForm.benefits || ""} onChange={handleEditChange} className={createStyles.input}/> */}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className={createStyles.submitBtn}>
                Update Product
              </button>
              <button type="button" className={createStyles.submitBtn} onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= VIEW MODAL ================= */}
     {viewProduct && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h3>{viewProduct.productName}</h3>

      <div className={styles.modalGrid}>
        <p><b>Brand:</b> {viewProduct.brandName}</p>
        <p><b>Category:</b> {getCategoryName(viewProduct.category)}</p>
        <p><b>MRP:</b> ₹{viewProduct.mrpPrice}</p>
        <p><b>Discounted:</b> ₹{viewProduct.discountedPrice}</p>
        <p><b>Net Quantity:</b> {viewProduct.netQuantity}</p>
        <p><b>Expiry Date:</b> {viewProduct.expiryDate}</p>
      </div>

      <p><b>Description:</b> {viewProduct.description}</p>
      <p><b>Ingredients:</b> {viewProduct.ingredients}</p>
      <p><b>Usage:</b> {viewProduct.usageInstructions}</p>

      {viewProduct.productImages?.length > 0 && (
        <div className={styles.modalImages}>
          {viewProduct.productImages.map((img, i) => (
            <img key={i} src={img} alt="Product" />
          ))}
        </div>
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
