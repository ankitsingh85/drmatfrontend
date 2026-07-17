"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import {
  FiVideo,
  FiSearch,
  FiShield,
  FiHome,
  FiLock,
  FiUsers,
  FiCheckCircle,
  FiFileText,
  FiArrowRight,
} from "react-icons/fi";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import styles from "@/styles/videoConsultation.module.css";

const CONSULTATION_CHECKOUT_KEY = "consultationCheckout";
const PAYMENT_PATH = "/home/PaymentPage?flow=consultation";
const DASHBOARD_CONSULTATIONS_PATH = "/UserDashboard?section=chat";

type Doctor = {
  _id: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  specialist?: string;
  email?: string;
  phone?: string;
  description?: string;
  profileImage?: string;
};

type ConsultationService = {
  _id: string;
  serviceCode?: string;
  serviceType: string;
  imageUrl?: string;
  consultationFee: number;
  offerPrice?: number;
  discountPercent?: number;
  isActive?: boolean;
  doctors?: Doctor[];
  nextAvailableSlot?: string;
};

const getDoctorName = (doctor?: Doctor | null) => {
  if (!doctor) return "Doctor";
  return (
    [doctor.title || "Dr.", doctor.firstName, doctor.lastName]
      .filter(Boolean)
      .join(" ") || doctor.email || "Doctor"
  );
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "D";

// Deterministic accent color per speciality, purely visual — not tied to
// any real data (we don't have per-speciality icons/colors in the DB).
const ACCENT_PALETTE = [
  { bg: "#eef5ff", fg: "#0a4b83" },
  { bg: "#f5f0ff", fg: "#6d28d9" },
  { bg: "#ecfeff", fg: "#0e7490" },
  { bg: "#f0fdf4", fg: "#15803d" },
  { bg: "#fff7ed", fg: "#c2410c" },
  { bg: "#fefce8", fg: "#a16207" },
  { bg: "#fdf2f8", fg: "#be185d" },
];

const accentFor = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return ACCENT_PALETTE[hash % ACCENT_PALETTE.length];
};

const HOW_IT_WORKS_STEPS = [
  { icon: <FiSearch />, label: "Select a Service" },
  { icon: <FiVideo />, label: "Video call with a verified doctor" },
  { icon: <FiFileText />, label: "Get your prescription after the consultation" },
];

