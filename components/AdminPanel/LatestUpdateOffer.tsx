"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/UpdateOffer.module.css";
import { API_URL } from "@/config/api";

interface LatestOffer {
  _id: string;
  imageBase64: string;
}

interface PreviewFile {
  file: File;
  base64: string;
  valid: boolean;
  error?: string;
}

const MAX_SIZE_MB = 5;
const REQUIRED_WIDTH = 1600;
const REQUIRED_HEIGHT = 350;

// ✅ Use environment variable for API base
// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const LatestUpdateOffer = () => {
  const [offers, setOffers] = useState<LatestOffer[]>([]);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Fetch all offers
  const fetchOffers = async () => {
    try {
      const res = await axios.get(`${API_URL}/latest-offers`);
      setOffers(res.data);
    } catch (err) {
      console.error("Fetch offers error:", err);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Validate image (size + dimensions)
  const validateImage = (file: File): Promise<PreviewFile> => {
    return new Promise((resolve) => {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return resolve({
          file,
          base64: "",
          valid: false,
          error: `Exceeds ${MAX_SIZE_MB}MB limit`,
        });
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const img = new Image();
        img.src = base64;

        img.onload = () => {
          if (img.width !== REQUIRED_WIDTH || img.height !== REQUIRED_HEIGHT) {
            resolve({
              file,
              base64,
              valid: false,
              error: `Must be ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT}px (got ${img.width}×${img.height})`,
            });
          } else {
            resolve({ file, base64, valid: true });
          }
        };

        img.onerror = () => {
          resolve({
            file,
            base64,
            valid: false,
            error: "Unable to read image dimensions",
          });
        };
      };

      reader.onerror = () => {
        resolve({
          file,
          base64: "",
          valid: false,
          error: "Failed to read file",
        });
      };
    });
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const previews: PreviewFile[] = [];

    for (const file of files) {
      const result = await validateImage(file);
      previews.push(result);
    }

    setPreviewFiles(previews);
  };

  // Upload valid images
  const handleUpload = async () => {
    const validFiles = previewFiles.filter((p) => p.valid);

    if (validFiles.length === 0) {
      setErrorMessage("⚠️ No valid images selected to upload.");
      return;
    }

    for (let preview of validFiles) {
      try {
        await axios.post(`${API_URL}/latest-offers`, {
          imageBase64: preview.base64,
        });
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    // Refresh and clear previews
    await fetchOffers();
    setPreviewFiles([]);
  };

  // Delete offer
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/latest-offers/${id}`);
      fetchOffers();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Update existing offer image (same behaviour as your UpdateOffer: prompt for Base64/URL)
  const handleUpdate = (id: string) => {
    const file = prompt("Enter image URL/Base64 string for update:")?.trim();
    if (!file) return;

    axios
      .put(`${API_URL}/latest-offers/${id}`, { imageBase64: file })
      .then(() => fetchOffers())
      .catch((err) => console.error("Update error:", err));
  };

  return (
    <div className={styles.container}>
      <h1>Manage Latest Offers</h1>

      {/* Upload Instructions */}
      <div className={styles.instructions}>
        <p>📌 Please upload images with the following requirements:</p>
        <ul>
          <li>✅ Width: <strong>{REQUIRED_WIDTH}px</strong></li>
          <li>✅ Height: <strong>{REQUIRED_HEIGHT}px</strong></li>
          <li>✅ Max Size: <strong>{MAX_SIZE_MB} MB</strong></li>
          <li>⚠️ Other sizes will be rejected.</li>
        </ul>
      </div>

      <div className={styles.uploadSection}>
        <input type="file" multiple accept="image/*" onChange={handleFileChange} />
        <button onClick={handleUpload} className={styles.uploadBtn}>
          Upload Selected
        </button>
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      {/* Preview Selected Images */}
      {previewFiles.length > 0 && (
        <div className={styles.previewGrid}>
          {previewFiles.map((preview, idx) => (
            <div
              key={idx}
              className={`${styles.previewCard} ${preview.valid ? styles.valid : styles.invalid}`}
            >
              {preview.base64 && (
                <img src={preview.base64} alt={preview.file.name} className={styles.previewImage} />
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

      {/* Existing Offers */}
      <div className={styles.offersGrid}>
        {offers.map((offer) => (
          <div key={offer._id} className={styles.offerCard}>
            <img src={offer.imageBase64} alt="offer" className={styles.offerImage} />
            <div className={styles.buttons}>
              <button onClick={() => handleUpdate(offer._id)} className={styles.updateBtn}>
                Update
              </button>
              <button onClick={() => handleDelete(offer._id)} className={styles.deleteBtn}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LatestUpdateOffer;
