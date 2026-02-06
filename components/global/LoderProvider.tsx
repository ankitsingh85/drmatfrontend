"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import FullPageLoader from "../common/FullPageLoader";

const LoaderContext = createContext<any>(null);

export const useGlobalLoader = () => useContext(LoaderContext);

export const LoaderProvider = ({ children }: any) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🔥 Listen to route events
  useEffect(() => {
    const start = () => setLoading(true);
    const end = () => setLoading(false);

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", end);
    router.events.on("routeChangeError", end);

    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", end);
      router.events.off("routeChangeError", end);
    };
  }, [router]);

  return (
    <LoaderContext.Provider value={{ loading, setLoading }}>
      {loading && <FullPageLoader />}
      {children}
    </LoaderContext.Provider>
  );
};
