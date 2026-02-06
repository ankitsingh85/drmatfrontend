"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "@/styles/components/forms/Signup.module.css";
import illustration from "../public/register.png";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import { API_URL } from "@/config/api";

const Signup: React.FC = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    contactNo: "",
    address: "",
  });

  const [signupSuccess, setSignupSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData), // 🔥 only usable fields
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      setSignupSuccess(true);
    } catch (err: any) {
      alert(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar />
      <div className={styles.container}>
        <div className={styles.form}>
          <div className={styles.imageContainer}>
            <Image src={illustration} alt="Register" className={styles.image} />
          </div>

          <h2 className={styles.head}>Create your account</h2>

          <form onSubmit={handleSubmit}>
            <input
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              className={styles.input}
            />

            <input
              name="email"
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.input}
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className={styles.input}
            />

            <input
              name="contactNo"
              placeholder="Contact Number (optional)"
              value={formData.contactNo}
              onChange={handleChange}
              className={styles.input}
            />

            <input
              name="address"
              placeholder="Address (optional)"
              value={formData.address}
              onChange={handleChange}
              className={styles.input}
            />

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          {signupSuccess && (
            <button
              onClick={() => router.push("/Login")}
              className={styles.button}
              style={{ marginTop: "1rem" }}
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Signup;
