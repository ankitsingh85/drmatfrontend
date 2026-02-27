"use client";

import { API_URL } from "@/config/api";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import styles from "@/styles/pages/clinicDetailPage.module.css";
import ClinicCard from "@/components/Layout/clinicCard";
import Footer from "@/components/Layout/Footer";
import Ratings from "@/components/Layout/Reviews";
import Topbar from "@/components/Layout/Topbar";

interface Clinic {
  _id: string;
  name: string;
  clinicName?: string;
  description?: string;
  address?: string;
  images?: string[];
  clinicLogo?: string;
  bannerImage?: string;
  photos?: string[];
  contactNumber?: string;
  mobile?: string;
  whatsapp?: string;
  mapLink?: string;
  verified?: boolean;
  trusted?: boolean;
  reviews?: number;
  availableServices?: string;
  doctors?: Array<{
    name: string;
    regNo?: string;
    specialization?: string;
  }>;
}

interface ClinicService {
  id: string;
  name: string;
}

const ClinicDetailPage = () => {
  const router = useRouter();
  const { clinicId } = router.query;
  const clinicIdValue = Array.isArray(clinicId) ? clinicId[0] : clinicId;

  const apiBaseUrl = API_URL.replace(/\/api\/?$/, "");

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [services, setServices] = useState<ClinicService[]>([]);
  const [loadingClinic, setLoadingClinic] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "Details" | "Services" | "Doctors" | "Reviews"
  >("Details");
  const [error, setError] = useState("");
  const [showAllServices, setShowAllServices] = useState(false);

  const getImage = (img?: string) => {
    if (!img) return undefined;
    if (img.startsWith("data:")) return img;
    if (img.startsWith("/")) return `${apiBaseUrl}${img}`;
    return img;
  };

  const parseServices = (raw?: string): ClinicService[] => {
    if (!raw) return [];
    const cleaned = raw
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ");

    const items = cleaned
      .split(/[\n,|]/g)
      .map((item) => item.trim())
      .filter(Boolean);

    const unique = Array.from(new Set(items));
    return unique.map((name, index) => ({ id: `${index}-${name}`, name }));
  };

  const getDoctorPlaceholder = (name?: string) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="260" viewBox="0 0 360 260">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#e2e8f0"/>
            <stop offset="100%" stop-color="#cbd5e1"/>
          </linearGradient>
        </defs>
        <rect width="360" height="260" fill="url(#g)"/>
        <circle cx="180" cy="100" r="42" fill="#94a3b8"/>
        <rect x="110" y="148" width="140" height="78" rx="39" fill="#94a3b8"/>
        <text x="180" y="246" text-anchor="middle" font-size="16" fill="#334155" font-family="Arial, sans-serif">
          ${name || "Doctor"}
        </text>
      </svg>`
    )}`;

  useEffect(() => {
    if (!clinicIdValue) return;
    const fetchClinic = async () => {
      setLoadingClinic(true);
      try {
        const res = await fetch(`${API_URL}/clinics/${clinicIdValue}`);
        if (!res.ok) throw new Error("Failed to fetch clinic details");
        const data: Clinic = await res.json();
        const normalizedImages = [
          getImage(data.clinicLogo),
          getImage(data.bannerImage),
          ...(data.photos?.map((img) => getImage(img)) || []),
          ...(data.images?.map((img) => getImage(img)) || []),
        ].filter((img): img is string => Boolean(img));

        const normalizedClinic: Clinic = {
          ...data,
          name: data.name || data.clinicName || "Clinic",
          images:
            normalizedImages.length > 0
              ? Array.from(new Set(normalizedImages))
              : ["/placeholder-clinic.jpg"],
          mobile: data.mobile || data.contactNumber,
        };

        setClinic(normalizedClinic);
        setServices(parseServices(data.availableServices));
      } catch (err: any) {
        setError(err.message || "Error loading clinic");
      } finally {
        setLoadingClinic(false);
        setLoadingServices(false);
      }
    };
    fetchClinic();
  }, [clinicIdValue, apiBaseUrl]);

  useEffect(() => {
    setShowAllServices(false);
  }, [clinicIdValue]);

  const groupedServices = useMemo(() => {
    const groups: Record<string, ClinicService[]> = {
      Treatment: [],
      Therapy: [],
      Tests: [],
      Management: [],
    };

    const detectGroup = (name: string) => {
      const v = name.toLowerCase();
      if (/test|scan|profile|blood|diagnostic|lab/.test(v)) return "Tests";
      if (/therapy|physio|massage|rehab|laser/.test(v)) return "Therapy";
      if (/manage|management|control|care|follow/.test(v)) return "Management";
      return "Treatment";
    };

    services.forEach((service) => {
      const key = detectGroup(service.name);
      groups[key].push(service);
    });

    return groups;
  }, [services]);

  if (loadingClinic) return <div className={styles.loading}>Loading clinic info...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!clinic) return <div className={styles.error}>Clinic not found.</div>;

  return (
    <>
      <div className={styles.pageWrapper}>
        <Topbar />

        <div className={styles.topSection}>
          <div className={styles.clinicCardSection}>
            <ClinicCard clinic={clinic} />
          </div>
        </div>

        <div className={styles.tabContainer}>
          {["Details", "Services", "Doctors", "Reviews"].map((tab) => (
            <button
              key={tab}
              className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab as typeof activeTab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Details" && (
          <section className={styles.container}>
            <h2 className={styles.heading}>{clinic.name}</h2>
            <p className={styles.paragraph}>{clinic.description || "No description available"}</p>
            <h3 className={styles.subheading}>Address</h3>
            <p className={styles.paragraph}>{clinic.address || "Address not provided"}</p>
          </section>
        )}

        {activeTab === "Services" && (
          <section className={styles.servicesTabPanel}>
            <div className={styles.servicesShowcaseV2}>
              {loadingServices ? (
                <p>Loading services...</p>
              ) : services.length === 0 ? (
                <p>No services available.</p>
              ) : (
                <>
                  <div className={styles.servicesColumnsV2}>
                    {Object.entries(groupedServices).map(([groupName, items]) => {
                      const visibleItems = showAllServices ? items : items.slice(0, 2);
                      const extraCount = Math.max(0, items.length - visibleItems.length);

                      return (
                        <div key={groupName} className={styles.servicesColumnV2}>
                          <h4 className={styles.servicesGroupTitleV2}>
                            <span className={styles.groupTickV2}>+</span> {groupName}
                          </h4>
                          {visibleItems.length === 0 ? (
                            <p className={styles.servicesEmptyV2}>No services</p>
                          ) : (
                            <div className={styles.servicesLinksV2}>
                              {visibleItems.map((service) => (
                                <span key={service.id} className={styles.serviceLinkLikeV2}>
                                  {service.name}
                                </span>
                              ))}
                              {!showAllServices && extraCount > 0 && (
                                <span className={styles.moreCountV2}>+{extraCount}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.servicesActionsV2}>
                    <button
                      type="button"
                      className={styles.viewAllButtonV2}
                      onClick={() => setShowAllServices((prev) => !prev)}
                    >
                      {showAllServices ? "View less" : "View all"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {activeTab === "Doctors" && (
          <section className={styles.doctorsTabPanel}>
            <h3 className={styles.doctorsHeadingV2}>Doctors in {clinic.name}</h3>
            {!Array.isArray(clinic.doctors) || clinic.doctors.length === 0 ? (
              <p>No doctors listed for this clinic.</p>
            ) : (
              <div className={styles.doctorsGridV2}>
                {clinic.doctors.map((doctor, index) => (
                  <article
                    key={`${doctor.regNo || doctor.name}-${index}`}
                    className={styles.doctorCardV2}
                  >
                    <img
                      src={getDoctorPlaceholder(doctor.name)}
                      alt={doctor.name}
                      className={styles.doctorImageV2}
                    />
                    <h4 className={styles.doctorNameV2}>Dr. {doctor.name}</h4>
                    <p className={styles.doctorSpecializationV2}>
                      {doctor.specialization || "Doctor"}
                    </p>
                    <p className={styles.doctorRatingV2}>
                      <strong>2.8</strong> <span className={styles.ratingStarV2}>★</span>
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "Reviews" && (
          <section>
            <div className={styles.reviewsContainer}>
              <Ratings />
              {clinic.reviews && clinic.reviews > 0 ? (
                <p>{clinic.reviews} people have reviewed this clinic.</p>
              ) : (
                <p>No reviews yet.</p>
              )}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </>
  );
};

export default ClinicDetailPage;

