"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaEdit, FaEye, FaFileExcel, FaFilePdf, FaTrash } from "react-icons/fa";
import styles from "@/styles/Dashboard/listofcategory.module.css";
import createStyles from "@/styles/Dashboard/createcategory.module.css";
import { API_URL } from "@/config/api";

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
  applyDiscountVoucher?: boolean;
  netFeesInr?: number;
  discountsOffers?: string;
  location?: string;
  maximumSeatsBatchSize?: number;
  currentAvailability?: string;
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
  contactForQueries?: string;
  createdAt?: string;
}

type EditFormData = {
  courseName: string;
  courseType: string;
  instituteName: string;
  courseDuration: string;
  modeOfTraining: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  certificationProvided: string;
  affiliationAccreditation: string;
  feesInr: string;
  applyDiscountVoucher: boolean;
  netFeesInr: string;
  discountsOffers: string;
  location: string;
  maximumSeatsBatchSize: string;
  currentAvailability: string;
  trainerInstructorName: string;
  trainerExperience: string;
  languageOfDelivery: string;
  curriculumTopicsCovered: string;
  refundCancellationPolicy: string;
  postCourseSupport: string;
  contactForQueries: string;
  targetAudience: string;
};

const courseTypeOptions = [
  "Certificate Course",
  "Diploma Course",
  "Fellowship Program",
  "Masterclass",
];

const certificationOptions = ["Yes", "No"];
const languageOptions = ["English", "Hindi", "Bilingual"];

const createEditFormData = (course: Course): EditFormData => ({
  courseName: course.courseName || "",
  courseType: course.courseType || "",
  instituteName: course.instituteName || "",
  courseDuration: course.courseDuration || "",
  modeOfTraining: course.modeOfTraining || "",
  startDate: course.startDate ? String(course.startDate).slice(0, 10) : "",
  endDate: course.endDate ? String(course.endDate).slice(0, 10) : "",
  registrationDeadline: course.registrationDeadline
    ? String(course.registrationDeadline).slice(0, 10)
    : "",
  certificationProvided: course.certificationProvided || "",
  affiliationAccreditation: course.affiliationAccreditation || "",
  feesInr:
    course.feesInr === undefined || course.feesInr === null
      ? ""
      : String(course.feesInr),
  applyDiscountVoucher: Boolean(course.applyDiscountVoucher),
  netFeesInr:
    course.netFeesInr === undefined || course.netFeesInr === null
      ? ""
      : String(course.netFeesInr),
  discountsOffers: course.discountsOffers || "",
  location: course.location || "",
  maximumSeatsBatchSize:
    course.maximumSeatsBatchSize === undefined || course.maximumSeatsBatchSize === null
      ? ""
      : String(course.maximumSeatsBatchSize),
  currentAvailability: course.currentAvailability || "",
  trainerInstructorName: course.trainerInstructorName || "",
  trainerExperience: course.trainerExperience || "",
  languageOfDelivery: course.languageOfDelivery || "",
  curriculumTopicsCovered: course.curriculumTopicsCovered || "",
  refundCancellationPolicy: course.refundCancellationPolicy || "",
  postCourseSupport: course.postCourseSupport || "",
  contactForQueries: course.contactForQueries || "",
  targetAudience: Array.isArray(course.targetAudience)
    ? course.targetAudience.join(", ")
    : "",
});

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

