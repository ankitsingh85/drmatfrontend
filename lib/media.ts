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

// For text exports (CSV/PDF) only — never use this for an <img src>. A
// data: URI or bare base64 blob can run for megabytes; dumping that into a
// spreadsheet cell is unreadable and can silently truncate/corrupt the row,
// since Excel caps a cell at ~32,767 characters. Real hosted URLs are short
// and useful, so those still pass through as-is.
export const getExportSafeMediaValue = (value?: string | null): string => {
  const resolved = resolveMediaUrl(value);
  if (!resolved) return "-";
  if (/^(data|blob):/i.test(resolved)) return "File uploaded";
  return resolved;
};

export const resolveUploadedMediaUrl = (value?: string | null): string | null => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(data|blob):/i.test(value)) return value;

  const origin = getMediaOrigin();
  return value.startsWith("/") ? `${origin}${value}` : `${origin}/${value}`;
};
