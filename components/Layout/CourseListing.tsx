"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaCalendarAlt,
  FaCartPlus,
  FaGlobe,
  FaGraduationCap,
  FaStar,
  FaUserFriends,
  FaUserTie,
} from "react-icons/fa";
import { API_URL } from "@/config/api";
import styles from "@/styles/courselisting.module.css";

interface Course {
  _id: string;
  courseName: string;
  courseUniqueCode: string;
  courseType?: string;
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

const CourseListing = () => {
  const router = useRouter();
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
            const image = getYoutubeThumbnail(course.courseDemoVideo);
            const audience =
              Array.isArray(course.targetAudience) && course.targetAudience.length > 0
                ? course.targetAudience.slice(0, 2).join(" | ")
                : "Open for learners";
            const learnerCount = course.maximumSeatsBatchSize || course.targetAudience?.length || 1;
            const ratingText = course.certificationProvided === "Yes" ? "5 Stars" : "4 Stars";

            return (
              <article key={course._id} className={styles.card}>
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
                    {(course.trainerInstructorName || course.instituteName || "C")
                      .slice(0, 1)
                      .toUpperCase()}
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

                  <div className={styles.cardFooter}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => {
                        if (course.courseDemoVideo) {
                          window.open(course.courseDemoVideo, "_blank", "noopener,noreferrer");
                          return;
                        }

                        router.push("/course-listing");
                      }}
                    >
                      <span>Add to Cart</span>
                      <FaCartPlus />
                    </button>
                  </div>

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
