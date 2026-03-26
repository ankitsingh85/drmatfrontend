"use client";

import React, { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import styles from "@/styles/adminpanel/userprofile.module.css";
import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";

interface IUserAddress {
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

interface IUserForm {
  _id?: string;
  patientId?: string;
  name: string;
  email: string;
  contactNo: string;
  profileImage: string;
  addresses: IUserAddress[];
  addressType: string;
  addressName: string;
  addressMobile: string;
  houseNo: string;
  street: string;
  localArea: string;
  pincode: string;
  district: string;
  state: string;
}

interface UserProfileProps {
  showFormInitially?: boolean;
  userEmail?: string;
  onProfileSaved?: (updatedUser?: {
    name?: string;
    email?: string;
    contactNo?: string;
    profileImage?: string;
  }) => void;
}

const MAX_IMAGE_SIZE = 200 * 1024;
const ADDRESS_TYPES = ["Home", "Work", "Office"] as const;
type AddressType = (typeof ADDRESS_TYPES)[number];

const emptyAddress: IUserAddress = {
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

const sanitizeAddressType = (value?: string): AddressType => {
  if (value === "Work" || value === "Office") return value;
  return "Home";
};

const formatAddressText = (addr: IUserAddress) => {
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
  return parts.join(", ");
};

const parseLegacyAddress = (value?: string) => {
  const source = (value || "").trim();
  if (!source) return {};
  const parts = source
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const parsed: Partial<IUserAddress> = {};
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

const normalizeAddress = (addr: any): IUserAddress => {
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

const toBackendAddress = (addr: IUserAddress): IUserAddress => ({
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

const UserProfile: React.FC<UserProfileProps> = ({
  showFormInitially = false,
  userEmail,
  onProfileSaved,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(showFormInitially);

  const [form, setForm] = useState<IUserForm>({
    name: "",
    email: "",
    contactNo: "",
    profileImage: "",
    addresses: [],
    addressType: "Home",
    addressName: "",
    addressMobile: "",
    houseNo: "",
    street: "",
    localArea: "",
    pincode: "",
    district: "",
    state: "",
  });

  const email = userEmail || Cookies.get("email") || "";

  const fetchPincodeMeta = async (pincode: string) => {
    if (pincode.length !== 6) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      const office = data?.[0]?.PostOffice?.[0];
      if (!office) return;
      setForm((prev) => ({
        ...prev,
        district: office.District || prev.district,
        state: office.State || prev.state,
      }));
    } catch {
      // Ignore lookup failures and allow manual fill.
    }
  };

  const fetchUser = useCallback(async () => {
    if (!email) {
      router.replace("/Login");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/users/by-email/${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error("User not found");

      const data = await res.json();
      const addresses = Array.isArray(data.addresses) ? data.addresses.map(normalizeAddress) : [];
      const primary = addresses[0] || normalizeAddress({ address: data.address || "" });

      setForm({
        _id: data._id,
        patientId: data.patientId,
        name: data.name || "",
        email: data.email || email,
        contactNo: data.contactNo || "",
        profileImage: data.profileImage || "",
        addresses,
        addressType: sanitizeAddressType(primary.type),
        addressName: primary.fullName || data.name || "",
        addressMobile: primary.mobileNo || data.contactNo || "",
        houseNo: primary.houseNo || "",
        street: primary.street || "",
        localArea: primary.localArea || "",
        pincode: primary.pincode || "",
        district: primary.district || "",
        state: primary.state || "",
      });
    } catch {
      setForm((prev) => ({ ...prev, email }));
    } finally {
      setLoading(false);
    }
  }, [email, router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const handleAddressUpdated = () => {
      fetchUser();
    };
    window.addEventListener("addresses-updated", handleAddressUpdated);
    return () => {
      window.removeEventListener("addresses-updated", handleAddressUpdated);
    };
  }, [fetchUser]);

  useEffect(() => {
    setShowForm(showFormInitially);
  }, [showFormInitially]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "profileImage" && e.target instanceof HTMLInputElement && e.target.files?.[0]) {
      const file = e.target.files[0];

      if (!file.type.startsWith("image/")) {
        alert("Only image files allowed");
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        alert("Image must be less than 200KB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({
          ...prev,
          profileImage: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
      return;
    }

    if (name === "contactNo" || name === "addressMobile") {
      setForm((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, "").slice(0, 10),
      }));
      return;
    }

    if (name === "pincode") {
      const pin = value.replace(/\D/g, "").slice(0, 6);
      setForm((prev) => ({ ...prev, pincode: pin }));
      fetchPincodeMeta(pin);
      return;
    }

    if (name === "addressType") {
      setForm((prev) => ({ ...prev, addressType: sanitizeAddressType(value) }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form._id) {
      alert("User ID not found");
      return;
    }

    if (!form.name.trim() || !form.email.trim()) {
      alert("Name and Email are required");
      return;
    }

    const primaryAddress: IUserAddress = toBackendAddress({
      type: form.addressType || "Home",
      fullName: form.addressName.trim(),
      mobileNo: form.addressMobile.trim(),
      houseNo: form.houseNo.trim(),
      street: form.street.trim(),
      localArea: form.localArea.trim(),
      pincode: form.pincode.trim(),
      district: form.district.trim(),
      state: form.state.trim(),
    });

    const existing = Array.isArray(form.addresses) ? [...form.addresses] : [];
    const addresses = existing.length ? [primaryAddress, ...existing.slice(1)] : [primaryAddress];

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/${form._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          contactNo: form.contactNo.trim(),
          profileImage: form.profileImage,
          addresses,
          address: primaryAddress.address,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      Cookies.set("username", data.user.name || "");
      Cookies.set("email", data.user.email || "");
      Cookies.set("contactNo", data.user.contactNo || "");

      setForm((prev) => ({
        ...prev,
        ...data.user,
        addresses,
      }));

      window.dispatchEvent(new CustomEvent("profile-updated"));
      window.dispatchEvent(new CustomEvent("addresses-updated"));
      setShowForm(false);

      onProfileSaved?.({
        name: data.user.name,
        email: data.user.email,
        contactNo: data.user.contactNo,
        profileImage: data.user.profileImage,
      });

      alert("Profile updated successfully");
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FullPageLoader />;

  const previewAddress = formatAddressText({
    type: form.addressType || "Home",
    houseNo: form.houseNo,
    street: form.street,
    localArea: form.localArea,
    pincode: form.pincode,
    district: form.district,
    state: form.state,
  });

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Your Profile</h2>
          <p className={styles.subtitle}>Manage your personal details</p>
        </div>
        {!showForm && (
          <button className={styles.editBtn} onClick={() => setShowForm(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className={styles.inlineForm}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Patient ID</label>
              <input value={form.patientId || ""} disabled />
            </div>

            <div className={styles.field}>
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Email</label>
              <input name="email" value={form.email} onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Mobile</label>
              <input name="contactNo" value={form.contactNo} onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Profile Picture</label>
              <input name="profileImage" type="file" accept="image/*" onChange={handleChange} />
              {form.profileImage && (
                <img
                  src={form.profileImage}
                  alt="Preview"
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: "50%",
                    marginTop: 8,
                    objectFit: "cover",
                  }}
                />
              )}
            </div>

            <div className={styles.field}>
              <label>Address Type</label>
              <select name="addressType" value={form.addressType} onChange={handleChange}>
                {ADDRESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Address Full Name</label>
              <input name="addressName" value={form.addressName} onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Address Mobile</label>
              <input name="addressMobile" value={form.addressMobile} onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>House No</label>
              <input name="houseNo" value={form.houseNo} onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Street</label>
              <input name="street" value={form.street} onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Local Area</label>
              <input name="localArea" value={form.localArea} onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Pincode</label>
              <input name="pincode" value={form.pincode} onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>District</label>
              <input name="district" value={form.district} onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>State</label>
              <input name="state" value={form.state} onChange={handleChange} />
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.secondaryBtn} onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <span>Name</span>
            <strong>{form.name}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Email</span>
            <strong>{form.email}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Mobile</span>
            <strong>{form.contactNo || "-"}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Address Name</span>
            <strong>{form.addressName || "-"}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Address Mobile</span>
            <strong>{form.addressMobile || "-"}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Address</span>
            <strong>{previewAddress || "-"}</strong>
          </div>
          {form.addresses.length > 0 && (
            <div className={styles.summaryRow}>
              <span>Saved Addresses</span>
              <strong style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {form.addresses.map((addr, idx) => (
                  <span key={idx}>
                    [{sanitizeAddressType(addr.type)}] {formatAddressText(normalizeAddress(addr)) || "-"}
                  </span>
                ))}
              </strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
