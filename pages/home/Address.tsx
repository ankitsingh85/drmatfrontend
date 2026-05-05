"use client";

import React, { useCallback, useEffect, useState } from "react";
import styles from "@/styles/user/Address.module.css";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import Image from "next/image";

import MobileNavbar from "@/components/Layout/MobileNavbar";
import Topbar from "@/components/Layout/Topbar";
import { FaUserCircle, FaShoppingCart, FaCreditCard } from "react-icons/fa";
import { BsShieldCheck } from "react-icons/bs";
import {
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineRadioButtonChecked,
  MdOutlineRadioButtonUnchecked,
} from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { CartItem, useCart } from "@/context/CartContext";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
// import {logo} from "@/public/logo.jpeg"
interface Address {
  type: string;
  address?: string;
  fullName?: string;
  mobileNo?: string;
  houseNo?: string;
  street?: string;
  localArea?: string;
  pincode?: string;
  district?: string;
  state?: string;
}

interface IUserProfile {
  _id?: string;
  email: string;
  name: string;
  addresses: Address[];
  profileImage?: string;
}

interface IClinicProfile {
  _id?: string;
  clinicName: string;
  email?: string;
  contactNumber?: string;
  address?: string;
  addresses?: Address[];
  clinicLogo?: string;
  ownerName?: string;
}

interface IDoctorProfile {
  id?: string;
  _id?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  specialist?: string;
  email?: string;
  phone?: string;
  contactNo?: string;
  description?: string;
  address?: string;
  addresses?: Address[];
}

interface IClinicEditForm {
  clinicName: string;
  email: string;
  contactNumber: string;
  ownerName: string;
  houseNo: string;
  street: string;
  localArea: string;
  pincode: string;
  district: string;
  state: string;
}

const ADDRESS_TYPES = ["Home", "Work", "Office"] as const;
type AddressType = (typeof ADDRESS_TYPES)[number];
const TREATMENT_CHECKOUT_KEY = "treatmentCheckout";

const emptyAddress: Address = {
  type: "Home",
  address: "",
  fullName: "",
  mobileNo: "",
  houseNo: "",
  street: "",
  localArea: "",
  pincode: "",
  district: "",
  state: "",
};

const emptyClinicEditForm: IClinicEditForm = {
  clinicName: "",
  email: "",
  contactNumber: "",
  ownerName: "",
  houseNo: "",
  street: "",
  localArea: "",
  pincode: "",
  district: "",
  state: "",
};

const sanitizeAddressType = (value?: string): AddressType => {
  if (value === "Work" || value === "Office") return value;
  return "Home";
};

const formatAddressText = (addr: {
  houseNo?: string;
  street?: string;
  localArea?: string;
  pincode?: string;
  district?: string;
  state?: string;
  address?: string;
}) => {
  const parts = [
    addr.houseNo,
    addr.street,
    addr.localArea,
    addr.district,
    addr.state,
    addr.pincode,
  ]
    .map((v) => (v || "").trim())
    .filter(Boolean);
  return parts.join(", ") || (addr.address || "").trim();
};

const parseLegacyAddress = (value?: string) => {
  const source = (value || "").trim();
  if (!source) return {};
  const parts = source
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const parsed: Partial<Address> = {};
  if (parts[0]) parsed.houseNo = parts[0];
  if (parts[1]) parsed.street = parts[1];
  if (parts[2]) parsed.localArea = parts[2];
  if (parts[3]) parsed.district = parts[3];
  if (parts[4]) parsed.state = parts[4];
  if (parts[5]) parsed.pincode = parts[5].replace(/\D/g, "").slice(0, 6);
  if (!parsed.pincode) {
    const pincodeMatch = source.match(/\b\d{6}\b/);
    if (pincodeMatch) parsed.pincode = pincodeMatch[0];
  }
  return parsed;
};

const normalizeAddress = (addr: any): Address => {
  if (!addr || typeof addr !== "object") return { ...emptyAddress };
  const legacy = parseLegacyAddress(addr.address);
  return {
    type: sanitizeAddressType(addr.type),
    address: addr.address || "",
    fullName: addr.fullName || "",
    mobileNo: addr.mobileNo || "",
    houseNo: addr.houseNo || legacy.houseNo || "",
    street: addr.street || legacy.street || "",
    localArea: addr.localArea || legacy.localArea || "",
    pincode: addr.pincode || legacy.pincode || "",
    district: addr.district || legacy.district || "",
    state: addr.state || legacy.state || "",
  };
};

const createClinicAddress = (clinic: Partial<IClinicProfile> & Partial<Address>) =>
  normalizeAddress({
    type: clinic.type || "Office",
    fullName: clinic.fullName || clinic.clinicName || "",
    mobileNo: clinic.mobileNo || clinic.contactNumber || "",
    houseNo: clinic.houseNo || "",
    street: clinic.street || "",
    localArea: clinic.localArea || "",
    pincode: clinic.pincode || "",
    district: clinic.district || "",
    state: clinic.state || "",
    address: clinic.address || "",
  });

const createDoctorAddress = (doctor: Partial<IDoctorProfile> & Partial<Address>) =>
  normalizeAddress({
    type: doctor.type || "Office",
    fullName:
      doctor.fullName ||
      doctor.name ||
      [doctor.title, doctor.firstName, doctor.lastName].filter(Boolean).join(" ") ||
      "",
    mobileNo: doctor.mobileNo || doctor.contactNo || doctor.phone || "",
    houseNo: doctor.houseNo || "",
    street: doctor.street || "",
    localArea: doctor.localArea || "",
    pincode: doctor.pincode || "",
    district: doctor.district || "",
    state: doctor.state || "",
    address: doctor.address || "",
  });

