  "use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "@/styles/components/Layout/Topbar.module.css";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingCart,
  MapPin,
  Menu,
  User,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
  import { useCart } from "@/context/CartContext";
  import { useTopbarProfile } from "@/context/TopbarProfileContext";
  import { useToast } from "@/context/ToastContext";
  import Cookies from "js-cookie";
  import { API_URL } from "@/config/api";
  import { reverseGeocodeWithGoogle } from "@/lib/geocode";
  import LocationPickerModal from "@/components/modal/LocationPickerModal";

  interface TopbarProps {
    hideHamburgerOnMobile?: boolean;
  }

  const Topbar: React.FC<TopbarProps> = ({ hideHamburgerOnMobile }) => {
    const router = useRouter();
  const pathname = usePathname();
  const { cartItems } = useCart();
  const profile = useTopbarProfile();
  const toast = useToast();
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [isHydrated, setIsHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState<string>("");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [doctorAccountDetected, setDoctorAccountDetected] = useState(false);
  const userBtnRef = useRef<HTMLButtonElement | null>(null);
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY || "";

    const username = profile?.username ?? null;
    const profileImage = profile?.profileImage ?? null;
    const email = profile?.email ?? null;
    const contactNo = profile?.contactNo ?? null;
    const currentRole = isHydrated ? Cookies.get("role")?.toLowerCase() : null;
    const isBusinessMode =
      currentRole === "clinic" || currentRole === "doctor" || currentRole === "b2buser";

    useEffect(() => {
      setIsHydrated(true);
    }, []);

    // If an admin creates a Doctor account using the same phone number as
    // this logged-in B2B user, their session stays alive (we no longer
    // auto-expire it) but they still need to log out and back in to pick
    // up the Doctor role — poll for that and surface a banner so they
    // find out without having to guess.
    useEffect(() => {
      if (!isHydrated || currentRole !== "b2buser") return;

      const phone = contactNo || Cookies.get("contactNo") || "";
      if (!phone) return;

      let cancelled = false;
      let interval: ReturnType<typeof setInterval> | undefined;

      const checkDoctorAccount = async () => {
        try {
          const res = await fetch(`${API_URL}/doctors/check-mobile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contactNo: phone }),
          });
          const data = await res.json().catch(() => null);
          if (!cancelled && data?.exists) {
            setDoctorAccountDetected(true);
            if (interval) clearInterval(interval);
          }
        } catch {
          // Ignore network errors; the next interval tick will retry.
        }
      };

      checkDoctorAccount();
      interval = setInterval(checkDoctorAccount, 30000);

      return () => {
        cancelled = true;
        if (interval) clearInterval(interval);
      };
    }, [isHydrated, currentRole, contactNo]);
useEffect(() => {
  const storedLocation = Cookies.get("location");

  if (storedLocation) {
    setLocation(storedLocation);
    return;
  }

  fetchLocation(true);
}, []);

  const isDashboard =
      pathname?.startsWith("/ClinicDashboard") ||
      pathname?.startsWith("/DoctorDashboard") ||
      pathname?.startsWith("/AdminDashboard") ||
      pathname?.includes("Dashboard");

  const getLoginPath = () => {
    if (isBusinessMode || currentRole === "b2buser") return "/businesslogin";
    return "/Login";
  };

  const handleClickCart = () => {
    router.push("/home/Cart");
  };

  const handleBusinessLogin = () => {
    setMenuOpen(false);
    router.push("/businesslogin");
  };

  const applyLocation = (summary: string, latitude: number, longitude: number) => {
    setLocation(summary);
    Cookies.set("location", summary, { expires: 7 });
    Cookies.set("latitude", latitude.toString(), { expires: 7 });
    Cookies.set("longitude", longitude.toString(), { expires: 7 });
  };

  const fetchLocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const { summary } = await reverseGeocodeWithGoogle(latitude, longitude, googleMapsApiKey);
          applyLocation(summary, latitude, longitude);
        } catch (err) {
          console.error(err);
          setLocation("Location unavailable");
        }
      },
      () => {
        if (!silent) {
          toast.error("Location access denied");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  };

  const handleLocationConfirmed = (result: { address: string; lat: number; lng: number }) => {
    applyLocation(result.address, result.lat, result.lng);
    setLocationModalOpen(false);
  };
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;

        if (
          userBtnRef.current &&
          !userBtnRef.current.contains(target) &&
          !(target instanceof Element && target.closest(`.${styles.profileDropdown}`))
        ) {
          setProfileOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [styles.profileDropdown]);

    const handleLogout = () => {
      const roleBeforeLogout = currentRole;

      [
        "token",
        "username",
        "clinicName",
        "clinicId",
        "doctorId",
        "b2bUserId",
        "email",
        "userId",
        "location",
        "contactNo",
        "profileImage",
        "role",
        "cartScope",
      ].forEach((key) => {
        Cookies.remove(key, { path: "/" });
      });

      localStorage.removeItem("userId");
      localStorage.removeItem("clinicId");
      localStorage.removeItem("doctorId");
      localStorage.removeItem("b2bUserId");
      localStorage.removeItem("profileImage");
      localStorage.removeItem("cartScope");
      profile?.clearProfile();

      setLocation("");
      window.dispatchEvent(new CustomEvent("user-logged-out"));
      router.replace(
        roleBeforeLogout === "clinic" ||
          roleBeforeLogout === "doctor" ||
          roleBeforeLogout === "b2buser"
          ? "/businesslogin"
          : "/Login"
      );
    };

    const handleBecomeClinic = () => {
      // The actual application form (business name/address/GST/email)
      // lives on the B2B dashboard — the topbar just gets them there.
      router.push("/B2BUserDashboard?openBecomeClinic=1");
    };

  const renderLoginOptions = () => (
      <button
        type="button"
        className={styles.loginLink}
        onClick={() => {
          setMenuOpen(false);
          router.push(getLoginPath());
        }}
      >
        Login
      </button>
    );

    const renderProfileAvatar = (fallback = "U") =>
      profileImage ? (
        <img
          src={profileImage}
          alt={username || "Profile"}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#e6eef8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0a4b83",
            fontWeight: 700,
          }}
        >
          {(username || fallback).slice(0, 1).toUpperCase()}
        </div>
      );

    const renderDefaultTopbar = () => (
      <>
      <div className={styles.topbar}>
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
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <Menu size={26} />
          </div>

          <nav className={`${styles.navLinks} ${menuOpen ? styles.open : ""}`}>
            <Link href="/home" className={styles.navLink}>
              Home
            </Link>
            <Link href="/home/findClinicsPage" className={styles.navLink}>
              Book Appointment
            </Link>
            {/* <Link href="/user/profile" className={styles.navLink}>Care Plan</Link> */}
            {/* <Link href="/home/findClinicsPage" className={styles.navLink}>Find Derma Clinic</Link> */}
            <Link href="/video-consultation" className={styles.navLink}>
              Book Video Consultation
            </Link>
            <Link href="/treatment-plans" className={styles.navLink}>
              Buy Treatment Plan
            </Link>
            <Link href="/product-listing" className={styles.navLink}>
              Buy Products
            </Link>
            <Link href="/quiz/ques1" className={styles.navLink}>
              Online Test
            </Link>
            <div className={styles.businessNavWrap}>
              <button
                type="button"
                className={styles.businessNavLink}
                onClick={handleBusinessLogin}
              >
                <span className={styles.businessTag}>BUSINESS</span>
                <span className={styles.businessText}>
                  <span>Free Listing</span>
                  <ArrowUpRight size={15} className={styles.businessIcon} />
                </span>
              </button>
            </div>
          </nav>
        </div>

        <div className={styles.rightSection}>
          {isDashboard ? (
            username ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {renderProfileAvatar(currentRole === "clinic" ? "C" : "D")}
                <span
                  style={{
                    maxWidth: 180,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 700,
                    color: "#173252",
                  }}
                  title={username}
                >
                  {username}
                </span>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              renderLoginOptions()
            )
          ) : (
            <>
              <div className={styles.location} onClick={() => setLocationModalOpen(true)}>
                <MapPin size={18} />
                {location && <span className={styles.locationText}>{location}</span>}
              </div>

              {username ? (
                <div className={styles.userSection} style={{ position: "relative" }}>
                  <button
                    ref={userBtnRef}
                    className={styles.userIconBtn}
                    onClick={() => setProfileOpen((s) => !s)}
                    aria-label="Open user profile"
                    title={username}
                    style={{ padding: 0, border: "none", background: "transparent" }}
                  >
                    {profileImage ? (
                      renderProfileAvatar("U")
                    ) : (
                      renderProfileAvatar("U")
                    )}
                  </button>

                  {profileOpen && (
                    <div
                      className={styles.profileDropdown}
                      role="dialog"
                      aria-modal="false"
                      onMouseLeave={() => setProfileOpen(false)}
                    >
                      <div className={styles.profileDropdownHeader}>
                        <div className={styles.profileAvatarWrap}>
                          {profileImage ? (
                            <img
                              src={profileImage}
                              alt={username || "User"}
                              className={styles.profileAvatar}
                            />
                          ) : (
                            <div className={styles.profileAvatarPlaceholder}>
                              {username?.slice(0, 1).toUpperCase() || "U"}
                            </div>
                          )}
                        </div>
                        <h3 className={styles.profileDropdownName}>{username}</h3>
                        <p className={styles.profileDropdownContact}>
                          {contactNo ? `+91 ${contactNo}` : email || "—"}
                        </p>
                      </div>

                      <div className={styles.profileDropdownDivider} />

                      <div className={styles.profileDropdownActions}>
                        <button
                          className={styles.profileActionBtn}
                          onClick={() => {
                            setProfileOpen(false);
                            if (currentRole === "clinic") {
                              router.push("/ClinicDashboard");
                              return;
                            }
                            if (currentRole === "b2buser") {
                              router.push("/B2BUserDashboard");
                              return;
                            }
                            router.push("/UserDashboard");
                          }}
                        >
                          <User size={18} />
                          <span>View Profile</span>
                        </button>

                        <button
                          className={`${styles.profileActionBtn} ${styles.profileActionLogout}`}
                          onClick={handleLogout}
                        >
                          <LogOut size={18} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                renderLoginOptions()
              )}

              <div className={styles.cartInfo} onClick={handleClickCart}>
                <ShoppingCart size={18} />
                {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
              </div>
            </>
          )}
        </div>
      </div>

      </>
    );

    const renderBusinessTopbar = () => (
      <>
      <div className={styles.topbar}>
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
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <Menu size={26} />
          </div>

          <nav className={`${styles.navLinks} ${menuOpen ? styles.open : ""}`}>
  <Link href="/home" className={styles.navLink}>
    Home
  </Link>

 {currentRole === "doctor" && (
    <Link
      href="/DoctorDashboard?section=appointments"
      className={styles.navLink}
    >
      Online Consultation
    </Link>
  )}
  {currentRole === "clinic" && (
    <Link
      href="/home/ClinicHiringPortal"
      className={styles.navLink}
    >
      Hiring
    </Link>
  )} 
  <Link href="/course-listing" className={styles.navLink}>
    Buy Courses
  </Link>

  <Link href="/workshop-trainings" className={styles.navLink}>
    Workshop Training
  </Link>

  <Link href="/home/B2bProductsList" className={styles.navLink}>
    B2B Products
  </Link>

  {currentRole === "b2buser" && (
    <>
      <Link href="/B2BUserDashboard" className={styles.navLink}>
        My Dashboard
      </Link>
      <button
        type="button"
        className={styles.businessNavLink}
        onClick={handleBecomeClinic}
      >
        <span className={styles.businessText}>
          <span>Become a Clinic</span>
          <ArrowUpRight size={15} className={styles.businessIcon} />
        </span>
      </button>
    </>
  )}
</nav>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.location} onClick={() => setLocationModalOpen(true)}>
            <MapPin size={18} />
            {location && <span className={styles.locationText}>{location}</span>}
          </div>

          {username ? (
            <div className={styles.userSection} style={{ position: "relative" }}>
              <button
                ref={userBtnRef}
                className={styles.userIconBtn}
                onClick={() => setProfileOpen((s) => !s)}
                aria-label="Open business profile"
                title={username}
                style={{ padding: 0, border: "none", background: "transparent" }}
              >
                {profileImage ? (
                  renderProfileAvatar("B")
                ) : (
                  renderProfileAvatar("B")
                )}
              </button>

              {profileOpen && (
                <div
                  className={styles.profileDropdown}
                  role="dialog"
                  aria-modal="false"
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <div className={styles.profileDropdownHeader}>
                    <div className={styles.profileAvatarWrap}>
                      {profileImage ? (
                            <img
                              src={profileImage}
                              alt={username || "Business profile"}
                              className={styles.profileAvatar}
                            />
                          ) : (
                            <div className={styles.profileAvatarPlaceholder}>
                              {username?.slice(0, 1).toUpperCase() || "B"}
                            </div>
                          )}
                    </div>
                    <h3 className={styles.profileDropdownName}>{username}</h3>
                    <p className={styles.profileDropdownContact}>
                      {contactNo ? `+91 ${contactNo}` : email || "—"}
                    </p>
                  </div>

                  <div className={styles.profileDropdownDivider} />

                  <div className={styles.profileDropdownActions}>
                    <button
                      className={styles.profileActionBtn}
                      onClick={() => {
                        setProfileOpen(false);
                        if (currentRole === "doctor") {
                          router.push("/DoctorDashboard");
                          return;
                        }
                        if (currentRole === "b2buser") {
                          router.push("/B2BUserDashboard");
                          return;
                        }
                        router.push("/ClinicDashboard");
                      }}
                    >
                      <User size={18} />
                      <span>View Profile</span>
                    </button>

                    <button
                      className={`${styles.profileActionBtn} ${styles.profileActionLogout}`}
                      onClick={handleLogout}
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            renderLoginOptions()
          )}

          <div className={styles.cartInfo} onClick={handleClickCart}>
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </div>
        </div>
      </div>

      </>
    );

    return (
      <>
        {doctorAccountDetected && currentRole === "b2buser" && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "10px 16px",
              background: "#fef3c7",
              color: "#92400e",
              fontSize: 13,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            <span>
              A doctor account has been created with your registered number. Please logout
              and log in again to switch to your doctor account.
            </span>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "6px 14px",
                background: "#92400e",
                color: "#fff",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Logout Now
            </button>
          </div>
        )}
        {isBusinessMode ? renderBusinessTopbar() : renderDefaultTopbar()}

        {locationModalOpen && (
          <LocationPickerModal
            initialLat={Number(Cookies.get("latitude")) || undefined}
            initialLng={Number(Cookies.get("longitude")) || undefined}
            onConfirm={handleLocationConfirmed}
            onClose={() => setLocationModalOpen(false)}
          />
        )}
      </>
    );
  };

 export default Topbar;
