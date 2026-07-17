"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import {
  FiVideo,
  FiSearch,
  FiX,
  FiShield,
  FiHome,
  FiLock,
  FiClock,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiMic,
  FiPhoneOff,
  FiFileText,
  FiArrowRight,
} from "react-icons/fi";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import { socket } from "@/utils/socket";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import WebRTCCall, { WebRTCCallSignalPayload } from "@/components/chat/WebRTCCall";
import styles from "@/styles/videoConsultation.module.css";

const CONSULTATION_CHECKOUT_KEY = "consultationCheckout";
const PAYMENT_PATH = "/home/PaymentPage?flow=consultation";

type ChatStatus = "pending" | "accepted" | "declined";

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

type ChatRequest = {
  _id: string;
  status?: ChatStatus;
};

type ConsultationOrder = {
  products?: { id: string; itemType?: string }[];
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

  const [connectPickerService, setConnectPickerService] =
    useState<ConsultationService | null>(null);

  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [chatId, setChatId] = useState("");
  const [chatStatus, setChatStatus] = useState<ChatStatus | "">("");
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [pendingIncomingCall, setPendingIncomingCall] =
    useState<WebRTCCallSignalPayload | null>(null);

  const servicesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("userId") || Cookies.get("userId");
    if (id) setUserId(id);
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
    if (!userId) {
      setPaidServiceIds(new Set());
      return;
    }

    const fetchPaidServices = async () => {
      try {
        const res = await axios.get(`${API_URL}/orders/my`, {
          params: { orderType: "consultation" },
          headers: { "x-user-id": userId },
        });
        const orders: ConsultationOrder[] = Array.isArray(res.data) ? res.data : [];
        const ids = new Set<string>();
        orders.forEach((order) => {
          (order.products || []).forEach((product) => {
            if (product.itemType === "consultation" && product.id) ids.add(product.id);
          });
        });
        setPaidServiceIds(ids);
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

  // Socket: register identity, and keep the open booking's status live.
  useEffect(() => {
    if (!userId) return;

    const registerSocket = () => socket.emit("register", userId);
    registerSocket();

    const handleChatStatus = (data: { chatId: string; status: ChatStatus }) => {
      if (data.chatId === chatId) setChatStatus(data.status);
    };

    const handleChatDeleted = (data: { chatId: string }) => {
      if (data.chatId !== chatId) return;
      setChatId("");
      setChatStatus("");
    };

    const handleCallInvite = (data: WebRTCCallSignalPayload) => {
      if (data.to !== userId) return;
      setPendingIncomingCall(data);
    };

    socket.on("chat_status_updated", handleChatStatus);
    socket.on("chat_deleted", handleChatDeleted);
    socket.on("call:invite", handleCallInvite);
    socket.on("connect", registerSocket);

    return () => {
      socket.off("chat_status_updated", handleChatStatus);
      socket.off("chat_deleted", handleChatDeleted);
      socket.off("call:invite", handleCallInvite);
      socket.off("connect", registerSocket);
    };
  }, [userId, chatId]);

  const scrollToServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openBooking = async (doctor: Doctor) => {
    setBookingDoctor(doctor);
    setBookingError("");
    setChatId("");
    setChatStatus("");

    if (!userId) return;

    try {
      setLoadingBooking(true);
      const res = await axios.get<ChatRequest | null>(
        `${API_URL}/chat/user/${userId}/doctor/${doctor._id}`
      );
      setChatId(res.data?._id || "");
      setChatStatus(res.data?.status || "");
    } catch (err: any) {
      setBookingError(err?.response?.data?.error || "Failed to load booking status.");
    } finally {
      setLoadingBooking(false);
    }
  };

  const closeBooking = () => {
    setBookingDoctor(null);
    setChatId("");
    setChatStatus("");
    setBookingError("");
  };

  const connectToService = (service: ConsultationService) => {
    const assignedDoctors = service.doctors || [];
    if (assignedDoctors.length === 0) return;
    if (assignedDoctors.length === 1) {
      openBooking(assignedDoctors[0]);
      return;
    }
    setConnectPickerService(service);
  };

  const closeConnectPicker = () => setConnectPickerService(null);

  const sendBookingRequest = async () => {
    if (!bookingDoctor || !userId) return;

    try {
      setRequesting(true);
      setBookingError("");

      const res = await axios.post<ChatRequest>(`${API_URL}/chat`, {
        doctorId: bookingDoctor._id,
        userId,
      });

      const nextChatId = res.data?._id || "";
      const nextStatus = res.data?.status || "pending";
      setChatId(nextChatId);
      setChatStatus(nextStatus);

      socket.emit("chat_request_created", {
        chatId: nextChatId,
        doctorId: bookingDoctor._id,
        userId,
        status: nextStatus,
      });
    } catch (err: any) {
      setBookingError(err?.response?.data?.error || "Could not send the request. Please try again.");
    } finally {
      setRequesting(false);
    }
  };

  const cancelBookingRequest = async () => {
    if (!chatId || !bookingDoctor || cancelling) return;

    try {
      setCancelling(true);
      setBookingError("");
      await axios.delete(`${API_URL}/chat/${chatId}`, {
        data: { userId, doctorId: bookingDoctor._id },
      });

      socket.emit("chat_deleted", {
        chatId,
        from: userId,
        to: bookingDoctor._id,
      });

      setChatId("");
      setChatStatus("");
    } catch (err: any) {
      setBookingError(err?.response?.data?.error || "Could not cancel the request.");
    } finally {
      setCancelling(false);
    }
  };

  const bookingDoctorName = getDoctorName(bookingDoctor);
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
            <div className={styles.heroArtBlobOne} />
            <div className={styles.heroArtBlobTwo} />

            <div className={styles.phoneMock}>
              <div className={styles.phoneNotch} />
              <div className={styles.phoneScreen}>
                <div className={styles.phoneCallTop}>
                  <span className={styles.phoneLiveDot} />
                  <span className={styles.phoneDoctorName}>Video Consultation</span>
                  <span className={styles.phoneCallTimer}>02:14</span>
                </div>

                <div className={styles.phoneMainAvatar}>
                  {previewDoctors[0] && resolveMediaUrl(previewDoctors[0].profileImage) ? (
                    <img
                      src={resolveMediaUrl(previewDoctors[0].profileImage) as string}
                      alt=""
                    />
                  ) : (
                    <FiUser />
                  )}
                </div>

                <div className={styles.phoneSelfPreview}>
                  <FiUser />
                </div>

                <div className={styles.phoneCallControls}>
                  <span className={styles.phoneControlBtn}>
                    <FiMic />
                  </span>
                  <span className={`${styles.phoneControlBtn} ${styles.phoneControlEnd}`}>
                    <FiPhoneOff />
                  </span>
                  <span className={styles.phoneControlBtn}>
                    <FiVideo />
                  </span>
                </div>
              </div>
            </div>
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
                const assignedDoctors = service.doctors || [];
                const hasSlot = Boolean(service.nextAvailableSlot);

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
                    ) : assignedDoctors.length === 0 ? (
                      <span className={styles.serviceUnavailable}>Doctor not assigned yet</span>
                    ) : !hasSlot ? (
                      <span className={styles.serviceUnavailable}>No slots available</span>
                    ) : (
                      <button
                        type="button"
                        className={styles.consultNowLink}
                        onClick={() => connectToService(service)}
                      >
                        Connect now <FiArrowRight />
                      </button>
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

      {/* ================= DOCTOR PICKER MODAL (multiple doctors on one service) ================= */}
      {connectPickerService && (
        <div className={styles.modalOverlay} onClick={closeConnectPicker}>
          <div className={styles.modalPanel} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={closeConnectPicker}>
              <FiX />
            </button>

            <div className={styles.modalHeader}>
              <div>
                <h3>{connectPickerService.serviceType}</h3>
                <p>Choose a doctor to connect with</p>
              </div>
            </div>

            <div className={styles.doctorPickerList}>
              {(connectPickerService.doctors || []).map((doctor) => {
                const name = getDoctorName(doctor);
                const image = resolveMediaUrl(doctor.profileImage);
                return (
                  <button
                    key={doctor._id}
                    type="button"
                    className={styles.doctorPickerRow}
                    onClick={() => {
                      closeConnectPicker();
                      openBooking(doctor);
                    }}
                  >
                    <span className={styles.doctorPickerAvatar}>
                      {image ? <img src={image} alt={name} /> : getInitials(name)}
                    </span>
                    <span>
                      <span className={styles.doctorPickerName}>{name}</span>
                      <span className={styles.doctorPickerSpecialist}>
                        {doctor.specialist || "General Physician"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= BOOKING MODAL ================= */}
      {bookingDoctor && (
        <div className={styles.modalOverlay} onClick={closeBooking}>
          <div className={styles.modalPanel} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={closeBooking}>
              <FiX />
            </button>

            <div className={styles.modalHeader}>
              <span className={styles.modalAvatar}>
                {resolveMediaUrl(bookingDoctor.profileImage) ? (
                  <img
                    src={resolveMediaUrl(bookingDoctor.profileImage) as string}
                    alt={bookingDoctorName}
                  />
                ) : (
                  getInitials(bookingDoctorName)
                )}
              </span>
              <div>
                <h3>{bookingDoctorName}</h3>
                <p>{bookingDoctor.specialist || "General Physician"}</p>
              </div>
            </div>

            {!userId ? (
              <p className={styles.modalState}>Please login to book a video consultation.</p>
            ) : loadingBooking ? (
              <p className={styles.modalState}>Checking booking status...</p>
            ) : !chatStatus ? (
              <div className={styles.modalState}>
                <FiVideo className={styles.modalStateIcon} />
                <p>
                  Send a request to {bookingDoctorName}. Once accepted, you can start a
                  private video call right here.
                </p>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={sendBookingRequest}
                  disabled={requesting}
                >
                  {requesting ? "Sending request..." : "Request Video Consultation"}
                </button>
              </div>
            ) : chatStatus === "pending" ? (
              <div className={styles.modalState}>
                <FiClock className={styles.modalStateIcon} />
                <p>
                  Request sent to {bookingDoctorName}. You'll be notified as soon as the
                  doctor accepts.
                </p>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={cancelBookingRequest}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling..." : "Cancel Request"}
                </button>
              </div>
            ) : chatStatus === "declined" ? (
              <div className={styles.modalState}>
                <FiXCircle className={styles.modalStateIcon} />
                <p>{bookingDoctorName} is unavailable for this request right now.</p>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={sendBookingRequest}
                  disabled={requesting}
                >
                  {requesting ? "Sending request..." : "Send Request Again"}
                </button>
              </div>
            ) : (
              <div className={styles.callSection}>
                <p className={styles.callReadyText}>
                  <FiCheckCircle /> {bookingDoctorName} accepted your request — start your
                  video consultation below.
                </p>
                <WebRTCCall
                  chatId={chatId}
                  currentUserId={userId}
                  peerId={bookingDoctor._id}
                  peerName={bookingDoctorName}
                  canCall
                  externalIncomingCall={
                    pendingIncomingCall?.chatId === chatId ? pendingIncomingCall : null
                  }
                  onExternalIncomingHandled={() => setPendingIncomingCall(null)}
                />
              </div>
            )}

            {bookingError && <p className={styles.modalError}>{bookingError}</p>}
          </div>
        </div>
      )}
    </>
  );
}