const addressSignature = (addr: Address) =>
  [
    addr.type,
    addr.fullName,
    addr.mobileNo,
    addr.houseNo,
    addr.street,
    addr.localArea,
    addr.pincode,
    addr.district,
    addr.state,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .join("|");

const mergeAddresses = (base: Address[], next: Address[]) => {
  const seen = new Set<string>();
  return [...base, ...next].filter((addr) => {
    const normalized = normalizeAddress(addr);
    const key = addressSignature(normalized);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const toBackendAddress = (addr: Address): Address => ({
  ...addr,
  type: sanitizeAddressType(addr.type),
  fullName: (addr.fullName || "").trim(),
  mobileNo: (addr.mobileNo || "").replace(/\D/g, "").slice(0, 10),
  houseNo: (addr.houseNo || "").trim(),
  street: (addr.street || "").trim(),
  localArea: (addr.localArea || "").trim(),
  pincode: (addr.pincode || "").replace(/\D/g, "").slice(0, 6),
  district: (addr.district || "").trim(),
  state: (addr.state || "").trim(),
  address: formatAddressText(addr),
});

const clinicAddressStorageKey = (clinicId?: string) =>
  `clinic-addresses:${clinicId || "guest"}`;

const clinicSelectedAddressStorageKey = (clinicId?: string) =>
  `clinic-address-index:${clinicId || "guest"}`;

const doctorAddressStorageKey = (doctorId?: string) =>
  `doctor-addresses:${doctorId || "guest"}`;

const doctorSelectedAddressStorageKey = (doctorId?: string) =>
  `doctor-address-index:${doctorId || "guest"}`;

const readStoredClinicAddresses = (clinicId?: string) => {
  if (typeof window === "undefined") return [] as Address[];
  try {
    const stored = localStorage.getItem(clinicAddressStorageKey(clinicId));
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? mergeAddresses([], parsed.map(normalizeAddress)) : [];
  } catch {
    return [];
  }
};

const readStoredClinicAddressIndex = (clinicId?: string) => {
  if (typeof window === "undefined") return 0;
  const value = Number(localStorage.getItem(clinicSelectedAddressStorageKey(clinicId)));
  return Number.isFinite(value) && value >= 0 ? value : 0;
};

const readStoredDoctorAddresses = (doctorId?: string) => {
  if (typeof window === "undefined") return [] as Address[];
  try {
    const stored = localStorage.getItem(doctorAddressStorageKey(doctorId));
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? mergeAddresses([], parsed.map(normalizeAddress)) : [];
  } catch {
    return [];
  }
};

const readStoredDoctorAddressIndex = (doctorId?: string) => {
  if (typeof window === "undefined") return 0;
  const value = Number(localStorage.getItem(doctorSelectedAddressStorageKey(doctorId)));
  return Number.isFinite(value) && value >= 0 ? value : 0;
};

const AddressPage: React.FC = () => {
  const router = useRouter();
  const currentRole = Cookies.get("role")?.toLowerCase();
  const isClinicMode = currentRole === "clinic";
  const isDoctorMode = currentRole === "doctor";
  const { cartItems, hydrated: cartHydrated } = useCart();

  const [user, setUser] = useState<IUserProfile | null>(null);
  const [clinic, setClinic] = useState<IClinicProfile | null>(null);
  const [doctor, setDoctor] = useState<IDoctorProfile | null>(null);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [checkoutLoaded, setCheckoutLoaded] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showClinicEditModal, setShowClinicEditModal] = useState(false);
  const [showClinicAddModal, setShowClinicAddModal] = useState(false);
  const [showClinicAddressEditModal, setShowClinicAddressEditModal] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [editingClinicAddressIndex, setEditingClinicAddressIndex] = useState<number | null>(null);
  const [editAddress, setEditAddress] = useState<Address>({ ...emptyAddress });
  const [newAddress, setNewAddress] = useState<Address>({ ...emptyAddress });
  const [clinicAddresses, setClinicAddresses] = useState<Address[]>([]);
  const [doctorAddresses, setDoctorAddresses] = useState<Address[]>([]);
  const [selectedClinicAddressIndex, setSelectedClinicAddressIndex] = useState(0);
  const [selectedDoctorAddressIndex, setSelectedDoctorAddressIndex] = useState(0);
  const [clinicNewAddress, setClinicNewAddress] = useState<Address>({
    ...emptyAddress,
    type: "Office",
  });
  const [clinicEditAddress, setClinicEditAddress] = useState<Address>({
    ...emptyAddress,
    type: "Office",
  });
  const [doctorNewAddress, setDoctorNewAddress] = useState<Address>({
    ...emptyAddress,
    type: "Office",
  });
  const [doctorEditAddress, setDoctorEditAddress] = useState<Address>({
    ...emptyAddress,
    type: "Office",
  });
  const [showDoctorAddModal, setShowDoctorAddModal] = useState(false);
  const [showDoctorAddressEditModal, setShowDoctorAddressEditModal] = useState(false);
  const [editingDoctorAddressIndex, setEditingDoctorAddressIndex] = useState<number | null>(null);
  const [clinicEditForm, setClinicEditForm] = useState<IClinicEditForm>({ ...emptyClinicEditForm });
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const fetchPincodeMeta = async (pincode: string, setter: (patch: Partial<Address>) => void) => {
    if (pincode.length !== 6) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      const office = data?.[0]?.PostOffice?.[0];
      if (!office) return;
      setter({ district: office.District || "", state: office.State || "" });
    } catch {
      // Ignore pincode lookup failures and allow manual entry.
    }
  };

  const updateClinicAddresses = useCallback(
    async (nextAddresses: Address[], selectedIndex: number, options?: { skipBackend?: boolean }) => {
      const normalized = mergeAddresses([], nextAddresses.map(normalizeAddress));
      const safeIndex = normalized.length
        ? Math.min(Math.max(selectedIndex, 0), normalized.length - 1)
        : 0;

      setClinicAddresses(normalized);
      setSelectedClinicAddressIndex(safeIndex);

      if (typeof window !== "undefined") {
        const clinicId = clinic?._id || Cookies.get("clinicId") || localStorage.getItem("clinicId") || "";
        localStorage.setItem(clinicAddressStorageKey(clinicId), JSON.stringify(normalized));
        localStorage.setItem(clinicSelectedAddressStorageKey(clinicId), String(safeIndex));
      }

      const selectedAddress = normalized[safeIndex] || normalized[0] || emptyAddress;
      setClinic((prev) =>
        prev
          ? {
              ...prev,
              address: formatAddressText(selectedAddress),
              addresses: normalized,
            }
          : prev
      );

      if (options?.skipBackend) return;

      if (clinic?._id) {
        try {
          const formData = new FormData();
          formData.append("clinicName", clinicEditForm.clinicName || clinic?.clinicName || "");
          formData.append("email", clinicEditForm.email || clinic?.email || "");
          formData.append(
            "contactNumber",
            clinicEditForm.contactNumber || clinic?.contactNumber || ""
          );
          formData.append("ownerName", clinicEditForm.ownerName || clinic?.ownerName || "");
          formData.append("address", formatAddressText(selectedAddress));
          formData.append("addresses", JSON.stringify(normalized.map(toBackendAddress)));

          const res = await fetch(`${API_URL}/clinics/${clinic._id}`, {
            method: "PUT",
            body: formData,
          });

          if (res.ok) {
            const updatedClinic = await res.json();
            const persistedAddresses = Array.isArray(updatedClinic.addresses)
              ? mergeAddresses([], updatedClinic.addresses.map(normalizeAddress))
              : normalized;
            setClinic((prev) =>
              prev
                ? {
                    ...prev,
                    clinicName: updatedClinic.clinicName || prev.clinicName,
                    email: updatedClinic.email || prev.email,
                    contactNumber: updatedClinic.contactNumber || prev.contactNumber,
                    ownerName: updatedClinic.ownerName || prev.ownerName,
                    address:
                      updatedClinic.address ||
                      formatAddressText(persistedAddresses[safeIndex] || persistedAddresses[0] || selectedAddress),
                    addresses: persistedAddresses,
                    clinicLogo: updatedClinic.clinicLogo || prev.clinicLogo,
                  }
                : prev
            );
            setClinicAddresses(persistedAddresses);
            setSelectedClinicAddressIndex(
              Math.min(safeIndex, Math.max(0, persistedAddresses.length - 1))
            );
          }
        } catch (err) {
          console.error("Failed to persist clinic addresses:", err);
        }
      }
    },
    [clinic?._id, clinic?.address, clinic?.clinicName, clinic?.contactNumber, clinic?.email, clinic?.ownerName, clinicEditForm]
  );

  const selectUserAddress = (index: number) => {
    setSelectedAddressIndex(index);
  };

  const selectClinicAddress = (index: number) => {
    setSelectedClinicAddressIndex(index);
    void updateClinicAddresses(clinicAddresses, index, { skipBackend: true });
  };

  const updateDoctorAddresses = useCallback(
    async (nextAddresses: Address[], selectedIndex: number, options?: { skipBackend?: boolean }) => {
      const normalized = mergeAddresses([], nextAddresses.map(normalizeAddress));
      const safeIndex = normalized.length
        ? Math.min(Math.max(selectedIndex, 0), normalized.length - 1)
        : 0;
      const doctorId = doctor?.id || doctor?._id || Cookies.get("doctorId") || localStorage.getItem("doctorId") || "";

      setDoctorAddresses(normalized);
      setSelectedDoctorAddressIndex(safeIndex);

      if (typeof window !== "undefined") {
        localStorage.setItem(doctorAddressStorageKey(doctorId), JSON.stringify(normalized));
        localStorage.setItem(doctorSelectedAddressStorageKey(doctorId), String(safeIndex));
      }

      const selectedAddress = normalized[safeIndex] || normalized[0] || emptyAddress;
      setDoctor((prev) =>
        prev
          ? {
              ...prev,
              address: formatAddressText(selectedAddress),
              addresses: normalized,
            }
          : prev
      );

      if (options?.skipBackend || !doctorId) return;

      try {
        const token = Cookies.get("token");
        const res = await fetch(`${API_URL}/doctors/${doctorId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            addresses: normalized.map(toBackendAddress),
            address: formatAddressText(selectedAddress),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const updatedDoctor = data?.doctor || data;
          const persistedAddresses = Array.isArray(updatedDoctor?.addresses)
            ? mergeAddresses([], updatedDoctor.addresses.map(normalizeAddress))
            : normalized;
          setDoctor((prev) =>
            prev
              ? {
                  ...prev,
                  address: updatedDoctor?.address || formatAddressText(selectedAddress),
                  addresses: persistedAddresses,
                }
              : prev
          );
          setDoctorAddresses(persistedAddresses);
        }
      } catch (err) {
        console.error("Failed to persist doctor addresses:", err);
      }
    },
    [doctor?.id, doctor?._id]
  );

  const selectDoctorAddress = (index: number) => {
    setSelectedDoctorAddressIndex(index);
    void updateDoctorAddresses(doctorAddresses, index, { skipBackend: true });
  };

  const fetchUser = useCallback(async () => {
    if (isClinicMode || isDoctorMode) return;
    const email = Cookies.get("email");
    const token = Cookies.get("token");
    if (!email || !token) {
      router.replace("/Login?next=/home/Address");
      return;
    }

    try {
      setIsLoadingUser(true);
      const res = await fetch(`${API_URL}/users/by-email/${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        const rawAddresses = Array.isArray(data.addresses) ? data.addresses : [];
        const addresses = mergeAddresses([], rawAddresses.map(normalizeAddress));
        setUser({
          _id: data._id,
          email: data.email,
          name: data.name,
          addresses,
          profileImage: data.profileImage,
        });
        setSelectedAddressIndex((prev) => Math.min(prev, Math.max(0, addresses.length - 1)));
      } else {
        router.replace("/Login?next=/home/Address");
      }
    } catch {
      router.replace("/Login?next=/home/Address");
    } finally {
      setIsLoadingUser(false);
    }
  }, [isClinicMode, isDoctorMode, router]);

  const fetchClinic = useCallback(async () => {
    if (!isClinicMode) return;
    const clinicId = Cookies.get("clinicId") || localStorage.getItem("clinicId");
    if (!clinicId) {
      router.replace("/cliniclogin?next=/home/Address");
      return;
    }

    try {
      setIsLoadingUser(true);
      const res = await fetch(`${API_URL}/clinics/${clinicId}`);
      if (!res.ok) throw new Error("Failed to fetch clinic profile");
      const data = await res.json();
      const apiAddresses = Array.isArray(data.addresses)
        ? mergeAddresses([], data.addresses.map(normalizeAddress))
        : [];
      const fallbackAddress = data.address || "";
      const storedAddresses = readStoredClinicAddresses(clinicId);
      const mergedAddresses =
        apiAddresses.length > 0
          ? apiAddresses
          : fallbackAddress
          ? [
              createClinicAddress({
                clinicName: data.clinicName || Cookies.get("clinicName") || "Clinic",
                contactNumber: data.contactNumber || Cookies.get("contactNo") || "",
                address: fallbackAddress,
              }),
            ]
          : storedAddresses;
      const selectedIndex = Math.min(
        readStoredClinicAddressIndex(clinicId),
        Math.max(0, mergedAddresses.length - 1)
      );
      setClinic({
        _id: data._id,
        clinicName: data.clinicName || Cookies.get("clinicName") || "Clinic",
        email: data.email || Cookies.get("email") || "",
        contactNumber: data.contactNumber || Cookies.get("contactNo") || "",
        address: data.address || "",
        addresses: mergedAddresses,
        clinicLogo: data.clinicLogo || "",
        ownerName: data.ownerName || "",
      });
      setClinicAddresses(mergedAddresses);
      setSelectedClinicAddressIndex(selectedIndex);
      setClinicEditForm({
        clinicName: data.clinicName || Cookies.get("clinicName") || "",
        email: data.email || Cookies.get("email") || "",
        contactNumber: data.contactNumber || Cookies.get("contactNo") || "",
        ownerName: data.ownerName || "",
        ...(() => {
          const selected = mergedAddresses[selectedIndex] || mergedAddresses[0] || emptyAddress;
          return {
            houseNo: selected.houseNo || "",
            street: selected.street || "",
            localArea: selected.localArea || "",
            pincode: selected.pincode || "",
            district: selected.district || "",
            state: selected.state || "",
          };
        })(),
      });
    } catch {
      router.replace("/cliniclogin?next=/home/Address");
    } finally {
      setIsLoadingUser(false);
    }
  }, [isClinicMode, router]);

  const fetchDoctor = useCallback(async () => {
    if (!isDoctorMode) return;
    const token = Cookies.get("token");
    const doctorId = Cookies.get("doctorId") || localStorage.getItem("doctorId") || "";
    if (!token || !doctorId) {
      router.replace("/doctorlogin?next=/home/Address");
      return;
    }

    try {
      setIsLoadingUser(true);
      const res = await fetch(`${API_URL}/doctors/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch doctor profile");
      const data = await res.json();
      const apiAddresses = Array.isArray(data.addresses)
        ? mergeAddresses([], data.addresses.map(normalizeAddress))
        : [];
      const fallbackAddress = data.address || "";
      const storedAddresses = readStoredDoctorAddresses(doctorId);
      const mergedAddresses =
        apiAddresses.length > 0
          ? apiAddresses
          : fallbackAddress
          ? [
              createDoctorAddress({
                ...data,
                address: fallbackAddress,
              }),
            ]
          : storedAddresses;
      const selectedIndex = Math.min(
        readStoredDoctorAddressIndex(doctorId),
        Math.max(0, mergedAddresses.length - 1)
      );
      setDoctor({
        ...data,
        id: data.id || data._id || doctorId,
        addresses: mergedAddresses,
      });
      setDoctorAddresses(mergedAddresses);
      setSelectedDoctorAddressIndex(selectedIndex);
    } catch {
      router.replace("/doctorlogin?next=/home/Address");
    } finally {
      setIsLoadingUser(false);
    }
  }, [isDoctorMode, router]);

  useEffect(() => {
    if (isClinicMode) {
      fetchClinic();
    } else if (isDoctorMode) {
      fetchDoctor();
    } else {
      fetchUser();
    }
  }, [fetchClinic, fetchDoctor, fetchUser, isClinicMode, isDoctorMode]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(TREATMENT_CHECKOUT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCheckoutItems(parsed);
        }
      }
    } catch {
      setCheckoutItems([]);
    } finally {
      setCheckoutLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!showEditModal || editingAddressIndex === null || !user?.addresses?.length) return;
    const current = user.addresses[editingAddressIndex];
    if (current) {
      setEditAddress(normalizeAddress(current));
    }
  }, [showEditModal, editingAddressIndex, user]);

  useEffect(() => {
    const handleAddressUpdated = () => {
      if (isClinicMode) {
        fetchClinic();
      } else if (isDoctorMode) {
        fetchDoctor();
      } else {
        fetchUser();
      }
    };
    window.addEventListener("addresses-updated", handleAddressUpdated);
    window.addEventListener("profile-updated", handleAddressUpdated);
    return () => {
      window.removeEventListener("addresses-updated", handleAddressUpdated);
      window.removeEventListener("profile-updated", handleAddressUpdated);
    };
  }, [fetchClinic, fetchDoctor, fetchUser, isClinicMode, isDoctorMode]);

  const activeItems = cartItems.length > 0 ? cartItems : checkoutItems;
  const isTreatmentCheckout = checkoutItems.length > 0 && cartItems.length === 0;

  useEffect(() => {
    if (isLoadingUser || !checkoutLoaded || !cartHydrated) return;
    if (activeItems.length === 0) {
      router.replace(isClinicMode || isDoctorMode ? "/home" : "/home/Cart");
    }
  }, [activeItems.length, cartHydrated, checkoutLoaded, isClinicMode, isDoctorMode, isLoadingUser, router]);

  if (isClinicMode && (isLoadingUser || !checkoutLoaded || !cartHydrated)) {
    return (
      <div className={styles.page}>
        <Topbar />
        <p className={styles.message}>Loading...</p>
      </div>
    );
  }

  if (isClinicMode) {
    const clinicSubtotalMrp = activeItems.reduce(
      (acc, item) => acc + (item.mrp != null ? item.mrp : item.price) * item.quantity,
      0
    );
    const clinicOfferTotal = activeItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const clinicTotalDiscount = Math.max(0, clinicSubtotalMrp - clinicOfferTotal);
    const clinicTotalPayable = clinicOfferTotal;
    const clinicProfile = clinic;
    const selectedClinicAddress =
      clinicAddresses[selectedClinicAddressIndex] ||
      clinicAddresses[0] ||
      createClinicAddress({
        clinicName: clinicProfile!.clinicName,
        contactNumber: clinicProfile!.contactNumber || "",
        address: clinicProfile!.address || "",
      });

    if (!clinic) {
      return (
        <div className={styles.page}>
          <Topbar />
          <p className={styles.message}>Loading...</p>
        </div>
      );
    }

    return (
      <div className={styles.page}>
        <Topbar />
        <div className={styles.header}>
          <div className={styles.logo}>
            <h1>Clinic Address</h1>
          </div>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.circleFilled}>
                <FaShoppingCart />
              </div>
              <div className={styles.labelActive}>Cart</div>
            </div>
            <div className={styles.line}></div>
            <div className={styles.step}>
              <div className={styles.circleOutlined}>
                <FaCreditCard />
              </div>
              <div className={styles.labelActive}>Clinic Address</div>
            </div>
            <div className={styles.line}></div>
            <div className={styles.step}>
              <div className={styles.circleGrey}>
                <FaCreditCard />
              </div>
              <div className={styles.labelDisabled}>Payment</div>
            </div>
          </div>
        </div>

        <div className={styles.heroBand}>
          <div>
            <p className={styles.heroEyebrow}>Secure checkout</p>
            <h2 className={styles.heroTitle}>Confirm your clinic billing details</h2>
            <p className={styles.heroCopy}>
              We will use your clinic profile details for billing and payment.
            </p>
          </div>
          <div className={styles.heroBadge}>
            <BsShieldCheck />
            <span>Address verified</span>
          </div>
        </div>

        <div className={styles.wrapper}>
          <div className={styles.left}>
            <div className={styles.userCard}>
              {clinic.clinicLogo ? (
                <img
                  src={resolveMediaUrl(clinic.clinicLogo) || ""}
                  alt={clinic.clinicName}
                  className={styles.avatarImage}
                />
              ) : (
                <FaUserCircle className={styles.avatar} />
              )}
              <div className={styles.userInfo}>
                <div className={styles.username}>{clinic.clinicName}</div>
                <div className={styles.secureLogin}>
                  <BsShieldCheck /> Billing as clinic account
                </div>
              </div>
              <div className={styles.phone}>Email: {clinic.email || "-"}</div>
            </div>

            <div className={styles.addressBox}>
              <div className={styles.addressHeader}>
                <h3>Clinic Billing Address</h3>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <span className={styles.addLink} onClick={() => handleOpenClinicAddressModal()}>
                    + Add Address
                  </span>
                  {/* <span className={styles.addLink} onClick={handleOpenClinicEditModal}>
                    Edit Selected Address
                  </span> */}
                </div>
              </div>
                {clinicAddresses.length > 0 ? (
                  clinicAddresses.map((addr, index) => {
                    const isSelected = selectedClinicAddressIndex === index;
                    return (
                      <div
                        key={`${addr.fullName || clinic.clinicName}-${index}`}
                        className={`${styles.addressCard} ${
                          isSelected ? styles.addressSelected : ""
                        }`}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectClinicAddress(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectClinicAddress(index);
                          }
                        }}
                      >
                        <div className={styles.radioRow}>
                          <button
                            type="button"
                            className={styles.radioButton}
                            aria-label={isSelected ? "Selected address" : "Select address"}
                            onClick={(e) => {
                              e.stopPropagation();
                              selectClinicAddress(index);
                            }}
                          >
                            {isSelected ? (
                              <MdOutlineRadioButtonChecked className={styles.radio} />
                            ) : (
                              <MdOutlineRadioButtonUnchecked className={styles.radio} />
                            )}
                          </button>
                        <div className={styles.addressText}>
                          <strong>{addr.fullName || clinic.clinicName}</strong>
                          <p>{formatAddressText(addr) || addr.address || "-"}</p>
                          <small>Phone: {addr.mobileNo || clinic.contactNumber || "-"}</small>
                        </div>
                        <div className={styles.addressActions}>
                          <MdOutlineEdit
                            className={styles.editIcon}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenClinicAddressModal(index);
                            }}
                          />
                          <MdOutlineDelete
                            className={styles.deleteIcon}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClinicAddress(index);
                            }}
                          />
                        </div>
                      </div>
                      <div className={styles.tagRow}>
                        <strong>{sanitizeAddressType(addr.type)}</strong>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.addressCard}>
                  <div className={styles.addressText}>
                    <strong>{clinic.clinicName}</strong>
                    <p>{clinic.address || "-"}</p>
                    <small>Phone: {clinic.contactNumber || "-"}</small>
                  </div>
                  <strong>{clinic.ownerName || "Clinic"}</strong>
                </div>
              )}
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.summaryTop}>
              <div>
                <p className={styles.summaryKicker}>Review your order</p>
                <h3 className={styles.summaryTitle}>Clinic cart summary</h3>
              </div>
              <div className={styles.summaryPill}>{activeItems.length} item(s)</div>
            </div>

            <div className={styles.summaryItems}>
              {activeItems.map((item) => (
                <div key={item.id} className={styles.summaryItem}>
                  <div className={styles.summaryItemCopy}>
                    <span>{item.name}</span>
                    <small>Qty {item.quantity}</small>
                  </div>
                  <strong>Rs. {(item.price * item.quantity).toLocaleString("en-IN")}</strong>
                </div>
              ))}
            </div>

            <div className={styles.summaryBreakdown}>
              <div className={styles.summaryRow}>
                <span>Subtotal (MRP)</span>
                <span>Rs. {clinicSubtotalMrp.toLocaleString("en-IN")}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Offer Price</span>
                <span>Rs. {clinicOfferTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className={styles.savingsNote}>
                You save Rs. {clinicTotalDiscount.toLocaleString("en-IN")}
              </div>
              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>Rs. {clinicTotalPayable.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              className={styles.saveDeliver}
              onClick={() => {
                router.push({
                  pathname: "/home/PaymentPage",
                  query: {
                    type: "Clinic",
                    address: formatAddressText(selectedClinicAddress) || clinic.address,
                    clinicName: clinic.clinicName,
                    clinicId: clinic._id || Cookies.get("clinicId") || "",
                    flow: "clinic",
                  },
                });
              }}
            >
              Proceed to Pay Rs. {clinicTotalPayable.toLocaleString("en-IN")}
            </button>
          </div>
        </div>

        {showClinicEditModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalBox}>
              <h3>Edit Clinic Profile</h3>
              <div className={styles.modalBody}>
                <div className={styles.modalGrid}>
                  <div>
                    <label>Clinic Name</label>
                    <input
                      value={clinicEditForm.clinicName}
                      onChange={(e) =>
                        setClinicEditForm((prev) => ({ ...prev, clinicName: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Email</label>
                    <input
                      value={clinicEditForm.email}
                      onChange={(e) =>
                        setClinicEditForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Contact Number</label>
                    <input
                      value={clinicEditForm.contactNumber}
                      onChange={(e) =>
                        setClinicEditForm((prev) => ({
                          ...prev,
                          contactNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label>Owner Name</label>
                    <input
                      value={clinicEditForm.ownerName}
                      onChange={(e) =>
                        setClinicEditForm((prev) => ({ ...prev, ownerName: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>House No</label>
                    <input
                      value={clinicEditForm.houseNo}
                      onChange={(e) =>
                        setClinicEditForm((prev) => ({ ...prev, houseNo: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Street</label>
                    <input
                      value={clinicEditForm.street}
                      onChange={(e) =>
                        setClinicEditForm((prev) => ({ ...prev, street: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Local Area</label>
                    <input
                      value={clinicEditForm.localArea}
                      onChange={(e) =>
                        setClinicEditForm((prev) => ({ ...prev, localArea: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Pincode</label>
                    <input
                      value={clinicEditForm.pincode}
                      onChange={(e) => {
                        const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setClinicEditForm((prev) => ({ ...prev, pincode }));
                        fetchPincodeMeta(pincode, (patch) =>
                          setClinicEditForm((prev) => ({ ...prev, ...patch }))
                        );
                      }}
                    />
                  </div>
                  <div>
                    <label>District</label>
                    <input
                      value={clinicEditForm.district}
                      onChange={(e) =>
                        setClinicEditForm((prev) => ({ ...prev, district: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>State</label>
                    <input
                      value={clinicEditForm.state}
                      onChange={(e) =>
                        setClinicEditForm((prev) => ({ ...prev, state: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <button onClick={handleSaveClinicAddress}>Save Clinic Details</button>
              </div>
              <IoClose
                className={styles.closeBtn}
                onClick={() => setShowClinicEditModal(false)}
              />
            </div>
          </div>
        )}

        {showClinicAddModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalBox}>
              <h3>Add Clinic Address</h3>
              <div className={styles.modalBody}>
                <div className={styles.modalGrid}>
                  <div>
                    <label>Full Name</label>
                    <input
                      value={clinicNewAddress.fullName || ""}
                      onChange={(e) =>
                        setClinicNewAddress((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label>Mobile No</label>
                    <input
                      value={clinicNewAddress.mobileNo || ""}
                      onChange={(e) =>
                        setClinicNewAddress((prev) => ({
                          ...prev,
                          mobileNo: e.target.value.replace(/\D/g, "").slice(0, 10),
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label>House No</label>
                    <input
                      value={clinicNewAddress.houseNo || ""}
                      onChange={(e) =>
                        setClinicNewAddress((prev) => ({ ...prev, houseNo: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Street</label>
                    <input
                      value={clinicNewAddress.street || ""}
                      onChange={(e) =>
                        setClinicNewAddress((prev) => ({ ...prev, street: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Local Area</label>
                    <input
                      value={clinicNewAddress.localArea || ""}
                      onChange={(e) =>
                        setClinicNewAddress((prev) => ({ ...prev, localArea: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Pincode</label>
                    <input
                      value={clinicNewAddress.pincode || ""}
                      onChange={(e) => {
                        const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setClinicNewAddress((prev) => ({ ...prev, pincode }));
                        fetchPincodeMeta(pincode, (patch) =>
                          setClinicNewAddress((prev) => ({ ...prev, ...patch }))
                        );
                      }}
                    />
                  </div>
                  <div>
                    <label>District</label>
                    <input
                      value={clinicNewAddress.district || ""}
                      onChange={(e) =>
                        setClinicNewAddress((prev) => ({ ...prev, district: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>State</label>
                    <input
                      value={clinicNewAddress.state || ""}
                      onChange={(e) =>
                        setClinicNewAddress((prev) => ({ ...prev, state: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Address Type</label>
                    <select
                      value={clinicNewAddress.type || "Office"}
                      onChange={(e) =>
                        setClinicNewAddress((prev) => ({
                          ...prev,
                          type: sanitizeAddressType(e.target.value),
                        }))
                      }
                    >
                      {ADDRESS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={handleSaveClinicNewAddress}>Save Address</button>
              </div>
              <IoClose
                className={styles.closeBtn}
                onClick={() => setShowClinicAddModal(false)}
              />
            </div>
          </div>
        )}

        {showClinicAddressEditModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalBox}>
              <h3>Edit Clinic Address</h3>
              <div className={styles.modalBody}>
                <div className={styles.modalGrid}>
                  <div>
                    <label>Full Name</label>
                    <input
                      value={clinicEditAddress.fullName || ""}
                      onChange={(e) =>
                        setClinicEditAddress((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label>Mobile No</label>
                    <input
                      value={clinicEditAddress.mobileNo || ""}
                      onChange={(e) =>
                        setClinicEditAddress((prev) => ({
                          ...prev,
                          mobileNo: e.target.value.replace(/\D/g, "").slice(0, 10),
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label>House No</label>
                    <input
                      value={clinicEditAddress.houseNo || ""}
                      onChange={(e) =>
                        setClinicEditAddress((prev) => ({ ...prev, houseNo: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Street</label>
                    <input
                      value={clinicEditAddress.street || ""}
                      onChange={(e) =>
                        setClinicEditAddress((prev) => ({ ...prev, street: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Local Area</label>
                    <input
                      value={clinicEditAddress.localArea || ""}
                      onChange={(e) =>
                        setClinicEditAddress((prev) => ({ ...prev, localArea: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Pincode</label>
                    <input
                      value={clinicEditAddress.pincode || ""}
                      onChange={(e) => {
                        const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setClinicEditAddress((prev) => ({ ...prev, pincode }));
                        fetchPincodeMeta(pincode, (patch) =>
                          setClinicEditAddress((prev) => ({ ...prev, ...patch }))
                        );
                      }}
                    />
                  </div>
                  <div>
                    <label>District</label>
                    <input
                      value={clinicEditAddress.district || ""}
                      onChange={(e) =>
                        setClinicEditAddress((prev) => ({ ...prev, district: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>State</label>
                    <input
                      value={clinicEditAddress.state || ""}
                      onChange={(e) =>
                        setClinicEditAddress((prev) => ({ ...prev, state: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Address Type</label>
                    <select
                      value={clinicEditAddress.type || "Office"}
                      onChange={(e) =>
                        setClinicEditAddress((prev) => ({
                          ...prev,
                          type: sanitizeAddressType(e.target.value),
                        }))
                      }
                    >
                      {ADDRESS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={handleSaveClinicEditedAddress}>Save Address</button>
              </div>
              <IoClose
                className={styles.closeBtn}
                onClick={() => {
                  setShowClinicAddressEditModal(false);
                  setEditingClinicAddressIndex(null);
                }}
              />
            </div>
          </div>
        )}

        <MobileNavbar />
      </div>
    );
  }

  if (isDoctorMode) {
    const doctorSubtotalMrp = activeItems.reduce(
      (acc, item) => acc + (item.mrp != null ? item.mrp : item.price) * item.quantity,
      0
    );
    const doctorOfferTotal = activeItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const doctorTotalDiscount = Math.max(0, doctorSubtotalMrp - doctorOfferTotal);
    const doctorTotalPayable = doctorOfferTotal;
    const doctorDisplayName =
      doctor?.name ||
      [doctor?.title, doctor?.firstName, doctor?.lastName].filter(Boolean).join(" ") ||
      "Doctor";
    const selectedDoctorAddress =
      doctorAddresses[selectedDoctorAddressIndex] ||
      doctorAddresses[0] ||
      createDoctorAddress({
        ...doctor,
        name: doctorDisplayName,
        contactNo: doctor?.contactNo || doctor?.phone || "",
        address: doctor?.address || "",
      });

    if (isLoadingUser || !doctor || !checkoutLoaded || !cartHydrated) {
      return (
        <div className={styles.page}>
          <Topbar />
          <p className={styles.message}>Loading...</p>
        </div>
      );
    }

    return (
      <div className={styles.page}>
        <Topbar />
        <div className={styles.header}>
          <div className={styles.logo}>
            <h1>Doctor Address</h1>
          </div>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.circleFilled}>
                <FaShoppingCart />
              </div>
              <div className={styles.labelActive}>Cart</div>
            </div>
            <div className={styles.line}></div>
            <div className={styles.step}>
              <div className={styles.circleOutlined}>
                <FaCreditCard />
              </div>
              <div className={styles.labelActive}>Doctor Address</div>
            </div>
            <div className={styles.line}></div>
            <div className={styles.step}>
              <div className={styles.circleGrey}>
                <FaCreditCard />
              </div>
              <div className={styles.labelDisabled}>Payment</div>
            </div>
          </div>
        </div>

        <div className={styles.heroBand}>
          <div>
            <p className={styles.heroEyebrow}>Secure checkout</p>
            <h2 className={styles.heroTitle}>Confirm your doctor billing details</h2>
            <p className={styles.heroCopy}>
              We will use your doctor profile details for billing and payment.
            </p>
          </div>
          <div className={styles.heroBadge}>
            <BsShieldCheck />
            <span>Address verified</span>
          </div>
        </div>

        <div className={styles.wrapper}>
          <div className={styles.left}>
            <div className={styles.userCard}>
              <FaUserCircle className={styles.avatar} />
              <div className={styles.userInfo}>
                <div className={styles.username}>{doctorDisplayName}</div>
                <div className={styles.secureLogin}>
                  <BsShieldCheck /> Billing as doctor account
                </div>
              </div>
              <div className={styles.phone}>Email: {doctor.email || "-"}</div>
            </div>

            <div className={styles.addressBox}>
              <div className={styles.addressHeader}>
                <h3>Doctor Billing Address</h3>
                <span className={styles.addLink} onClick={() => handleOpenDoctorAddressModal()}>
                  + Add Address
                </span>
              </div>

              {doctorAddresses.length > 0 ? (
                doctorAddresses.map((addr, index) => {
                  const isSelected = selectedDoctorAddressIndex === index;
                  return (
                    <div
                      key={`${addr.fullName || doctorDisplayName}-${index}`}
                      className={`${styles.addressCard} ${isSelected ? styles.addressSelected : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectDoctorAddress(index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectDoctorAddress(index);
                        }
                      }}
                    >
                      <div className={styles.radioRow}>
                        <button
                          type="button"
                          className={styles.radioButton}
                          aria-label={isSelected ? "Selected address" : "Select address"}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectDoctorAddress(index);
                          }}
                        >
                          {isSelected ? (
                            <MdOutlineRadioButtonChecked className={styles.radio} />
                          ) : (
                            <MdOutlineRadioButtonUnchecked className={styles.radio} />
                          )}
                        </button>
                        <div className={styles.addressText}>
                          <strong>{addr.fullName || doctorDisplayName}</strong>
                          <p>{formatAddressText(addr) || addr.address || "-"}</p>
                          <small>Phone: {addr.mobileNo || doctor.contactNo || doctor.phone || "-"}</small>
                        </div>
                        <div className={styles.addressActions}>
                          <MdOutlineEdit
                            className={styles.editIcon}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDoctorAddressModal(index);
                            }}
                          />
                          <MdOutlineDelete
                            className={styles.deleteIcon}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDoctorAddress(index);
                            }}
                          />
                        </div>
                      </div>
                      <div className={styles.tagRow}>
                        <strong>{sanitizeAddressType(addr.type)}</strong>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.addressCard}>
                  <div className={styles.addressText}>
                    <strong>{doctorDisplayName}</strong>
                    <p>{doctor.address || "Add a billing address to continue."}</p>
                    <small>Phone: {doctor.contactNo || doctor.phone || "-"}</small>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.summaryTop}>
              <div>
                <p className={styles.summaryKicker}>Review your order</p>
                <h3 className={styles.summaryTitle}>Doctor cart summary</h3>
              </div>
              <div className={styles.summaryPill}>{activeItems.length} item(s)</div>
            </div>

            <div className={styles.summaryItems}>
              {activeItems.map((item) => (
                <div key={item.id} className={styles.summaryItem}>
                  <div className={styles.summaryItemCopy}>
                    <span>{item.name}</span>
                    <small>Qty {item.quantity}</small>
                  </div>
                  <strong>Rs. {(item.price * item.quantity).toLocaleString("en-IN")}</strong>
                </div>
              ))}
            </div>

            <div className={styles.summaryBreakdown}>
              <div className={styles.summaryRow}>
                <span>Subtotal (MRP)</span>
                <span>Rs. {doctorSubtotalMrp.toLocaleString("en-IN")}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Offer Price</span>
                <span>Rs. {doctorOfferTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className={styles.savingsNote}>
                You save Rs. {doctorTotalDiscount.toLocaleString("en-IN")}
              </div>
              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>Rs. {doctorTotalPayable.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              className={styles.saveDeliver}
              onClick={() => {
                if (!formatAddressText(selectedDoctorAddress)) {
                  alert("Please add a doctor billing address.");
                  return;
                }

                router.push({
                  pathname: "/home/PaymentPage",
                  query: {
                    type: "Doctor",
                    address: formatAddressText(selectedDoctorAddress) || doctor.address || "",
                    doctorName: doctorDisplayName,
                    doctorId: doctor.id || doctor._id || Cookies.get("doctorId") || "",
                    flow: "doctor",
                  },
                });
              }}
            >
              Proceed to Pay Rs. {doctorTotalPayable.toLocaleString("en-IN")}
            </button>
          </div>
        </div>

        {showDoctorAddModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalBox}>
              <h3>Add Doctor Address</h3>
              <div className={styles.modalBody}>
                <div className={styles.modalGrid}>
                  <div>
                    <label>Full Name</label>
                    <input
                      value={doctorNewAddress.fullName || ""}
                      onChange={(e) =>
                        setDoctorNewAddress((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Mobile No</label>
                    <input
                      value={doctorNewAddress.mobileNo || ""}
                      onChange={(e) =>
                        setDoctorNewAddress((prev) => ({
                          ...prev,
                          mobileNo: e.target.value.replace(/\D/g, "").slice(0, 10),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label>House No</label>
                    <input
                      value={doctorNewAddress.houseNo || ""}
                      onChange={(e) =>
                        setDoctorNewAddress((prev) => ({ ...prev, houseNo: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Street</label>
                    <input
                      value={doctorNewAddress.street || ""}
                      onChange={(e) =>
                        setDoctorNewAddress((prev) => ({ ...prev, street: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Local Area</label>
                    <input
                      value={doctorNewAddress.localArea || ""}
                      onChange={(e) =>
                        setDoctorNewAddress((prev) => ({ ...prev, localArea: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Pincode</label>
                    <input
                      value={doctorNewAddress.pincode || ""}
                      onChange={(e) => {
                        const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setDoctorNewAddress((prev) => ({ ...prev, pincode }));
                        fetchPincodeMeta(pincode, (patch) =>
                          setDoctorNewAddress((prev) => ({ ...prev, ...patch }))
                        );
                      }}
                    />
                  </div>
                  <div>
                    <label>District</label>
                    <input
                      value={doctorNewAddress.district || ""}
                      onChange={(e) =>
                        setDoctorNewAddress((prev) => ({ ...prev, district: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>State</label>
                    <input
                      value={doctorNewAddress.state || ""}
                      onChange={(e) =>
                        setDoctorNewAddress((prev) => ({ ...prev, state: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Address Type</label>
                    <select
                      value={doctorNewAddress.type || "Office"}
                      onChange={(e) =>
                        setDoctorNewAddress((prev) => ({
                          ...prev,
                          type: sanitizeAddressType(e.target.value),
                        }))
                      }
                    >
                      {ADDRESS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={handleSaveDoctorNewAddress}>Save Address</button>
              </div>
              <IoClose className={styles.closeBtn} onClick={() => setShowDoctorAddModal(false)} />
            </div>
          </div>
        )}

        {showDoctorAddressEditModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalBox}>
              <h3>Edit Doctor Address</h3>
              <div className={styles.modalBody}>
                <div className={styles.modalGrid}>
                  <div>
                    <label>Full Name</label>
                    <input
                      value={doctorEditAddress.fullName || ""}
                      onChange={(e) =>
                        setDoctorEditAddress((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Mobile No</label>
                    <input
                      value={doctorEditAddress.mobileNo || ""}
                      onChange={(e) =>
                        setDoctorEditAddress((prev) => ({
                          ...prev,
                          mobileNo: e.target.value.replace(/\D/g, "").slice(0, 10),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label>House No</label>
                    <input
                      value={doctorEditAddress.houseNo || ""}
                      onChange={(e) =>
                        setDoctorEditAddress((prev) => ({ ...prev, houseNo: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Street</label>
                    <input
                      value={doctorEditAddress.street || ""}
                      onChange={(e) =>
                        setDoctorEditAddress((prev) => ({ ...prev, street: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Local Area</label>
                    <input
                      value={doctorEditAddress.localArea || ""}
                      onChange={(e) =>
                        setDoctorEditAddress((prev) => ({ ...prev, localArea: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Pincode</label>
                    <input
                      value={doctorEditAddress.pincode || ""}
                      onChange={(e) => {
                        const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setDoctorEditAddress((prev) => ({ ...prev, pincode }));
                        fetchPincodeMeta(pincode, (patch) =>
                          setDoctorEditAddress((prev) => ({ ...prev, ...patch }))
                        );
                      }}
                    />
                  </div>
                  <div>
                    <label>District</label>
                    <input
                      value={doctorEditAddress.district || ""}
                      onChange={(e) =>
                        setDoctorEditAddress((prev) => ({ ...prev, district: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>State</label>
                    <input
                      value={doctorEditAddress.state || ""}
                      onChange={(e) =>
                        setDoctorEditAddress((prev) => ({ ...prev, state: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Address Type</label>
                    <select
                      value={doctorEditAddress.type || "Office"}
                      onChange={(e) =>
                        setDoctorEditAddress((prev) => ({
                          ...prev,
                          type: sanitizeAddressType(e.target.value),
                        }))
                      }
                    >
                      {ADDRESS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={handleSaveDoctorEditedAddress}>Save Address</button>
              </div>
              <IoClose
                className={styles.closeBtn}
                onClick={() => {
                  setShowDoctorAddressEditModal(false);
                  setEditingDoctorAddressIndex(null);
                }}
              />
            </div>
          </div>
        )}

        <MobileNavbar />
      </div>
    );
  }

  if (isLoadingUser || !user || !checkoutLoaded || !cartHydrated) {
    return (
      <div className={styles.page}>
        <Topbar />
        <p className={styles.message}>Loading...</p>
      </div>
    );
  }

  const saveAddressesToBackend = async (addresses: Address[], selectedIndex?: number) => {
    if (!user?._id) return;
    const effectiveSelected = selectedIndex ?? selectedAddressIndex;
    try {
      const payloadAddresses = mergeAddresses([], addresses.map(normalizeAddress)).map(toBackendAddress);
      const res = await fetch(`${API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          addresses: payloadAddresses,
          address: formatAddressText(
            addresses[effectiveSelected] || addresses[0] || emptyAddress
          ),
        }),
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("addresses-updated"));
      }
    } catch (err) {
      console.error("Failed to save address:", err);
    }
  };

  function validateAddress(addr: Address) {
    if (
      !addr.fullName?.trim() ||
      !addr.mobileNo?.trim() ||
      !addr.houseNo?.trim() ||
      !addr.street?.trim() ||
      !addr.localArea?.trim() ||
      !addr.pincode?.trim() ||
      !addr.district?.trim() ||
      !addr.state?.trim()
    ) {
      alert("Please fill all address fields.");
      return false;
    }
    if (!/^\d{10}$/.test(addr.mobileNo || "")) {
      alert("Please enter a valid 10-digit mobile number.");
      return false;
    }
    if (!/^\d{6}$/.test(addr.pincode || "")) {
      alert("Please enter a valid 6-digit pincode.");
      return false;
    }
    return true;
  }

  const handleAddAddress = async () => {
    if (!validateAddress(newAddress)) return;
    const payload = toBackendAddress(newAddress);
    const updatedAddresses = mergeAddresses(user?.addresses || [], [payload]);
    const nextIndex = updatedAddresses.length - 1;
    setUser((prev) => (prev ? { ...prev, addresses: updatedAddresses } : null));
    setSelectedAddressIndex(nextIndex);
    setNewAddress({ ...emptyAddress });
    setShowAddModal(false);
    await saveAddressesToBackend(updatedAddresses, nextIndex);
  };

  const handleEditAddress = async () => {
    if (!user) return;
    if (!validateAddress(editAddress)) return;
    const updatedAddresses = [...user.addresses];
    updatedAddresses[selectedAddressIndex] = toBackendAddress(editAddress);
    setUser({ ...user, addresses: mergeAddresses([], updatedAddresses) });
    setShowEditModal(false);
    setEditingAddressIndex(null);
    await saveAddressesToBackend(mergeAddresses([], updatedAddresses), selectedAddressIndex);
  };

  const handleDeleteAddress = async (index: number) => {
    if (!user) return;
    const nextAddresses = user.addresses.filter((_, addressIndex) => addressIndex !== index);
    const nextSelectedIndex =
      nextAddresses.length === 0
        ? 0
        : selectedAddressIndex > index
        ? selectedAddressIndex - 1
        : selectedAddressIndex === index
        ? Math.min(index, nextAddresses.length - 1)
        : selectedAddressIndex;

    setUser((prev) => (prev ? { ...prev, addresses: nextAddresses } : null));
    setSelectedAddressIndex(nextSelectedIndex);
    await saveAddressesToBackend(nextAddresses, nextSelectedIndex);
  };

  const handleOpenEditModal = (index: number) => {
    const selected = user?.addresses?.[index];
    if (!selected) return;
    setSelectedAddressIndex(index);
    setEditingAddressIndex(index);
    setEditAddress(normalizeAddress(selected));
    setShowEditModal(true);
  };

  function handleOpenClinicEditModal() {
    handleOpenClinicAddressModal(selectedClinicAddressIndex);
  }

  function handleOpenClinicAddressModal(index?: number) {
    const selectedIndex =
      typeof index === "number" ? index : selectedClinicAddressIndex;
    const selected = clinicAddresses[selectedIndex] || emptyAddress;
    setEditingClinicAddressIndex(typeof index === "number" ? index : null);
    setClinicNewAddress({
      ...emptyAddress,
      type: selected.type || "Office",
      fullName: clinic?.clinicName || selected.fullName || "",
      mobileNo: clinic?.contactNumber || selected.mobileNo || "",
      houseNo: selected.houseNo || "",
      street: selected.street || "",
      localArea: selected.localArea || "",
      pincode: selected.pincode || "",
      district: selected.district || "",
      state: selected.state || "",
    });
    setClinicEditAddress({
      ...emptyAddress,
      type: selected.type || "Office",
      fullName: clinic?.clinicName || selected.fullName || "",
      mobileNo: clinic?.contactNumber || selected.mobileNo || "",
      houseNo: selected.houseNo || "",
      street: selected.street || "",
      localArea: selected.localArea || "",
      pincode: selected.pincode || "",
      district: selected.district || "",
      state: selected.state || "",
    });
    if (typeof index === "number") {
      setShowClinicAddressEditModal(true);
    } else {
      setShowClinicAddModal(true);
    }
  }

  async function handleSaveClinicAddress() {
    if (!clinic?._id) return;

    const nextClinicName = clinicEditForm.clinicName.trim();
    const nextEmail = clinicEditForm.email.trim();
    const nextClinicAddress = normalizeAddress({
      type: "Office",
      fullName: clinicEditForm.clinicName || clinic?.clinicName || "",
      mobileNo: clinicEditForm.contactNumber || clinic?.contactNumber || "",
      houseNo: clinicEditForm.houseNo,
      street: clinicEditForm.street,
      localArea: clinicEditForm.localArea,
      pincode: clinicEditForm.pincode,
      district: clinicEditForm.district,
      state: clinicEditForm.state,
    });
    const nextAddress = formatAddressText(nextClinicAddress);

    if (!nextClinicName || !nextEmail || !nextAddress) {
      alert("Please fill clinic name, email, and address details.");
      return;
    }
    if (!validateAddress(nextClinicAddress)) return;

    try {
      const payloadAddresses =
        clinicAddresses.length > 0 ? clinicAddresses : [nextClinicAddress];
      const formData = new FormData();
      formData.append("clinicName", nextClinicName);
      formData.append("email", nextEmail);
      formData.append("contactNumber", clinicEditForm.contactNumber.trim());
      formData.append("address", nextAddress);
      formData.append("ownerName", clinicEditForm.ownerName.trim());
      formData.append("addresses", JSON.stringify(payloadAddresses.map(toBackendAddress)));

      const res = await fetch(`${API_URL}/clinics/${clinic._id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to update clinic");
      }

      const updatedClinic = await res.json();
      const persistedAddresses = Array.isArray(updatedClinic.addresses)
        ? mergeAddresses([], updatedClinic.addresses.map(normalizeAddress))
        : payloadAddresses;
      const nextClinic: IClinicProfile = {
        _id: updatedClinic._id,
        clinicName: updatedClinic.clinicName || nextClinicName,
        email: updatedClinic.email || nextEmail,
        contactNumber: updatedClinic.contactNumber || clinicEditForm.contactNumber.trim(),
        address: updatedClinic.address || nextAddress,
        addresses: persistedAddresses,
        clinicLogo: updatedClinic.clinicLogo || clinic?.clinicLogo || "",
        ownerName: updatedClinic.ownerName || clinicEditForm.ownerName.trim(),
      };

      setClinic(nextClinic);
      setClinicAddresses(persistedAddresses);
      setClinicEditForm({
        clinicName: nextClinic.clinicName,
        email: nextClinic.email || "",
        contactNumber: nextClinic.contactNumber || "",
        ownerName: nextClinic.ownerName || "",
        ...(() => {
          const selected = persistedAddresses[selectedClinicAddressIndex] || persistedAddresses[0] || emptyAddress;
          return {
            houseNo: selected.houseNo || "",
            street: selected.street || "",
            localArea: selected.localArea || "",
            pincode: selected.pincode || "",
            district: selected.district || "",
            state: selected.state || "",
          };
        })(),
      });

      if (persistedAddresses.length === 0) {
        await updateClinicAddresses([nextClinicAddress], 0, { skipBackend: true });
      }

      if (nextClinic.clinicName) {
        Cookies.set("clinicName", nextClinic.clinicName, { expires: 7 });
      }
      if (nextClinic.email) {
        Cookies.set("email", nextClinic.email, { expires: 7 });
      }
      if (nextClinic.contactNumber) {
        Cookies.set("contactNo", nextClinic.contactNumber, { expires: 7 });
      }

      window.dispatchEvent(new CustomEvent("profile-updated"));
      setShowClinicEditModal(false);
    } catch (err) {
      console.error("Failed to update clinic profile:", err);
      alert("Could not update clinic details. Please try again.");
    }
  }

  async function handleSaveClinicNewAddress() {
    const nextAddress = normalizeAddress({
      ...clinicNewAddress,
      fullName: clinicNewAddress.fullName || clinic?.clinicName || "",
      mobileNo: clinicNewAddress.mobileNo || clinic?.contactNumber || "",
    });
    if (!validateAddress(nextAddress)) return;
    const nextAddresses = mergeAddresses(clinicAddresses, [nextAddress]);
    const nextSelectedIndex = nextAddresses.length - 1;
    await updateClinicAddresses(nextAddresses, nextSelectedIndex);
    setShowClinicAddModal(false);
    setClinicNewAddress({ ...emptyAddress, type: "Office" });
  }

  async function handleSaveClinicEditedAddress() {
    const nextAddress = normalizeAddress({
      ...clinicEditAddress,
      fullName: clinicEditAddress.fullName || clinic?.clinicName || "",
      mobileNo: clinicEditAddress.mobileNo || clinic?.contactNumber || "",
    });
    if (!validateAddress(nextAddress)) return;
    if (editingClinicAddressIndex === null || !clinicAddresses[editingClinicAddressIndex]) {
      return;
    }
    const nextAddresses = [...clinicAddresses];
    nextAddresses[editingClinicAddressIndex] = nextAddress;
    await updateClinicAddresses(nextAddresses, editingClinicAddressIndex);
    setShowClinicAddressEditModal(false);
    setEditingClinicAddressIndex(null);
  }

  async function handleDeleteClinicAddress(index: number) {
    const nextAddresses = clinicAddresses.filter((_, addressIndex) => addressIndex !== index);
    const nextSelectedIndex =
      nextAddresses.length === 0
        ? 0
        : selectedClinicAddressIndex > index
        ? selectedClinicAddressIndex - 1
        : selectedClinicAddressIndex === index
        ? Math.min(index, nextAddresses.length - 1)
        : selectedClinicAddressIndex;

    await updateClinicAddresses(nextAddresses, nextSelectedIndex);
  }

  function handleOpenDoctorAddressModal(index?: number) {
    const selectedIndex =
      typeof index === "number" ? index : selectedDoctorAddressIndex;
    const selected = doctorAddresses[selectedIndex] || emptyAddress;
    const doctorDisplayName =
      doctor?.name ||
      [doctor?.title, doctor?.firstName, doctor?.lastName].filter(Boolean).join(" ") ||
      "";
    const baseAddress = {
      ...emptyAddress,
      type: selected.type || "Office",
      fullName: doctorDisplayName || selected.fullName || "",
      mobileNo: doctor?.contactNo || doctor?.phone || selected.mobileNo || "",
      houseNo: selected.houseNo || "",
      street: selected.street || "",
      localArea: selected.localArea || "",
      pincode: selected.pincode || "",
      district: selected.district || "",
      state: selected.state || "",
    };

    setEditingDoctorAddressIndex(typeof index === "number" ? index : null);
    setDoctorNewAddress(baseAddress);
    setDoctorEditAddress(baseAddress);

    if (typeof index === "number") {
      setShowDoctorAddressEditModal(true);
    } else {
      setShowDoctorAddModal(true);
    }
  }

  async function handleSaveDoctorNewAddress() {
    const doctorDisplayName =
      doctor?.name ||
      [doctor?.title, doctor?.firstName, doctor?.lastName].filter(Boolean).join(" ") ||
      "";
    const nextAddress = normalizeAddress({
      ...doctorNewAddress,
      fullName: doctorNewAddress.fullName || doctorDisplayName,
      mobileNo: doctorNewAddress.mobileNo || doctor?.contactNo || doctor?.phone || "",
    });
    if (!validateAddress(nextAddress)) return;
    const nextAddresses = mergeAddresses(doctorAddresses, [nextAddress]);
    const nextSelectedIndex = nextAddresses.length - 1;
    await updateDoctorAddresses(nextAddresses, nextSelectedIndex);
    setShowDoctorAddModal(false);
    setDoctorNewAddress({ ...emptyAddress, type: "Office" });
  }

  async function handleSaveDoctorEditedAddress() {
    const doctorDisplayName =
      doctor?.name ||
      [doctor?.title, doctor?.firstName, doctor?.lastName].filter(Boolean).join(" ") ||
      "";
    const nextAddress = normalizeAddress({
      ...doctorEditAddress,
      fullName: doctorEditAddress.fullName || doctorDisplayName,
      mobileNo: doctorEditAddress.mobileNo || doctor?.contactNo || doctor?.phone || "",
    });
    if (!validateAddress(nextAddress)) return;
    if (editingDoctorAddressIndex === null || !doctorAddresses[editingDoctorAddressIndex]) {
      return;
    }
    const nextAddresses = [...doctorAddresses];
    nextAddresses[editingDoctorAddressIndex] = nextAddress;
    await updateDoctorAddresses(nextAddresses, editingDoctorAddressIndex);
    setShowDoctorAddressEditModal(false);
    setEditingDoctorAddressIndex(null);
  }

  async function handleDeleteDoctorAddress(index: number) {
    const nextAddresses = doctorAddresses.filter((_, addressIndex) => addressIndex !== index);
    const nextSelectedIndex =
      nextAddresses.length === 0
        ? 0
        : selectedDoctorAddressIndex > index
        ? selectedDoctorAddressIndex - 1
        : selectedDoctorAddressIndex === index
        ? Math.min(index, nextAddresses.length - 1)
        : selectedDoctorAddressIndex;

    await updateDoctorAddresses(nextAddresses, nextSelectedIndex);
  }

  const handleProceedPayment = () => {
    if (isClinicMode) {
      const clinicPaymentAddress =
        clinicAddresses[selectedClinicAddressIndex] ||
        clinicAddresses[0] ||
        createClinicAddress({
          clinicName: clinic?.clinicName || "",
          contactNumber: clinic?.contactNumber || "",
          address: clinic?.address || "",
        });

      if (!clinic?.clinicName || !formatAddressText(clinicPaymentAddress)) {
        alert("Clinic profile is incomplete.");
        return;
      }

      router.push({
        pathname: "/home/PaymentPage",
        query: {
          type: "Clinic",
          address: formatAddressText(clinicPaymentAddress) || clinic.address || "",
          clinicName: clinic.clinicName,
          clinicId: clinic._id || Cookies.get("clinicId") || "",
          flow: "clinic",
        },
      });
      return;
    }

    if (!user || !user.addresses.length) {
      alert("Please add at least one delivery address.");
      return;
    }
    const selectedAddress = user.addresses[selectedAddressIndex];
    if (!selectedAddress) {
      alert("Please select a delivery address.");
      return;
    }

    router.push({
      pathname: "/home/PaymentPage",
      query: {
        type: selectedAddress.type,
        address: formatAddressText(selectedAddress),
        flow: isTreatmentCheckout ? "treatment" : "cart",
      },
    });
  };

  const subtotalMrp = activeItems.reduce(
    (acc, item) => acc + (item.mrp != null ? item.mrp : item.price) * item.quantity,
    0
  );

  const offerTotal = activeItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const totalDiscount = Math.max(0, subtotalMrp - offerTotal);
  const totalPayable = offerTotal;

  return (
    <div className={styles.page}>
      <Topbar />
      <div className={styles.header}>
        <div className={styles.logo}>
          <h1>{isClinicMode ? "Clinic Address" : "Address"}</h1>
        </div>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.circleFilled}>
              <FaShoppingCart />
            </div>
            <div className={styles.labelActive}>
              {isTreatmentCheckout ? "Treatment" : "Cart"}
            </div>
          </div>
          <div className={styles.line}></div>
          <div className={styles.step}>
            <div className={styles.circleOutlined}>
              <FaCreditCard />
            </div>
            <div className={styles.labelActive}>
              {isClinicMode ? "Clinic Address" : "Address"}
            </div>
          </div>
          <div className={styles.line}></div>
          <div className={styles.step}>
            <div className={styles.circleGrey}>
              <FaCreditCard />
            </div>
            <div className={styles.labelDisabled}>Payment</div>
          </div>
        </div>
      </div>

      <div className={styles.heroBand}>
        <div>
          <p className={styles.heroEyebrow}>Secure checkout</p>
          <h2 className={styles.heroTitle}>
            {isClinicMode
              ? "Confirm your clinic billing details"
              : isTreatmentCheckout
              ? "Confirm your treatment booking details"
              : "Choose your delivery address"}
          </h2>
          <p className={styles.heroCopy}>
            {isClinicMode
              ? "We will use your clinic profile details for billing and payment."
              : "Review your saved addresses, select the one you want, and continue to a clean payment step."}
          </p>
        </div>
        <div className={styles.heroBadge}>
          <BsShieldCheck />
          <span>Address verified</span>
        </div>
      </div>

      <div className={styles.wrapper}>
        <div className={styles.left}>
          {isClinicMode ? (
            <div className={styles.userCard}>
              {clinic?.clinicLogo ? (
                <img
                  src={resolveMediaUrl(clinic.clinicLogo) || ""}
                  alt={clinic.clinicName}
                  className={styles.avatarImage}
                />
              ) : (
                <FaUserCircle className={styles.avatar} />
              )}
              <div className={styles.userInfo}>
                <div className={styles.username}>{clinic?.clinicName}</div>
                <div className={styles.secureLogin}>
                  <BsShieldCheck /> Billing as clinic account
                </div>
              </div>
              <div className={styles.phone}>Email: {clinic?.email || "-"}</div>
            </div>
          ) : (
            <>
              <div className={styles.userCard}>
                {user.profileImage ? (
                  <img
                    src={resolveMediaUrl(user.profileImage) || ""}
                    alt={user.name}
                    className={styles.avatarImage}
                  />
                ) : (
                  <FaUserCircle className={styles.avatar} />
                )}
                <div className={styles.userInfo}>
                  <div className={styles.username}>{user.name}</div>
                  <div className={styles.secureLogin}>
                    <BsShieldCheck /> You are securely logged in with {user.email}
                  </div>
                </div>
                <div className={styles.phone}>Email: {user.email}</div>
              </div>

              <div className={styles.addressBox}>
                <div className={styles.addressHeader}>
                  <h3>Delivery Address</h3>
                  <span className={styles.addLink} onClick={() => setShowAddModal(true)}>
                    + Add Address
                  </span>
                </div>

                {user.addresses.map((addr, index) => {
                  const isSelected = selectedAddressIndex === index;
                  return (
                    <div
                      key={index}
                      className={`${styles.addressCard} ${isSelected ? styles.addressSelected : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectUserAddress(index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectUserAddress(index);
                        }
                      }}
                    >
                      <div className={styles.radioRow}>
                        <button
                          type="button"
                          className={styles.radioButton}
                          aria-label={isSelected ? "Selected address" : "Select address"}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectUserAddress(index);
                          }}
                        >
                          {isSelected ? (
                            <MdOutlineRadioButtonChecked className={styles.radio} />
                          ) : (
                            <MdOutlineRadioButtonUnchecked className={styles.radio} />
                          )}
                        </button>
                        <div className={styles.addressText}>
                          <strong>{addr.fullName || user.name}</strong>
                          <p>{formatAddressText(addr) || addr.address || "-"}</p>
                          <small>Phone: {addr.mobileNo || "-"}</small>
                        </div>
                        <div className={styles.addressActions}>
                          <MdOutlineEdit
                            className={styles.editIcon}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(index);
                            }}
                          />
                          <MdOutlineDelete
                            className={styles.deleteIcon}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAddress(index);
                            }}
                          />
                        </div>
                      </div>
                      <div className={styles.tagRow}>
                        <strong>{sanitizeAddressType(addr.type)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className={styles.right}>
          <div className={styles.summaryTop}>
            <div>
              <p className={styles.summaryKicker}>Review your order</p>
              <h3 className={styles.summaryTitle}>
                {isTreatmentCheckout ? "Treatment booking summary" : "Cart summary"}
              </h3>
            </div>
            <div className={styles.summaryPill}>{activeItems.length} item(s)</div>
          </div>

          <div className={styles.summaryItems}>
            {activeItems.map((item) => (
              <div key={item.id} className={styles.summaryItem}>
                <div className={styles.summaryItemCopy}>
                  <span>{item.name}</span>
                  <small>Qty {item.quantity}</small>
                </div>
                <strong>Rs. {(item.price * item.quantity).toLocaleString("en-IN")}</strong>
              </div>
            ))}
          </div>

          <div className={styles.summaryBreakdown}>
            <div className={styles.summaryRow}>
              <span>Subtotal (MRP)</span>
              <span>Rs. {subtotalMrp.toLocaleString("en-IN")}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Offer Price</span>
              <span>Rs. {offerTotal.toLocaleString("en-IN")}</span>
            </div>
            <div className={styles.savingsNote}>
              You save Rs. {totalDiscount.toLocaleString("en-IN")}
            </div>
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>Rs. {totalPayable.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <button className={styles.saveDeliver} onClick={handleProceedPayment}>
            Proceed to Pay Rs. {totalPayable.toLocaleString("en-IN")}
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3>Add New Address</h3>
            <div className={styles.modalBody}>
              <div className={styles.modalGrid}>
                <div>
                  <label>Full Name</label>
                  <input
                    value={newAddress.fullName || ""}
                    onChange={(e) => setNewAddress((p) => ({ ...p, fullName: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Mobile No</label>
                  <input
                    value={newAddress.mobileNo || ""}
                    onChange={(e) =>
                      setNewAddress((p) => ({
                        ...p,
                        mobileNo: e.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                  />
                </div>
                <div>
                  <label>House No</label>
                  <input
                    value={newAddress.houseNo || ""}
                    onChange={(e) => setNewAddress((p) => ({ ...p, houseNo: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Street</label>
                  <input
                    value={newAddress.street || ""}
                    onChange={(e) => setNewAddress((p) => ({ ...p, street: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Local Area</label>
                  <input
                    value={newAddress.localArea || ""}
                    onChange={(e) => setNewAddress((p) => ({ ...p, localArea: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Pincode</label>
                  <input
                    value={newAddress.pincode || ""}
                    onChange={(e) => {
                      const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setNewAddress((p) => ({ ...p, pincode }));
                      fetchPincodeMeta(pincode, (patch) => setNewAddress((p) => ({ ...p, ...patch })));
                    }}
                  />
                </div>
                <div>
                  <label>District</label>
                  <input
                    value={newAddress.district || ""}
                    onChange={(e) => setNewAddress((p) => ({ ...p, district: e.target.value }))}
                  />
                </div>
                <div>
                  <label>State</label>
                  <input
                    value={newAddress.state || ""}
                    onChange={(e) => setNewAddress((p) => ({ ...p, state: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Address Type</label>
                  <select
                    value={newAddress.type || "Home"}
                    onChange={(e) =>
                      setNewAddress((p) => ({ ...p, type: sanitizeAddressType(e.target.value) }))
                    }
                  >
                    {ADDRESS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={handleAddAddress}>Save Address</button>
            </div>
            <IoClose className={styles.closeBtn} onClick={() => setShowAddModal(false)} />
          </div>
        </div>
      )}

      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3>Edit Address</h3>
            <div className={styles.modalBody}>
              <div className={styles.modalGrid}>
                <div>
                  <label>Full Name</label>
                  <input
                    value={editAddress.fullName || ""}
                    onChange={(e) => setEditAddress((p) => ({ ...p, fullName: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Mobile No</label>
                  <input
                    value={editAddress.mobileNo || ""}
                    onChange={(e) =>
                      setEditAddress((p) => ({
                        ...p,
                        mobileNo: e.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                  />
                </div>
                <div>
                  <label>House No</label>
                  <input
                    value={editAddress.houseNo || ""}
                    onChange={(e) => setEditAddress((p) => ({ ...p, houseNo: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Street</label>
                  <input
                    value={editAddress.street || ""}
                    onChange={(e) => setEditAddress((p) => ({ ...p, street: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Local Area</label>
                  <input
                    value={editAddress.localArea || ""}
                    onChange={(e) =>
                      setEditAddress((p) => ({ ...p, localArea: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label>Pincode</label>
                  <input
                    value={editAddress.pincode || ""}
                    onChange={(e) => {
                      const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setEditAddress((p) => ({ ...p, pincode }));
                      fetchPincodeMeta(pincode, (patch) =>
                        setEditAddress((p) => ({ ...p, ...patch }))
                      );
                    }}
                  />
                </div>
                <div>
                  <label>District</label>
                  <input
                    value={editAddress.district || ""}
                    onChange={(e) => setEditAddress((p) => ({ ...p, district: e.target.value }))}
                  />
                </div>
                <div>
                  <label>State</label>
                  <input
                    value={editAddress.state || ""}
                    onChange={(e) => setEditAddress((p) => ({ ...p, state: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Address Type</label>
                  <select
                    value={editAddress.type || "Home"}
                    onChange={(e) =>
                      setEditAddress((p) => ({ ...p, type: sanitizeAddressType(e.target.value) }))
                    }
                  >
                    {ADDRESS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={handleEditAddress}>Save Changes</button>
            </div>
            <IoClose
              className={styles.closeBtn}
              onClick={() => {
                setShowEditModal(false);
                setEditingAddressIndex(null);
              }}
            />
          </div>
        </div>
      )}

      <MobileNavbar />
    </div>
  );
};

export default AddressPage;
