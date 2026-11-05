"use client";

import React from "react";
import { FiPhone, FiPhoneOff, FiVideo } from "react-icons/fi";
import { useCall } from "@/context/CallContext";
import styles from "@/styles/incomingCallPopup.module.css";

// Rendered once, app-wide (mounted in _app.tsx), so an incoming call shows
// up no matter which page the doctor or patient is currently on — instead
// of only being visible from inside the exact chat window it belongs to.
const IncomingCallPopup = () => {
  const { role, incomingCall, declineIncomingCall, viewIncomingCall } = useCall();

  if (!incomingCall) return null;

  const callerLabel =
    incomingCall.fromName ||
    (role === "doctor" ? "A patient" : "Your doctor");

  return (
    <div className={styles.overlay} role="dialog" aria-live="assertive">
      <div className={styles.card}>
        <span className={styles.pulseRing} />
        <span className={styles.avatar}>{callerLabel.slice(0, 1).toUpperCase()}</span>
        <p className={styles.caller}>{callerLabel}</p>
        <p className={styles.subtitle}>
          Incoming {incomingCall.callType === "audio" ? "audio" : "video"} call
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.declineBtn}
            onClick={declineIncomingCall}
          >
            <FiPhoneOff />
            <span>Decline</span>
          </button>
          <button type="button" className={styles.acceptBtn} onClick={viewIncomingCall}>
            {incomingCall.callType === "audio" ? <FiPhone /> : <FiVideo />}
            <span>Answer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;
