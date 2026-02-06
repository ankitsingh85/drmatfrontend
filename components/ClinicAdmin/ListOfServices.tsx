"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Cookies from "js-cookie";
import {jwtDecode} from "jwt-decode";
import styles from "@/styles/clinicdashboard/listofservices.module.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

interface Category {
  _id: string;
  name: string;
}

interface Service {
  _id: string;
  serviceName: string;
  categories: Category[];
  images: string[];
  description: string;
  price: number;
  discountedPrice?: number;
  clinic: string;
}

interface JwtPayload {
  id: string; // clinicId
  role: string;
}

// ✅ Use environment variable for API base URL
// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const ServiceList = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [notification, setNotification] = useState<string>("");

  // Get clinicId from token
  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        if (decoded?.id) setClinicId(decoded.id);
        else setNotification("Invalid token: Clinic ID missing");
      } catch (err) {
        console.error("Failed to decode token", err);
        setNotification("Failed to decode token");
      }
    } else {
      setNotification("Token not found. Please login again.");
    }
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/service-categories`);
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data: Category[] = await res.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch services
  useEffect(() => {
    if (!clinicId) return;

    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/services?clinic=${clinicId}`);
        if (!res.ok) throw new Error("Failed to fetch services");
        const data = await res.json();
        setServices(Array.isArray(data) ? data : data.services);
      } catch (err) {
        console.error(err);
        setNotification("Error fetching services ❌");
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [clinicId]);

  const showTempNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const deleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const res = await fetch(`${API_URL}/services/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete");

      setServices((prev) => prev.filter((s) => s._id !== id));
      showTempNotification("Service deleted successfully ✅");
    } catch (err) {
      console.error(err);
      showTempNotification("Failed to delete service ❌");
    }
  };

  const openEditModal = (service: Service) => {
    setEditingService({ ...service });
    setShowModal(true);
    setNewImages([]);
    setNewImagePreviews([]);
  };

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setNewImages(files);
    setNewImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });

  const removeExistingImage = (index: number) => {
    if (!editingService) return;
    const imgs = [...editingService.images];
    imgs.splice(index, 1);
    setEditingService({ ...editingService, images: imgs });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      const base64NewImages = await Promise.all(newImages.map(toBase64));
      const payload = {
        ...editingService,
        categories: editingService.categories.map((c) => c._id),
        images: [...editingService.images, ...base64NewImages],
      };

      const res = await fetch(`${API_URL}/services/${editingService._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update service");

      setServices((prev) =>
        prev.map((s) =>
          s._id === data._id ? { ...data, categories: editingService.categories } : s
        )
      );

      setShowModal(false);
      showTempNotification("Service updated successfully ✅");
    } catch (err) {
      console.error(err);
      showTempNotification("Failed to update service ❌");
    }
  };

  if (loading) return <p>Loading services...</p>;
  if (!loading && services.length === 0) return <p>{notification || "No services found."}</p>;

  return (
    <div className={styles.container}>
      {notification && <div className={styles.notification}>{notification}</div>}

      <h2 className={styles.heading}>Service List</h2>
      <div className={styles.grid}>
        {services.map((service) => (
          <div key={service._id} className={styles.card}>
            <h3>{service.serviceName}</h3>

            {service.categories.length > 0 && (
              <div className={styles.categoryBox}>
                {service.categories.map((c) => (
                  <span key={c._id} className={styles.categoryName}>
                    {c.name}
                  </span>
                ))}
              </div>
            )}

            <div className={styles.imageContainer}>
              {service.images.map((img, idx) => (
                <img key={idx} src={img} alt={`service-${idx}`} />
              ))}
            </div>

            <p
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: service.description }}
            ></p>

            <p>Price: ₹{service.price}</p>
            {service.discountedPrice && <p>Discounted: ₹{service.discountedPrice}</p>}

            <div className={styles.actions}>
              <button onClick={() => openEditModal(service)}>Update</button>
              <button className={styles.deleteBtn} onClick={() => deleteService(service._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && editingService && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.closeBtn} onClick={() => setShowModal(false)}>
              &times;
            </button>
            <h3>Edit Service</h3>
            <form onSubmit={handleUpdate}>
              <label>Service Name</label>
              <input
                type="text"
                value={editingService.serviceName}
                onChange={(e) =>
                  setEditingService({ ...editingService, serviceName: e.target.value })
                }
                required
              />

              <label>Categories</label>
              <select
                multiple
                value={editingService.categories.map((c) => c._id)}
                onChange={(e) => {
                  const selectedIds = Array.from(e.target.selectedOptions, (opt) => opt.value);
                  const selectedCats = categories.filter((c) => selectedIds.includes(c._id));
                  setEditingService({ ...editingService, categories: selectedCats });
                }}
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <label>Description</label>
              <ReactQuill
                value={editingService.description}
                onChange={(val) => setEditingService({ ...editingService, description: val })}
              />

              <label>Price</label>
              <input
                type="number"
                value={editingService.price}
                onChange={(e) =>
                  setEditingService({ ...editingService, price: Number(e.target.value) })
                }
                required
              />

              <label>Discounted Price</label>
              <input
                type="number"
                value={editingService.discountedPrice || ""}
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    discountedPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />

              <label>Existing Images</label>
              <div className={styles.imagePreviewContainer}>
                {editingService.images.map((img, idx) => (
                  <div key={idx} className={styles.imageWrapper}>
                    <img src={img} alt={`existing-${idx}`} />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className={styles.removeBtn}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <label>Add New Images</label>
              <input type="file" accept="image/*" multiple onChange={handleNewImageChange} />
              <div className={styles.imagePreviewContainer}>
                {newImagePreviews.map((src, idx) => (
                  <img key={idx} src={src} alt={`new-${idx}`} />
                ))}
              </div>

              <div className={styles.modalActions}>
                <button type="submit">Save Changes</button>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceList;
