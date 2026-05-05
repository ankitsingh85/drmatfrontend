"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { API_URL } from "@/config/api";
import styles from "@/styles/clinicdashboard/editprofile.module.css";
import { resolveMediaUrl } from "@/lib/media";

export interface DoctorProfileRecord {
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
  profileImage?: string;
  address?: string;
  addresses?: DoctorAddress[];
}

interface DoctorAddress {
  type?: string;
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

interface ProfileEditProps {
  doctor?: DoctorProfileRecord | null;
  onSaved?: (doctor?: DoctorProfileRecord) => void;
}

const emptyForm = {
  title: "Dr.",
  firstName: "",
  lastName: "",
  specialist: "",
  email: "",
  phone: "",
  description: "",
  password: "",
  addressType: "Office",
  houseNo: "",
  street: "",
  localArea: "",
  pincode: "",
  district: "",
  state: "",
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
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return parts.join(", ") || String(addr.address || "").trim();
};

const parseLegacyAddress = (value?: string): Partial<DoctorAddress> => {
  const source = String(value || "").trim();
  if (!source) return {};

  const parts = source
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const parsed: Partial<DoctorAddress> = {};
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

function ProfileEdit({ doctor, onSaved }: ProfileEditProps) {
  const [form, setForm] = useState(emptyForm);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!doctor) return;
    const primaryAddress = doctor.addresses?.[0] || {};
    const legacyAddress = parseLegacyAddress(primaryAddress.address || doctor.address);

    setForm({
      title: doctor.title || "Dr.",
      firstName: doctor.firstName || "",
      lastName: doctor.lastName || "",
      specialist: doctor.specialist || "",
      email: doctor.email || "",
      phone: doctor.phone || doctor.contactNo || "",
      description: doctor.description || "",
      password: "",
      addressType: primaryAddress.type || "Office",
      houseNo: primaryAddress.houseNo || legacyAddress.houseNo || "",
      street: primaryAddress.street || legacyAddress.street || "",
      localArea: primaryAddress.localArea || legacyAddress.localArea || "",
      pincode: primaryAddress.pincode || legacyAddress.pincode || "",
      district: primaryAddress.district || legacyAddress.district || "",
      state: primaryAddress.state || legacyAddress.state || "",
    });
    setProfileImageFile(null);
    setProfilePreview(resolveMediaUrl(doctor.profileImage) || "");
  }, [doctor]);

  const updateField = (
    field: keyof typeof emptyForm,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]:
        field === "phone"
          ? value.replace(/\D/g, "").slice(0, 10)
          : field === "pincode"
          ? value.replace(/\D/g, "").slice(0, 6)
          : value,
    }));
    setMessage("");
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please upload an image file.");
      return;
    }

    setProfileImageFile(file);
    setProfilePreview(URL.createObjectURL(file));
    setMessage("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const doctorId = doctor?.id || doctor?._id || Cookies.get("doctorId") || localStorage.getItem("doctorId");
    const token = Cookies.get("token");

    if (!doctorId || !token) {
      setMessage("Doctor session not found. Please login again.");
      return;
    }

    if (!form.firstName.trim() || !form.lastName.trim() || !form.specialist.trim() || !form.email.trim()) {
      setMessage("Please fill name, specialist, and email.");
      return;
    }

    if (form.phone && form.phone.length !== 10) {
      setMessage("Please enter a valid 10 digit mobile number.");
      return;
    }

    if (form.pincode && form.pincode.length !== 6) {
      setMessage("Please enter a valid 6 digit pincode.");
      return;
    }

    try {
      setSaving(true);
      const nextDisplayName = [form.title, form.firstName, form.lastName]
        .filter(Boolean)
        .join(" ");
      const address = {
        type: form.addressType || "Office",
        fullName: nextDisplayName,
        mobileNo: form.phone,
        houseNo: form.houseNo,
        street: form.street,
        localArea: form.localArea,
        pincode: form.pincode,
        district: form.district,
        state: form.state,
      };
      const addressText = formatAddressText(address);
      const addresses = addressText
        ? [
            {
              ...address,
              address: addressText,
            },
          ]
        : [];
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("firstName", form.firstName);
      payload.append("lastName", form.lastName);
      payload.append("specialist", form.specialist);
      payload.append("email", form.email);
      payload.append("phone", form.phone);
      payload.append("description", form.description);
      payload.append("address", addressText);
      payload.append("addresses", JSON.stringify(addresses));

      if (form.password.trim()) {
        payload.append("password", form.password.trim());
      }

      if (profileImageFile) {
        payload.append("profileImage", profileImageFile);
      }

      const res = await fetch(`${API_URL}/doctors/${doctorId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update doctor profile");
      }

      const updatedDoctor = data?.doctor || data;
      const displayName =
        updatedDoctor?.name ||
        [updatedDoctor?.title, updatedDoctor?.firstName, updatedDoctor?.lastName]
          .filter(Boolean)
          .join(" ") ||
        "Doctor";

      Cookies.set("username", displayName, { path: "/" });
      Cookies.set("email", updatedDoctor?.email || form.email, { path: "/" });
      Cookies.set("contactNo", updatedDoctor?.phone || form.phone, { path: "/" });
      if (updatedDoctor?.profileImage) {
        const normalizedProfileImage = resolveMediaUrl(updatedDoctor.profileImage) || updatedDoctor.profileImage;
        Cookies.set("profileImage", normalizedProfileImage, { path: "/" });
        localStorage.setItem("profileImage", normalizedProfileImage);
      }
      window.dispatchEvent(new CustomEvent("profile-updated"));
      setMessage("Profile updated successfully.");
      setForm((prev) => ({ ...prev, password: "" }));
      setProfileImageFile(null);
      onSaved?.({
        ...updatedDoctor,
        id: updatedDoctor?._id || updatedDoctor?.id || doctorId,
        name: displayName,
        contactNo: updatedDoctor?.phone || form.phone,
        address: updatedDoctor?.address || addressText,
        addresses: updatedDoctor?.addresses || addresses,
        profileImage: updatedDoctor?.profileImage || doctor?.profileImage,
      });
    } catch (err: any) {
      setMessage(err?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.section} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Doctor Profile</p>
          <h2>Edit Profile</h2>
          <p>Keep your doctor details current for billing and dashboard use.</p>
        </div>
              </div>


      {message && <p className={styles.message}>{message}</p>}

      <div className={styles.grid}>
        <label className={styles.field} style={{ gridColumn: "1 / -1" }}>
          Profile Picture
          <div className={styles.profileImageEditor}>
            <div className={styles.profileImagePreview}>
              {profilePreview ? (
                <img src={profilePreview} alt="Doctor profile preview" />
              ) : (
                <span>{form.firstName?.slice(0, 1).toUpperCase() || "D"}</span>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleProfileImageChange} />
          </div>
        </label>
        <label className={styles.field}>
          Title
          <input value={form.title} onChange={(e) => updateField("title", e.target.value)} />
        </label>
        <label className={styles.field}>
          First Name
          <input value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} />
        </label>
        <label className={styles.field}>
          Last Name
          <input value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} />
        </label>
        <label className={styles.field}>
          Specialist
          <input value={form.specialist} onChange={(e) => updateField("specialist", e.target.value)} />
        </label>
        <label className={styles.field}>
          Email
          <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
        </label>
        <label className={styles.field}>
          Mobile Number
          <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
        </label>
        <label className={styles.field}>
          New Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            placeholder="Leave blank to keep current password"
          />
        </label>
        <label className={styles.field} style={{ gridColumn: "1 / -1" }}>
          Description
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={4}
          />
        </label>
      </div>

      <div className={styles.section} style={{ marginTop: 18 }}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Billing Address</p>
            <h3 className={styles.sectionTitle}>Doctor Address</h3>
          </div>
        </div>

        <div className={styles.grid}>
          <label className={styles.field}>
            Address Type
            <select
              value={form.addressType}
              onChange={(e) => updateField("addressType", e.target.value)}
            >
              <option value="Office">Office</option>
              <option value="Home">Home</option>
              <option value="Work">Work</option>
            </select>
          </label>
          <label className={styles.field}>
            House No
            <input value={form.houseNo} onChange={(e) => updateField("houseNo", e.target.value)} />
          </label>
          <label className={styles.field}>
            Street
            <input value={form.street} onChange={(e) => updateField("street", e.target.value)} />
          </label>
          <label className={styles.field}>
            Local Area
            <input value={form.localArea} onChange={(e) => updateField("localArea", e.target.value)} />
          </label>
          <label className={styles.field}>
            Pincode
            <input value={form.pincode} onChange={(e) => updateField("pincode", e.target.value)} />
          </label>
          <label className={styles.field}>
            District
            <input value={form.district} onChange={(e) => updateField("district", e.target.value)} />
          </label>
          <label className={styles.field}>
            State
            <input value={form.state} onChange={(e) => updateField("state", e.target.value)} />
          </label>

          <button type="submit" className={styles.primaryBtn} disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
        </div>
      </div>
    </form>
  );
}
export default ProfileEdit;
