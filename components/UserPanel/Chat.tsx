"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  FiCalendar,
  FiMessageSquare,
  FiPhoneIncoming,
  FiSearch,
  FiSend,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { socket } from "@/utils/socket";
import { API_URL } from "@/config/api";
import WebRTCCall, { WebRTCCallSignalPayload } from "@/components/chat/WebRTCCall";
import styles from "@/styles/chat.module.css";

type ChatStatus = "pending" | "accepted" | "declined";

type Doctor = {
  _id: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  specialist?: string;
  email?: string;
  phone?: string;
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
  createdAt?: string;
};

type ChatRequest = {
  _id: string;
  status?: ChatStatus;
};

type ChatNotice = {
  type: "message" | "call";
  title: string;
  body: string;
  doctorId: string;
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

const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const UserChat = () => {
  const [userId, setUserId] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState("");
  const [chatStatus, setChatStatus] = useState<ChatStatus | "">("");
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [requestingChat, setRequestingChat] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [unreadByDoctor, setUnreadByDoctor] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<ChatNotice | null>(null);
  const [pendingIncomingCall, setPendingIncomingCall] =
    useState<WebRTCCallSignalPayload | null>(null);
  const [error, setError] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("userId") || Cookies.get("userId");
    if (id) setUserId(id);
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        setError("");
        const res = await axios.get(`${API_URL}/doctoradmin`);
        const nextDoctors = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setDoctors(nextDoctors);
      } catch (err: any) {
        setError(err?.response?.data?.msg || "Failed to load doctors.");
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const registerSocket = () => socket.emit("register", userId);
    registerSocket();

    const handleReceiveMessage = (data: ChatMessage) => {
      if (data.chatId === chatId) {
        setMessages((prev) => [...prev, data]);
        return;
      }

      if (data.messageType === "call") return;

      setUnreadByDoctor((prev) => ({
        ...prev,
        [data.senderId]: (prev[data.senderId] || 0) + 1,
      }));

      const doctor = doctors.find((item) => item._id === data.senderId);
      const doctorName = getDoctorName(doctor);
      setNotice({
        type: "message",
        title: `New message from ${doctorName}`,
        body: data.message,
        doctorId: data.senderId,
      });
    };

    const handleChatStatus = (data: { chatId: string; status: ChatStatus }) => {
      if (data.chatId === chatId) {
        setChatStatus(data.status);
        if (data.status !== "accepted") {
          setMessages([]);
        }
      }
    };

    const handleChatDeleted = (data: { chatId: string }) => {
      if (data.chatId !== chatId) return;

      setChatId("");
      setChatStatus("");
      setMessages([]);
      setError("This chat was deleted.");
    };

    const handleCallInvite = (data: WebRTCCallSignalPayload) => {
      if (data.to !== userId || data.chatId === chatId) return;

      const doctor = doctors.find((item) => item._id === data.from);
      const doctorName = getDoctorName(doctor);
      setPendingIncomingCall(data);
      setUnreadByDoctor((prev) => ({
        ...prev,
        [data.from]: Math.max(prev[data.from] || 0, 1),
      }));
      setNotice({
        type: "call",
        title: `Incoming ${data.callType} call`,
        body: doctorName,
        doctorId: data.from,
      });
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
  }, [userId, chatId, doctors]);

  useEffect(() => {
    const messagePanel = messagesRef.current;
    if (!messagePanel) return;
    messagePanel.scrollTop = messagePanel.scrollHeight;
  }, [messages]);

  const filteredDoctors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return doctors;

    return doctors.filter((doctor) =>
      [
        getDoctorName(doctor),
        doctor.specialist,
        doctor.email,
        doctor.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [doctors, search]);

  const loadMessages = async (nextChatId: string) => {
    const messageRes = await axios.get(`${API_URL}/message/${nextChatId}`);
    setMessages(Array.isArray(messageRes.data) ? messageRes.data : []);
  };

  const openChat = async (doctor: Doctor) => {
    if (!userId) {
      setError("Please login to start a chat.");
      return;
    }

    try {
      setActiveDoctor(doctor);
      setUnreadByDoctor((prev) => {
        const next = { ...prev };
        delete next[doctor._id];
        return next;
      });
      if (notice?.doctorId === doctor._id) setNotice(null);
      setLoadingMessages(true);
      setError("");

      const chatRes = await axios.get<ChatRequest | null>(
        `${API_URL}/chat/user/${userId}/doctor/${doctor._id}`
      );

      const nextChatId = chatRes.data?._id || "";
      const nextStatus = chatRes.data?.status || "";
      setChatId(nextChatId);
      setChatStatus(nextStatus);

      if (!nextChatId || nextStatus !== "accepted") {
        setMessages([]);
        return;
      }

      await loadMessages(nextChatId);
    } catch (err: any) {
      setMessages([]);
      setError(err?.response?.data?.error || "Failed to open chat.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const requestAppointment = async () => {
    if (!activeDoctor || !userId) return;

    try {
      setRequestingChat(true);
      setError("");

      const chatRes = await axios.post<ChatRequest>(`${API_URL}/chat`, {
        doctorId: activeDoctor._id,
        userId,
      });

      const nextChatId = chatRes.data?._id || "";
      const nextStatus = chatRes.data?.status || "pending";
      setChatId(nextChatId);
      setChatStatus(nextStatus);
      setMessages([]);

      socket.emit("chat_request_created", {
        chatId: nextChatId,
        doctorId: activeDoctor._id,
        userId,
        status: nextStatus,
      });

      if (nextChatId && nextStatus === "accepted") {
        await loadMessages(nextChatId);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not send appointment request.");
    } finally {
      setRequestingChat(false);
    }
  };

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !chatId || !activeDoctor || chatStatus !== "accepted") return;

    const payload: ChatMessage = {
      chatId,
      senderId: userId,
      receiverId: activeDoctor._id,
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
      setError(err?.response?.data?.error || "Message could not be sent. Please try again.");
    }
  };

  const deleteChat = async () => {
    if (!chatId || !activeDoctor || deletingChat) return;
    if (!window.confirm("Delete this chat and all its messages?")) return;

    try {
      setDeletingChat(true);
      setError("");
      await axios.delete(`${API_URL}/chat/${chatId}`, {
        data: {
          userId,
          doctorId: activeDoctor._id,
        },
      });

      socket.emit("chat_deleted", {
        chatId,
        from: userId,
        to: activeDoctor._id,
      });

      setChatId("");
      setChatStatus("");
      setMessages([]);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not delete this chat.");
    } finally {
      setDeletingChat(false);
    }
  };

  const openNotice = () => {
    if (!notice) return;
    const doctor = doctors.find((item) => item._id === notice.doctorId);
    if (doctor) {
      openChat(doctor);
    }
  };

  const activeDoctorName = getDoctorName(activeDoctor);
  const canChat = chatStatus === "accepted";

  if (!userId) {
    return (
      <div className={styles.emptyPanel}>
        <FiMessageSquare />
        <h3>Login required</h3>
        <p>Please login to chat with a doctor.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div>
            <p>Care Team</p>
            <h3>Doctors</h3>
          </div>
          <span>{filteredDoctors.length}</span>
        </div>

        <div className={styles.searchBox}>
          <FiSearch />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search doctors"
          />
        </div>

        <div className={styles.chatList}>
          {loadingDoctors ? (
            <div className={styles.listState}>Loading doctors...</div>
          ) : error && doctors.length === 0 ? (
            <div className={styles.listState}>{error}</div>
          ) : filteredDoctors.length === 0 ? (
            <div className={styles.listState}>No doctors found.</div>
          ) : (
            filteredDoctors.map((doctor) => {
              const doctorName = getDoctorName(doctor);

              return (
                <button
                  key={doctor._id}
                  type="button"
                  onClick={() => openChat(doctor)}
                  className={`${styles.chatItem} ${
                    activeDoctor?._id === doctor._id ? styles.active : ""
                  }`}
                >
                  <span className={styles.avatarWrap}>
                    <span className={styles.avatar}>{getInitials(doctorName)}</span>
                    {unreadByDoctor[doctor._id] ? (
                      <span className={styles.unreadBadge}>{unreadByDoctor[doctor._id]}</span>
                    ) : null}
                  </span>
                  <span className={styles.chatMeta}>
                    <span className={styles.chatName}>{doctorName}</span>
                    <span className={styles.chatPreview}>
                      {doctor.specialist || doctor.email || "Available for consultation"}
                    </span>
                  </span>
                  <span className={styles.chatTime}>
                    {activeDoctor?._id === doctor._id && canChat ? "Chat" : "Select"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className={styles.chatArea}>
        {notice ? (
          <button type="button" className={styles.chatNotice} onClick={openNotice}>
            {notice.type === "call" ? <FiPhoneIncoming /> : <FiMessageSquare />}
            <span>
              <strong>{notice.title}</strong>
              <small>{notice.body}</small>
            </span>
          </button>
        ) : null}
        {activeDoctor ? (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.headerIdentity}>
                <span className={styles.headerAvatar}>{getInitials(activeDoctorName)}</span>
                <div>
                  <h3>{activeDoctorName}</h3>
                  <p>
                    {activeDoctor.specialist
                      ? `${activeDoctor.specialist}${activeDoctor.phone ? ` | +91 ${activeDoctor.phone}` : ""}`
                      : activeDoctor.email || "Doctor conversation"}
                  </p>
                </div>
              </div>
              <div className={styles.headerActions}>
                <WebRTCCall
                  chatId={chatId}
                  currentUserId={userId}
                  peerId={activeDoctor._id}
                  peerName={activeDoctorName}
                  canCall={canChat}
                  externalIncomingCall={
                    pendingIncomingCall?.chatId === chatId ? pendingIncomingCall : null
                  }
                  onExternalIncomingHandled={() => {
                    setPendingIncomingCall(null);
                    setNotice(null);
                  }}
                />
                {chatId ? (
                  <button
                    type="button"
                    className={styles.deleteChatBtn}
                    onClick={deleteChat}
                    disabled={deletingChat}
                    title="Delete chat"
                  >
                    <FiTrash2 />
                  </button>
                ) : null}
              </div>
            </div>

            <div className={styles.messages} ref={messagesRef}>
              {loadingMessages ? (
                <div className={styles.messageState}>Loading messages...</div>
              ) : !chatStatus ? (
                <div className={styles.messageState}>
                  <FiCalendar />
                  <h3>Request appointment</h3>
                  <p>Send an appointment request to {activeDoctorName} before starting chat.</p>
                  <button
                    type="button"
                    className={styles.appointmentBtn}
                    onClick={requestAppointment}
                    disabled={requestingChat}
                  >
                    {requestingChat ? "Sending request..." : "Send appointment request"}
                  </button>
                </div>
              ) : chatStatus === "pending" ? (
                <div className={styles.messageState}>
                  Chat request sent to {activeDoctorName}. You can message after the doctor accepts.
                </div>
              ) : chatStatus === "declined" ? (
                <div className={styles.messageState}>
                  {activeDoctorName} has declined your chat request.
                  <button
                    type="button"
                    className={styles.appointmentBtn}
                    onClick={requestAppointment}
                    disabled={requestingChat}
                  >
                    {requestingChat ? "Sending request..." : "Send request again"}
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className={styles.messageState}>
                  Start your conversation with {activeDoctorName}.
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.senderId === userId;
                  if (msg.messageType === "call") {
                    return (
                      <div
                        key={msg._id || `${msg.chatId}-${index}`}
                        className={styles.callMessageRow}
                      >
                        <div className={styles.callMessage}>
                          <p>
                            {isMe ? "You started" : `${activeDoctorName} started`} a{" "}
                            {msg.callType || "video"} call
                          </p>
                          <span>{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg._id || `${msg.chatId}-${index}`}
                      className={`${styles.msgRow} ${isMe ? styles.right : styles.left}`}
                    >
                      <div className={`${styles.bubble} ${isMe ? styles.me : styles.other}`}>
                        <p>{msg.message}</p>
                        <span>{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className={styles.inputBar}>
              <input
                className={styles.input}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={`Message ${activeDoctorName}`}
                disabled={!canChat}
              />
              <button
                type="button"
                className={styles.sendBtn}
                onClick={sendMessage}
                disabled={!text.trim() || !canChat}
              >
                <FiSend />
                {canChat ? "Send" : "Waiting"}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.emptyPanel}>
            <FiUser />
            <h3>Select a doctor</h3>
            <p>Choose a doctor from the left to start or continue a chat.</p>
          </div>
        )}
      </section>
    </div>
  );
};
export default UserChat;
