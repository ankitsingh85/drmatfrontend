"use client";

import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import { API_URL } from "@/config/api";
import { useCart } from "@/context/CartContext";
import styles from "@/styles/pages/courseDetailPage.module.css";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaCheck,
  FaDownload,
  FaPhoneAlt,
  FaShoppingCart,
  FaStar,
  FaUserFriends,
} from "react-icons/fa";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl } from "@/lib/media";

interface WorkshopTraining {
  _id: string;
  trainingName: string;
  trainingUniqueCode: string;
  trainingType?: string;
  trainingImage?: string;
  instituteName?: string;
  trainingDuration?: string;
  modeOfTraining?: string;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  curriculumTopicsCovered?: string;
  targetAudience?: string[];
  certificationProvided?: string;
  affiliationAccreditation?: string;
  feesInr?: number;
  netFeesInr?: number;
  location?: string;
  currentAvailability?: string;
  maximumSeatsBatchSize?: number;
  trainerInstructorName?: string;
  trainerExperience?: string;
  languageOfDelivery?: string;
  whatsIncluded?: string;
  whatsNotIncluded?: string;
  learningOutcomes?: string;
  courseDemoVideo?: string;
  brochurePdfDownload?: string[];
  refundCancellationPolicy?: string;
  postTrainingSupport?: string;
  contactForQueries?: string;
}

const formatDate = (value?: string) => {
  if (!value) return "To be announced";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const formatPrice = (value?: number) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const splitToList = (value?: string) =>
  (value || "")
    .split(/\r?\n|,|;|[|]/)
    .map((item) => item.trim())
    .filter(Boolean);

const resolveFileUrl = (value?: string) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return resolveMediaUrl(value) || value;
};

const WorkshopTrainingDetailPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const resolvedSlug = Array.isArray(slug) ? slug[0] : slug;
  const { addToCart, cartItems } = useCart();

  const [training, setTraining] = useState<WorkshopTraining | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllLearning, setShowAllLearning] = useState(false);

  useEffect(() => {
    if (!resolvedSlug) return;

    const fetchTraining = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_URL}/workshop-trainings`);
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || "Failed to fetch workshop training");
        }

        const list: WorkshopTraining[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.trainings)
          ? data.trainings
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const key = slugify(String(resolvedSlug));
        const matched =
          list.find((item) => item._id === resolvedSlug) ||
          list.find((item) => slugify(item.trainingName) === key) ||
          list.find((item) => slugify(item.trainingUniqueCode || "") === key);

        setTraining(matched || null);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch workshop training");
      } finally {
        setLoading(false);
      }
    };

    fetchTraining();
  }, [resolvedSlug]);

  const price = useMemo(() => {
    const mrp = Number(training?.feesInr || 0);
    const sale = Number(training?.netFeesInr || 0) > 0 ? Number(training?.netFeesInr || 0) : mrp;
    return { mrp, sale };
  }, [training]);

  const learningPoints = useMemo(() => {
    if (!training) return [];

    const combined = [
      ...splitToList(training.learningOutcomes),
      ...splitToList(training.curriculumTopicsCovered),
      ...splitToList(training.whatsIncluded),
    ];

    return [...new Set(combined)].filter(Boolean);
  }, [training]);

  const visibleLearningPoints = showAllLearning ? learningPoints : learningPoints.slice(0, 4);

  const audience = training?.targetAudience?.length
    ? training.targetAudience
    : ["Learners", "Clinicians", "Aesthetic practitioners"];

  const inCart = training
    ? cartItems.some((item) => item.id === `workshop:${training._id}`)
    : false;

  if (loading || error || !training) {
    if (loading) return <FullPageLoader />;
    return (
      <>
        <Topbar />
        <main className={styles.page}>
          <section className={styles.stateCard}>
            <p className={styles.stateText}>
              {loading ? "Loading workshop details..." : error || "Workshop training not found."}
            </p>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const heroImage =
    resolveFileUrl(training.trainingImage) || "/doctor-landing-page-3.jpg";

  const handleAddToCart = () => {
    if (inCart) {
      router.push("/home/Cart");
      return;
    }

    addToCart({
      id: `workshop:${training._id}`,
      name: training.trainingName,
      price: price.sale,
      mrp: price.mrp || price.sale,
      company: training.instituteName || training.trainingType || "Workshop",
      image: heroImage,
    });
  };

  return (
    <>
      <Topbar />
      <main className={styles.page}>
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <p className={styles.breadcrumb}>Home &gt; Workshop Details</p>
            <span className={styles.heroBadge}>{training.trainingUniqueCode}</span>
            <h1 className={styles.heroTitle}>{training.trainingName}</h1>
            <p className={styles.heroText}>
              {training.trainingType || "Professional workshop"} by{" "}
              {training.instituteName || "the institute"} with practical training,
              guided mentorship, and focused skill-building for real-world learning.
            </p>

            <div className={styles.heroStats}>
              <button type="button" className={styles.heroButton} onClick={handleAddToCart}>
                {inCart ? "Go to Cart" : "Enroll Now"}
              </button>
              <span className={styles.metricText}>
                {training.certificationProvided === "Yes" ? "Certified" : "Open"}
              </span>
              <div className={styles.starRow}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <FaStar key={index} />
                ))}
              </div>
              <span className={styles.metricPill}>
                {training.currentAvailability || "Limited seats"}
              </span>
              <span className={styles.metricText}>
                {training.maximumSeatsBatchSize || 1} Seats
              </span>
            </div>
          </div>

          <div className={styles.heroImageCard}>
            <img src={heroImage} alt={training.trainingName} className={styles.heroImage} />
          </div>
        </section>

        <section className={styles.contentWrap}>
          <div className={styles.mainColumn}>
            <article className={styles.panel}>
              <h2 className={styles.panelTitle}>What You'll Learn</h2>
              <p className={styles.panelDescription}>
                {training.curriculumTopicsCovered ||
                  "This workshop is structured to help learners build practical, job-ready knowledge with a clear focus on clinical and procedural skills."}
              </p>

              <div className={styles.learnGrid}>
                {visibleLearningPoints.length > 0 ? (
                  visibleLearningPoints.map((point) => (
                    <div key={point} className={styles.learnItem}>
                      <FaCheck />
                      <span>{point}</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.learnItem}>
                    <FaCheck />
                    <span>Practical modules, guided instruction, and applied learning.</span>
                  </div>
                )}
              </div>

              {learningPoints.length > 4 && (
                <button
                  type="button"
                  className={styles.inlineToggle}
                  onClick={() => setShowAllLearning((current) => !current)}
                >
                  {showAllLearning ? "Show Less" : "Show More"}
                  {showAllLearning ? <FiChevronUp /> : <FiChevronDown />}
                </button>
              )}
            </article>

            <article className={styles.panel}>
              <h2 className={styles.panelTitle}>Workshop Brochure</h2>
              <p className={styles.panelDescription}>
                Download the latest brochure to review the outline, eligibility, fee
                details, and support information shared from the backend upload.
              </p>

              <div className={styles.brochureCard}>
                <div>
                  <h3 className={styles.brochureTitle}>Download Workshop PDF</h3>
                  <p className={styles.brochureText}>
                    {training.brochurePdfDownload?.[0]
                      ? "Open or download the uploaded brochure directly from the workshop record."
                      : "The brochure has not been uploaded yet."}
                  </p>
                </div>

                {training.brochurePdfDownload?.[0] ? (
                  <a
                    href={resolveFileUrl(training.brochurePdfDownload[0])}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className={styles.downloadButton}
                  >
                    <FaDownload />
                    Download Brochure
                  </a>
                ) : (
                  <button type="button" className={styles.downloadButtonDisabled} disabled>
                    <FaDownload />
                    Brochure Unavailable
                  </button>
                )}
              </div>
            </article>

            <article className={styles.panel}>
              <h2 className={styles.panelTitle}>Trainer</h2>
              <div className={styles.instructorCard}>
                <img
                  src={heroImage}
                  alt={training.trainerInstructorName || "Trainer"}
                  className={styles.instructorImage}
                />
                <div className={styles.instructorContent}>
                  <h3>{training.trainerInstructorName || "Expert Faculty"}</h3>
                  <p className={styles.instructorRole}>
                    {training.instituteName || training.trainingType || "Workshop Instructor"}
                  </p>

                  <div className={styles.instructorMeta}>
                    <span>
                      <FaStar />
                      Certified Workshop
                    </span>
                    <span className={styles.ratingChip}>Workshop</span>
                    <span>
                      <FaUserFriends />
                      {training.maximumSeatsBatchSize || 1} Seats
                    </span>
                    <span>
                      <FaCalendarAlt />
                      {training.trainingDuration || "Flexible Duration"}
                    </span>
                  </div>

                  <p className={styles.instructorBio}>
                    {training.trainerExperience ||
                      `${training.trainerInstructorName || "The trainer"} leads learners through practical sessions and protocol-driven workshop workflows.`}
                  </p>
                </div>
              </div>
            </article>
          </div>

          <aside className={styles.sidebar}>
            <article className={styles.priceCard}>
              <div className={styles.priceRow}>
                <div>
                  <strong className={styles.salePrice}>{formatPrice(price.sale)}</strong>
                  {price.mrp > price.sale && (
                    <span className={styles.basePrice}>{formatPrice(price.mrp)}</span>
                  )}
                </div>
                <span className={styles.offerBadge}>
                  {training.registrationDeadline
                    ? `Till ${formatDate(training.registrationDeadline)}`
                    : "Limited Seats"}
                </span>
              </div>

              <button type="button" className={styles.primaryButton} onClick={handleAddToCart}>
                <FaShoppingCart />
                {inCart ? "Go To Cart" : "Add To Cart"}
              </button>

              <div className={styles.sidebarMeta}>
                <div className={styles.sidebarRow}>
                  <span>Start Date</span>
                  <strong>{formatDate(training.startDate)}</strong>
                </div>
                <div className={styles.sidebarRow}>
                  <span>Duration</span>
                  <strong>{training.trainingDuration || "Flexible"}</strong>
                </div>
                <div className={styles.sidebarRow}>
                  <span>Mode</span>
                  <strong>{training.modeOfTraining || "Online"}</strong>
                </div>
                <div className={styles.sidebarRow}>
                  <span>Language</span>
                  <strong>{training.languageOfDelivery || "English"}</strong>
                </div>
                <div className={styles.sidebarRow}>
                  <span>Availability</span>
                  <strong>{training.currentAvailability || "Open"}</strong>
                </div>
                <div className={styles.sidebarRow}>
                  <span>Location</span>
                  <strong>{training.location || "Online access"}</strong>
                </div>
              </div>

              <div className={styles.audienceBox}>
                <h3>Ideal For</h3>
                <div className={styles.audienceList}>
                  {audience.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>

              <div className={styles.contactCard}>
                <p>For workshop details</p>
                <a
                  href={training.contactForQueries ? `tel:${training.contactForQueries}` : undefined}
                  className={styles.contactButton}
                >
                  <FaPhoneAlt />
                  {training.contactForQueries || "Contact Us"}
                </a>
              </div>
            </article>
          </aside>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default WorkshopTrainingDetailPage;
