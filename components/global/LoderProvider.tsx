"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import FullPageLoader from "../common/FullPageLoader";

const LoaderContext = createContext<any>(null);

export const useGlobalLoader = () => useContext(LoaderContext);

// Next's routeChangeStart isn't always followed by a matching
// routeChangeComplete/routeChangeError (e.g. navigation cancelled by a
// rapid second click, back/forward during an in-flight route change, or a
// no-op navigation to the same path). Without this cap, `loading` can get
// stuck true forever, leaving the full-screen overlay up and silently
// swallowing every click (including "Add to Cart") until the user reloads.
const MAX_LOADING_MS = 6000;

export const LoaderProvider = ({ children }: any) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearSafetyTimeout = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const start = () => {
      setLoading(true);
      clearSafetyTimeout();
      timeoutRef.current = setTimeout(() => setLoading(false), MAX_LOADING_MS);
    };
    const end = () => {
      clearSafetyTimeout();
      setLoading(false);
    };

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", end);
    router.events.on("routeChangeError", end);

    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", end);
      router.events.off("routeChangeError", end);
      clearSafetyTimeout();
    };
  }, [router]);

  return (
    <LoaderContext.Provider value={{ loading, setLoading }}>
      {loading && <FullPageLoader />}
      {children}
    </LoaderContext.Provider>
  );
};
