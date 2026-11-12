"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { socket } from "@/utils/socket";
import type { WebRTCCallSignalPayload } from "@/components/chat/WebRTCCall";

export type IncomingCallInfo = WebRTCCallSignalPayload;

interface CallContextType {
  role: "doctor" | "patient" | null;
  myId: string;
  // A call that is currently ringing, app-wide, regardless of which page
  // the person is on — this is what the global popup shows.
  incomingCall: IncomingCallInfo | null;
  // The call the person chose to answer from that popup, handed off so the
  // destination chat page can pick up exactly where the popup left off.
  resumeCall: IncomingCallInfo | null;
  declineIncomingCall: () => void;
  viewIncomingCall: () => void;
  clearResumeCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [role, setRole] = useState<"doctor" | "patient" | null>(null);
  const [myId, setMyId] = useState("");
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
  const [resumeCall, setResumeCall] = useState<IncomingCallInfo | null>(null);
  const myIdRef = useRef("");
  const roleRef = useRef<"doctor" | "patient" | null>(null);

  // Re-derive identity on every navigation (not just on first mount) so a
  // fresh login/logout — which only updates cookies, not this provider — is
  // picked up without needing a full page reload.
  useEffect(() => {
    const doctorId = Cookies.get("doctorId") || "";
    const userId = Cookies.get("userId") || "";
    const nextRole: "doctor" | "patient" | null = doctorId ? "doctor" : userId ? "patient" : null;
    const nextId = doctorId || userId || "";

    roleRef.current = nextRole;
    myIdRef.current = nextId;
    setRole(nextRole);
    setMyId(nextId);
  }, [router.asPath]);

  // Being "reachable" for a call used to depend entirely on the patient's
  // or doctor's specific chat component happening to be mounted. Registering
  // here instead — once, app-wide — means a call can always reach them no
  // matter which page they're currently on.
  useEffect(() => {
    if (!myId) return;

    const register = () => socket.emit("register", myId);
    register();
    socket.on("connect", register);

    return () => {
      socket.off("connect", register);
    };
  }, [myId]);

  useEffect(() => {
    if (!myId) return;

    const handleInvite = (data: IncomingCallInfo) => {
      if (data.to !== myIdRef.current) return;
      // Don't clobber a call that's already ringing with a second one.
      setIncomingCall((current) => current ?? data);
    };

    // If the caller hangs up or cancels before we've answered, make sure
    // the popup doesn't keep ringing for a call that's no longer there.
    const handleGone = (data: { callId?: string }) => {
      setIncomingCall((current) => (current && current.callId === data.callId ? null : current));
    };

    socket.on("call:invite", handleInvite);
    socket.on("call:ended", handleGone);
    socket.on("call:rejected", handleGone);

    return () => {
      socket.off("call:invite", handleInvite);
      socket.off("call:ended", handleGone);
      socket.off("call:rejected", handleGone);
    };
  }, [myId]);

  const declineIncomingCall = useCallback(() => {
    setIncomingCall((current) => {
      if (current) {
        socket.emit("call:rejected", {
          chatId: current.chatId,
          callId: current.callId,
          from: myIdRef.current,
          to: current.from,
        });
      }
      return null;
    });
  }, []);

  const viewIncomingCall = useCallback(() => {
    setIncomingCall((current) => {
      if (!current) return current;

      setResumeCall(current);

      const destination =
        roleRef.current === "doctor"
          ? "/DoctorDashboard?section=chat"
          : current.surface === "consultation"
          ? "/UserDashboard?section=chat"
          : "/Chat";

      router.push(destination);
      return null;
    });
  }, [router]);

  const clearResumeCall = useCallback(() => setResumeCall(null), []);

  return (
    <CallContext.Provider
      value={{
        role,
        myId,
        incomingCall,
        resumeCall,
        declineIncomingCall,
        viewIncomingCall,
        clearResumeCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error("useCall must be used within CallProvider");
  return context;
};
