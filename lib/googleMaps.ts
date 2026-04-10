import type { Library } from "@googlemaps/js-api-loader";

export const GOOGLE_MAPS_LOADER_ID = "script-loader";

export const GOOGLE_MAPS_LOADER_OPTIONS = {
  id: GOOGLE_MAPS_LOADER_ID,
  version: "weekly",
  libraries: ["maps"] as Library[],
  language: "en",
  region: "US",
  mapIds: [] as string[],
  nonce: "",
  url: "https://maps.googleapis.com/maps/api/js",
  authReferrerPolicy: "origin" as const,
};

export const getGoogleMapsLoaderOptions = (apiKey: string) => ({
  ...GOOGLE_MAPS_LOADER_OPTIONS,
  googleMapsApiKey: apiKey,
});
