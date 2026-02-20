"use client";

import React, { createContext, useContext, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { API_URL } from "@/config/api";

interface TopbarProfileState {
  username: string | null;
  profileImage: string | null;
  email: string | null;
  contactNo: string | null;
}

interface TopbarProfileContextType extends TopbarProfileState {
  refetchProfile: () => void;
  clearProfile: () => void;
}

const TopbarProfileContext = createContext<TopbarProfileContextType | undefined>(undefined);

const normalizeImage = (img: string | undefined | null, apiUrl: string): string | null => {
  if (!img) return null;
  if (/^data:image\//i.test(img)) return img;
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith("/")) return `${apiUrl}${img}`;
  return `${apiUrl}/${img}`;
};

export const TopbarProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Keep initial state SSR-safe to avoid hydration mismatch.
  const [state, setState] = React.useState<TopbarProfileState>({
    username: null,
    profileImage: null,
    email: null,
    contactNo: null,
  });

  useEffect(() => {
    const username = Cookies.get("username") || null;
    const email = Cookies.get("email") || null;
    const contactNo = Cookies.get("contactNo") || null;
    const rawProfileImage = Cookies.get("profileImage") || null;

    setState({
      username,
      email,
      contactNo,
      profileImage: normalizeImage(rawProfileImage, API_URL),
    });
  }, []);

  const refetchProfile = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data) {
        Cookies.set("username", data.name || "");
        Cookies.set("email", data.email || "");
        Cookies.set("contactNo", data.contactNo || "");
        const normalizedProfile = data.profileImage
          ? normalizeImage(data.profileImage, API_URL)
          : null;
        if (normalizedProfile) {
          Cookies.set("profileImage", normalizedProfile);
        } else {
          Cookies.remove("profileImage");
        }
        setState({
          username: data.name || null,
          email: data.email || null,
          contactNo: data.contactNo || null,
          profileImage: normalizedProfile,
        });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refetchProfile();
  }, [refetchProfile]);

  useEffect(() => {
    const onProfileUpdated = () => refetchProfile();
    const onUserLoggedIn = () => refetchProfile();
    window.addEventListener("profile-updated", onProfileUpdated);
    window.addEventListener("user-logged-in", onUserLoggedIn);
    return () => {
      window.removeEventListener("profile-updated", onProfileUpdated);
      window.removeEventListener("user-logged-in", onUserLoggedIn);
    };
  }, [refetchProfile]);

  const clearProfile = useCallback(() => {
    setState({
      username: null,
      profileImage: null,
      email: null,
      contactNo: null,
    });
  }, []);

  const value: TopbarProfileContextType = {
    ...state,
    refetchProfile,
    clearProfile,
  };

  return (
    <TopbarProfileContext.Provider value={value}>
      {children}
    </TopbarProfileContext.Provider>
  );
};

export const useTopbarProfile = (): TopbarProfileContextType | undefined => {
  return useContext(TopbarProfileContext);
};