const resolveAssetUrl = (value?: string) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${API_URL.replace(/\/api$/, "")}${value}`;
  return value;
};

const ListOfCourse = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const editSectionRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return courses;

    return courses.filter((course) =>
      [
        course.courseName,
        course.courseUniqueCode,
        course.courseType,
        course.languageOfDelivery,
        course.currentAvailability,
        course.instituteName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [courses, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCourses.length / itemsPerPage)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(start, start + itemsPerPage);
  }, [filteredCourses, currentPage, itemsPerPage]);

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setEditFormData(createEditFormData(course));
    setError("");
    setTimeout(() => {
      editSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const closeEditModal = () => {
    setEditingCourse(null);
    setEditFormData(null);
    setError("");
  };

  const handleEditChange = (field: keyof EditFormData, value: string) => {
    setEditFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editFormData) return;

    if (!editFormData.courseName.trim()) {
      setError("Course name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        courseName: editFormData.courseName.trim(),
        courseType: editFormData.courseType.trim(),
        instituteName: editFormData.instituteName.trim(),
        courseDuration: editFormData.courseDuration.trim(),
        modeOfTraining: editFormData.modeOfTraining.trim(),
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
        registrationDeadline: editFormData.registrationDeadline,
        certificationProvided: editFormData.certificationProvided,
        affiliationAccreditation: editFormData.affiliationAccreditation.trim(),
        feesInr: editFormData.feesInr,
        applyDiscountVoucher: editFormData.applyDiscountVoucher,
        netFeesInr: editFormData.netFeesInr,
        discountsOffers: editFormData.discountsOffers.trim(),
        location: editFormData.location.trim(),
        maximumSeatsBatchSize: editFormData.maximumSeatsBatchSize,
        currentAvailability: editFormData.currentAvailability.trim(),
        trainerInstructorName: editFormData.trainerInstructorName.trim(),
        trainerExperience: editFormData.trainerExperience.trim(),
        languageOfDelivery: editFormData.languageOfDelivery.trim(),
        curriculumTopicsCovered: editFormData.curriculumTopicsCovered.trim(),
        refundCancellationPolicy: editFormData.refundCancellationPolicy.trim(),
        postCourseSupport: editFormData.postCourseSupport.trim(),
        contactForQueries: editFormData.contactForQueries.trim(),
        targetAudience: editFormData.targetAudience
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const res = await fetch(`${API_URL}/courses/${editingCourse._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to update course");
      }

      setCourses((prev) =>
        prev.map((course) => (course._id === data._id ? data : course))
      );
      closeEditModal();
    } catch (err: any) {
      setError(err.message || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const res = await fetch(`${API_URL}/courses/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete course");
      }

      setCourses((prev) => prev.filter((course) => course._id !== id));
      if (viewingCourse?._id === id) setViewingCourse(null);
      if (editingCourse?._id === id) closeEditModal();
    } catch (err: any) {
      alert(err.message || "Failed to delete course");
    }
  };

  const handleDownloadExcel = () => {
    const rows = [
      [
        "Course Code",
        "Course Name",
        "Course Type",
        "Fees",
        "Net Fees",
        "Language",
        "Availability",
        "Institute",
      ],
      ...filteredCourses.map((course) => [
        course.courseUniqueCode || "",
        course.courseName || "",
        course.courseType || "",
        course.feesInr ?? "",
        course.netFeesInr ?? "",
        course.languageOfDelivery || "",
        course.currentAvailability || "",
        course.instituteName || "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "courses.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const printable = window.open("", "_blank");
    if (!printable) {
      alert("Unable to open print window. Please allow popups.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const rows = filteredCourses
      .map(
        (course) => `<tr>
          <td>${escapeHtml(course.courseUniqueCode || "-")}</td>
          <td>${escapeHtml(course.courseName || "-")}</td>
          <td>${escapeHtml(course.courseType || "-")}</td>
          <td>${escapeHtml(String(course.feesInr ?? "-"))}</td>
          <td>${escapeHtml(course.languageOfDelivery || "-")}</td>
          <td>${escapeHtml(course.currentAvailability || "-")}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Courses List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Courses List</h2>
          <table>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Course Type</th>
                <th>Fees</th>
                <th>Language</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  return (
    <div
      className={styles.container}
      style={{ maxWidth: "1680px", width: "100%" }}
    >
      {/* <h2 className={styles.title}>List of Courses</h2> */}

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by course name, code, type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={`${styles.filter} ${styles.pageFilter}`}
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}/page
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.premiumButton}
          onClick={handleDownloadExcel}
        >
          <FaFileExcel /> Export Excel
        </button>
        <button
          type="button"
          className={styles.premiumButton}
          onClick={handleDownloadPDF}
        >
          <FaFilePdf /> Download PDF
        </button>
      </div>

      {loading && <p className={styles.loading}>Loading courses...</p>}
      {!loading && error && !editingCourse && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <>
          <div className={styles.tableWrap} style={{ overflowX: "hidden" }}>
            <table
              className={styles.table}
              style={{ tableLayout: "fixed", width: "100%" }}
            >
              <thead>
                <tr>
                  <th>#</th>
                  <th>Image</th>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Fees</th>
                  <th>Language</th>
                  <th>Availability</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCourses.map((course, index) => (
                  <tr key={course._id}>
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td>
                      {course.courseImage ? (
                        <img
                          src={resolveAssetUrl(course.courseImage)}
                          alt={course.courseName || "Course"}
                          className={styles.image}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className={styles.id}>{course.courseUniqueCode || "-"}</td>
                    <td style={{ wordBreak: "break-word" }}>
                      {course.courseName || "Untitled Course"}
                    </td>
                    <td>{course.feesInr ?? 0}</td>
                    <td style={{ wordBreak: "break-word" }}>
                      {course.languageOfDelivery || "-"}
                    </td>
                    <td style={{ wordBreak: "break-word" }}>
                      {course.currentAvailability || "-"}
                    </td>
                    <td>{formatDate(course.createdAt)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => setViewingCourse(course)}
                          title="View course"
                        >
                          <FaEye />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => openEditModal(course)}
                          title="Edit course"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.iconDeleteBtn}`}
                          onClick={() => handleDelete(course._id)}
                          title="Delete course"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedCourses.length === 0 && (
                  <tr>
                    <td colSpan={9}>No courses found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <p style={{ margin: 0 }}>
              Showing {paginatedCourses.length} of {filteredCourses.length}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className={`${styles.premiumButton} ${
                  currentPage === 1 ? styles.premiumButtonDisabled : ""
                }`}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span style={{ alignSelf: "center" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className={`${styles.premiumButton} ${
                  currentPage === totalPages ? styles.premiumButtonDisabled : ""
                }`}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {viewingCourse && (
        <div className={styles.modalOverlay}>
          <div
            className={`${styles.modal} ${styles.wideModal}`}
            style={{ width: "min(1120px, 96vw)" }}
          >
            <h3>View Course</h3>
            <div className={styles.detailsGrid}>
              <div>
                <strong>Course Image</strong>
                {viewingCourse.courseImage ? (
                  <img
                    src={resolveAssetUrl(viewingCourse.courseImage)}
                    alt={viewingCourse.courseName || "Course"}
                    className={styles.preview}
                  />
                ) : (
                  <p>-</p>
                )}
              </div>
              <div>
                <strong>Trainer Image</strong>
                {viewingCourse.trainerImage ? (
                  <img
                    src={resolveAssetUrl(viewingCourse.trainerImage)}
                    alt={viewingCourse.trainerInstructorName || "Trainer"}
                    className={styles.preview}
                  />
                ) : (
                  <p>-</p>
                )}
              </div>
              <div>
                <strong>Course Name</strong>
                <p>{viewingCourse.courseName || "-"}</p>
              </div>
              <div>
                <strong>Course Code</strong>
                <p>{viewingCourse.courseUniqueCode || "-"}</p>
              </div>
              <div>
                <strong>Course Type</strong>
                <p>{viewingCourse.courseType || "-"}</p>
              </div>
              <div>
                <strong>Institute</strong>
                <p>{viewingCourse.instituteName || "-"}</p>
              </div>
              <div>
                <strong>Fees</strong>
                <p>{viewingCourse.feesInr ?? 0}</p>
              </div>
              <div>
                <strong>Net Fees</strong>
                <p>{viewingCourse.netFeesInr ?? 0}</p>
              </div>
              <div>
                <strong>Language</strong>
                <p>{viewingCourse.languageOfDelivery || "-"}</p>
              </div>
              <div>
                <strong>Availability</strong>
                <p>{viewingCourse.currentAvailability || "-"}</p>
              </div>
              <div>
                <strong>Start Date</strong>
                <p>{formatDate(viewingCourse.startDate)}</p>
              </div>
              <div>
                <strong>End Date</strong>
                <p>{formatDate(viewingCourse.endDate)}</p>
              </div>
              <div>
                <strong>Registration Deadline</strong>
                <p>{formatDate(viewingCourse.registrationDeadline)}</p>
              </div>
              <div>
                <strong>Trainer</strong>
                <p>{viewingCourse.trainerInstructorName || "-"}</p>
              </div>
              <div className={styles.fullSpan}>
                <strong>Target Audience</strong>
                <p>
                  {Array.isArray(viewingCourse.targetAudience) &&
                  viewingCourse.targetAudience.length > 0
                    ? viewingCourse.targetAudience.join(", ")
                    : "-"}
                </p>
              </div>
              <div className={styles.fullSpan}>
                <strong>Curriculum</strong>
                <p>{viewingCourse.curriculumTopicsCovered || "-"}</p>
              </div>
              <div className={styles.fullSpan}>
                <strong>What's Included</strong>
                <div
                  className={styles.richContent}
                  dangerouslySetInnerHTML={{
                    __html: viewingCourse.whatsIncluded || "<p>-</p>",
                  }}
                />
              </div>
              <div className={styles.fullSpan}>
                <strong>What's Not Included</strong>
                <div
                  className={styles.richContent}
                  dangerouslySetInnerHTML={{
                    __html: viewingCourse.whatsNotIncluded || "<p>-</p>",
                  }}
                />
              </div>
              <div className={styles.fullSpan}>
                <strong>Learning Outcomes</strong>
                <div
                  className={styles.richContent}
                  dangerouslySetInnerHTML={{
                    __html: viewingCourse.learningOutcomes || "<p>-</p>",
                  }}
                />
              </div>
              <div className={styles.fullSpan}>
                <strong>Brochures</strong>
                <div className={styles.linkList}>
                  {viewingCourse.brochurePdfDownload &&
                  viewingCourse.brochurePdfDownload.length > 0 ? (
                    viewingCourse.brochurePdfDownload.map((link, index) => (
                      <a
                        key={`${link}-${index}`}
                        href={
                          link.startsWith("http")
                            ? link
                            : `${API_URL.replace(/\/api$/, "")}${link}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className={styles.detailLink}
                      >
                        Brochure {index + 1}
                      </a>
                    ))
                  ) : (
                    <p>-</p>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setViewingCourse(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCourse && editFormData && (
        <div ref={editSectionRef} className={createStyles.container} style={{ maxWidth: "100%", marginTop: 32 }}>
          <h1 className={createStyles.heading}>Edit Course</h1>
          {error && <p className={createStyles.error}>{error}</p>}

          <form className={createStyles.form} onSubmit={handleUpdate}>
            <section className={createStyles.section}>
              <h2 className={createStyles.sectionTitle}>Course Details</h2>

              <div className={createStyles.fieldGrid}>
                <div className={createStyles.field}>
                  <label className={createStyles.label}>Course Name</label>
                  <input
                    className={createStyles.input}
                    type="text"
                    value={editFormData.courseName}
                    onChange={(e) => handleEditChange("courseName", e.target.value)}
                    required
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Course Code</label>
                  <input
                    className={`${createStyles.input} ${createStyles.readOnlyInput}`}
                    type="text"
                    value={editingCourse.courseUniqueCode}
                    readOnly
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Course Type</label>
                  <select
                    className={createStyles.input}
                    value={editFormData.courseType}
                    onChange={(e) => handleEditChange("courseType", e.target.value)}
                  >
                    <option value="">Select course type</option>
                    {courseTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Certification Provided</label>
                  <select
                    className={createStyles.input}
                    value={editFormData.certificationProvided}
                    onChange={(e) =>
                      handleEditChange("certificationProvided", e.target.value)
                    }
                  >
                    <option value="">Select option</option>
                    {certificationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Institute Name</label>
                  <input
                    className={createStyles.input}
                    type="text"
                    value={editFormData.instituteName}
                    onChange={(e) => handleEditChange("instituteName", e.target.value)}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Course Duration</label>
                  <input
                    className={createStyles.input}
                    type="text"
                    value={editFormData.courseDuration}
                    onChange={(e) => handleEditChange("courseDuration", e.target.value)}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Mode Of Training</label>
                  <input
                    className={createStyles.input}
                    type="text"
                    value={editFormData.modeOfTraining}
                    onChange={(e) => handleEditChange("modeOfTraining", e.target.value)}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Language Of Delivery</label>
                  <select
                    className={createStyles.input}
                    value={editFormData.languageOfDelivery}
                    onChange={(e) =>
                      handleEditChange("languageOfDelivery", e.target.value)
                    }
                  >
                    <option value="">Select language</option>
                    {languageOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Start Date</label>
                  <input
                    className={createStyles.input}
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => handleEditChange("startDate", e.target.value)}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>End Date</label>
                  <input
                    className={createStyles.input}
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) => handleEditChange("endDate", e.target.value)}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Registration Deadline</label>
                  <input
                    className={createStyles.input}
                    type="date"
                    value={editFormData.registrationDeadline}
                    onChange={(e) =>
                      handleEditChange("registrationDeadline", e.target.value)
                    }
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Fees (INR)</label>
                  <input
                    className={createStyles.input}
                    type="number"
                    min="0"
                    value={editFormData.feesInr}
                    onChange={(e) => handleEditChange("feesInr", e.target.value)}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Net Fees (INR)</label>
                  <input
                    className={createStyles.input}
                    type="number"
                    min="0"
                    value={editFormData.netFeesInr}
                    onChange={(e) => handleEditChange("netFeesInr", e.target.value)}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Maximum Seats / Batch Size</label>
                  <input
                    className={createStyles.input}
                    type="number"
                    min="0"
                    value={editFormData.maximumSeatsBatchSize}
                    onChange={(e) =>
                      handleEditChange("maximumSeatsBatchSize", e.target.value)
                    }
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Current Availability</label>
                  <input
                    className={createStyles.input}
                    type="text"
                    value={editFormData.currentAvailability}
                    onChange={(e) =>
                      handleEditChange("currentAvailability", e.target.value)
                    }
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Location</label>
                  <input
                    className={createStyles.input}
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => handleEditChange("location", e.target.value)}
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Trainer / Instructor Name</label>
                  <input
                    className={createStyles.input}
                    type="text"
                    value={editFormData.trainerInstructorName}
                    onChange={(e) =>
                      handleEditChange("trainerInstructorName", e.target.value)
                    }
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Trainer Experience</label>
                  <input
                    className={createStyles.input}
                    type="text"
                    value={editFormData.trainerExperience}
                    onChange={(e) =>
                      handleEditChange("trainerExperience", e.target.value)
                    }
                  />
                </div>

                <div className={createStyles.field}>
                  <label className={createStyles.label}>Apply Discount Voucher</label>
                  <label className={createStyles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={editFormData.applyDiscountVoucher}
                      onChange={(e) =>
                        setEditFormData((prev) =>
                          prev
                            ? {
                                ...prev,
                                applyDiscountVoucher: e.target.checked,
                              }
                            : prev
                        )
                      }
                    />
                    Enable discount voucher for this course
                  </label>
                </div>

                <div className={createStyles.fullField}>
                  <label className={createStyles.label}>Target Audience</label>
                  <textarea
                    className={createStyles.input}
                    rows={4}
                    value={editFormData.targetAudience}
                    onChange={(e) => handleEditChange("targetAudience", e.target.value)}
                    placeholder="Comma separated audience values"
                  />
                </div>

                <div className={createStyles.fullField}>
                  <label className={createStyles.label}>Curriculum / Topics Covered</label>
                  <textarea
                    className={createStyles.input}
                    rows={5}
                    value={editFormData.curriculumTopicsCovered}
                    onChange={(e) =>
                      handleEditChange("curriculumTopicsCovered", e.target.value)
                    }
                  />
                </div>

                <div className={createStyles.fullField}>
                  <label className={createStyles.label}>Affiliation / Accreditation</label>
                  <textarea
                    className={createStyles.input}
                    rows={4}
                    value={editFormData.affiliationAccreditation}
                    onChange={(e) =>
                      handleEditChange("affiliationAccreditation", e.target.value)
                    }
                  />
                </div>

                <div className={createStyles.fullField}>
                  <label className={createStyles.label}>Discounts / Offers</label>
                  <textarea
                    className={createStyles.input}
                    rows={4}
                    value={editFormData.discountsOffers}
                    onChange={(e) => handleEditChange("discountsOffers", e.target.value)}
                  />
                </div>

                <div className={createStyles.fullField}>
                  <label className={createStyles.label}>Refund / Cancellation Policy</label>
                  <textarea
                    className={createStyles.input}
                    rows={4}
                    value={editFormData.refundCancellationPolicy}
                    onChange={(e) =>
                      handleEditChange("refundCancellationPolicy", e.target.value)
                    }
                  />
                </div>

                <div className={createStyles.fullField}>
                  <label className={createStyles.label}>Post-Course Support</label>
                  <textarea
                    className={createStyles.input}
                    rows={4}
                    value={editFormData.postCourseSupport}
                    onChange={(e) => handleEditChange("postCourseSupport", e.target.value)}
                  />
                </div>

                <div className={createStyles.fullField}>
                  <label className={createStyles.label}>Contact For Queries</label>
                  <textarea
                    className={createStyles.input}
                    rows={4}
                    value={editFormData.contactForQueries}
                    onChange={(e) => handleEditChange("contactForQueries", e.target.value)}
                  />
                </div>
              </div>
            </section>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="submit"
                className={createStyles.submitBtn}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={closeEditModal}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ListOfCourse;
