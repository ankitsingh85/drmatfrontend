"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import {
  FaCalendarAlt,
  FaCartPlus,
  FaGlobe,
  FaStar,
  FaUserFriends,
} from "react-icons/fa";
import { API_URL } from "@/config/api";
import { useCart } from "@/context/CartContext";
import styles from "@/styles/courselisting.module.css";
import FullPageLoader from "@/components/common/FullPageLoader";

interface Course {
  _id: string;
  courseName: string;
  courseUniqueCode: string;
  courseType?: string;
  courseImage?: string;
  trainerImage?: string;
  instituteName?: string;
  courseDuration?: string;
  modeOfTraining?: string;
  startDate?: string;
  currentAvailability?: string;
  maximumSeatsBatchSize?: number;
  trainerInstructorName?: string;
  languageOfDelivery?: string;
  courseDemoVideo?: string;
  feesInr?: number;
  netFeesInr?: number;
  targetAudience?: string[];
}

const MAX_VISIBLE_TILES = 8;
const apiBaseUrl = API_URL.replace(/\/api\/?$/, "");

const resolveAssetUrl = (value?: string) => {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  if (value.startsWith("/")) return `${apiBaseUrl}${value}`;
  return `${apiBaseUrl}/${value}`;
};

const getYoutubeThumbnail = (url?: string) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const id = parsed.searchParams.get("v");
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
  } catch {
    return "";
  }
};

const formatPrice = (course: Course) => {
  const value =
    course.netFeesInr && course.netFeesInr > 0
      ? course.netFeesInr
      : course.feesInr || 0;

  return `₹ ${Number(value).toLocaleString("en-IN")}`;
};

const getCourseAmount = (course: Course) =>
  course.netFeesInr && course.netFeesInr > 0
    ? course.netFeesInr
    : course.feesInr || 0;

export default function CourseListing({
  title = "Featured Courses",
  showAll = false,
  showSeeMore = true,
  seeMoreHref = "/course-listing",
  seeMoreLabel = "See More",
}) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  const currentRole = isHydrated
    ? Cookies.get("role")?.toLowerCase()
    : null;

  const isBusinessMode =
    currentRole === "clinic" || currentRole === "doctor";

  const dynamicSeeMorePath = isBusinessMode
    ? "/course-listing"
    : "/courses";

  const isSamePage = router.pathname === dynamicSeeMorePath;

  useEffect(() => setIsHydrated(true), []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${API_URL}/courses`);
        const data = await res.json();
        setCourses(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const visibleCourses = useMemo(
    () => (showAll ? courses : courses.slice(0, MAX_VISIBLE_TILES)),
    [courses, showAll]
  );

  if (loading) return <FullPageLoader />;

  return (
    <section className={styles.section}>
      <div className={styles.headingWrap}>
        <h2 className={styles.heading}>{title}</h2>
      </div>

      <div className={styles.grid}>
        {visibleCourses.map((course) => {
          const image =
            resolveAssetUrl(course.courseImage) ||
            getYoutubeThumbnail(course.courseDemoVideo);

          return (
            <article
              key={course._id}
              className={styles.card}
              onClick={() => router.push(`/courses/${course._id}`)}
            >
              {/* IMAGE */}
              <div className={styles.imageWrap}>
                {image ? (
                  <img src={image} className={styles.image} />
                ) : (
                  <div className={styles.fallbackImage}>
                    <span>{course.courseType}</span>
                    <strong>{course.courseUniqueCode}</strong>
                  </div>
                )}
                <span className={styles.codeBadge}>
                  {course.courseUniqueCode}
                </span>
              </div>

              {/* CONTENT */}
              <div className={styles.content}>
                {/* Trainer Avatar */}
                <div className={styles.avatar}>
                  {course.trainerInstructorName?.charAt(0) || "C"}
                </div>

                <p className={styles.trainerName}>
                  {course.trainerInstructorName || "Expert Trainer"}
                </p>

                <p className={styles.trainerRole}>
                  {course.instituteName || "Institute"}
                </p>

                <div className={styles.featuredBadge}>
                  <FaStar /> <span>Featured</span>
                </div>

                <h3 className={styles.title}>{course.courseName}</h3>

                {/* DETAILS */}
                <div className={styles.details}>
                  <span>
                    <FaGlobe />
                    {course.modeOfTraining || "Online"}
                  </span>

                  <span>
                    <FaCalendarAlt />
                    {course.courseDuration || "N/A"}
                  </span>
                </div>

                <p className={styles.summary}>
                  {course.startDate
                    ? new Date(course.startDate).toLocaleDateString()
                    : course.currentAvailability || "Open"}
                </p>

                {/* META */}
                <div className={styles.bottomMeta}>
                  <div className={styles.statGroup}>
                    <span className={styles.statItem}>
                      <FaUserFriends />
                      {course.maximumSeatsBatchSize || 0}
                    </span>

                    <span className={styles.statItem}>
                      <FaStar /> 4.5
                    </span>
                  </div>

                  <span className={styles.priceTag}>
                    {formatPrice(course)}
                  </span>
                </div>

                {/* BUTTON */}
                <div className={styles.cardFooter}>
                  {isBusinessMode ? (
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart({
                          id: `course:${course._id}`,
                          name: course.courseName,
                          price: getCourseAmount(course),
                          mrp: course.feesInr || 0,
                          company: course.instituteName,
                          image,
                        });
                      }}
                    >
                      Add to Cart <FaCartPlus />
                    </button>
                  ) : (
                    <button className={styles.actionBtn} disabled>
                      Business Only
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* SEE MORE */}
      {!showAll && !isSamePage && showSeeMore && (
        <div className={styles.footerActions}>
          <Link href={dynamicSeeMorePath} className={styles.seeMoreLink}>
            {seeMoreLabel}
          </Link>
        </div>
      )}
    </section>
  );
}