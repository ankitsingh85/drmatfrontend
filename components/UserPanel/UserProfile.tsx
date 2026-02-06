"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import styles from "@/styles/adminpanel/userprofile.module.css";
import { API_URL } from "@/config/api";

interface IAddress {
  type: "Home" | "Work" | "Other";
  address: string;
}

interface IUserProfile {
  _id?: string;
  email: string;
  name: string;
  age: number;
  image: string;
  addresses: IAddress[];
}

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

interface UserProfileProps {
  showFormInitially?: boolean;
  userEmail?: string;
  onProfileSaved?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  showFormInitially = false,
  userEmail,
  onProfileSaved,
}) => {
  const router = useRouter();
  const [user, setUser] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(showFormInitially);

  const [form, setForm] = useState<IUserProfile>({
    email: "",
    name: "",
    age: 0,
    image: "",
    addresses: [{ type: "Home", address: "" }],
  });

  // Use prop email or fallback to cookie
  const email = userEmail || Cookies.get("email") || "";

  // Redirect if not logged in
  useEffect(() => {
    if (!email) {
      router.replace("/Login");
    }
  }, [email, router]);

  // Fetch user profile
  useEffect(() => {
    if (!email) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/userprofile/${email}`);
        if (res.ok) {
          const data: IUserProfile = await res.json();
          setUser(data);
          setForm(data);
          Cookies.set("userId", data._id || "");
          localStorage.setItem("userId", data._id || "");
        } else {
          setUser(null);
          setForm((prev) => ({ ...prev, email }));
          setShowForm(showFormInitially);
        }
      } catch (err) {
        console.error(err);
        setUser(null);
        setForm((prev) => ({ ...prev, email }));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [email, showFormInitially]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index?: number
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("address") && index !== undefined) {
      const newAddresses = [...form.addresses];
      if (name === "address_type")
        newAddresses[index].type = value as "Home" | "Work" | "Other";
      else newAddresses[index].address = value;
      setForm((prev) => ({ ...prev, addresses: newAddresses }));
    } else if (name === "image" && "files" in e.target && e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setForm((prev) => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(e.target.files[0]);
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: name === "age" ? Number(value) : value,
      }));
    }
  };

  const addAddress = () =>
    setForm((prev) => ({
      ...prev,
      addresses: [...prev.addresses, { type: "Home", address: "" }],
    }));

  const removeAddress = (index: number) =>
    setForm((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index),
    }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/userprofile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save profile");

      setUser(data);
      Cookies.set("userId", data._id || "");
      localStorage.setItem("userId", data._id || "");
      setShowForm(false);

      if (onProfileSaved) onProfileSaved();
      alert("✅ Profile saved successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleEdit = () => {
    if (user) {
      setForm(user);
      setShowForm(true);
    }
  };

  if (loading) return <p className={styles.message}>Loading...</p>;

  return (
    <div className={styles.container}>
      <h2>Welcome, {user?.name || "User"}</h2>

      {showForm ? (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{user ? "Edit Profile" : "Create Profile"}</h3>
            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                name="email"
                type="email"
                value={form.email}
                placeholder="Email"
                readOnly
                className={styles.readOnly}
              />
              <input
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <input
                name="age"
                type="number"
                placeholder="Age"
                value={form.age || ""}
                onChange={handleChange}
                required
              />
              <input
                name="image"
                type="file"
                accept="image/*"
                onChange={handleChange}
              />

              <div>
                <h4>Addresses:</h4>
                {form.addresses.map((addr, index) => (
                  <div key={index} className={styles.addressRow}>
                    <select
                      name="address_type"
                      value={addr.type}
                      onChange={(e) => handleChange(e, index)}
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      name="address_address"
                      placeholder="Address"
                      value={addr.address}
                      onChange={(e) => handleChange(e, index)}
                      required
                    />
                    {form.addresses.length > 1 && (
                      <button type="button" onClick={() => removeAddress(index)}>
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addAddress}>
                  Add Address
                </button>
              </div>

              <button type="submit">Save Profile</button>
            </form>
          </div>
        </div>
      ) : user ? (
        <div className={styles.profileCard}>
          {user.image && <img src={user.image} alt="Profile" className={styles.image} />}
          <p><strong>User ID:</strong> {user._id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Age:</strong> {user.age}</p>
          <div>
            <strong>Addresses:</strong>
            <ul>
              {user.addresses.map((addr, i) => (
                <li key={i}>
                  {addr.type}: {addr.address}
                </li>
              ))}
            </ul>
          </div>
          <button onClick={handleEdit}>Edit Profile</button>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>No profile found. Please create your profile.</p>
          <button onClick={() => setShowForm(true)}>Create Profile</button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
