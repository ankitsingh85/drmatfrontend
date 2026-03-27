import { API_URL } from "@/config/api";

const getMediaOrigin = () => {
  try {
    return new URL(API_URL).origin;
  } catch {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return API_URL.replace(/\/api\/?$/, "");
  }
};

export const resolveMediaUrl = (value?: string | null): string | null => {
  if (!value) return null;
  if (/^(data|blob):/i.test(value)) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[A-Za-z0-9+/=]+$/.test(value) && value.length > 100) {
    return `data:image/jpeg;base64,${value}`;
  }

  const origin = getMediaOrigin();
  return value.startsWith("/") ? `${origin}${value}` : `${origin}/${value}`;
};
