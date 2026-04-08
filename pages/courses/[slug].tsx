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

interface Course {
  _id: string;
  courseName: string;
  courseUniqueCode: string;
  courseType?: string;
  courseImage?: string;
  instituteName?: string;
  courseDuration?: string;
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
  discountsOffers?: string;
  location?: string;
  currentAvailability?: string;
  maximumSeatsBatchSize?: number;
  trainerInstructorName?: string;
  trainerImage?: string;
  trainerExperience?: string;
  languageOfDelivery?: string;
  whatsIncluded?: string;
  whatsNotIncluded?: string;
  learningOutcomes?: string;
  courseDemoVideo?: string;
  brochurePdfDownload?: string[];
  refundCancellationPolicy?: string;
  postCourseSupport?: string;
  mobileNo?: string;
  contactForQueries?: string;
}

const COURSE_HERO_IMAGE = "/doctor-landing-page-3.jpg";
const INSTRUCTOR_IMAGE = "/doctor1.jpg";

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

const getSalePrice = (course?: Course | null) => {
  if (!course) return 0;
  return course.netFeesInr && course.netFeesInr > 0 ? course.netFeesInr : course.feesInr || 0;
};

const apiBaseUrl = API_URL.replace(/\/api\/?$/, "");

const splitToList = (value?: string) =>
  (value || "")
    .split(/\r?\n|,|;|[|]/)
    .map((item) => item.trim())
    .filter(Boolean);

