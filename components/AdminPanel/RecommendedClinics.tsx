"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FiSearch, FiStar, FiMapPin } from "react-icons/fi";
import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";
import { useToast } from "@/context/ToastContext";
import styles from "@/styles/Dashboard/recommendedClinics.module.css";

interface ClinicCategory {
  _id: string;
  name: string;
}

interface Clinic {
  _id: string;
  clinicName: string;
  city?: string;
  sector?: string;
  pincode?: string;
  contactNumber?: string;
  dermaCategory?: ClinicCategory | string;
  verifiedBadge?: boolean;
  isActive?: boolean;
  isRecommended?: boolean;
  recommendedOrder?: number;
}

const getCategoryName = (clinic: Clinic) =>
  typeof clinic.dermaCategory === "object" ? clinic.dermaCategory?.name || "-" : "-";

const MAX_RECOMMENDED_PER_LOCATION = 10;

export default function RecommendedClinics() {
  const toast = useToast();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [onlyRecommended, setOnlyRecommended] = useState(false);
  const [savingId, setSavingId] = useState("");

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/clinics?light=true`);
      const data = await res.json();
      setClinics(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch clinics:", err);
      toast.error("Failed to load clinics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cities = useMemo(() => {
    const set = new Set<string>();
    clinics.forEach((clinic) => {
      if (clinic.city?.trim()) set.add(clinic.city.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [clinics]);

  const filteredClinics = useMemo(() => {
    const q = search.trim().toLowerCase();

    return clinics
      .filter((clinic) => {
        if (onlyRecommended && !clinic.isRecommended) return false;
        if (cityFilter !== "all" && clinic.city !== cityFilter) return false;
        if (!q) return true;

        const haystack = [
          clinic.clinicName,
          clinic.city,
          clinic.sector,
          clinic.pincode,
          getCategoryName(clinic),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => {
        // Recommended clinics float to the top, ranked #1/#2/#3... by
        // recommendedOrder (unranked ones last within that group); every
        // other clinic stays alphabetical below them.
        if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
        if (a.isRecommended && b.isRecommended) {
          const orderA = a.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
          if (orderA !== orderB) return orderA - orderB;
        }
        return a.clinicName.localeCompare(b.clinicName);
      });
  }, [clinics, search, cityFilter, onlyRecommended]);

  const recommendedCount = clinics.filter((clinic) => clinic.isRecommended).length;

  const recommendedCountByCity = useMemo(() => {
    const counts: Record<string, number> = {};
    clinics.forEach((clinic) => {
      if (!clinic.isRecommended) return;
      const city = (clinic.city || "").trim();
      counts[city] = (counts[city] || 0) + 1;
    });
    return counts;
  }, [clinics]);

  const isCityFullFor = (clinic: Clinic) => {
    if (clinic.isRecommended) return false; // already in — toggling off is always allowed
    const city = (clinic.city || "").trim();
    return (recommendedCountByCity[city] || 0) >= MAX_RECOMMENDED_PER_LOCATION;
  };

  const handleToggleRecommend = async (clinic: Clinic) => {
    const nextValue = !clinic.isRecommended;

    if (nextValue && isCityFullFor(clinic)) {
      const city = (clinic.city || "").trim();
      toast.error(
        city
          ? `Only ${MAX_RECOMMENDED_PER_LOCATION} clinics can be recommended for ${city}. Remove one before adding another.`
          : `Only ${MAX_RECOMMENDED_PER_LOCATION} clinics without a city set can be recommended.`
      );
      return;
    }
    try {
      setSavingId(clinic._id);
      const res = await fetch(`${API_URL}/clinics/${clinic._id}/recommend`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRecommended: nextValue }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to update clinic");

      setClinics((prev) =>
        prev.map((c) => (c._id === clinic._id ? { ...c, isRecommended: nextValue } : c))
      );
      toast.success(
        nextValue
          ? `${clinic.clinicName} added to Recommended Clinics`
          : `${clinic.clinicName} removed from Recommended Clinics`
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to update clinic");
    } finally {
      setSavingId("");
    }
  };

  const handleOrderChange = (clinicId: string, value: string) => {
    const parsed = value === "" ? undefined : Number(value);
    setClinics((prev) =>
      prev.map((c) => (c._id === clinicId ? { ...c, recommendedOrder: parsed } : c))
    );
  };

  const handleOrderSave = async (clinic: Clinic) => {
    try {
      setSavingId(clinic._id);
      const res = await fetch(`${API_URL}/clinics/${clinic._id}/recommend`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendedOrder:
            clinic.recommendedOrder === undefined ? null : clinic.recommendedOrder,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to update order");
      toast.success(`Display order updated for ${clinic.clinicName}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update order");
    } finally {
      setSavingId("");
    }
  };

  if (loading) return <FullPageLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Recommended Clinics</h2>
          <p className={styles.subtle}>
            Choose which clinics should be shown as "Recommended" to patients, by location.
          </p>
        </div>
        <div className={styles.summaryChip}>
          <FiStar />
          <span>{recommendedCount} Recommended</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch color="#64748b" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by clinic name, city, sector, or category..."
          />
        </div>

        <div className={styles.locationFilter}>
          <FiMapPin color="#64748b" />
          <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
            <option value="all">All Locations</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city} ({recommendedCountByCity[city] || 0}/{MAX_RECOMMENDED_PER_LOCATION})
              </option>
            ))}
          </select>
        </div>

        {cityFilter !== "all" && (
          <span className={styles.locationCapBadge}>
            {recommendedCountByCity[cityFilter] || 0}/{MAX_RECOMMENDED_PER_LOCATION} recommended
            in {cityFilter}
          </span>
        )}

        <label className={styles.onlyRecommendedToggle}>
          <input
            type="checkbox"
            checked={onlyRecommended}
            onChange={(event) => setOnlyRecommended(event.target.checked)}
          />
          Show recommended only
        </label>
      </div>

      {filteredClinics.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No clinics match this search/location.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Clinic</th>
                <th>Category</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Recommended</th>
                <th>Order</th>
              </tr>
            </thead>
            <tbody>
              {filteredClinics.map((clinic) => (
                <tr
                  key={clinic._id}
                  className={clinic.isRecommended ? styles.recommendedRow : ""}
                >
                  <td className={styles.clinicNameCell}>{clinic.clinicName}</td>
                  <td>{getCategoryName(clinic)}</td>
                  <td>
                    {[clinic.sector, clinic.city].filter(Boolean).join(", ") || "-"}
                  </td>
                  <td>{clinic.contactNumber || "-"}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        clinic.isActive === false ? styles.statusInactive : styles.statusActive
                      }`}
                    >
                      {clinic.isActive === false ? "Inactive" : "Active"}
                    </span>
                    {clinic.verifiedBadge && (
                      <span className={styles.verifiedTag}>Verified</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.recommendToggle} ${
                        clinic.isRecommended ? styles.recommendToggleOn : ""
                      }`}
                      onClick={() => handleToggleRecommend(clinic)}
                      disabled={savingId === clinic._id || isCityFullFor(clinic)}
                      title={
                        isCityFullFor(clinic)
                          ? `Only ${MAX_RECOMMENDED_PER_LOCATION} clinics can be recommended for ${
                              clinic.city || "this location"
                            }`
                          : undefined
                      }
                    >
                      <FiStar />
                      {savingId === clinic._id
                        ? "Saving..."
                        : clinic.isRecommended
                        ? "Recommended"
                        : isCityFullFor(clinic)
                        ? "Location Full"
                        : "Recommend"}
                    </button>
                  </td>
                  <td>
                    {clinic.isRecommended ? (
                      <input
                        type="number"
                        min={1}
                        className={styles.orderInput}
                        value={clinic.recommendedOrder ?? ""}
                        onChange={(event) => handleOrderChange(clinic._id, event.target.value)}
                        onBlur={() => handleOrderSave(clinic)}
                        disabled={savingId === clinic._id}
                        placeholder="#"
                        title="Display rank among recommended clinics (1 = shown first)"
                      />
                    ) : (
                      <span className={styles.orderPlaceholder}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
