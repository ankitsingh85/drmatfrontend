// Shared reverse-geocoding helper — used by the Topbar's location pill and
// by the location-picker modal (map pin / search), so both always resolve
// a lat/lng to the same "Sector, City" short summary.

const getComponent = (
  components: google.maps.GeocoderAddressComponent[] | undefined,
  type: string
) => components?.find((part) => part.types?.includes(type))?.long_name;

const formatDetailedAddress = (result: google.maps.GeocoderResult | undefined) => {
  const components = result?.address_components || [];

  const sector =
    getComponent(components, "sublocality_level_1") ||
    getComponent(components, "sublocality_level_2") ||
    getComponent(components, "neighborhood") ||
    getComponent(components, "route");

  const city =
    getComponent(components, "locality") ||
    getComponent(components, "postal_town") ||
    getComponent(components, "administrative_area_level_2");

  return [sector, city].filter(Boolean).join(", ");
};

export const reverseGeocodeWithGoogle = async (
  latitude: number,
  longitude: number,
  apiKey: string
): Promise<{ summary: string; formattedAddress: string }> => {
  if (!apiKey) return { summary: "Location unavailable", formattedAddress: "" };

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${encodeURIComponent(
        apiKey
      )}`
    );
    const data = await res.json();
    const result = data?.results?.[0];

    if (data.status !== "OK" || !result) {
      return { summary: "Location unavailable", formattedAddress: "" };
    }

    return {
      summary: formatDetailedAddress(result) || result.formatted_address || "Location unavailable",
      formattedAddress: result.formatted_address || "",
    };
  } catch {
    return { summary: "Location unavailable", formattedAddress: "" };
  }
};
