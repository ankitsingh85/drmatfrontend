"use client";

import React, { createContext, useCallback, useContext, useEffect } from "react";
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
const PROFILE_IMAGE_STORAGE_KEY = "profileImage";

const normalizeImage = (img: string | undefined | null, apiUrl: string): string | null => {
  if (!img) return null;
  if (/^data:image\//i.test(img)) return img;
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith("/")) return `${apiUrl}${img}`;
  return `${apiUrl}/${img}`;
};

const readStoredProfileImage = (): string | null => {
  try {
    return localStorage.getItem(PROFILE_IMAGE_STORAGE_KEY) || Cookies.get("profileImage") || null;
  } catch {
    return Cookies.get("profileImage") || null;
  }
};

const writeStoredProfileImage = (value: string | null) => {
  try {
    if (value) {
      localStorage.setItem(PROFILE_IMAGE_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(PROFILE_IMAGE_STORAGE_KEY);
    }
  } catch {
    // Ignore localStorage failures.
  }

  if (value && !/^data:image\//i.test(value)) {
    Cookies.set("profileImage", value);
  } else {
    Cookies.remove("profileImage");
  }
};

export const TopbarProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<TopbarProfileState>({
    username: null,
    profileImage: null,
    email: null,
    contactNo: null,
  });

  const syncFromStorage = useCallback(() => {
    const username = Cookies.get("username") || null;
    const email = Cookies.get("email") || null;
    const contactNo = Cookies.get("contactNo") || null;
    const rawProfileImage = readStoredProfileImage();

    setState({
      username,
      email,
      contactNo,
      profileImage: normalizeImage(rawProfileImage, API_URL),
    });
  }, []);

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  const refetchProfile = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      Cookies.set("username", data.name || "");
      Cookies.set("email", data.email || "");
      Cookies.set("contactNo", data.contactNo || "");

      const normalizedProfile = data.profileImage ? normalizeImage(data.profileImage, API_URL) : null;
      writeStoredProfileImage(normalizedProfile);

      setState({
        username: data.name || null,
        email: data.email || null,
        contactNo: data.contactNo || null,
        profileImage: normalizedProfile,
      });
    } catch {
      // Ignore API failures and keep existing state.
    }
  }, []);

  useEffect(() => {
    refetchProfile();
  }, [refetchProfile]);

  useEffect(() => {
    const onProfileUpdated = () => {
      syncFromStorage();
      refetchProfile();
    };
    const onUserLoggedIn = () => {
      syncFromStorage();
      refetchProfile();
    };

    window.addEventListener("profile-updated", onProfileUpdated);
    window.addEventListener("user-logged-in", onUserLoggedIn);

    return () => {
      window.removeEventListener("profile-updated", onProfileUpdated);
      window.removeEventListener("user-logged-in", onUserLoggedIn);
    };
  }, [refetchProfile, syncFromStorage]);

  const clearProfile = useCallback(() => {
    writeStoredProfileImage(null);
    setState({
      username: null,
      profileImage: null,
      email: null,
      contactNo: null,
    });
  }, []);

  return (
    <TopbarProfileContext.Provider
      value={{
        ...state,
        refetchProfile,
        clearProfile,
      }}
    >
      {children}
    </TopbarProfileContext.Provider>
  );
};

export const useTopbarProfile = (): TopbarProfileContextType | undefined => {
  return useContext(TopbarProfileContext);
};
