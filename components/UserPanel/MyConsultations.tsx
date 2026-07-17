"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  FiVideo,
  FiX,
  FiClock,
  FiXCircle,
  FiSend,
  FiTrash2,
  FiPaperclip,
  FiFileText,
} from "react-icons/fi";
import { socket } from "@/utils/socket";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import WebRTCCall, { WebRTCCallSignalPayload } from "@/components/chat/WebRTCCall";
import styles from "@/styles/userpanel/myconsultations.module.css";
import chatStyles from "@/styles/chat.module.css";

type ChatStatus = "pending" | "accepted" | "declined";

type Doctor = {
  _id: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  specialist?: string;
  email?: string;
  profileImage?: string;
};

type ConsultationService = {
  _id: string;
  serviceType: string;
  imageUrl?: string;
  consultationFee: number;
  offerPrice?: number;
  doctors?: Doctor[];
  nextAvailableSlot?: string;
};

type ChatRequest = {
  _id: string;
  status?: ChatStatus;
};

type ChatMessage = {
  _id?: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType?: "text" | "call";
  callType?: "audio" | "video";
  callStatus?: "started" | "missed" | "ended";
  attachmentUrl?: string;
  attachmentType?: "image" | "pdf";
  attachmentName?: string;
  createdAt?: string;
};

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

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