export default function VideoConsultation() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [services, setServices] = useState<ConsultationService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [paidServiceIds, setPaidServiceIds] = useState<Set<string>>(new Set());

  const servicesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    const id = localStorage.getItem("userId") || Cookies.get("userId");
    if (token && id) setUserId(id);
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const res = await axios.get(`${API_URL}/doctoradmin`);
        const nextDoctors = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setDoctors(nextDoctors);
      } catch {
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const res = await axios.get(`${API_URL}/online-consultation-services`);
        const list: ConsultationService[] = Array.isArray(res.data) ? res.data : [];
        setServices(list.filter((service) => service.isActive !== false));
      } catch {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      setPaidServiceIds(new Set());
      return;
    }

    const fetchPaidServices = async () => {
      try {
        // Access is decided server-side from the verified JWT (never from a
        // client-supplied user id) so a purchased consultation can only ever
        // be reached by the account that actually paid for it.
        const res = await axios.get(`${API_URL}/orders/my/consultation-access`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ids: string[] = Array.isArray(res.data?.serviceIds) ? res.data.serviceIds : [];
        setPaidServiceIds(new Set(ids));
      } catch {
        setPaidServiceIds(new Set());
      }
    };

    fetchPaidServices();
  }, [userId]);

  const consultNow = (service: ConsultationService) => {
    const effectivePrice =
      typeof service.offerPrice === "number" && service.offerPrice > 0
        ? service.offerPrice
        : service.consultationFee;

    const checkoutItem = {
      id: service._id,
      name: service.serviceType,
      price: effectivePrice,
      quantity: 1,
      image: resolveMediaUrl(service.imageUrl) || "",
      itemType: "consultation" as const,
    };

    try {
      sessionStorage.setItem(CONSULTATION_CHECKOUT_KEY, JSON.stringify([checkoutItem]));
    } catch {
      // ignore storage failures; PaymentPage will simply show an empty cart
    }

    const loggedIn = Boolean(Cookies.get("token"));
    if (loggedIn) {
      router.push(PAYMENT_PATH);
    } else {
      router.push(`/Login?next=${encodeURIComponent(PAYMENT_PATH)}`);
    }
  };

  const scrollToServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToDashboard = () => router.push(DASHBOARD_CONSULTATIONS_PATH);

  const previewDoctors = doctors.slice(0, 3);

  return (
    <>
      <Topbar />
      <div className={styles.page}>
        {/* ================= HERO ================= */}
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Skip the travel</p>
            <h1 className={styles.heroTitle}>
              Book a Video Consultation with a Dermatologist
            </h1>
            <p className={styles.heroSub}>
              Private, one-on-one video consultation from home. Send a request and
              your doctor will accept it before the call begins.
            </p>

            <div className={styles.heroMeta}>
              <div className={styles.avatarStack}>
                {previewDoctors.map((doctor) => {
                  const name = getDoctorName(doctor);
                  const image = resolveMediaUrl(doctor.profileImage);
                  return (
                    <span key={doctor._id} className={styles.stackAvatar}>
                      {image ? (
                        <img src={image} alt={name} />
                      ) : (
                        getInitials(name)
                      )}
                    </span>
                  );
                })}
              </div>
              <span className={styles.heroMetaText}>
                <FiUsers />
                {loadingDoctors
                  ? "Loading doctors..."
                  : `${doctors.length} dermatologist${doctors.length === 1 ? "" : "s"} available`}
              </span>
            </div>

            <button type="button" className={styles.consultNowBtn} onClick={scrollToServices}>
              <FiVideo /> Consult Now
            </button>

            <div className={styles.trustRow}>
              <span>
                <FiShield /> Verified Doctors
              </span>
              <span>
                <FiLock /> Private &amp; Secure
              </span>
              <span>
                <FiHome /> Consult From Home
              </span>
            </div>
          </div>

          <div className={styles.heroArt}>
            <img
              src="/video-consultation-hero.png"
              alt="Patient having a video consultation with a doctor"
              className={styles.heroBannerImage}
            />
          </div>
        </section>

        {/* ================= SPECIALITIES / SERVICES ================= */}
        {!loadingServices && services.length > 0 && (
          <section className={styles.specialitiesSection} ref={servicesRef}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>{services.length}+ Services</h2>
                <p>Consult with verified doctors across specialities</p>
              </div>
            </div>

            <div className={styles.specialitiesGrid}>
              {services.map((service) => {
                const accent = accentFor(service.serviceType);
                const image = resolveMediaUrl(service.imageUrl);
                const hasOffer =
                  typeof service.offerPrice === "number" &&
                  service.offerPrice > 0 &&
                  service.offerPrice < service.consultationFee;
                const effectivePrice = hasOffer ? service.offerPrice! : service.consultationFee;
                const isPaid = paidServiceIds.has(service._id);

                return (
                  <div key={service._id} className={styles.serviceCard}>
                    <span
                      className={styles.specialityIcon}
                      style={{ background: accent.bg, color: accent.fg }}
                    >
                      {image ? <img src={image} alt={service.serviceType} /> : getInitials(service.serviceType)}
                    </span>
                    <span className={styles.specialityLabel}>{service.serviceType}</span>
                    <span className={styles.servicePrice}>
                      {hasOffer && (
                        <span className={styles.servicePriceStrike}>₹{service.consultationFee}</span>
                      )}
                      ₹{effectivePrice}
                    </span>

                    {!isPaid ? (
                      <button
                        type="button"
                        className={styles.consultNowLink}
                        onClick={() => consultNow(service)}
                      >
                        Consult now <FiArrowRight />
                      </button>
                    ) : (
                      <div className={styles.purchasedRow}>
                        <span className={styles.purchasedBadge}>
                          <FiCheckCircle /> Purchased
                        </span>
                        <button
                          type="button"
                          className={styles.dashboardLink}
                          onClick={goToDashboard}
                        >
                          Go to Dashboard <FiArrowRight />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================= HOW IT WORKS ================= */}
        <section className={styles.howItWorksSection}>
          <h2 className={styles.howItWorksTitle}>How it works</h2>
          <div className={styles.stepsRow}>
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <React.Fragment key={step.label}>
                <div className={styles.stepItem}>
                  <span className={styles.stepIcon}>{step.icon}</span>
                  <p className={styles.stepLabel}>{step.label}</p>
                </div>
                {index < HOW_IT_WORKS_STEPS.length - 1 && (
                  <span className={styles.stepConnector} />
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
}
