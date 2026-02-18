"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "@/styles/components/Layout/Topbar.module.css";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, MapPin, Menu, CircleUser } from "lucide-react";
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
    const storedLocation = Cookies.get("location");
    if (storedUsername) setUsername(storedUsername);
    if (storedLocation) setLocation(storedLocation);
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

  const fetchLocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
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
          const finalLocation = `${city || "Unknown"}, ${state || ""}`.trim();

          setLocation(finalLocation);
          Cookies.set("location", finalLocation, { expires: 7 });
        } catch {
          const fallback = `Lat ${latitude.toFixed(2)}, Lng ${longitude.toFixed(2)}`;
          setLocation(fallback);
          Cookies.set("location", fallback, { expires: 7 });
        }
      },
      () => {
        if (!silent) alert("Location access denied");
      }
    );
  };

  useEffect(() => {
    if (!username || location) return;
    fetchLocation(true);
  }, [username, location]);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("username");
    Cookies.remove("email");
    Cookies.remove("userId");
    Cookies.remove("location");
    Cookies.remove("contactNo");

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

        </nav>
      </div>

      {/* RIGHT SECTION */}
      <div className={styles.rightSection}>
        {isDashboard ? (
          username ? (
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <div className={styles.authLinks}>
              <Link href="/Login">Login</Link>
            </div>
          )
        ) : (
          <>
            <div className={styles.location} onClick={() => fetchLocation(false)}>
              <MapPin size={18} />
              {location && (
                <span className={styles.locationText}>{location}</span>
              )}
            </div>

            {username ? (
              <div className={styles.userSection}>
                <button
                  className={styles.userIconBtn}
                  onClick={() => router.push("/UserDashboard")}
                  aria-label="Open user dashboard"
                >
                  <CircleUser size={22} />
                </button>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <div className={styles.authLinks}>
                <Link href="/Login">Login</Link>
              </div>
            )}

            <div className={styles.cartInfo} onClick={handleClickCart}>
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className={styles.cartBadge}>{cartCount}</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Topbar;
