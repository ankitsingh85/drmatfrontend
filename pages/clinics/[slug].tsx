"use client";

import { API_URL } from "@/config/api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import styles from "@/styles/pages/clinicDetailPage.module.css";
import ClinicCard from "@/components/Layout/clinicCard";
import Footer from "@/components/Layout/Footer";
import { FaStar } from "react-icons/fa";
import Topbar from "@/components/Layout/Topbar";
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl } from "@/lib/media";
interface Review {
  _id: string;

  name: string;

  rating: number;

  comment: string;

  createdAt: string;
  reply?:string;
}
interface Clinic {
  _id: string;
  slug?: string;
  name: string;
  clinicName?: string;
  description?: string;
  clinicDescription?: string;
  address?: string;
  photos?: string[];
  bannerImage?: string;
  clinicLogo?: string;
  contactNumber?: string;
  mobile?: string;
  whatsapp?: string;
  mapLink?: string;
  verified?: boolean;
  trusted?: boolean;
  reviews?: number;
  availableServices?: string;
  clinicServices?: Array<{
    _id: string;
    name: string;
    description?: string;
    imageUrl?: string;
  }>;
  doctors?: Array<{
    name: string;
    regNo?: string;
    specialization?: string;
  }>;
}

interface ClinicService {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

const stripHtml = (value?: string) => {
  if (!value) return "";

  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    const parsed = new DOMParser().parseFromString(value, "text/html");
    return parsed.body.textContent?.replace(/\s+/g, " ").trim() || "";
  }

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const ClinicDetailPage = () => {
  const router = useRouter();
  const { slug, tab } = router.query;
  const slugValue = Array.isArray(slug) ? slug[0] : slug;
  const tabQueryValue = Array.isArray(tab) ? tab[0] : tab;
  const tabs: Array<"Details" | "Services" | "Doctors" | "Reviews"> = [
    "Details",
    "Services",
    "Doctors",
    "Reviews",
  ];
  const [reviews, setReviews] = useState<Review[]>([]);

  const [hoverRating, setHoverRating] = useState(0);

  const [reviewForm, setReviewForm] = useState({
    name: "",

    rating: 0,

    comment: "",
  });
  // One review per logged-in user per clinic (enforced by the backend).
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [reviewMessage, setReviewMessage] = useState("");
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [services, setServices] = useState<ClinicService[]>([]);
  const [loadingClinic, setLoadingClinic] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "Details" | "Services" | "Doctors" | "Reviews"
  >("Details");
  const [error, setError] = useState("");

  // Lets a link (e.g. "View Clinic" from a treatment order) deep-link
  // straight into the Services tab via ?tab=Services.
  useEffect(() => {
    const requested = tabs.find(
      (t) => t.toLowerCase() === String(tabQueryValue || "").toLowerCase()
    );
    if (requested) setActiveTab(requested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabQueryValue]);

  const getImage = (img?: string) => {
    return resolveMediaUrl(img) || img;
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
      </svg>`,
    )}`;
  useEffect(() => {
    if (!clinic?._id) return;

    fetchReviews();
    fetchMyReview();
  }, [clinic?._id]);

  const fetchMyReview = async () => {
    const token = Cookies.get("token");
    if (!token || !clinic?._id) {
      setMyReview(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/clinic-reviews/${clinic._id}/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMyReview(res.ok ? data?.review || null : null);
    } catch {
      setMyReview(null);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/clinic-reviews/${clinic?._id}`);

      const data = await res.json();

      setReviews(data);
    } catch (err) {
      console.log(err);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clinic) return;

    const token = Cookies.get("token");
    if (!token) {
      setReviewMessage("Please log in to write a review.");
      return;
    }

    const res = await fetch(
      `${API_URL}/clinic-reviews`,

      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          clinicId: clinic._id,

          ...reviewForm,
        }),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setReviewMessage(data?.message || "Could not post your review.");
      if (res.status === 409) fetchMyReview();
      return;
    }
    setReviewMessage("");
    setMyReview(data?.review || null);

    setReviewForm({
      name: "",

      rating: 0,

      comment: "",
    });

    fetchReviews();
  };

  useEffect(() => {
    if (!slugValue) return;
    const fetchClinic = async () => {
      setLoadingClinic(true);
      try {
        const res = await fetch(`${API_URL}/clinics/${slugValue}`);
        if (!res.ok) throw new Error("Failed to fetch clinic details");
        const data: Clinic = await res.json();
        const normalizedImages = [
          ...(data.photos?.map((img) => getImage(img)) || []),
        ].filter((img): img is string => Boolean(img));

        // No separate gallery photos uploaded — fall back to whichever
        // single image the clinic does have (banner, then logo) instead
        // of jumping straight to the generic placeholder.
        const fallbackImage =
          getImage(data.bannerImage) || getImage(data.clinicLogo) || "/clinic-image.png";

        const normalizedClinic: Clinic = {
          ...data,
          name: data.name || data.clinicName || "Clinic",
          description: stripHtml(
            data.description || data.clinicDescription || "",
          ),
          photos:
            normalizedImages.length > 0
              ? Array.from(new Set(normalizedImages))
              : [fallbackImage],
          mobile: data.mobile || data.contactNumber,
        };

        setClinic(normalizedClinic);

        // Prefer the admin/clinic-picked catalog services (real name +
        // image + description) over the legacy free-text availableServices
        // blob — only fall back to parsing that text when nothing has been
        // picked from the catalog yet.
        const catalogServices = (data.clinicServices || []).map((s) => ({
          id: s._id,
          name: s.name,
          description: s.description,
          imageUrl: s.imageUrl,
        }));
        setServices(
          catalogServices.length > 0
            ? catalogServices
            : parseServices(data.availableServices)
        );
      } catch (err: any) {
        setError(err.message || "Error loading clinic");
      } finally {
        setLoadingClinic(false);
        setLoadingServices(false);
      }
    };
    fetchClinic();
  }, [slugValue]);

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
                  <h3 className={styles.sectionTitle}>
                    Services at {clinic.name}
                  </h3>
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
                      {service.imageUrl ? (
                        <img
                          src={getImage(service.imageUrl)}
                          alt={service.name}
                          style={{
                            width: "100%",
                            height: 120,
                            objectFit: "cover",
                            borderRadius: 10,
                            marginBottom: 8,
                          }}
                        />
                      ) : (
                        <span className={styles.serviceNumber}>
                          {(index + 1).toString().padStart(2, "0")}
                        </span>
                      )}
                      <h4 className={styles.serviceTitle}>{service.name}</h4>
                      <p className={styles.serviceMeta}>
                        {service.description ||
                          "Personalized dermatology support and treatment planning."}
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
                  <h3 className={styles.sectionTitle}>
                    Doctors in {clinic.name}
                  </h3>
                </div>
                <span className={styles.countBadge}>
                  {Array.isArray(clinic.doctors) ? clinic.doctors.length : 0}{" "}
                  doctors
                </span>
              </div>

              {!Array.isArray(clinic.doctors) || clinic.doctors.length === 0 ? (
                <div className={styles.emptyState}>
                  No doctors listed for this clinic.
                </div>
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
                            <h4 className={styles.doctorName}>
                              Dr. {doctor.name}
                            </h4>
                            <p className={styles.doctorSpecialization}>
                              {doctor.specialization ||
                                "Dermatology specialist"}
                            </p>
                          </div>
                          {doctor.regNo && (
                            <span className={styles.doctorBadge}>
                              Reg. {doctor.regNo}
                            </span>
                          )}
                        </div>
                        <p className={styles.doctorNote}>
                          Experienced in patient consultations, diagnosis, and
                          guided care.
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
                  <span className={styles.sectionEyebrow}>
                    Patient feedback
                  </span>

                  <h3 className={styles.sectionTitle}>
                    Reviews and trust signals
                  </h3>
                </div>

                <span className={styles.countBadge}>
                  {reviews.length} reviews
                </span>
              </div>

              <div className={styles.reviewsLayout}>
                <div className={styles.reviewPanel}>
                  {myReview ? (
                    <p className={styles.reviewComment}>
                      You have already reviewed this clinic ({myReview.rating}★). Each user can review a clinic only once.
                    </p>
                  ) : (
                  <form className={styles.reviewForm} onSubmit={submitReview}>
                    {reviewMessage && <p className={styles.reviewComment}>{reviewMessage}</p>}
                    <input
                      className={styles.reviewInput}
                      placeholder="Your name"
                      value={reviewForm.name}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          name: e.target.value,
                        })
                      }
                      required
                    />

                    <div className={styles.starSelect}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={
                            star <= (hoverRating || reviewForm.rating)
                              ? styles.activeStar
                              : styles.emptyStar
                          }
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() =>
                            setReviewForm({
                              ...reviewForm,
                              rating: star,
                            })
                          }
                        />
                      ))}
                    </div>

                    <textarea
                      className={styles.reviewTextarea}
                      placeholder="Write your experience..."
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          comment: e.target.value,
                        })
                      }
                      required
                    />

                    <button className={styles.reviewButton}>
                      Submit Review
                    </button>
                  </form>
                  )}

                  <div className={styles.reviewList}>
                    {reviews.length === 0 ? (
                      <div className={styles.emptyState}>
                        No reviews available.
                      </div>
                    ) : (
                      reviews.map((item) => (
                        <div key={item._id} className={styles.reviewCard}>
                          <div className={styles.reviewTop}>
                            <div className={styles.reviewAvatar}>
                              {item.name.charAt(0)}
                            </div>

                            <div>
                              <h4 className={styles.reviewName}>{item.name}</h4>

                              <div className={styles.reviewStars}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <FaStar
                                    key={s}
                                    className={
                                      s <= item.rating
                                        ? styles.activeStar
                                        : styles.emptyStar
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

<p className={styles.reviewComment}>
  {item.comment}
</p>


{item.reply && (
  <div className={styles.clinicReply}>
    <strong>Clinic Response</strong>

    <p>
      {item.reply}
    </p>
  </div>
)}                   
     </div>
                      ))
                    )}
                  </div>
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
