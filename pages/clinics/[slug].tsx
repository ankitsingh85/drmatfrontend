"use client";

import { API_URL } from "@/config/api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "@/styles/pages/clinicDetailPage.module.css";
import ClinicCard from "@/components/Layout/clinicCard";
import Footer from "@/components/Layout/Footer";
import Ratings from "@/components/Layout/Reviews";
import Topbar from "@/components/Layout/Topbar";
import FullPageLoader from "@/components/common/FullPageLoader";

interface Clinic {
  _id: string;
  slug?: string;
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
  const { slug } = router.query;
  const slugValue = Array.isArray(slug) ? slug[0] : slug;
  const tabs: Array<"Details" | "Services" | "Doctors" | "Reviews"> = [
    "Details",
    "Services",
    "Doctors",
    "Reviews",
  ];

  const apiBaseUrl = API_URL.replace(/\/api\/?$/, "");

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [services, setServices] = useState<ClinicService[]>([]);
  const [loadingClinic, setLoadingClinic] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "Details" | "Services" | "Doctors" | "Reviews"
  >("Details");
  const [error, setError] = useState("");

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
    if (!slugValue) return;
    const fetchClinic = async () => {
      setLoadingClinic(true);
      try {
        const res = await fetch(`${API_URL}/clinics/${slugValue}`);
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
  }, [slugValue, apiBaseUrl]);

  if (loadingClinic) return <FullPageLoader />;
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
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab as typeof activeTab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <section className={styles.panelShell}>
          {activeTab === "Details" && (
            <div className={styles.detailsLayout}>
              <div className={styles.primaryPanel}>
                <span className={styles.sectionEyebrow}>Clinic overview</span>
                <h2 className={styles.heading}>{clinic.name}</h2>
                <p className={styles.leadText}>
                  {clinic.description ||
                    "A trusted dermatology destination with focused care, professional support, and a patient-friendly experience."}
                </p>

                <div className={styles.infoCardGrid}>
                  <article className={styles.infoCard}>
                    <h3 className={styles.cardTitle}>About this clinic</h3>
                    <p className={styles.cardText}>
                      {clinic.description ||
                        "No description available right now. Please explore the other sections for services, doctors, and patient reviews."}
                    </p>
                  </article>

                  <article className={styles.infoCard}>
                    <h3 className={styles.cardTitle}>Location</h3>
                    <p className={styles.cardText}>
                      {clinic.address || "Address not provided"}
                    </p>
                  </article>
                </div>
              </div>

              {/* <aside className={styles.sidePanel}>
                <div className={styles.sideCard}>
                  <h3 className={styles.sideTitle}>Quick facts</h3>
                  <div className={styles.factItem}>
                    <span className={styles.factLabel}>Phone</span>
                    <span className={styles.factValue}>
                      {clinic.mobile || clinic.contactNumber || "Not available"}
                    </span>
                  </div>
                  <div className={styles.factItem}>
                    <span className={styles.factLabel}>WhatsApp</span>
                    <span className={styles.factValue}>
                      {clinic.whatsapp || "Not available"}
                    </span>
                  </div>
                  <div className={styles.factItem}>
                    <span className={styles.factLabel}>Directions</span>
                    <span className={styles.factValue}>
                      {clinic.mapLink ? "Available" : "Not available"}
                    </span>
                  </div>
                </div>
              </aside> */}
            </div>
          )}

          {activeTab === "Services" && (
            <div className={styles.contentPanel}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.sectionEyebrow}>What they offer</span>
                  <h3 className={styles.sectionTitle}>Services at {clinic.name}</h3>
                </div>
                <span className={styles.countBadge}>
                  {loadingServices ? "..." : services.length} services
                </span>
              </div>

              {loadingServices ? (
                <FullPageLoader />
              ) : services.length === 0 ? (
                <div className={styles.emptyState}>No services available.</div>
              ) : (
                <div className={styles.servicesGrid}>
                  {services.map((service, index) => (



                    <article key={service.id} className={styles.serviceCard}>
                      <span className={styles.serviceNumber}>
                        {(index + 1).toString().padStart(2, "0")}
                      </span>
                      <h4 className={styles.serviceTitle}>{service.name}</h4>
                      <p className={styles.serviceMeta}>
                        Personalized dermatology support and treatment planning.
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Doctors" && (
            <div className={styles.contentPanel}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.sectionEyebrow}>Medical team</span>
                  <h3 className={styles.sectionTitle}>Doctors in {clinic.name}</h3>
                </div>
                <span className={styles.countBadge}>
                  {Array.isArray(clinic.doctors) ? clinic.doctors.length : 0} doctors
                </span>
              </div>

              {!Array.isArray(clinic.doctors) || clinic.doctors.length === 0 ? (
                <div className={styles.emptyState}>No doctors listed for this clinic.</div>
              ) : (
                <div className={styles.doctorsGrid}>
                  {clinic.doctors.map((doctor, index) => (
                    <article
                      key={`${doctor.regNo || doctor.name}-${index}`}
                      className={styles.doctorCard}
                    >
                      <img
                        src={getDoctorPlaceholder(doctor.name)}
                        alt={doctor.name}
                        className={styles.doctorImage}
                      />
                      <div className={styles.doctorContent}>
                        <div className={styles.doctorTopRow}>
                          <div>
                            <h4 className={styles.doctorName}>Dr. {doctor.name}</h4>
                            <p className={styles.doctorSpecialization}>
                              {doctor.specialization || "Dermatology specialist"}
                            </p>
                          </div>
                          {doctor.regNo && (
                            <span className={styles.doctorBadge}>
                              Reg. {doctor.regNo}
                            </span>
                          )}
                        </div>
                        <p className={styles.doctorNote}>
                          Experienced in patient consultations, diagnosis, and guided care.
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Reviews" && (
            <div className={styles.contentPanel}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.sectionEyebrow}>Patient feedback</span>
                  <h3 className={styles.sectionTitle}>Reviews and trust signals</h3>
                </div>
                <span className={styles.countBadge}>
                  {clinic.reviews ?? 0} reviews
                </span>
              </div>

              <div className={styles.reviewsLayout}>
                <div className={styles.reviewSummaryCard}>
                  <span className={styles.reviewScore}>4.5</span>
                  <p className={styles.reviewSummaryText}>
                    {clinic.reviews && clinic.reviews > 0
                      ? `${clinic.reviews} people have reviewed this clinic.`
                      : "No reviews yet. Once patients share feedback, it will appear here."}
                  </p>
                </div>
                <div className={styles.reviewPanel}>
                  <Ratings />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </>
  );
};

export default ClinicDetailPage;