const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function MyConsultations() {
  const [userId, setUserId] = useState("");
  const [services, setServices] = useState<ConsultationService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    const id = localStorage.getItem("userId") || Cookies.get("userId");
    if (token && id) setUserId(id);
  }, []);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      setServices([]);
      setLoading(false);
      return;
    }

    const fetchMyConsultations = async () => {
      try {
        setLoading(true);
        setError("");

        // Purchased service ids are resolved server-side from the verified
        // JWT — never from a client-supplied user id.
        const accessRes = await axios.get(`${API_URL}/orders/my/consultation-access`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const serviceIds: string[] = Array.isArray(accessRes.data?.serviceIds)
          ? accessRes.data.serviceIds
          : [];

        if (serviceIds.length === 0) {
          setServices([]);
          return;
        }

        const catalogRes = await axios.get(`${API_URL}/online-consultation-services`);
        const catalog: ConsultationService[] = Array.isArray(catalogRes.data)
          ? catalogRes.data
          : [];
        const idSet = new Set(serviceIds);
        setServices(catalog.filter((service) => idSet.has(service._id)));
      } catch {
        setError("Failed to load your consultations.");
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyConsultations();
  }, []);

  // Live presence: ask for the current state, then stay updated as doctors connect/disconnect.
  useEffect(() => {
    const doctorIds = Array.from(
      new Set(services.flatMap((service) => (service.doctors || []).map((d) => d._id)))
    );
    if (doctorIds.length === 0) return;

    doctorIds.forEach((id) => {
      socket.emit("check_online", id, (online: boolean) => {
        setOnlineMap((prev) => ({ ...prev, [id]: online }));
      });
    });

    const handleOnline = (data: { id: string }) => {
      if (doctorIds.includes(data.id)) setOnlineMap((prev) => ({ ...prev, [data.id]: true }));
    };
    const handleOffline = (data: { id: string }) => {
      if (doctorIds.includes(data.id)) setOnlineMap((prev) => ({ ...prev, [data.id]: false }));
    };

    socket.on("presence_online", handleOnline);
    socket.on("presence_offline", handleOffline);

    return () => {
      socket.off("presence_online", handleOnline);
      socket.off("presence_offline", handleOffline);
    };
  }, [services]);

  // Socket: register identity, and keep the open booking's status live.
  useEffect(() => {
    if (!userId) return;

    const registerSocket = () => socket.emit("register", userId);
    registerSocket();

    const handleReceiveMessage = (data: ChatMessage) => {
      if (data.chatId === chatId) setMessages((prev) => [...prev, data]);
    };

    const handleChatStatus = (data: { chatId: string; status: ChatStatus }) => {
      if (data.chatId !== chatId) return;
      setChatStatus(data.status);
      if (data.status === "accepted") loadMessages(chatId);
    };

    const handleChatDeleted = (data: { chatId: string }) => {
      if (data.chatId !== chatId) return;
      setChatId("");
      setChatStatus("");
      setMessages([]);
    };

    const handleCallInvite = (data: WebRTCCallSignalPayload) => {
      if (data.to !== userId) return;
      setPendingIncomingCall(data);
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("chat_status_updated", handleChatStatus);
    socket.on("chat_deleted", handleChatDeleted);
    socket.on("call:invite", handleCallInvite);
    socket.on("connect", registerSocket);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("chat_status_updated", handleChatStatus);
      socket.off("chat_deleted", handleChatDeleted);
      socket.off("call:invite", handleCallInvite);
      socket.off("connect", registerSocket);
    };
  }, [userId, chatId]);

  useEffect(() => {
    const panel = messagesRef.current;
    if (!panel) return;
    panel.scrollTop = panel.scrollHeight;
  }, [messages]);

  const loadMessages = async (nextChatId: string) => {
    try {
      setLoadingMessages(true);
      const res = await axios.get(`${API_URL}/message/${nextChatId}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const openBooking = async (doctor: Doctor) => {
    setBookingDoctor(doctor);
    setBookingError("");
    setChatId("");
    setChatStatus("");
    setMessages([]);

    if (!userId) return;

    try {
      setLoadingBooking(true);
      const res = await axios.get<ChatRequest | null>(
        `${API_URL}/chat/user/${userId}/doctor/${doctor._id}`
      );
      const nextChatId = res.data?._id || "";
      const nextStatus = res.data?.status || "";
      setChatId(nextChatId);
      setChatStatus(nextStatus);

      if (nextChatId && nextStatus === "accepted") {
        await loadMessages(nextChatId);
      }
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
    setMessages([]);
    setText("");
  };

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !chatId || !bookingDoctor || chatStatus !== "accepted") return;

    const payload: ChatMessage = {
      chatId,
      senderId: userId,
      receiverId: bookingDoctor._id,
      message: trimmed,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await axios.post(`${API_URL}/message/send`, payload);
      const savedMessage = res.data || payload;
      socket.emit("send_message", savedMessage);
      setMessages((prev) => [...prev, savedMessage]);
      setText("");
    } catch (err: any) {
      setBookingError(err?.response?.data?.error || "Message could not be sent. Please try again.");
    }
  };

  const handleAttachClick = () => {
    if (chatStatus === "accepted" && !uploadingAttachment) fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !chatId || !bookingDoctor) return;

    const isSupported = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!isSupported) {
      setBookingError("Only image or PDF files can be attached.");
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setBookingError("Attachments must be 5MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", chatId);
    formData.append("senderId", userId);
    formData.append("receiverId", bookingDoctor._id);

    try {
      setUploadingAttachment(true);
      setBookingError("");
      const res = await axios.post(`${API_URL}/message/send-attachment`, formData);
      const savedMessage = res.data;
      socket.emit("send_message", savedMessage);
      setMessages((prev) => [...prev, savedMessage]);
    } catch (err: any) {
      setBookingError(err?.response?.data?.error || "Could not send the attachment.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const deleteChat = async () => {
    if (!chatId || !bookingDoctor || deletingChat) return;
    if (!window.confirm("Delete this conversation and all its messages?")) return;

    try {
      setDeletingChat(true);
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
      setMessages([]);
    } catch (err: any) {
      setBookingError(err?.response?.data?.error || "Could not delete this conversation.");
    } finally {
      setDeletingChat(false);
    }
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

  if (!userId) {
    return (
      <div className={styles.emptyState}>
        <FiVideo />
        <h3>Login required</h3>
        <p>Please login to view your consultations.</p>
      </div>
    );
  }

  if (loading) {
    return <div className={styles.stateText}>Loading your consultations...</div>;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h2>My Consultations</h2>
          <p>Video consultations you have purchased</p>
        </div>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      {services.length === 0 ? (
        <div className={styles.emptyState}>
          <FiVideo />
          <h3>No consultations yet</h3>
          <p>Book a video consultation service to see it here.</p>
          <a href="/video-consultation" className={styles.browseBtn}>
            Browse consultation services
          </a>
        </div>
      ) : (
        <div className={styles.grid}>
          {services.map((service) => {
            const assignedDoctors = service.doctors || [];
            const hasSlot = Boolean(service.nextAvailableSlot);
            const canConnect = assignedDoctors.length > 0 && hasSlot;
            const effectivePrice =
              typeof service.offerPrice === "number" && service.offerPrice > 0
                ? service.offerPrice
                : service.consultationFee;
            const image = resolveMediaUrl(service.imageUrl);
            const primaryDoctor = assignedDoctors[0];
            const anyOnline = assignedDoctors.some((doctor) => onlineMap[doctor._id]);

            return (
              <button
                key={service._id}
                type="button"
                className={styles.card}
                onClick={() => canConnect && connectToService(service)}
                disabled={!canConnect}
              >
                <div className={styles.cardTop}>
                  <span className={styles.serviceIcon}>
                    {image ? (
                      <img src={image} alt={service.serviceType} />
                    ) : (
                      service.serviceType.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className={styles.cardTopInfo}>
                    <h3>{service.serviceType}</h3>
                    <span className={styles.paidTag}>Paid ₹{effectivePrice}</span>
                  </div>
                </div>

                {primaryDoctor ? (
                  <div className={styles.doctorRow}>
                    <span className={styles.doctorAvatar}>
                      {resolveMediaUrl(primaryDoctor.profileImage) ? (
                        <img
                          src={resolveMediaUrl(primaryDoctor.profileImage) as string}
                          alt=""
                        />
                      ) : (
                        getInitials(getDoctorName(primaryDoctor))
                      )}
                    </span>
                    <span className={styles.doctorInfo}>
                      <span className={styles.doctorName}>
                        {getDoctorName(primaryDoctor)}
                        {assignedDoctors.length > 1 ? ` +${assignedDoctors.length - 1}` : ""}
                      </span>
                      <span className={styles.doctorSpecialist}>
                        {primaryDoctor.specialist || "General Physician"}
                      </span>
                    </span>
                    <span
                      className={`${styles.presenceBadge} ${
                        anyOnline ? styles.presenceOnline : styles.presenceOffline
                      }`}
                    >
                      <i />
                      {anyOnline ? "Available now" : "Offline"}
                    </span>
                  </div>
                ) : (
                  <div className={styles.doctorRow}>
                    <span className={styles.doctorSpecialist}>Doctor not assigned yet</span>
                  </div>
                )}

                <div className={styles.cardFooter}>
                  <span className={styles.slotText}>
                    <FiClock />
                    {hasSlot ? `Next slot: ${service.nextAvailableSlot}` : "No slots available"}
                  </span>
                  <span className={styles.connectCta}>
                    <FiVideo /> {canConnect ? "Connect Now" : "Unavailable"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

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

      {/* ================= CHAT + CALL WINDOW (WhatsApp-style) ================= */}
      {bookingDoctor && (
        <div className={styles.modalOverlay} onClick={closeBooking}>
          <div className={styles.chatWindow} onClick={(event) => event.stopPropagation()}>
            <div className={chatStyles.chatHeader}>
              <div className={chatStyles.headerIdentity}>
                <span className={chatStyles.headerAvatar}>
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
                  <p>
                    {bookingDoctor.specialist || "General Physician"}
                    {" · "}
                    <span
                      className={
                        onlineMap[bookingDoctor._id]
                          ? styles.presenceTextOnline
                          : styles.presenceTextOffline
                      }
                    >
                      {onlineMap[bookingDoctor._id] ? "Online" : "Offline"}
                    </span>
                  </p>
                </div>
              </div>
              <div className={chatStyles.headerActions}>
                <WebRTCCall
                  chatId={chatId}
                  currentUserId={userId}
                  peerId={bookingDoctor._id}
                  peerName={bookingDoctorName}
                  canCall={chatStatus === "accepted"}
                  externalIncomingCall={
                    pendingIncomingCall?.chatId === chatId ? pendingIncomingCall : null
                  }
                  onExternalIncomingHandled={() => setPendingIncomingCall(null)}
                />
                {chatId ? (
                  <button
                    type="button"
                    className={chatStyles.deleteChatBtn}
                    onClick={deleteChat}
                    disabled={deletingChat}
                    title="Delete conversation"
                  >
                    <FiTrash2 />
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.closeChatBtn}
                  onClick={closeBooking}
                  title="Close"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className={chatStyles.messages} ref={messagesRef}>
              {loadingBooking || loadingMessages ? (
                <div className={chatStyles.messageState}>Loading conversation...</div>
              ) : !chatStatus ? (
                <div className={chatStyles.messageState}>
                  <FiVideo />
                  <h3>Start your consultation</h3>
                  <p>
                    Send a request to {bookingDoctorName}. Once accepted, you can chat and
                    start an audio or video call right here.
                  </p>
                  <button
                    type="button"
                    className={chatStyles.appointmentBtn}
                    onClick={sendBookingRequest}
                    disabled={requesting}
                  >
                    {requesting ? "Sending request..." : "Request Video Consultation"}
                  </button>
                </div>
              ) : chatStatus === "pending" ? (
                <div className={chatStyles.messageState}>
                  <FiClock />
                  <h3>Request sent</h3>
                  <p>
                    Request sent to {bookingDoctorName}. You will be notified as soon as the
                    doctor accepts.
                  </p>
                  <button
                    type="button"
                    className={chatStyles.appointmentBtn}
                    onClick={cancelBookingRequest}
                    disabled={cancelling}
                  >
                    {cancelling ? "Cancelling..." : "Cancel Request"}
                  </button>
                </div>
              ) : chatStatus === "declined" ? (
                <div className={chatStyles.messageState}>
                  <FiXCircle />
                  <h3>Request declined</h3>
                  <p>{bookingDoctorName} is unavailable for this request right now.</p>
                  <button
                    type="button"
                    className={chatStyles.appointmentBtn}
                    onClick={sendBookingRequest}
                    disabled={requesting}
                  >
                    {requesting ? "Sending request..." : "Send Request Again"}
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className={chatStyles.messageState}>
                  Start your conversation with {bookingDoctorName}.
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.senderId === userId;

                  if (msg.messageType === "call") {
                    return (
                      <div
                        key={msg._id || `${msg.chatId}-${index}`}
                        className={chatStyles.callMessageRow}
                      >
                        <div className={chatStyles.callMessage}>
                          <p>
                            {isMe ? "You started" : `${bookingDoctorName} started`} a{" "}
                            {msg.callType || "video"} call
                          </p>
                          <span>{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  }

                  const imageUrl =
                    msg.attachmentType === "image" ? resolveMediaUrl(msg.attachmentUrl) : null;
                  const fileUrl =
                    msg.attachmentType === "pdf" ? resolveMediaUrl(msg.attachmentUrl) : null;

                  return (
                    <div
                      key={msg._id || `${msg.chatId}-${index}`}
                      className={`${chatStyles.msgRow} ${isMe ? chatStyles.right : chatStyles.left}`}
                    >
                      <div className={`${chatStyles.bubble} ${isMe ? chatStyles.me : chatStyles.other}`}>
                        {imageUrl ? (
                          <a href={imageUrl} target="_blank" rel="noreferrer">
                            <img
                              src={imageUrl}
                              alt={msg.attachmentName || "Attachment"}
                              className={chatStyles.attachmentImage}
                            />
                          </a>
                        ) : fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={chatStyles.attachmentFile}
                          >
                            <FiFileText />
                            <span>{msg.attachmentName || "Document.pdf"}</span>
                          </a>
                        ) : null}
                        {msg.message ? <p>{msg.message}</p> : null}
                        <span>{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={chatStyles.inputBar}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelected}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className={chatStyles.attachBtn}
                onClick={handleAttachClick}
                disabled={chatStatus !== "accepted" || uploadingAttachment}
                title="Attach image or PDF"
              >
                <FiPaperclip />
              </button>
              <input
                className={chatStyles.input}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  uploadingAttachment ? "Sending attachment..." : `Message ${bookingDoctorName}`
                }
                disabled={chatStatus !== "accepted" || uploadingAttachment}
              />
              <button
                type="button"
                className={chatStyles.sendBtn}
                onClick={sendMessage}
                disabled={!text.trim() || chatStatus !== "accepted"}
              >
                <FiSend />
                {chatStatus === "accepted" ? "Send" : "Waiting"}
              </button>
            </div>

            {bookingError && <p className={styles.modalError}>{bookingError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
