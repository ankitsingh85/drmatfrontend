"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FiFileText, FiImage, FiTrash2, FiUpload } from "react-icons/fi";
import styles from "@/styles/userresult.module.css";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";

type TabKey = "gallery" | "prescriptions";

interface GalleryItem {
  _id?: string;
  title?: string;
  note?: string;
  beforeImage?: string;
  afterImage?: string;
  uploadedAt?: string;
}

interface PrescriptionItem {
  _id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt?: string;
}

interface UserResultProps {
  userId?: string;
  userName?: string;
  initialTab?: TabKey;
}

const emptyGalleryForm = {
  title: "",
  note: "",
  beforeImage: null as File | null,
  afterImage: null as File | null,
};

export default function YourResult({ userId, userName, initialTab }: UserResultProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab || "gallery");
  const [loading, setLoading] = useState(true);
  const [savingGallery, setSavingGallery] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [galleryForm, setGalleryForm] = useState(emptyGalleryForm);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [beforePreview, setBeforePreview] = useState("");
  const [afterPreview, setAfterPreview] = useState("");

  const counts = useMemo(
    () => ({
      gallery: galleryItems.length,
      prescriptions: prescriptions.length,
    }),
    [galleryItems.length, prescriptions.length]
  );

  useEffect(() => {
    setActiveTab(initialTab || "gallery");
  }, [initialTab]);

  useEffect(() => {
    if (!galleryForm.beforeImage) {
      setBeforePreview("");
      return;
    }

    const url = URL.createObjectURL(galleryForm.beforeImage);
    setBeforePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [galleryForm.beforeImage]);

  useEffect(() => {
    if (!galleryForm.afterImage) {
      setAfterPreview("");
      return;
    }

    const url = URL.createObjectURL(galleryForm.afterImage);
    setAfterPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [galleryForm.afterImage]);

  useEffect(() => {
    const fetchResultMedia = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_URL}/users/${userId}`);
        if (!res.ok) throw new Error("Failed to load result media");

        const data = await res.json();
        setGalleryItems(Array.isArray(data.resultGallery) ? data.resultGallery : []);
        setPrescriptions(Array.isArray(data.prescriptions) ? data.prescriptions : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load your results");
      } finally {
        setLoading(false);
      }
    };

    fetchResultMedia();
  }, [userId]);

  const handleGalleryFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "beforeImage" || name === "afterImage") {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setGalleryForm((prev) => ({ ...prev, [name]: file }));
      return;
    }

    setGalleryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrescriptionFile(e.target.files?.[0] || null);
  };

  const uploadGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!galleryForm.beforeImage && !galleryForm.afterImage) {
      alert("Please choose at least one image");
      return;
    }

    const formData = new FormData();
    formData.append("title", galleryForm.title.trim());
    formData.append("note", galleryForm.note.trim());
    if (galleryForm.beforeImage) formData.append("beforeImage", galleryForm.beforeImage);
    if (galleryForm.afterImage) formData.append("afterImage", galleryForm.afterImage);

    try {
      setSavingGallery(true);
      const res = await fetch(`${API_URL}/users/${userId}/result-gallery`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload gallery item");

      setGalleryItems(Array.isArray(data.resultGallery) ? data.resultGallery : []);
      setGalleryForm(emptyGalleryForm);
      alert("Gallery item uploaded successfully");
    } catch (err: any) {
      alert(err.message || "Failed to upload gallery item");
    } finally {
      setSavingGallery(false);
    }
  };

  const uploadPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !prescriptionFile) return;

    if (prescriptionFile.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      return;
    }

    const formData = new FormData();
    formData.append("file", prescriptionFile);

    try {
      setSavingPrescription(true);
      const res = await fetch(`${API_URL}/users/${userId}/prescriptions`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload prescription");

      setPrescriptions(Array.isArray(data.prescriptions) ? data.prescriptions : []);
      setPrescriptionFile(null);
      alert("Prescription uploaded successfully");
    } catch (err: any) {
      alert(err.message || "Failed to upload prescription");
    } finally {
      setSavingPrescription(false);
    }
  };

  const deleteGalleryItem = async (itemId?: string) => {
    if (!userId || !itemId) return;

    try {
      const res = await fetch(`${API_URL}/users/${userId}/result-gallery/${itemId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete gallery item");
      setGalleryItems(Array.isArray(data.resultGallery) ? data.resultGallery : []);
    } catch (err: any) {
      alert(err.message || "Failed to delete gallery item");
    }
  };

  const deletePrescription = async (itemId?: string) => {
    if (!userId || !itemId) return;

    try {
      const res = await fetch(`${API_URL}/users/${userId}/prescriptions/${itemId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete prescription");
      setPrescriptions(Array.isArray(data.prescriptions) ? data.prescriptions : []);
    } catch (err: any) {
      alert(err.message || "Failed to delete prescription");
    }
  };

  if (!userId) {
    return (
      <div className={styles.shell}>
        <div className={styles.emptyState}>
          <h2>Your Result</h2>
          <p>We need a logged in user before we can show result uploads.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.shell}>
        <div className={styles.loadingCard}>Loading your results...</div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.hero}>
        <div>
          <p className={styles.kicker}>Patient media center</p>
          <h2 className={styles.title}>Your Result</h2>
          <p className={styles.subtitle}>
            Keep a clean record of your progress, gallery photos, and prescriptions.
          </p>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span>{counts.gallery}</span>
            <small>Gallery items</small>
          </div>
          <div className={styles.statCard}>
            <span>{counts.prescriptions}</span>
            <small>Prescriptions</small>
          </div>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.tabBar} role="tablist" aria-label="Your result tabs">
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "gallery" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("gallery")}
        >
          <FiImage />
          <span>Your Gallery</span>
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "prescriptions" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("prescriptions")}
        >
          <FiFileText />
          <span>Upload a Prescription</span>
        </button>
      </div>

      {activeTab === "gallery" ? (
        <div className={styles.contentGrid}>
          <form className={styles.panelCard} onSubmit={uploadGallery}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Before and after gallery</h3>
                <p>Upload one or two images to track the treatment journey.</p>
              </div>
              <FiUpload className={styles.panelIcon} />
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Title</span>
                <input
                  name="title"
                  value={galleryForm.title}
                  onChange={handleGalleryFieldChange}
                  placeholder="Example: Acne improvement"
                />
              </label>

              <label className={styles.field}>
                <span>Note</span>
                <textarea
                  name="note"
                  value={galleryForm.note}
                  onChange={handleGalleryFieldChange}
                  placeholder="Short note about this progress"
                  rows={4}
                />
              </label>
            </div>

            <div className={styles.previewRow}>
              <label className={styles.dropzone}>
                <input
                  type="file"
                  accept="image/*"
                  name="beforeImage"
                  onChange={handleGalleryFieldChange}
                />
                {beforePreview ? (
                  <img src={beforePreview} alt="Before preview" />
                ) : (
                  <div>
                    <FiImage />
                    <strong>Before image</strong>
                    <span>Click to choose a file</span>
                  </div>
                )}
              </label>

              <label className={styles.dropzone}>
                <input
                  type="file"
                  accept="image/*"
                  name="afterImage"
                  onChange={handleGalleryFieldChange}
                />
                {afterPreview ? (
                  <img src={afterPreview} alt="After preview" />
                ) : (
                  <div>
                    <FiImage />
                    <strong>After image</strong>
                    <span>Click to choose a file</span>
                  </div>
                )}
              </label>
            </div>

            <button type="submit" className={styles.primaryBtn} disabled={savingGallery}>
              {savingGallery ? "Uploading..." : "Save Gallery Entry"}
            </button>
          </form>

          <div className={styles.listColumn}>
            <div className={styles.sectionHeading}>
              <h3>Saved gallery entries</h3>
              <p>Latest uploads appear first.</p>
            </div>

            {galleryItems.length === 0 ? (
              <div className={styles.emptyState}>
                <h4>No gallery items yet</h4>
                <p>Your before and after photos will show here after upload.</p>
              </div>
            ) : (
              <div className={styles.resultList}>
                {galleryItems.map((item) => (
                  <article className={styles.resultCard} key={item._id}>
                    <div className={styles.resultMediaGrid}>
                      <figure className={styles.mediaBox}>
                        <span>Before</span>
                        {item.beforeImage ? (
                          <img
                            src={resolveMediaUrl(item.beforeImage) || item.beforeImage}
                            alt="Before"
                          />
                        ) : (
                          <div className={styles.mediaFallback}>No before image</div>
                        )}
                      </figure>
                      <figure className={styles.mediaBox}>
                        <span>After</span>
                        {item.afterImage ? (
                          <img
                            src={resolveMediaUrl(item.afterImage) || item.afterImage}
                            alt="After"
                          />
                        ) : (
                          <div className={styles.mediaFallback}>No after image</div>
                        )}
                      </figure>
                    </div>

                    <div className={styles.resultMeta}>
                      <div>
                        <h4>{item.title || "Untitled progress"}</h4>
                        <p>{item.note || "No note added for this entry."}</p>
                      </div>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => deleteGalleryItem(item._id)}
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.contentGrid}>
          <form className={styles.panelCard} onSubmit={uploadPrescription}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Upload a prescription</h3>
                <p>Only PDF files are allowed here for a clean medical record.</p>
              </div>
              <FiFileText className={styles.panelIcon} />
            </div>

            <label className={styles.pdfDropzone}>
              <input type="file" accept="application/pdf" onChange={handlePrescriptionChange} />
              <div>
                <FiFileText />
                <strong>{prescriptionFile ? prescriptionFile.name : "Choose a PDF file"}</strong>
                <span>{prescriptionFile ? "Ready to upload" : "Click to attach prescription PDF"}</span>
              </div>
            </label>

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={savingPrescription || !prescriptionFile}
            >
              {savingPrescription ? "Uploading..." : "Upload Prescription"}
            </button>
          </form>

          <div className={styles.listColumn}>
            <div className={styles.sectionHeading}>
              <h3>Uploaded prescriptions</h3>
              <p>Open the PDF or remove it anytime.</p>
            </div>

            {prescriptions.length === 0 ? (
              <div className={styles.emptyState}>
                <h4>No prescriptions uploaded</h4>
                <p>Your uploaded prescription PDFs will appear here.</p>
              </div>
            ) : (
              <div className={styles.prescriptionList}>
                {prescriptions.map((item) => {
                  const fileUrl = resolveMediaUrl(item.fileUrl) || item.fileUrl;
                  return (
                    <article className={styles.prescriptionCard} key={item._id}>
                      <div className={styles.prescriptionInfo}>
                        <FiFileText className={styles.prescriptionIcon} />
                        <div>
                          <h4>{item.fileName}</h4>
                          <p>PDF prescription</p>
                        </div>
                      </div>

                      <div className={styles.prescriptionActions}>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.linkBtn}
                        >
                          Open PDF
                        </a>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => deletePrescription(item._id)}
                        >
                          <FiTrash2 />
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {userName && (
        <p className={styles.footerNote}>
          Viewing result records for <strong>{userName}</strong>.
        </p>
      )}
    </div>
  );
}
