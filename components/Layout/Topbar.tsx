  "use client";

  import React, { useEffect, useRef, useState } from "react";
  import Link from "next/link";
  import styles from "@/styles/components/Layout/Topbar.module.css";
  import Image from "next/image";
  import { useRouter, usePathname } from "next/navigation";
  import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
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
  import { getGoogleMapsLoaderOptions } from "@/lib/googleMaps";

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
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationDebug, setLocationDebug] = useState<{
    status?: string;
    formattedAddress?: string;
    rawAddress?: string;
    componentSummary?: string;
    error?: string;
    origin?: string;
    keySuffix?: string;
  } | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const userBtnRef = useRef<HTMLButtonElement | null>(null);
    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY || "";

    const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader(
      getGoogleMapsLoaderOptions(googleMapsApiKey)
    );

    const username = profile?.username ?? null;
    const profileImage = profile?.profileImage ?? null;
    const email = profile?.email ?? null;
    const contactNo = profile?.contactNo ?? null;
    const currentRole = isHydrated ? Cookies.get("role")?.toLowerCase() : null;
    const isClinicMode = currentRole === "clinic";

    useEffect(() => {
      setIsHydrated(true);
    }, []);

    useEffect(() => {
      const storedLocation = Cookies.get("location");
      if (storedLocation && storedLocation !== "Current location") setLocation(storedLocation);
    }, []);

    const isDashboard =
      pathname?.startsWith("/ClinicDashboard") ||
      pathname?.startsWith("/DoctorDashboard") ||
      pathname?.startsWith("/AdminDashboard") ||
      pathname?.includes("Dashboard");

  const handleClickCart = () => {
    router.push("/home/Cart");
  };

  const getComponent = (components: any[] | undefined, type: string) =>
    components?.find((part) => part.types?.includes(type));

  const formatDetailedAddress = (
    result: google.maps.GeocoderResult | undefined,
    latitude: number,
    longitude: number
  ) => {
    const components = result?.address_components || [];
    const firstComponent = (type: string) => getComponent(components, type)?.long_name;
    const orderedParts = [
      firstComponent("floor"),
      firstComponent("subpremise"),
      firstComponent("premise"),
      firstComponent("block"),
      firstComponent("sector"),
      [firstComponent("street_number"), firstComponent("route")]
        .filter(Boolean)
        .join(" "),
      firstComponent("neighborhood"),
      firstComponent("sublocality_level_4"),
      firstComponent("sublocality_level_3"),
      firstComponent("sublocality_level_2"),
      firstComponent("sublocality_level_1"),
      firstComponent("locality"),
      firstComponent("postal_town"),
      firstComponent("administrative_area_level_3"),
      firstComponent("administrative_area_level_2"),
      firstComponent("administrative_area_level_1"),
      firstComponent("postal_code"),
    ]
      .map((part) => String(part || "").trim())
      .filter(Boolean);

    const uniqueParts = Array.from(new Set(orderedParts));
    if (uniqueParts.length > 0) {
      return uniqueParts.join(", ");
    }

    return result?.formatted_address || `Location unavailable`;
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
    if (!googleMapsApiKey) {
      setLocationDebug({
        error: "Missing NEXT_PUBLIC_GOOGLE_MAP_KEY",
        origin: window.location.origin,
        keySuffix: "n/a",
      });
      return "Location unavailable";
    }

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
    console.log("[Topbar geocode debug]", debugPayload, data);
    setLocationDebug({
      status: data?.status,
      formattedAddress: result?.formatted_address || "",
      rawAddress: result?.address_components?.map((part: any) => part.long_name).join(", ") || "",
      componentSummary: summarizeAddressComponents(result),
      error: data?.error_message || "",
      origin: window.location.origin,
      keySuffix: googleMapsApiKey.slice(-4),
    });
    if (!result) return "Location unavailable";
    return formatDetailedAddress(result, latitude, longitude);
  };

    const fetchLocation = (silent = false) => {
      if (!navigator.geolocation) {
        if (!silent) alert("Geolocation not supported");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const coords = { lat: latitude, lng: longitude };
          setLocationCoords(coords);
          setLocationModalOpen(true);
          try {
            const finalLocation = await reverseGeocodeWithGoogle(latitude, longitude);
            setLocation(finalLocation);
            if (finalLocation !== "Location unavailable") {
              Cookies.set("location", finalLocation, { expires: 7 });
            }
          } catch {
            setLocation("Location unavailable");
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

      Cookies.remove("token");
      Cookies.remove("username");
      Cookies.remove("clinicName");
      Cookies.remove("clinicId");
      Cookies.remove("email");
      Cookies.remove("userId");
      Cookies.remove("location");
      Cookies.remove("contactNo");
      Cookies.remove("profileImage");
      Cookies.remove("role");
      Cookies.remove("cartScope");

      localStorage.removeItem("userId");
      localStorage.removeItem("clinicId");
      localStorage.removeItem("profileImage");
      localStorage.removeItem("cartScope");
      profile?.clearProfile();

      setLocation("");
      window.dispatchEvent(new CustomEvent("user-logged-out"));
      router.replace(roleBeforeLogout === "clinic" ? "/cliniclogin" : "/Login");
    };

    const renderLoginOptions = () => (
      <button
        type="button"
        className={styles.loginLink}
        onClick={() => router.push("/Login")}
      >
        Login
      </button>
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
            onClick={() => setMenuOpen(!menuOpen)}
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
            <Link href="/cliniclogin" className={styles.businessNavLink}>
              <span className={styles.businessTag}>BUSINESS</span>
              <span className={styles.businessText}>
                <span>Free Listing</span>
                <ArrowUpRight size={15} className={styles.businessIcon} />
              </span>
            </Link>
          </nav>
        </div>

        <div className={styles.rightSection}>
          {isDashboard ? (
            username ? (
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Logout
              </button>
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
                      <img
                        src={profileImage}
                        alt={username}
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
                        {username.slice(0, 1).toUpperCase()}
                      </div>
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

      {locationModalOpen && (
        <div className={styles.locationModalOverlay} onClick={() => setLocationModalOpen(false)}>
          <div className={styles.locationModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.locationModalHeader}>
              <div>
              <p className={styles.locationModalKicker}>Address details</p>
              <h3 className={styles.locationModalTitle}>Your Google Map</h3>
              </div>
              <button
                type="button"
                className={styles.locationModalClose}
                onClick={() => setLocationModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className={styles.locationModalBody}>
              <div className={styles.locationAddress}>
                <MapPin size={16} />
                <span>{location || "Fetching address..."}</span>
              </div>

              {locationDebug && (
                <div className={styles.locationDebugBox}>
                  <div><strong>Origin:</strong> {locationDebug.origin || "-"}</div>
                  <div><strong>Key:</strong> {locationDebug.keySuffix || "-"}</div>
                  <div><strong>Status:</strong> {locationDebug.status || "-"}</div>
                  <div><strong>Formatted:</strong> {locationDebug.formattedAddress || "-"}</div>
                  <div><strong>Raw:</strong> {locationDebug.rawAddress || "-"}</div>
                  <div><strong>Components:</strong> {locationDebug.componentSummary || "-"}</div>
                  {locationDebug.error && (
                    <div><strong>Error:</strong> {locationDebug.error}</div>
                  )}
                </div>
              )}

              {isGoogleMapsLoaded && locationCoords ? (
                <GoogleMap
                  mapContainerClassName={styles.locationMap}
                  center={locationCoords}
                  zoom={16}
                  options={{
                    disableDefaultUI: true,
                    gestureHandling: "greedy",
                    clickableIcons: false,
                  }}
                >
                  <Marker position={locationCoords} />
                </GoogleMap>
              ) : (
                <div className={styles.locationMapPlaceholder}>Loading map...</div>
              )}
            </div>
          </div>
        </div>
      )}
      </>
    );

    const renderClinicTopbar = () => (
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

          <nav className={styles.navLinks}>
            <Link href="/home" className={styles.navLink}>
              Home
            </Link>
            <Link href="/course-listing" className={styles.navLink}>
            Buy Courses
            </Link>
            <Link href="/home/B2bProductsList" className={styles.navLink}>
              Buy B2B Products
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
                aria-label="Open clinic profile"
                title={username}
                style={{ padding: 0, border: "none", background: "transparent" }}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={username}
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
                    {username.slice(0, 1).toUpperCase()}
                  </div>
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
                          alt={username || "Clinic"}
                          className={styles.profileAvatar}
                        />
                      ) : (
                        <div className={styles.profileAvatarPlaceholder}>
                          {username?.slice(0, 1).toUpperCase() || "C"}
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

      {locationModalOpen && (
        <div className={styles.locationModalOverlay} onClick={() => setLocationModalOpen(false)}>
          <div className={styles.locationModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.locationModalHeader}>
              <div>
              <p className={styles.locationModalKicker}>Address details</p>
              <h3 className={styles.locationModalTitle}>Your Google Map</h3>
              </div>
              <button
                type="button"
                className={styles.locationModalClose}
                onClick={() => setLocationModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className={styles.locationModalBody}>
              <div className={styles.locationAddress}>
                <MapPin size={16} />
                <span>{location || "Fetching address..."}</span>
              </div>

              {locationDebug && (
                <div className={styles.locationDebugBox}>
                  <div><strong>Origin:</strong> {locationDebug.origin || "-"}</div>
                  <div><strong>Key:</strong> {locationDebug.keySuffix || "-"}</div>
                  <div><strong>Status:</strong> {locationDebug.status || "-"}</div>
                  <div><strong>Formatted:</strong> {locationDebug.formattedAddress || "-"}</div>
                  <div><strong>Raw:</strong> {locationDebug.rawAddress || "-"}</div>
                  <div><strong>Components:</strong> {locationDebug.componentSummary || "-"}</div>
                  {locationDebug.error && (
                    <div><strong>Error:</strong> {locationDebug.error}</div>
                  )}
                </div>
              )}

              {isGoogleMapsLoaded && locationCoords ? (
                <GoogleMap
                  mapContainerClassName={styles.locationMap}
                  center={locationCoords}
                  zoom={16}
                  options={{
                    disableDefaultUI: true,
                    gestureHandling: "greedy",
                    clickableIcons: false,
                  }}
                >
                  <Marker position={locationCoords} />
                </GoogleMap>
              ) : (
                <div className={styles.locationMapPlaceholder}>Loading map...</div>
              )}
            </div>
          </div>
        </div>
      )}
      </>
    );

    return (
      <>
        {isClinicMode ? renderClinicTopbar() : renderDefaultTopbar()}
      </>
    );
  };

  export default Topbar;
