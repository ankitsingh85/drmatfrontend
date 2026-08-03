"use client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { getGoogleMapsLoaderOptions } from "@/lib/googleMaps";
import { useToast } from "@/context/ToastContext";

export default function Map() {
  const [location, setLocation] = useState<any>(null);
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY || "";
  const { isLoaded } = useJsApiLoader(getGoogleMapsLoaderOptions(googleMapsApiKey));
  const toast = useToast();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => toast.error("Please allow location")
    );
  }, []);

  if (!isLoaded || !location) {
    return null;
  }

  return (
    <GoogleMap mapContainerStyle={{ width: "100%", height: "400px" }} center={location} zoom={15}>
      <Marker position={location} />
    </GoogleMap>
  );
}
