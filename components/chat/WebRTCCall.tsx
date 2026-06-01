"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FiMic,
  FiMicOff,
  FiPhone,
  FiPhoneOff,
  FiVideo,
  FiVideoOff,
} from "react-icons/fi";
import { socket } from "@/utils/socket";
import styles from "@/styles/chat.module.css";

type CallType = "audio" | "video";
type CallMode = "idle" | "incoming" | "calling" | "connecting" | "active";

export type WebRTCCallSignalPayload = {
  chatId: string;
  callId: string;
  from: string;
  to: string;
  callType: CallType;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

type WebRTCCallProps = {
  chatId: string;
  currentUserId: string;
  peerId?: string;
  peerName: string;
  canCall: boolean;
  externalIncomingCall?: WebRTCCallSignalPayload | null;
  onExternalIncomingHandled?: (callId: string) => void;
};

const createCallId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const WebRTCCall = ({
  chatId,
  currentUserId,
  peerId,
  peerName,
  canCall,
  externalIncomingCall,
  onExternalIncomingHandled,
}: WebRTCCallProps) => {
  const [mode, setMode] = useState<CallMode>("idle");
  const [callType, setCallType] = useState<CallType>("video");
  const [callId, setCallId] = useState("");
  const [incomingFrom, setIncomingFrom] = useState("");
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [callError, setCallError] = useState("");

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const modeRef = useRef<CallMode>("idle");
  const callIdRef = useRef("");

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    callIdRef.current = callId;
  }, [callId]);

  const attachStreams = useCallback(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, []);

  useEffect(() => {
    attachStreams();
  }, [attachStreams, mode]);

  const stopLocalMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
  }, []);

  const resetCall = useCallback(
    (notifyPeer = false) => {
      if (notifyPeer && peerId && callIdRef.current) {
        socket.emit("call:ended", {
          chatId,
          callId: callIdRef.current,
          from: currentUserId,
          to: peerId,
        });
      }

      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      stopLocalMedia();
      remoteStreamRef.current = null;
      pendingCandidatesRef.current = [];
      setMode("idle");
      setCallId("");
      setIncomingFrom("");
      setCallError("");
      setMicEnabled(true);
      setCameraEnabled(true);
    },
    [chatId, currentUserId, peerId, stopLocalMedia]
  );

  useEffect(() => () => resetCall(false), [resetCall]);

  const getMedia = useCallback(async (nextCallType: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: nextCallType === "video",
    });

    localStreamRef.current = stream;
    setMicEnabled(stream.getAudioTracks().every((track) => track.enabled));
    setCameraEnabled(stream.getVideoTracks().every((track) => track.enabled));
    attachStreams();
    return stream;
  }, [attachStreams]);

  const createPeerConnection = useCallback(
    (nextCallId: string, nextPeerId: string) => {
      const connection = new RTCPeerConnection();
      const remoteStream = new MediaStream();

      remoteStreamRef.current = remoteStream;
      peerConnectionRef.current = connection;

      connection.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
        attachStreams();
      };

      connection.onicecandidate = (event) => {
        if (!event.candidate) return;
        socket.emit("call:ice-candidate", {
          chatId,
          callId: nextCallId,
          from: currentUserId,
          to: nextPeerId,
          candidate: event.candidate.toJSON(),
        });
      };

      connection.onconnectionstatechange = () => {
        if (connection.connectionState === "connected") {
          setMode("active");
        }

        if (["failed", "closed", "disconnected"].includes(connection.connectionState)) {
          resetCall(false);
        }
      };

      return connection;
    },
    [attachStreams, chatId, currentUserId, resetCall]
  );

  const addPendingCandidates = useCallback(async () => {
    const connection = peerConnectionRef.current;
    if (!connection?.remoteDescription) return;

    const candidates = pendingCandidatesRef.current.splice(0);
    await Promise.all(
      candidates.map((candidate) => connection.addIceCandidate(new RTCIceCandidate(candidate)))
    );
  }, []);

  const startCall = async (nextCallType: CallType) => {
    if (!canCall || !peerId || !chatId || mode !== "idle") return;

    try {
      const nextCallId = createCallId();
      setCallError("");
      setCallType(nextCallType);
      setCallId(nextCallId);
      setMode("calling");
      await getMedia(nextCallType);

      socket.emit("call:invite", {
        chatId,
        callId: nextCallId,
        from: currentUserId,
        to: peerId,
        callType: nextCallType,
      });
    } catch (err: any) {
      resetCall(false);
      setCallError(err?.message || "Camera or microphone permission was blocked.");
    }
  };

  const acceptCall = async () => {
    if (!peerId || !incomingFrom || !callId) return;

    try {
      setCallError("");
      setMode("connecting");
      const stream = await getMedia(callType);
      const connection = createPeerConnection(callId, incomingFrom);
      stream.getTracks().forEach((track) => connection.addTrack(track, stream));

      socket.emit("call:accepted", {
        chatId,
        callId,
        from: currentUserId,
        to: incomingFrom,
        callType,
      });
    } catch (err: any) {
      socket.emit("call:rejected", {
        chatId,
        callId,
        from: currentUserId,
        to: incomingFrom,
        reason: "media-blocked",
      });
      resetCall(false);
      setCallError(err?.message || "Camera or microphone permission was blocked.");
    }
  };

  const rejectCall = () => {
    if (incomingFrom && callId) {
      socket.emit("call:rejected", {
        chatId,
        callId,
        from: currentUserId,
        to: incomingFrom,
      });
    }
    resetCall(false);
  };

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setMicEnabled(track.enabled);
    });
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setCameraEnabled(track.enabled);
    });
  };

  const receiveInvite = useCallback(
    (data: WebRTCCallSignalPayload) => {
      if (
        data.chatId !== chatId ||
        data.to !== currentUserId ||
        !canCall ||
        modeRef.current !== "idle"
      ) {
        return false;
      }

      setCallType(data.callType);
      setCallId(data.callId);
      setIncomingFrom(data.from);
      setMode("incoming");
      setCallError("");
      return true;
    },
    [canCall, chatId, currentUserId]
  );

  useEffect(() => {
    if (!externalIncomingCall) return;
    if (receiveInvite(externalIncomingCall)) {
      onExternalIncomingHandled?.(externalIncomingCall.callId);
    }
  }, [externalIncomingCall, onExternalIncomingHandled, receiveInvite]);

  useEffect(() => {
    if (!chatId || !currentUserId) return;

    const isCurrentCall = (data: WebRTCCallSignalPayload) =>
      data.chatId === chatId && data.to === currentUserId;

    const handleInvite = (data: WebRTCCallSignalPayload) => {
      receiveInvite(data);
    };

    const handleAccepted = async (data: WebRTCCallSignalPayload) => {
      if (!isCurrentCall(data) || data.callId !== callIdRef.current || !peerId) return;

      const connection = createPeerConnection(data.callId, peerId);
      localStreamRef.current?.getTracks().forEach((track) => {
        if (localStreamRef.current) connection.addTrack(track, localStreamRef.current);
      });

      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      socket.emit("call:offer", {
        chatId,
        callId: data.callId,
        from: currentUserId,
        to: peerId,
        callType: data.callType,
        offer,
      });
      setMode("connecting");
    };

    const handleRejected = (data: WebRTCCallSignalPayload) => {
      if (!isCurrentCall(data) || data.callId !== callIdRef.current) return;
      resetCall(false);
      setCallError(`${peerName} declined the call.`);
    };

    const handleOffer = async (data: WebRTCCallSignalPayload) => {
      if (!isCurrentCall(data) || data.callId !== callIdRef.current || !data.offer) return;

      const connection = peerConnectionRef.current;
      if (!connection) return;

      await connection.setRemoteDescription(new RTCSessionDescription(data.offer));
      await addPendingCandidates();
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      socket.emit("call:answer", {
        chatId,
        callId: data.callId,
        from: currentUserId,
        to: data.from,
        callType: data.callType,
        answer,
      });
    };

    const handleAnswer = async (data: WebRTCCallSignalPayload) => {
      if (!isCurrentCall(data) || data.callId !== callIdRef.current || !data.answer) return;

      const connection = peerConnectionRef.current;
      if (!connection) return;

      await connection.setRemoteDescription(new RTCSessionDescription(data.answer));
      await addPendingCandidates();
    };

    const handleCandidate = async (data: WebRTCCallSignalPayload) => {
      if (!isCurrentCall(data) || data.callId !== callIdRef.current || !data.candidate) return;

      const connection = peerConnectionRef.current;
      if (!connection?.remoteDescription) {
        pendingCandidatesRef.current.push(data.candidate);
        return;
      }

      await connection.addIceCandidate(new RTCIceCandidate(data.candidate));
    };

    const handleEnded = (data: WebRTCCallSignalPayload) => {
      if (!isCurrentCall(data) || data.callId !== callIdRef.current) return;
      resetCall(false);
    };

    socket.on("call:invite", handleInvite);
    socket.on("call:accepted", handleAccepted);
    socket.on("call:rejected", handleRejected);
    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice-candidate", handleCandidate);
    socket.on("call:ended", handleEnded);

    return () => {
      socket.off("call:invite", handleInvite);
      socket.off("call:accepted", handleAccepted);
      socket.off("call:rejected", handleRejected);
      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice-candidate", handleCandidate);
      socket.off("call:ended", handleEnded);
    };
  }, [
    addPendingCandidates,
    chatId,
    createPeerConnection,
    currentUserId,
    peerId,
    peerName,
    receiveInvite,
    resetCall,
  ]);

  return (
    <>
      <div className={styles.callActions}>
        <button
          type="button"
          onClick={() => startCall("audio")}
          disabled={!canCall || mode !== "idle"}
          title="Start audio call"
        >
          <FiPhone />
        </button>
        <button
          type="button"
          onClick={() => startCall("video")}
          disabled={!canCall || mode !== "idle"}
          title="Start video call"
        >
          <FiVideo />
        </button>
      </div>

      {callError ? <div className={styles.callError}>{callError}</div> : null}

      {mode !== "idle" ? (
        <div className={styles.callOverlay}>
          <div className={styles.callPanel}>
            <div className={styles.callStage}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={styles.remoteVideo}
              />
              {callType === "audio" || mode !== "active" ? (
                <div className={styles.callPlaceholder}>
                  <span>{peerName.slice(0, 1).toUpperCase()}</span>
                  <p>
                    {mode === "incoming"
                      ? `Incoming ${callType} call`
                      : mode === "calling"
                        ? `Calling ${peerName}`
                        : "Connecting call"}
                  </p>
                </div>
              ) : null}
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={styles.localVideo}
              />
            </div>

            <div className={styles.callFooter}>
              <div>
                <h3>{peerName}</h3>
                <p>{callType === "video" ? "Video call" : "Audio call"}</p>
              </div>

              {mode === "incoming" ? (
                <div className={styles.callControls}>
                  <button type="button" className={styles.endCallBtn} onClick={rejectCall}>
                    <FiPhoneOff />
                  </button>
                  <button type="button" className={styles.acceptCallBtn} onClick={acceptCall}>
                    <FiPhone />
                  </button>
                </div>
              ) : (
                <div className={styles.callControls}>
                  <button type="button" onClick={toggleMic}>
                    {micEnabled ? <FiMic /> : <FiMicOff />}
                  </button>
                  {callType === "video" ? (
                    <button type="button" onClick={toggleCamera}>
                      {cameraEnabled ? <FiVideo /> : <FiVideoOff />}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={styles.endCallBtn}
                    onClick={() => resetCall(true)}
                  >
                    <FiPhoneOff />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default WebRTCCall;
