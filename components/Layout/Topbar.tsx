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
  import Cookies from "js-cookie";

  interface TopbarProps {
    hideHamburgerOnMobile?: boolean;
  }

  const Topbar: React.FC<TopbarProps> = ({ hideHamburgerOnMobile }) => {
    const router = useRouter();
  const pathname = usePathname();
  const { cartItems } = useCart();
  const profile = useTopbarProfile();
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [isHydrated, setIsHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState<string>("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
  const userBtnRef = useRef<HTMLButtonElement | null>(null);
  const businessMenuRef = useRef<HTMLDivElement | null>(null);
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY || "";

    const username = profile?.username ?? null;
    const profileImage = profile?.profileImage ?? null;
    const email = profile?.email ?? null;
    const contactNo = profile?.contactNo ?? null;
    const currentRole = isHydrated ? Cookies.get("role")?.toLowerCase() : null;
    const isBusinessMode = currentRole === "clinic" || currentRole === "doctor";

    useEffect(() => {
      setIsHydrated(true);
    }, []);
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
    if (currentRole === "clinic") return "/cliniclogin";
    if (currentRole === "doctor") return "/doctorlogin";
    return "/Login";
  };

  const handleClickCart = () => {
    setBusinessMenuOpen(false);
    router.push("/home/Cart");
  };

  const handleBusinessLogin = (path: string) => {
    setBusinessMenuOpen(false);
    setMenuOpen(false);
    router.push(path);
  };

  const getComponent = (components: any[] | undefined, type: string) =>
    components?.find((part) => part.types?.includes(type));

const formatDetailedAddress = (
  result: google.maps.GeocoderResult | undefined
) => {
  const components = result?.address_components || [];

  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name;

 const sector =
  get("sublocality_level_1") ||
  get("sublocality_level_2") ||
  get("neighborhood") ||
  get("route");

  const city =
    get("locality") ||
    get("postal_town") ||
    get("administrative_area_level_2");

  return [sector, city].filter(Boolean).join(", ");
};
  const summarizeAddressComponents = (result: google.maps.GeocoderResult | undefined) => {
    const components = result?.address_components || [];
    const preferredTypes = [
      "floor",
      "subpremise",
      "premise",
      "block",
      "sector",
      "street_number",
      "route",
      "neighborhood",
      "sublocality_level_4",
      "sublocality_level_3",
      "sublocality_level_2",
      "sublocality_level_1",
      "locality",
      "postal_town",
      "administrative_area_level_3",
      "administrative_area_level_2",
      "administrative_area_level_1",
      "postal_code",
    ];

    return components
      .map((component) => {
        const key = component.types.find((type) => preferredTypes.includes(type));
        return key ? `${key}: ${component.long_name}` : "";
      })
      .filter(Boolean)
      .join(" | ");
  };

  const reverseGeocodeWithGoogle = async (latitude: number, longitude: number) => {
    if (!googleMapsApiKey) return "Location unavailable";

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${encodeURIComponent(
        googleMapsApiKey
      )}`
    );
    const data = await res.json();
    const result = data?.results?.[0];
    const debugPayload = {
      origin: window.location.origin,
      keySuffix: googleMapsApiKey.slice(-4),
      status: data?.status,
      error_message: data?.error_message || "",
      result_count: data?.results?.length || 0,
      formatted_address: result?.formatted_address || "",
    };


console.log("Google Response", data);

if (data.status !== "OK") {
  console.log(data.error_message);
  return "Location unavailable";
}



return formatDetailedAddress(result);
  };

    const fetchLocation = (silent = false) => {
      if (!navigator.geolocation) {
        if (!silent) alert("Geolocation not supported");
        return;
      }
     navigator.geolocation.getCurrentPosition(
  async (position) => {
    const { latitude, longitude, accuracy } = position.coords;

    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);
    console.log("Accuracy:", accuracy);

    try {
      const finalLocation = await reverseGeocodeWithGoogle(
        latitude,
        longitude
      );

      setLocation(finalLocation);

      Cookies.set("location", finalLocation, {
        expires: 7,
      });

      Cookies.set("latitude", latitude.toString(), {
        expires: 7,
      });

      Cookies.set("longitude", longitude.toString(), {
        expires: 7,
      });

    } catch (err) {
      console.error(err);
      setLocation("Location unavailable");
    }
  },
  () => {
    if (!silent) {
      alert("Location access denied");
    }
  },
  {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 0,
  }
);

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

    useEffect(() => {
      if (!businessMenuOpen) return;

      const handleBusinessClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (businessMenuRef.current && !businessMenuRef.current.contains(target)) {
          setBusinessMenuOpen(false);
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setBusinessMenuOpen(false);
        }
      };

      document.addEventListener("mousedown", handleBusinessClickOutside);
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("mousedown", handleBusinessClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [businessMenuOpen]);

    const handleLogout = () => {
      const roleBeforeLogout = currentRole;

      [
        "token",
        "username",
        "clinicName",
        "clinicId",
        "doctorId",
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
      localStorage.removeItem("profileImage");
      localStorage.removeItem("cartScope");
      profile?.clearProfile();

      setLocation("");
      window.dispatchEvent(new CustomEvent("user-logged-out"));
      router.replace(
        roleBeforeLogout === "clinic"
          ? "/cliniclogin"
          : roleBeforeLogout === "doctor"
          ? "/doctorlogin"
          : "/Login"
      );
    };

  const renderLoginOptions = () => (
      <button
        type="button"
        className={styles.loginLink}
        onClick={() => {
          setMenuOpen(false);
          setBusinessMenuOpen(false);
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
            onClick={() => {
              setMenuOpen((prev) => !prev);
              setBusinessMenuOpen(false);
            }}
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
            <Link href="/Chat" className={styles.navLink}>
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
            <div className={styles.businessNavWrap} ref={businessMenuRef}>
              <button
                type="button"
                className={styles.businessNavLink}
                onClick={() => setBusinessMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={businessMenuOpen}
                aria-controls="business-login-menu"
              >
                <span className={styles.businessTag}>BUSINESS</span>
                <span className={styles.businessText}>
                  <span>Free Listing</span>
                  <ArrowUpRight size={15} className={styles.businessIcon} />
                </span>
              </button>

              {businessMenuOpen && (
                <div
                  id="business-login-menu"
                  className={styles.businessDropdown}
                  role="menu"
                  aria-label="Business login options"
                >
                  <button
                    type="button"
                    className={styles.businessDropdownItem}
                    onClick={() => handleBusinessLogin("/cliniclogin")}
                    role="menuitem"
                  >
                    <span className={styles.businessDropdownTitle}>Login as Clinic</span>
                    <span className={styles.businessDropdownDesc}>
                      Continue to the clinic login page
                    </span>
                  </button>

                  <button
                    type="button"
                    className={styles.businessDropdownItem}
                    onClick={() => handleBusinessLogin("/doctorlogin")}
                    role="menuitem"
                  >
                    <span className={styles.businessDropdownTitle}>Login as Doctor</span>
                    <span className={styles.businessDropdownDesc}>
                      Continue to the doctor login page
                    </span>
                  </button>
                </div>
              )}
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
              <div className={styles.location} onClick={() => fetchLocation(false)}>
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
            onClick={() => {
              setMenuOpen((prev) => !prev);
              setBusinessMenuOpen(false);
            }}
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
</nav>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.location} onClick={() => fetchLocation(false)}>
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
                        router.push(
                          currentRole === "doctor"
                            ? "/DoctorDashboard"
                            : "/ClinicDashboard"
                        );
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
        {isBusinessMode ? renderBusinessTopbar() : renderDefaultTopbar()}
      </>
    );
  };

 export default Topbar;
