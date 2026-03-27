"use client";

import React, { createContext, useCallback, useContext, useEffect } from "react";
import Cookies from "js-cookie";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";

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

const readStoredProfileImage = (): string | null => {
  try {
    return localStorage.getItem(PROFILE_IMAGE_STORAGE_KEY) || Cookies.get("profileImage") || null;
  } catch {
    return Cookies.get("profileImage") || null;
  }
};

const writeStoredProfileImage = (value: string | null) => {
  try {
    if (value && !/^data:image\//i.test(value)) {
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
      profileImage: resolveMediaUrl(rawProfileImage),
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

      const normalizedProfile = resolveMediaUrl(data.profileImage);
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

  const clearProfile = useCallback(() => {
    writeStoredProfileImage(null);
    setState({
      username: null,
      profileImage: null,
      email: null,
      contactNo: null,
    });
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
    const onUserLoggedOut = () => {
      clearProfile();
    };

    window.addEventListener("profile-updated", onProfileUpdated);
    window.addEventListener("user-logged-in", onUserLoggedIn);
    window.addEventListener("user-logged-out", onUserLoggedOut);

    return () => {
      window.removeEventListener("profile-updated", onProfileUpdated);
      window.removeEventListener("user-logged-in", onUserLoggedIn);
      window.removeEventListener("user-logged-out", onUserLoggedOut);
    };
  }, [clearProfile, refetchProfile, syncFromStorage]);

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
