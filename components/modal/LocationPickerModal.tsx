"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { FiX, FiMapPin, FiCrosshair, FiSearch } from "react-icons/fi";
import { getGoogleMapsLoaderOptions } from "@/lib/googleMaps";
import { reverseGeocodeWithGoogle } from "@/lib/geocode";
import { useToast } from "@/context/ToastContext";
import styles from "@/styles/components/modal/LocationPickerModal.module.css";

type Props = {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (result: { address: string; lat: number; lng: number }) => void;
  onClose: () => void;
};

type LatLng = { lat: number; lng: number };

// New Delhi — used only as a map starting point when we have no prior
// location saved and the user hasn't searched/located themselves yet.
const DEFAULT_CENTER: LatLng = { lat: 28.6139, lng: 77.209 };

const mapContainerStyle = { width: "100%", height: "320px", borderRadius: "16px" };

export default function LocationPickerModal({
  initialLat,
  initialLng,
  onConfirm,
  onClose,
}: Props) {
  const toast = useToast();
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY || "";
  const { isLoaded } = useJsApiLoader(getGoogleMapsLoaderOptions(googleMapsApiKey));

  const startingPoint: LatLng =
    initialLat != null && initialLng != null ? { lat: initialLat, lng: initialLng } : DEFAULT_CENTER;

  const [center, setCenter] = useState<LatLng>(startingPoint);
  const [marker, setMarker] = useState<LatLng>(startingPoint);
  const [addressPreview, setAddressPreview] = useState("");
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const resolveAddressFor = useCallback(
    async (lat: number, lng: number) => {
      setResolving(true);
      try {
        const { summary } = await reverseGeocodeWithGoogle(lat, lng, googleMapsApiKey);
        setAddressPreview(summary);
      } finally {
        setResolving(false);
      }
    },
    [googleMapsApiKey]
  );

  // Resolve the starting pin's address once the map/geocoder is ready.
  useEffect(() => {
    if (!isLoaded) return;
    resolveAddressFor(startingPoint.lat, startingPoint.lng);
    // Only on initial load — subsequent moves resolve themselves explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();
    if (lat == null || lng == null) return;
    setMarker({ lat, lng });
    resolveAddressFor(lat, lng);
  };

  const handleMarkerDragEnd = (event: google.maps.MapMouseEvent) => {
    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();
    if (lat == null || lng == null) return;
    setMarker({ lat, lng });
    resolveAddressFor(lat, lng);
  };

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    const location = place?.geometry?.location;
    if (!location) return;

    const lat = location.lat();
    const lng = location.lng();
    setCenter({ lat, lng });
    setMarker({ lat, lng });
    mapRef.current?.panTo({ lat, lng });

    if (place?.formatted_address) {
      setAddressPreview(place.formatted_address);
    } else {
      resolveAddressFor(lat, lng);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCenter({ lat: latitude, lng: longitude });
        setMarker({ lat: latitude, lng: longitude });
        mapRef.current?.panTo({ lat: latitude, lng: longitude });
        resolveAddressFor(latitude, longitude).finally(() => setLocating(false));
      },
      () => {
        toast.error("Location access denied");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const handleConfirm = () => {
    if (!addressPreview || addressPreview === "Location unavailable") {
      toast.error("Pick a valid location first");
      return;
    }
    onConfirm({ address: addressPreview, lat: marker.lat, lng: marker.lng });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <h2>Set Your Location</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <p className={styles.subtitle}>
          Search for a city or area, drop the pin on the map, or use your current location.
        </p>

        {isLoaded ? (
          <Autocomplete
            onLoad={(instance) => {
              autocompleteRef.current = instance;
            }}
            onPlaceChanged={handlePlaceChanged}
          >
            <div className={styles.searchBox}>
              <FiSearch size={16} />
              <input
                type="text"
                placeholder="Search for a city or area..."
                className={styles.searchInput}
              />
            </div>
          </Autocomplete>
        ) : (
          <div className={styles.searchBox}>
            <FiSearch size={16} />
            <input
              type="text"
              placeholder="Loading map..."
              className={styles.searchInput}
              disabled
            />
          </div>
        )}

        <button
          type="button"
          className={styles.currentLocationBtn}
          onClick={handleUseCurrentLocation}
          disabled={locating || !isLoaded}
        >
          <FiCrosshair size={14} />
          {locating ? "Detecting..." : "Use My Current Location"}
        </button>

        <div className={styles.mapWrap}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={15}
              onClick={handleMapClick}
              onLoad={(map) => {
                mapRef.current = map;
              }}
              options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
            >
              <Marker position={marker} draggable onDragEnd={handleMarkerDragEnd} />
            </GoogleMap>
          ) : (
            <div className={styles.mapLoading}>Loading map…</div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.addressPreview}>
            <FiMapPin size={16} />
            <span>
              {resolving ? "Locating address…" : addressPreview || "Pick a location on the map"}
            </span>
          </div>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={resolving || !addressPreview}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
