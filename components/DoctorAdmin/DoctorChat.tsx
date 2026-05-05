"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { FiMessageSquare, FiSearch, FiSend, FiUser } from "react-icons/fi";
import { socket } from "@/utils/socket";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import WebRTCCall from "@/components/chat/WebRTCCall";
import styles from "@/styles/chat.module.css";

type ChatStatus = "pending" | "accepted" | "declined";

type ChatUser = {
  _id?: string;
  name?: string;
  email?: string;
  contactNo?: string;
  profileImage?: string;
  patientId?: string;
};

type ChatThread = {
  _id: string;
  user?: ChatUser | null;
  lastMessage?: string;
  status?: ChatStatus;
  requestedAt?: string;
  respondedAt?: string;
  updatedAt?: string;
};

type ChatMessage = {
  _id?: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt?: string;
};

const getPatientName = (chat?: ChatThread | null) =>
  chat?.user?.name?.trim() ||
  chat?.user?.email?.split("@")[0] ||
  chat?.user?.contactNo ||
  "Patient";

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "P";

const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const DoctorChat = () => {
  const [doctorId, setDoctorId] = useState("");
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [activeChat, setActiveChat] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("doctorId") || Cookies.get("doctorId");
    if (id) setDoctorId(id);
  }, []);

  const fetchChats = useCallback(async () => {
    if (!doctorId) return;

    try {
      setLoadingChats(true);
      setError("");
      const res = await axios.get(`${API_URL}/chat/doctor/${doctorId}`);
      const nextChats = Array.isArray(res.data) ? res.data : [];
      setChats(nextChats);
      setActiveChat((current) => {
        if (!current) return nextChats[0] || null;
        return nextChats.find((chat: ChatThread) => chat._id === current._id) || current;
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load patient chats.");
    } finally {
      setLoadingChats(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (!doctorId) return;

    socket.emit("register", doctorId);

    const handleChatRequest = () => {
      fetchChats();
    };

    const handleReceiveMessage = (data: ChatMessage) => {
      if (data.chatId === activeChat?._id) {
        setMessages((prev) => [...prev, data]);
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat._id === data.chatId
            ? { ...chat, lastMessage: data.message, updatedAt: new Date().toISOString() }
            : chat
        )
      );
    };

    socket.on("chat_request_created", handleChatRequest);
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("chat_request_created", handleChatRequest);
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [doctorId, activeChat?._id, fetchChats]);

  useEffect(() => {
    if (!activeChat?._id || activeChat.status !== "accepted") {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await axios.get(`${API_URL}/message/${activeChat._id}`);
        setMessages(Array.isArray(res.data) ? res.data : []);
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeChat?._id]);

  useEffect(() => {
    const messagePanel = messagesRef.current;
    if (!messagePanel) return;
    messagePanel.scrollTop = messagePanel.scrollHeight;
  }, [messages]);

  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;

    return chats.filter((chat) => {
      const user = chat.user || {};
      return [user.name, user.email, user.contactNo, user.patientId, chat.lastMessage]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [chats, search]);

  const activePatientName = getPatientName(activeChat);
  const activePatientImage = resolveMediaUrl(activeChat?.user?.profileImage);

  const updateChatStatus = async (status: ChatStatus) => {
    if (!activeChat) return;

    try {
      setError("");
      const res = await axios.patch(`${API_URL}/chat/${activeChat._id}/status`, {
        status,
        doctorId,
      });
      const updatedChat = res.data as ChatThread;

      setActiveChat(updatedChat);
      setChats((prev) =>
        prev.map((chat) => (chat._id === updatedChat._id ? updatedChat : chat))
      );
      socket.emit("chat_status_updated", {
        chatId: activeChat._id,
        userId: activeChat.user?._id,
        doctorId,
        status,
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not update chat request.");
    }
  };

  const sendMessage = async () => {
    const trimmed = text.trim();
    const receiverId = activeChat?.user?._id;
    if (!trimmed || !activeChat || !receiverId || activeChat.status !== "accepted") return;

    const payload: ChatMessage = {
      chatId: activeChat._id,
      senderId: doctorId,
      receiverId,
      message: trimmed,
      createdAt: new Date().toISOString(),
    };

    try {
      await axios.post(`${API_URL}/message/send`, payload);
      socket.emit("send_message", payload);
      setMessages((prev) => [...prev, payload]);
      setChats((prev) =>
        prev.map((chat) =>
          chat._id === activeChat._id
            ? { ...chat, lastMessage: trimmed, updatedAt: payload.createdAt }
            : chat
        )
      );
      setText("");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Message could not be sent. Please try again.");
    }
  };

  const canChat = activeChat?.status === "accepted";

  if (!doctorId) {
    return (
      <div className={styles.emptyPanel}>
        <FiMessageSquare />
        <h3>Loading chat</h3>
        <p>Preparing your doctor inbox.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div>
            <p>Inbox</p>
            <h3>Patients</h3>
          </div>
          <span>{filteredChats.length}</span>
        </div>

        <div className={styles.searchBox}>
          <FiSearch />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search patients"
          />
        </div>

        <div className={styles.chatList}>
          {loadingChats ? (
            <div className={styles.listState}>Loading patients...</div>
          ) : error ? (
            <div className={styles.listState}>{error}</div>
          ) : filteredChats.length === 0 ? (
            <div className={styles.listState}>No patient chats yet.</div>
          ) : (
            filteredChats.map((chat) => {
              const patientName = getPatientName(chat);
              const image = resolveMediaUrl(chat.user?.profileImage);

              return (
                <button
                  key={chat._id}
                  type="button"
                  onClick={() => setActiveChat(chat)}
                  className={`${styles.chatItem} ${
                    activeChat?._id === chat._id ? styles.active : ""
                  }`}
                >
                  <span className={styles.avatar}>
                    {image ? <img src={image} alt={patientName} /> : getInitials(patientName)}
                  </span>
                  <span className={styles.chatMeta}>
                    <span className={styles.chatName}>{patientName}</span>
                  <span className={styles.chatPreview}>
                      {chat.status === "pending"
                        ? "Chat request pending"
                        : chat.status === "declined"
                          ? "Request declined"
                          : chat.lastMessage || chat.user?.email || "No messages yet"}
                  </span>
                  </span>
                  <span
                    className={`${styles.chatTime} ${
                      chat.status === "pending" ? styles.pendingBadge : ""
                    }`}
                  >
                    {chat.status === "pending" ? "New" : formatTime(chat.updatedAt)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className={styles.chatArea}>
        {activeChat ? (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.headerIdentity}>
                <span className={styles.headerAvatar}>
                  {activePatientImage ? (
                    <img src={activePatientImage} alt={activePatientName} />
                  ) : (
                    getInitials(activePatientName)
                  )}
                </span>
                <div>
                  <h3>{activePatientName}</h3>
                  <p>
                    {activeChat.user?.contactNo
                      ? `+91 ${activeChat.user.contactNo}`
                      : activeChat.user?.email || "Patient conversation"}
                  </p>
                </div>
              </div>
              {activeChat.status === "pending" ? (
                <div className={styles.requestActions}>
                  <button type="button" onClick={() => updateChatStatus("declined")}>
                    Decline
                  </button>
                  <button type="button" onClick={() => updateChatStatus("accepted")}>
                    Accept
                  </button>
                </div>
              ) : (
                <WebRTCCall
                  chatId={activeChat._id}
                  currentUserId={doctorId}
                  peerId={activeChat.user?._id}
                  peerName={activePatientName}
                  canCall={canChat}
                />
              )}
            </div>

            <div className={styles.messages} ref={messagesRef}>
              {loadingMessages ? (
                <div className={styles.messageState}>Loading messages...</div>
              ) : activeChat.status === "pending" ? (
                <div className={styles.messageState}>
                  {activePatientName} wants to connect. Accept the request to start chat.
                </div>
              ) : activeChat.status === "declined" ? (
                <div className={styles.messageState}>
                  You declined this chat request.
                </div>
              ) : messages.length === 0 ? (
                <div className={styles.messageState}>No messages in this chat yet.</div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.senderId === doctorId;

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
                placeholder={`Reply to ${activePatientName}`}
                disabled={!canChat}
              />
              <button
                type="button"
                className={styles.sendBtn}
                onClick={sendMessage}
                disabled={!text.trim() || !canChat}
              >
                <FiSend />
                {canChat ? "Send" : "Locked"}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.emptyPanel}>
            <FiUser />
            <h3>Select a patient</h3>
            <p>Choose a conversation from the left to view messages.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DoctorChat;
