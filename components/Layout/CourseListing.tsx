"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
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
  registrationDeadline?: string;
  targetAudience?: string[];
  certificationProvided?: string;
  feesInr?: number;
  netFeesInr?: number;
  currentAvailability?: string;
  maximumSeatsBatchSize?: number;
  trainerInstructorName?: string;
  languageOfDelivery?: string;
  courseDemoVideo?: string;
}

const MAX_VISIBLE_TILES = 8;
const apiBaseUrl = API_URL.replace(/\/api\/?$/, "");

const getYoutubeThumbnail = (url?: string) => {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
    }
  } catch {
    return "";
  }

  return "";
};

const formatPrice = (course: Course) => {
  const value =
    course.netFeesInr && course.netFeesInr > 0 ? course.netFeesInr : course.feesInr || 0;

  return `Rs. ${Number(value).toLocaleString("en-IN")}`;
};

const getCourseAmount = (course: Course) =>
  course.netFeesInr && course.netFeesInr > 0 ? course.netFeesInr : course.feesInr || 0;

const resolveAssetUrl = (value?: string) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${apiBaseUrl}${value}`;
  return `${apiBaseUrl}/${value}`;
};

const CourseListing = () => {
  const router = useRouter();
  const { addToCart } = useCart();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_URL}/courses`);
        const data = await res.json().catch(() => []);

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch courses");
        }

        setCourses(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const visibleCourses = useMemo(() => courses.slice(0, MAX_VISIBLE_TILES), [courses]);

  return (
    <section className={styles.section}>
      <div className={styles.headingWrap}>
        <p className={styles.eyebrow}>Learning Tracks</p>
        <h2 className={styles.heading}>Featured Courses</h2>
        <p className={styles.subheading}>
          Discover high-impact dermatology programs crafted for practical learning, career growth, and clinical confidence.
        </p>
      </div>

      {loading && <p className={styles.stateText}>Loading courses...</p>}
      {!loading && error && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <div className={styles.grid}>
          {visibleCourses.map((course) => {
            const image =
              resolveAssetUrl(course.courseImage) ||
              getYoutubeThumbnail(course.courseDemoVideo);
            const audience =
              Array.isArray(course.targetAudience) && course.targetAudience.length > 0
                ? course.targetAudience.slice(0, 2).join(" | ")
                : "Open for learners";
            const learnerCount = course.maximumSeatsBatchSize || course.targetAudience?.length || 1;
            const ratingText = course.certificationProvided === "Yes" ? "5 Stars" : "4 Stars";

            return (
              <article
                key={course._id}
                className={styles.card}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/courses/${course._id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/courses/${course._id}`);
                  }
                }}
              >
                <div className={styles.imageWrap}>
                  {image ? (
                    <img
                      src={image}
                      alt={course.courseName}
                      className={styles.image}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.fallbackImage}>
                      <span>{course.courseType || "Course"}</span>
                      <strong>{course.courseUniqueCode}</strong>
                    </div>
                  )}

                  <span className={styles.codeBadge}>{course.courseUniqueCode}</span>
                </div>

                <div className={styles.content}>
                  <div className={styles.avatar}>
                    {course.trainerImage ? (
                      <img
                        src={resolveAssetUrl(course.trainerImage)}
                        alt={course.trainerInstructorName || "Trainer"}
                        className={styles.avatarImage}
                      />
                    ) : (
                      (course.trainerInstructorName || course.instituteName || "C")
                        .slice(0, 1)
                        .toUpperCase()
                    )}
                  </div>

                  <p className={styles.trainerName}>
                    {course.trainerInstructorName || "Expert Faculty"}
                  </p>
                  <p className={styles.trainerRole}>
                    {course.instituteName || course.courseType || "Consultant"}
                  </p>

                  <div className={styles.featuredBadge}>
                    <FaStar />
                    <span>Featured</span>
                  </div>

                  <h3 className={styles.title}>{course.courseName}</h3>

                  <div className={styles.details}>
                    <span>
                      <FaGlobe />
                      {course.languageOfDelivery || "English"}
                    </span>
                    <span>
                      <FaCalendarAlt />
                      {course.startDate
                        ? new Date(course.startDate).toLocaleDateString()
                        : course.currentAvailability || "Open now"}
                    </span>
                  </div>

                  <p className={styles.summary}>{audience}</p>

                  <div className={styles.bottomMeta}>
                    <div className={styles.statGroup}>
                      <span className={styles.statItem}>
                        <FaUserFriends />
                        {learnerCount}
                      </span>
                      <span className={styles.statItem}>
                        <FaStar />
                        {ratingText}
                      </span>
                    </div>
                    <span className={styles.priceTag}>{formatPrice(course)}</span>
                  </div>

                  <div className={styles.cardFooter}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={(event) => {
                        event.stopPropagation();
                        const image =
                          resolveAssetUrl(course.courseImage) ||
                          getYoutubeThumbnail(course.courseDemoVideo);
                        const amount = getCourseAmount(course);
                        addToCart({
                          id: `course:${course._id}`,
                          name: course.courseName,
                          price: amount,
                          mrp: course.feesInr || amount,
                          company: course.instituteName || course.courseType || "Course",
                          image: image || undefined,
                        });
                      }}
                    >
                      <span>Add to Cart</span>
                      <FaCartPlus />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CourseListing;
