"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import styles from "@/styles/adminpanel/userprofile.module.css";
import { API_URL } from "@/config/api";

interface IUserForm {
  _id?: string;
  patientId?: string;
  name: string;
  email: string;
  contactNo: string;
  address: string;
  profileImage: string;
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
    address: "",
    profileImage: "",
  });

  const email = userEmail || Cookies.get("email") || "";

  useEffect(() => {
    if (!email) {
      router.replace("/Login");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/users/by-email/${encodeURIComponent(email)}`);
        if (!res.ok) throw new Error("User not found");

        const data = await res.json();
        setForm({
          _id: data._id,
          patientId: data.patientId,
          name: data.name || "",
          email: data.email || email,
          contactNo: data.contactNo || "",
          address: data.address || "",
          profileImage: data.profileImage || "",
        });
      } catch {
        setForm((prev) => ({
          ...prev,
          email,
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [email, router]);

  useEffect(() => {
    setShowForm(showFormInitially);
  }, [showFormInitially]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "profileImage" && "files" in e.target && e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setForm((prev) => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
      return;
    }

    if (name === "contactNo") {
      setForm((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 10) }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form._id) {
      alert("User ID not found for update");
      return;
    }

    if (!form.name.trim() || !form.email.trim()) {
      alert("Name and Email are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/${form._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          contactNo: form.contactNo.trim(),
          address: form.address.trim(),
          profileImage: form.profileImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      setForm((prev) => ({
        ...prev,
        ...data.user,
      }));

      Cookies.set("username", data.user.name || "");
      Cookies.set("email", data.user.email || "");
      Cookies.set("contactNo", data.user.contactNo || "");
      Cookies.set("profileImage", data.user.profileImage || "");

      setShowForm(false);
      onProfileSaved?.({
        name: data.user?.name,
        email: data.user?.email,
        contactNo: data.user?.contactNo,
        profileImage: data.user?.profileImage,
      });
      alert("Profile updated successfully");
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className={styles.message}>Loading profile...</p>;

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
              <input value={form.patientId || ""} disabled className={styles.readOnly} />
            </div>

            <div className={styles.field}>
              <label>Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className={styles.field}>
              <label>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email"
                required
              />
            </div>

            <div className={styles.field}>
              <label>Mobile Number</label>
              <input
                name="contactNo"
                value={form.contactNo}
                onChange={handleChange}
                placeholder="10 digit mobile number"
                maxLength={10}
                inputMode="numeric"
              />
            </div>

            <div className={styles.field}>
              <label>Profile Picture</label>
              <input
                name="profileImage"
                type="file"
                accept="image/*"
                onChange={handleChange}
              />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label>Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter complete address"
                rows={4}
              />
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
          <div className={styles.summaryRow}><span>Name</span><strong>{form.name || "-"}</strong></div>
          <div className={styles.summaryRow}><span>Email</span><strong>{form.email || "-"}</strong></div>
          <div className={styles.summaryRow}><span>Mobile</span><strong>{form.contactNo || "-"}</strong></div>
          <div className={styles.summaryRow}><span>Address</span><strong>{form.address || "-"}</strong></div>
          <div className={styles.summaryRow}>
            <span>Profile Image</span>
            <strong>{form.profileImage ? "Uploaded" : "-"}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
