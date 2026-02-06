"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { API_URL } from "@/config/api";

interface User {
  _id: string;
  email: string;
  name: string;
  age?: number;
  image?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const email = Cookies.get("email");
        const userId = Cookies.get("userId") || localStorage.getItem("userId");

        if (userId) {
          const res = await axios.get(`${API_URL}/userprofile/id/${userId}`);
          setUser(res.data);
        } else if (email) {
          const res = await axios.get(`${API_URL}/userprofile/${email}`);
          setUser(res.data);

          Cookies.set("userId", res.data._id);
          localStorage.setItem("userId", res.data._id);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("❌ Failed to fetch user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