const resolveFileUrl = (value?: string) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${apiBaseUrl}${value}`;
  return `${apiBaseUrl}/${value}`;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const CourseDetailPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const resolvedSlug = Array.isArray(slug) ? slug[0] : slug;
  const { addToCart, cartItems } = useCart();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllLearning, setShowAllLearning] = useState(false);

  useEffect(() => {
    if (!resolvedSlug) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_URL}/courses`);
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || "Failed to fetch course");
        }

        const list: Course[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.courses)
          ? data.courses
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const key = slugify(String(resolvedSlug));
        const matched =
          list.find((item) => item._id === resolvedSlug) ||
          list.find((item) => slugify(item.courseName) === key) ||
          list.find((item) => slugify(item.courseUniqueCode || "") === key);

        setCourse(matched || null);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [resolvedSlug]);

  const price = useMemo(() => {
    const mrp = Number(course?.feesInr || 0);
    const sale = getSalePrice(course);
    return { mrp, sale };
  }, [course]);

  const learningPoints = useMemo(() => {
    if (!course) return [];

    const combined = [
      ...splitToList(course.learningOutcomes),
      ...splitToList(course.curriculumTopicsCovered),
      ...splitToList(course.whatsIncluded),
    ];

    return [...new Set(combined)].filter(Boolean);
  }, [course]);

  const visibleLearningPoints = showAllLearning
    ? learningPoints
    : learningPoints.slice(0, 4);

  const audience = course?.targetAudience?.length
    ? course.targetAudience
    : ["Dermatology learners", "Aesthetic practitioners", "Clinical teams"];

  const inCart = course
    ? cartItems.some((item) => item.id === `course:${course._id}`)
    : false;

  if (loading || error || !course) {
    if (loading) return <FullPageLoader />;
    return (
      <>
        <Topbar />
        <main className={styles.page}>
          <section className={styles.stateCard}>
            <p className={styles.stateText}>
              {loading ? "Loading course details..." : error || "Course not found."}
            </p>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const trainerName = course.trainerInstructorName || "Expert Faculty";
  const trainerRole = course.instituteName || course.courseType || "Dermat Educator";
  const learnerCount = course.maximumSeatsBatchSize || 100;
  const ratingValue = course.certificationProvided === "Yes" ? 4.9 : 4.7;
  const reviewCount = 7525;
  const brochureUrl = resolveFileUrl(course.brochurePdfDownload?.[0]);
  const courseHeroImage = resolveFileUrl(course.courseImage) || COURSE_HERO_IMAGE;
  const trainerImage = resolveFileUrl(course.trainerImage) || INSTRUCTOR_IMAGE;
  const contactNumber = course.mobileNo || course.contactForQueries || "";

  const handleAddToCart = () => {
    if (inCart) {
      router.push("/home/Cart");
      return;
    }

    addToCart({
      id: `course:${course._id}`,
      name: course.courseName,
      price: price.sale,
      mrp: price.mrp || price.sale,
      company: course.instituteName || course.courseType || "Course",
      image: courseHeroImage,
    });
  };

  const handleBuyNow = () => {
    if (!inCart) {
      addToCart({
        id: `course:${course._id}`,
        name: course.courseName,
        price: price.sale,
        mrp: price.mrp || price.sale,
        company: course.instituteName || course.courseType || "Course",
        image: courseHeroImage,
      });
    }
    router.push("/home/Cart");
  };

  return (
    <>
      <Topbar />
      <main className={styles.page}>
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <p className={styles.breadcrumb}>Home &gt; Course Details</p>
            <span className={styles.heroBadge}>{course.courseUniqueCode}</span>
            <h1 className={styles.heroTitle}>{course.courseName}</h1>
            <p className={styles.heroText}>
              {course.courseType || "Professional dermatology program"} with practical
              training, guided mentorship, and real-world clinical confidence for modern
              skin and aesthetic practice.
            </p>

            <div className={styles.heroStats}>
              <button type="button" className={styles.heroButton} onClick={handleBuyNow}>
                Get Started
              </button>
              <span className={styles.metricText}>{ratingValue.toFixed(1)}</span>
              <div className={styles.starRow}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <FaStar key={index} />
                ))}
              </div>
              <span className={styles.metricPill}>
                {reviewCount.toLocaleString("en-IN")} Rating
              </span>
              <span className={styles.metricText}>
                {learnerCount.toLocaleString("en-IN")} Students
              </span>
            </div>
          </div>

          <div className={styles.heroImageCard}>
            <img src={courseHeroImage} alt={course.courseName} className={styles.heroImage} />
          </div>
        </section>

        <section className={styles.contentWrap}>
          <div className={styles.mainColumn}>
            <article className={styles.panel}>
              <h2 className={styles.panelTitle}>What You'll Learn</h2>
              <p className={styles.panelDescription}>
                {course.curriculumTopicsCovered ||
                  "This course is structured to help learners build practical, job-ready knowledge with a strong focus on usable clinical and procedural skills."}
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
                    <span>Practical modules, guided instruction, and applied clinical learning.</span>
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
              <h2 className={styles.panelTitle}>Course Brochure</h2>
              <p className={styles.panelDescription}>
                Download the latest brochure to review the course outline, eligibility,
                fee details, and support information shared from the backend upload.
              </p>

              <div className={styles.brochureCard}>
                <div>
                  <h3 className={styles.brochureTitle}>Download Course PDF</h3>
                  <p className={styles.brochureText}>
                    {brochureUrl
                      ? "Open or download the uploaded brochure directly from the course record."
                      : "The brochure has not been uploaded yet. You can add it from the admin panel later."}
                  </p>
                </div>

                {brochureUrl ? (
                  <a
                    href={brochureUrl}
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

              <div className={styles.brochureCard}>
                <div>
                  <h3 className={styles.brochureTitle}>Course Demo Video</h3>
                  <p className={styles.brochureText}>
                    {course.courseDemoVideo
                      ? "Watch the YouTube demo to understand the trainer style, course flow, and learning experience before enrolling."
                      : "Demo video has not been added yet for this course."}
                  </p>
                </div>

                {course.courseDemoVideo ? (
                  <a
                    href={course.courseDemoVideo}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.downloadButton}
                  >
                    Watch Demo Video
                  </a>
                ) : (
                  <button type="button" className={styles.downloadButtonDisabled} disabled>
                    Demo Unavailable
                  </button>
                )}
              </div>
            </article>

            <article className={styles.panel}>
              <h2 className={styles.panelTitle}>Instructor</h2>
              <div className={styles.instructorCard}>
                <img
                  src={trainerImage}
                  alt={trainerName}
                  className={styles.instructorImage}
                />
                <div className={styles.instructorContent}>
                  <h3>{trainerName}</h3>
                  <p className={styles.instructorRole}>{trainerRole}</p>

                  <div className={styles.instructorMeta}>
                    <span>
                      <FaStar />
                      {reviewCount.toLocaleString("en-IN")} Reviews
                    </span>
                    <span className={styles.ratingChip}>{ratingValue.toFixed(1)} Rating</span>
                    <span>
                      <FaUserFriends />
                      {learnerCount.toLocaleString("en-IN")} Students
                    </span>
                    <span>
                      <FaCalendarAlt />
                      20 Course modules
                    </span>
                  </div>

                  <p className={styles.instructorBio}>
                    {course.trainerExperience ||
                      `${trainerName} guides learners through practical sessions, protocol-driven learning, and confidence-building clinical workflows.`}
                  </p>
                </div>
              </div>
            </article>

            <article className={styles.panel}>
              <h2 className={styles.panelTitle}>Review</h2>
              <div className={styles.reviewGrid}>
                <div className={styles.reviewScoreCard}>
                  <strong>5.0</strong>
                  <div className={styles.starRow}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <FaStar key={index} />
                    ))}
                  </div>
                  <span>Course Rating</span>
                </div>

                <div className={styles.reviewBars}>
                  {[
                    { label: "5 Star", value: 75 },
                    { label: "4 Star", value: 20 },
                    { label: "3 Star", value: 3 },
                    { label: "2 Star", value: 1 },
                    { label: "1 Star", value: 1 },
                  ].map((item) => (
                    <div key={item.label} className={styles.reviewBarRow}>
                      <span>{item.label}</span>
                      <div className={styles.reviewBarTrack}>
                        <div
                          className={styles.reviewBarFill}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                      <strong>{item.value}%</strong>
                    </div>
                  ))}
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
                  {course.registrationDeadline
                    ? `Till ${formatDate(course.registrationDeadline)}`
                    : "Limited Seats"}
                </span>
              </div>

              <button type="button" className={styles.primaryButton} onClick={handleAddToCart}>
                <FaShoppingCart />
                {inCart ? "Go To Cart" : "Add To Cart"}
              </button>

              <button type="button" className={styles.secondaryButton} onClick={handleBuyNow}>
                Buy Now
              </button>

              {/* <p className={styles.guaranteeText}>30 day learner assistance included</p> */}

              <div className={styles.sidebarMeta}>
                <div className={styles.sidebarRow}>
                  <span>Start Date</span>
                  <strong>{formatDate(course.startDate)}</strong>
                </div>
                <div className={styles.sidebarRow}>
                  <span>Enrolled</span>
                  <strong>{learnerCount}</strong>
                </div>
                <div className={styles.sidebarRow}>
                  <span>Duration</span>
                  <strong>{course.courseDuration || "Flexible"}</strong>
                </div>
                <div className={styles.sidebarRow}>
                  <span>Skill Level</span>
                  <strong>{course.courseType || "Professional"}</strong>
                </div>
                <div className={styles.sidebarRow}>
                  <span>Language</span>
                  <strong>{course.languageOfDelivery || "English"}</strong>
                </div>
                <div className={styles.sidebarRow}>
                  <span>Mode</span>
                  <strong>{course.modeOfTraining || "Online"}</strong>
                </div>
                <div className={styles.sidebarRow}>
                  <span>Location</span>
                  <strong>{course.location || course.currentAvailability || "Online access"}</strong>
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
                <p>For details about the course</p>
                <a
                  href={contactNumber ? `tel:${contactNumber}` : undefined}
                  className={styles.contactButton}
                >
                  <FaPhoneAlt />
                  {contactNumber || "Call Us"}
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

export default CourseDetailPage;
