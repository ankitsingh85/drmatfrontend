"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FiCheck, FiPackage, FiSearch } from "react-icons/fi";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import styles from "@/styles/Dashboard/recommendModal.module.css";

type CatalogItem = {
  itemType: "product" | "treatment";
  itemId: string;
  name: string;
  image?: string;
  price: number;
  mrp?: number;
};

type RawProduct = {
  _id: string;
  productName?: string;
  productImages?: string[];
  discountedPrice?: number;
  mrpPrice?: number;
};

type RawTreatment = {
  _id: string;
  treatmentName?: string;
  treatmentImages?: string[];
  offerPrice?: number;
  mrp?: number;
};

type RecommendModalProps = {
  doctorId: string;
  chatId: string;
  patientId: string;
  patientName: string;
  onClose: () => void;
  onSent: (message: any) => void;
};

const RecommendModal: React.FC<RecommendModalProps> = ({
  doctorId,
  chatId,
  patientId,
  patientName,
  onClose,
  onSent,
}) => {
  const [tab, setTab] = useState<"product" | "treatment">("product");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [treatments, setTreatments] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CatalogItem[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const [productsRes, treatmentsRes] = await Promise.all([
          axios.get(`${API_URL}/products`),
          axios.get(`${API_URL}/treatment-plans`),
        ]);

        const productList: RawProduct[] = Array.isArray(productsRes.data)
          ? productsRes.data
          : productsRes.data?.data || [];
        const treatmentList: RawTreatment[] = Array.isArray(treatmentsRes.data)
          ? treatmentsRes.data
          : treatmentsRes.data?.data || [];

        setProducts(
          productList
            .filter((p) => p && p._id && p.productName)
            .map((p) => ({
              itemType: "product" as const,
              itemId: p._id,
              name: p.productName || "",
              image: p.productImages?.[0],
              price: Number(p.discountedPrice || 0),
              mrp: p.mrpPrice != null ? Number(p.mrpPrice) : undefined,
            }))
        );

        setTreatments(
          treatmentList
            .filter((t) => t && t._id && t.treatmentName)
            .map((t) => ({
              itemType: "treatment" as const,
              itemId: t._id,
              name: t.treatmentName || "",
              image: t.treatmentImages?.[0],
              price: Number(t.offerPrice || 0),
              mrp: t.mrp != null ? Number(t.mrp) : undefined,
            }))
        );
      } catch {
        setError("Could not load products/treatments catalog.");
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  const activeList = tab === "product" ? products : treatments;

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeList;
    return activeList.filter((item) => item.name.toLowerCase().includes(q));
  }, [activeList, search]);

  const isSelected = (item: CatalogItem) =>
    selected.some((s) => s.itemType === item.itemType && s.itemId === item.itemId);

  const toggleSelect = (item: CatalogItem) => {
    setSelected((prev) => {
      if (prev.some((s) => s.itemType === item.itemType && s.itemId === item.itemId)) {
        return prev.filter((s) => !(s.itemType === item.itemType && s.itemId === item.itemId));
      }
      return [...prev, item];
    });
  };

  const removeSelected = (item: CatalogItem) => {
    setSelected((prev) => prev.filter((s) => !(s.itemType === item.itemType && s.itemId === item.itemId)));
  };

  const handleSend = async () => {
    if (selected.length === 0) {
      setError("Select at least one product or treatment to suggest.");
      return;
    }

    try {
      setSending(true);
      setError("");

      const res = await axios.post(`${API_URL}/message/send-recommendation`, {
        chatId,
        senderId: doctorId,
        receiverId: patientId,
        recommendations: selected,
      });

      onSent(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not send the suggestion. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h3>Suggest Products / Treatments</h3>
            <p>To {patientName}</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "product" ? styles.tabBtnActive : ""}`}
            onClick={() => setTab("product")}
          >
            Products ({products.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "treatment" ? styles.tabBtnActive : ""}`}
            onClick={() => setTab("treatment")}
          >
            Treatments ({treatments.length})
          </button>
        </div>

        <div className={styles.searchBox}>
          <FiSearch />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tab === "product" ? "products" : "treatments"}...`}
          />
        </div>

        <div className={styles.list}>
          {loading ? (
            <div className={styles.listState}>Loading catalog...</div>
          ) : filteredList.length === 0 ? (
            <div className={styles.listState}>No results found.</div>
          ) : (
            filteredList.map((item) => {
              const selectedState = isSelected(item);
              const image = resolveMediaUrl(item.image);
              return (
                <button
                  key={`${item.itemType}-${item.itemId}`}
                  type="button"
                  className={`${styles.itemRow} ${selectedState ? styles.itemRowSelected : ""}`}
                  onClick={() => toggleSelect(item)}
                >
                  {image ? (
                    <img src={image} alt={item.name} className={styles.itemThumb} />
                  ) : (
                    <span className={styles.itemThumbPlaceholder}>
                      <FiPackage />
                    </span>
                  )}
                  <span className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemPrice}>Rs. {item.price.toLocaleString("en-IN")}</span>
                  </span>
                  <span className={`${styles.itemCheck} ${selectedState ? styles.itemCheckOn : ""}`}>
                    <FiCheck />
                  </span>
                </button>
              );
            })
          )}
        </div>

        {selected.length > 0 && (
          <div className={styles.selectedWrap}>
            <p className={styles.selectedLabel}>Selected ({selected.length})</p>
            <div className={styles.chips}>
              {selected.map((item) => (
                <span key={`${item.itemType}-${item.itemId}`} className={styles.chip}>
                  {item.name}
                  <button type="button" className={styles.chipRemove} onClick={() => removeSelected(item)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button type="button" className={styles.sendBtn} onClick={handleSend} disabled={sending}>
            {sending ? "Sending..." : `Send Suggestion${selected.length > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendModal;
