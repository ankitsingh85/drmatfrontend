"use client";

import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { FiX, FiMapPin, FiCheckCircle } from "react-icons/fi";
import { API_URL } from "@/config/api";
import { distanceInKm } from "@/lib/geo";
import styles from "@/styles/components/modal/TreatmentClinicModal.module.css";

export type TreatmentClinicOption = {
  _id: string;
  clinicName: string;
  address?: string;
  city?: string;
  sector?: string;
  pincode?: string;
  slug?: string;
  latitude?: number;
  longitude?: number;
  verifiedBadge?: boolean;
  distanceKm?: number;
};

type Props = {
  treatmentId: string;
  treatmentName: string;
  price: number;
  onConfirm: (clinic: TreatmentClinicOption) => void;
  onClose: () => void;
};

const RADIUS_KM = 30;

const addressLineFor = (clinic: TreatmentClinicOption) =>
  [clinic.sector, clinic.city].filter(Boolean).join(", ") || clinic.address || "";

export default function TreatmentClinicModal({
  treatmentId,
  treatmentName,
  price,
  onConfirm,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clinics, setClinics] = useState<TreatmentClinicOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );

  useEffect(() => {
    const fetchTreatment = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_URL}/treatment-plans/${treatmentId}`);
        if (!res.ok) throw new Error("Failed to load clinics for this treatment");
        const data = await res.json();
        const list: TreatmentClinicOption[] = Array.isArray(data?.clinic)
          ? data.clinic
          : [];
        setClinics(list.filter((c) => c && c._id));
      } catch (err: any) {
        setError(err?.message || "Failed to load clinics");
      } finally {
        setLoading(false);
      }
    };

    fetchTreatment();
  }, [treatmentId]);

  useEffect(() => {
    const cookieLat = Cookies.get("latitude");
    const cookieLng = Cookies.get("longitude");
    if (cookieLat && cookieLng) {
      setUserCoords({ lat: Number(cookieLat), lng: Number(cookieLng) });
      return;
    }

    if (!navigator.geolocation) {
      setLocationDenied(true);
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        try {
          Cookies.set("latitude", String(latitude), { expires: 7 });
          Cookies.set("longitude", String(longitude), { expires: 7 });
        } catch {
          // Ignore cookie write failures — distance still works this session.
        }
        setLocating(false);
      },
      () => {
        setLocationDenied(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const clinicsWithDistance = useMemo(() => {
    return clinics.map((clinic) => {
      if (
        userCoords &&
        typeof clinic.latitude === "number" &&
        typeof clinic.longitude === "number"
      ) {
        return {
          ...clinic,
          distanceKm: distanceInKm(
            userCoords.lat,
            userCoords.lng,
            clinic.latitude,
            clinic.longitude
          ),
        };
      }
      return { ...clinic, distanceKm: undefined };
    });
  }, [clinics, userCoords]);

  const withinRadius = useMemo(
    () =>
      clinicsWithDistance
        .filter((c) => c.distanceKm !== undefined && c.distanceKm <= RADIUS_KM)
        .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0)),
    [clinicsWithDistance]
  );

  const sortedAll = useMemo(
    () =>
      [...clinicsWithDistance].sort((a, b) => {
        if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
        if (a.distanceKm === undefined) return 1;
        if (b.distanceKm === undefined) return -1;
        return a.distanceKm - b.distanceKm;
      }),
    [clinicsWithDistance]
  );

  const displayList = withinRadius.length > 0 ? withinRadius : sortedAll;
  const showingFallback = withinRadius.length === 0 && sortedAll.length > 0;

  useEffect(() => {
    if (!selectedId && displayList.length > 0) {
      setSelectedId(displayList[0]._id);
    }
  }, [displayList, selectedId]);

  const selectedClinic = displayList.find((c) => c._id === selectedId) || null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Select a clinic for your visit</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <p className={styles.subtitle}>{treatmentName}</p>

        {locating && <p className={styles.locatingText}>Detecting your location…</p>}
        {locationDenied && !userCoords && (
          <p className={styles.locationNote}>
            Enable location access to see distance to each clinic.
          </p>
        )}

        <div className={styles.list}>
          {loading && <p className={styles.stateText}>Loading clinics…</p>}
          {!loading && error && <p className={styles.stateText}>{error}</p>}
          {!loading && !error && displayList.length === 0 && (
            <p className={styles.stateText}>
              No clinics are associated with this treatment yet.
            </p>
          )}

          {!loading && !error && showingFallback && (
            <p className={styles.fallbackNote}>
              No clinics found within {RADIUS_KM} km — showing all clinics for this
              treatment.
            </p>
          )}

          {!loading &&
            !error &&
            displayList.map((clinic) => {
              const selected = clinic._id === selectedId;
              const addressLine = addressLineFor(clinic);
              return (
                <label
                  key={clinic._id}
                  className={`${styles.card} ${selected ? styles.cardSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="clinic"
                    checked={selected}
                    onChange={() => setSelectedId(clinic._id)}
                    className={styles.radio}
                  />
                  <div className={styles.cardBody}>
                    <div className={styles.cardTop}>
                      <h3>{clinic.clinicName}</h3>
                      {clinic.verifiedBadge && (
                        <span className={styles.verifiedBadge}>
                          <FiCheckCircle /> Verified
                        </span>
                      )}
                    </div>
                    {addressLine && (
                      <p className={styles.address}>
                        <FiMapPin /> {addressLine}
                      </p>
                    )}
                    {clinic.distanceKm !== undefined && (
                      <p className={styles.distance}>
                        {clinic.distanceKm.toFixed(1)} km away
                      </p>
                    )}
                    <div className={styles.priceRow}>
                      <span className={styles.price}>₹{price}</span>
                    </div>
                    {clinic.slug && (
                      <a
                        href={`/clinics/${clinic.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.knowMore}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Know More
                      </a>
                    )}
                  </div>
                </label>
              );
            })}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerAmount}>
            <span className={styles.footerLabel}>Payable amount</span>
            <span className={styles.footerPrice}>₹{price}</span>
          </div>
          <button
            type="button"
            className={styles.confirmBtn}
            disabled={!selectedClinic}
            onClick={() => selectedClinic && onConfirm(selectedClinic)}
          >
            Confirm &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}
