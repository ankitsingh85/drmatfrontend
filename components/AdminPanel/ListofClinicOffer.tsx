"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "@/styles/UpdateOffer.module.css";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import { useToast } from "@/context/ToastContext";
import TableActions from "@/components/AdminPanel/common/TableActions";

interface Offer {
  _id: string;
  imageUrl: string;
  imageBase64?: string;
}

interface PreviewFile {
  file: File;
  previewUrl: string;
  valid: boolean;
  error?: string;
}

const MAX_SIZE_MB = 5;
// Matches the actual display box in the home page's "Latest Coupon Offer"
// carousel (components/homePage/..ClinicOffer.tsx + styles/Offer.module.css)
// — a 2:1 banner, not the old 1600x350 (~4.6:1) ratio, which was being
// cropped hard by object-fit: cover to fit the much narrower slide.
const REQUIRED_WIDTH = 1200;
const REQUIRED_HEIGHT = 600;

type ListofClinicOfferProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

// Admin-side "Coupon Offer" banner manager — a plain image upload, no
// clinic/category link required. The banner is purely promotional (shown
// in the Coupon Offer carousel on the home page); it isn't tied to any
// specific clinic the way the old "Clinic Offer" version was.
const ListofClinicOffer = ({ canEdit = true, canDelete = true }: ListofClinicOfferProps) => {
  const toast = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [updatingOfferId, setUpdatingOfferId] = useState<string | null>(null);
  const updateFileInputRef = useRef<HTMLInputElement | null>(null);
  const previewFilesRef = useRef<PreviewFile[]>([]);

  const fetchOffers = async () => {
    try {
      const res = await axios.get(`${API_URL}/offer3`);
      setOffers(res.data);
    } catch (err) {
      console.error("Fetch offers error:", err);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    previewFilesRef.current = previewFiles;
  }, [previewFiles]);

  useEffect(() => {
    return () => {
      revokePreviewUrls(previewFilesRef.current);
    };
  }, []);

  const revokePreviewUrls = (files: PreviewFile[]) => {
    files.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
  };

  const validateImage = (file: File): Promise<PreviewFile> => {
    return new Promise((resolve) => {
      const previewUrl = URL.createObjectURL(file);

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return resolve({
          file,
          previewUrl,
          valid: false,
          error: `Exceeds ${MAX_SIZE_MB}MB limit`,
        });
      }

      const img = new Image();
      img.onload = () => {
        if (img.width !== REQUIRED_WIDTH || img.height !== REQUIRED_HEIGHT) {
          resolve({
            file,
            previewUrl,
            valid: false,
            error: `Must be ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}px (got ${img.width}x${img.height})`,
          });
        } else {
          resolve({ file, previewUrl, valid: true });
        }
      };

      img.onerror = () => {
        resolve({
          file,
          previewUrl,
          valid: false,
          error: "Unable to read image dimensions",
        });
      };
      img.src = previewUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    revokePreviewUrls(previewFilesRef.current);
    const previews: PreviewFile[] = [];

    for (const file of files) {
      const result = await validateImage(file);
      previews.push(result);
    }

    setPreviewFiles(previews);
    setIsUploadModalOpen(previews.length > 0);
  };

  const closeUploadModal = (force = false) => {
    if (isUploading && !force) return;
    revokePreviewUrls(previewFilesRef.current);
    setIsUploadModalOpen(false);
    setPreviewFiles([]);
    setErrorMessage("");
  };

  const handleUpload = async () => {
    const validFiles = previewFiles.filter((preview) => preview.valid);

    if (validFiles.length === 0) {
      setErrorMessage("No valid images selected to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage("");

      const formData = new FormData();
      validFiles.forEach((preview) => formData.append("images", preview.file));

      await axios.post(`${API_URL}/offer3`, formData);

      toast.success("Coupon offer uploaded successfully");
      await fetchOffers();
      closeUploadModal(true);
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Failed to upload coupon offer image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/offer3/${id}`);
      fetchOffers();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleUpdateClick = (id: string) => {
    setUpdatingOfferId(id);
    updateFileInputRef.current?.click();
  };

  const handleUpdateFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !updatingOfferId) return;

    const preview = await validateImage(file);
    if (!preview.valid) {
      revokePreviewUrls([preview]);
      setErrorMessage(preview.error || "Invalid image selected.");
      setUpdatingOfferId(null);
      e.target.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      await axios.put(`${API_URL}/offer3/${updatingOfferId}`, formData);
      await fetchOffers();
    } catch (err) {
      console.error("Update error:", err);
      setErrorMessage("Failed to update coupon offer image.");
    } finally {
      setIsUploading(false);
      revokePreviewUrls([preview]);
      setUpdatingOfferId(null);
      e.target.value = "";
    }
  };

  const getOfferImage = (offer: Offer) =>
    offer.imageUrl || offer.imageBase64 || "";

  return (
    <div className={styles.container}>
      <h1>Coupon Offer</h1>

      <div className={styles.instructions}>
        <p>Please upload images with the following requirements:</p>
        <ul>
          <li>Width: <strong>{REQUIRED_WIDTH}px</strong></li>
          <li>Height: <strong>{REQUIRED_HEIGHT}px</strong></li>
          <li>Max Size: <strong>{MAX_SIZE_MB} MB</strong></li>
          <li>Other sizes will be rejected.</li>
        </ul>
      </div>

      <div className={styles.uploadSection}>
        <input type="file" multiple accept="image/*" onChange={handleFileChange} />
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      {previewFiles.length > 0 && (
        <div className={styles.previewGrid}>
          {previewFiles.map((preview, idx) => (
            <div
              key={idx}
              className={`${styles.previewCard} ${preview.valid ? styles.valid : styles.invalid}`}
            >
              {preview.previewUrl && (
                <img
                  src={preview.previewUrl}
                  alt={preview.file.name}
                  className={styles.previewImage}
                />
              )}
              <p className={styles.fileName}>{preview.file.name}</p>
              <p className={styles.fileSize}>
                {(preview.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              {!preview.valid && <p className={styles.previewError}>{preview.error}</p>}
            </div>
          ))}
        </div>
      )}

      {isUploadModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Upload Coupon Offer</h3>
            <p className={styles.modalHint}>
              Just the image — no clinic or category link needed for coupon offers.
            </p>

            <div className={styles.modalActions}>
              <button
                onClick={handleUpload}
                className={styles.saveBtn}
                type="button"
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={() => closeUploadModal()}
                className={styles.cancelBtn}
                type="button"
                disabled={isUploading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.offersGrid}>
        {offers.map((offer) => (
          <div key={offer._id} className={styles.offerCard}>
            <img
              src={resolveMediaUrl(getOfferImage(offer)) || getOfferImage(offer)}
              alt="Coupon offer"
              className={styles.offerImage}
            />
            <div className={styles.buttons}>
              <TableActions
                onEdit={() => handleUpdateClick(offer._id)}
                onDelete={() => handleDelete(offer._id)}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            </div>
          </div>
        ))}
      </div>

      <input
        ref={updateFileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleUpdateFileChange}
      />
    </div>
  );
};

export default ListofClinicOffer;
