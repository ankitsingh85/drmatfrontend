"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "@/styles/components/Layout/Topbar.module.css";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, MapPin, Menu, HelpCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Cookies from "js-cookie";

interface TopbarProps {
  hideHamburgerOnMobile?: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ hideHamburgerOnMobile }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { cartItems, clearCart } = useCart();
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState<string>("");
  const [username, setUsername] = useState<string | null>(null);

  // Load username
  useEffect(() => {
    const storedUsername = Cookies.get("username");
    if (storedUsername) setUsername(storedUsername);
  }, []);

  // Hide on dashboards
  const isDashboard =
    pathname.startsWith("/ClinicDashboard") ||
    pathname.startsWith("/DoctorDashboard") ||
    pathname.startsWith("/AdminDashboard") ||
    pathname.includes("Dashboard");

  const handleClickCart = () => {
    router.push("/home/Cart");
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        const data = await res.json();

        const city =
          data?.address?.city ||
          data?.address?.town ||
          data?.address?.village;
        const state = data?.address?.state;

        setLocation(`${city || "Unknown"}, ${state || ""}`);
      } catch {
        setLocation(`Lat ${latitude.toFixed(2)}, Lng ${longitude.toFixed(2)}`);
      }
    });
  };

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("username");
    Cookies.remove("email");
    Cookies.remove("userId");

    localStorage.removeItem("userId");
    clearCart && clearCart();

    setUsername(null);
    setLocation("");
    router.replace("/Login");
  };

  return (
    <div className={styles.topbar}>
      {/* LEFT SECTION */}
      <div className={styles.leftSection}>
        <Image
          className={styles.logo}
          src="/logo.jpeg"
          alt="Logo"
          width={120}
          height={30}
          onClick={() => router.push("/home")}
        />

        <div
          className={`${styles.hamburger} ${
            hideHamburgerOnMobile ? styles.hideOnMobile : ""
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu size={26} />
        </div>

        {/* NAV LINKS */}
        <nav className={`${styles.navLinks} ${menuOpen ? styles.open : ""}`}>
          {/* EXISTING */}
          <Link href="/home" className={styles.navLink}>
            Home
          </Link>

          <Link href="/home/findClinicsPage" className={styles.navLink}>
            Book Appointment
          </Link>


          <Link href="/user/profile" className={styles.navLink}>
            Care Plan
          </Link>

          {/* 🔥 NEWLY ADDED (NO REPLACEMENT) */}
          <Link href="/home/findClinicsPage" className={styles.navLink}>
            Find Derma Clinic
          </Link>

          <Link href="/video-consultation" className={styles.navLink}>
            Book Video Consultation
          </Link>

          <Link href="/plans" className={styles.navLink}>
            Buy Treatment Plan
          </Link>

          <Link href="/products" className={styles.navLink}>
            Buy Products
          </Link>

          <Link href="/quiz/ques1" className={styles.navLink}>
            Online Test
          </Link>

          
          <Link href="/quiz/ques1" className={styles.navLink}>
           Track Your Result
          </Link>

          <Link href="/help" className={styles.navLink}>
            Need Help?
          </Link>
        </nav>
      </div>

      {/* RIGHT SECTION */}
      {!isDashboard && (
        <div className={styles.rightSection}>
          <div className={styles.location} onClick={fetchLocation}>
            <MapPin size={18} />
            {location && (
              <span className={styles.locationText}>{location}</span>
            )}
          </div>

          {username ? (
            <div className={styles.userSection}>
              <span
                className={styles.userName}
                onClick={() => router.push("/UserDashboard")}
              >
                {username.toUpperCase()}
              </span>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className={styles.authLinks}>
              <Link href="/Login">Login</Link>
              <span className={styles.separator}>|</span>
              <Link href="/Signups">Sign Up</Link>
            </div>
          )}

          <div className={styles.cartInfo} onClick={handleClickCart}>
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className={styles.cartBadge}>{cartCount}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Topbar;
