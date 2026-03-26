"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import styles from "@/styles/UpdateOffer.module.css";
import { API_URL } from "@/config/api";

interface ClinicCategoryOption {
  _id: string;
  id: string;
  name: string;
}

interface ClinicOption {
  _id: string;
  cuc?: string;
  clinicName: string;
  dermaCategory?:
    | string
    | {
        _id?: string;
        id?: string;
        name?: string;
      };
}

interface OfferClinicRef {
  _id: string;
  cuc?: string;
  clinicName?: string;
}

interface OfferCategoryRef {
  _id?: string;
  id?: string;
  name?: string;
}

interface Offer {
  _id: string;
  imageBase64: string;
  clinicId?: string | OfferClinicRef;
  categoryId?: string | OfferCategoryRef;
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

const ListofClinicOffer = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [categories, setCategories] = useState<ClinicCategoryOption[]>([]);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState("");
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const fetchOffers = async () => {
    try {
      const res = await axios.get(`${API_URL}/clinic`);
      setOffers(res.data);
    } catch (err) {
      console.error("Fetch offers error:", err);
    }
  };

  const fetchPickerData = async () => {
    try {
      const [clinicRes, categoryRes] = await Promise.all([
        axios.get(`${API_URL}/clinics?light=true`),
        axios.get(`${API_URL}/clinic-categories`),
      ]);

      setClinics(Array.isArray(clinicRes.data) ? clinicRes.data : []);
      setCategories(Array.isArray(categoryRes.data) ? categoryRes.data : []);
    } catch (err) {
      console.error("Fetch picker data error:", err);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchPickerData();
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) {
      setSelectedClinicId("");
      setSelectedCategoryLabel("");
      return;
    }

    const matchedCategory =
      categories.find((category) => category._id === selectedCategoryId) ||
      categories.find((category) => category.id === selectedCategoryId) ||
      categories.find((category) => category.name === selectedCategoryId);

    setSelectedCategoryLabel(
      matchedCategory?.name || matchedCategory?.id || selectedCategoryId || ""
    );
  }, [selectedCategoryId, categories]);

  const filteredClinics = useMemo(() => {
    if (!selectedCategoryId) return [];

    const normalize = (value: string) => value.trim().toLowerCase();
    const selectedCategory = categories.find(
      (category) => category._id === selectedCategoryId || category.id === selectedCategoryId
    );

    const categoryMatchers = new Set<string>(
      [
        selectedCategoryId,
        selectedCategory?._id || "",
        selectedCategory?.id || "",
        selectedCategory?.name || "",
      ]
        .filter(Boolean)
        .map(normalize)
    );

    return clinics.filter((clinic) => {
      const clinicCategory =
        typeof clinic.dermaCategory === "object"
          ? clinic.dermaCategory?._id ||
            clinic.dermaCategory?.id ||
            clinic.dermaCategory?.name ||
            ""
          : clinic.dermaCategory || "";

      return clinicCategory ? categoryMatchers.has(normalize(clinicCategory)) : false;
    });
  }, [categories, clinics, selectedCategoryId]);

  const selectedCategoryName = useMemo(
    () =>
      categories.find((category) => category._id === selectedCategoryId)?.name ||
      categories.find((category) => category.id === selectedCategoryId)?.name ||
      selectedCategoryLabel,
    [categories, selectedCategoryId, selectedCategoryLabel]
  );

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
              error: `Must be ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}px (got ${img.width}x${img.height})`,
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
    setIsUploadModalOpen(previews.length > 0);
  };

  const closeUploadModal = () => {
    if (isUploading) return;
    setIsUploadModalOpen(false);
    setPreviewFiles([]);
    setErrorMessage("");
    setSelectedCategoryId("");
    setSelectedCategoryLabel("");
    setSelectedClinicId("");
  };

  const handleUpload = async () => {
    const validFiles = previewFiles.filter((preview) => preview.valid);

    if (!selectedCategoryId) {
      setErrorMessage("Please choose a category before uploading.");
      return;
    }

    if (!selectedClinicId) {
      setErrorMessage("Please choose a clinic before uploading.");
      return;
    }

    const matchedClinic = filteredClinics.find((clinic) => clinic._id === selectedClinicId);

    if (!matchedClinic) {
      setErrorMessage("Please choose a clinic from the selected category.");
      return;
    }

    if (validFiles.length === 0) {
      setErrorMessage("No valid images selected to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage("");

      const results = await Promise.allSettled(
        validFiles.map((preview) =>
          axios.post(`${API_URL}/offer3`, {
            imageBase64: preview.base64,
            clinicId: selectedClinicId,
            categoryId: selectedCategoryId,
          })
        )
      );

      const failedCount = results.filter((result) => result.status === "rejected").length;

      if (failedCount === 0) {
        alert("Offer uploaded successfully");
        await fetchOffers();
        closeUploadModal();
      } else {
        setErrorMessage(`Uploaded ${validFiles.length - failedCount} of ${validFiles.length} images.`);
        await fetchOffers();
      }
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Failed to upload offer image.");
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

  const handleUpdate = (id: string) => {
    const file = prompt("Enter image URL/Base64 string for update:")?.trim();
    if (!file) return;

    axios
      .put(`${API_URL}/offer3/${id}`, { imageBase64: file })
      .then(() => fetchOffers())
      .catch((err) => console.error("Update error:", err));
  };

  const getClinicLabel = (offer: Offer) =>
    typeof offer.clinicId === "object"
      ? offer.clinicId.clinicName || offer.clinicId.cuc || offer.clinicId._id || "-"
      : clinics.find((clinic) => clinic._id === offer.clinicId)?.clinicName ||
        offer.clinicId ||
        "-";

  const getCategoryLabel = (offer: Offer) =>
    typeof offer.categoryId === "object"
      ? offer.categoryId.name || offer.categoryId.id || offer.categoryId._id || "-"
      : categories.find((category) => category._id === offer.categoryId)?.name ||
        categories.find((category) => category.id === offer.categoryId)?.name ||
        offer.categoryId ||
        "-";

  return (
    <div className={styles.container}>
      <h1>Offer 3</h1>

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

      {isUploadModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Upload Offer</h3>
            <p className={styles.modalHint}>
              Choose a category first, then pick a clinic from that category.
            </p>

            <label className={styles.fieldLabel}>Category</label>
            <select
              className={styles.field}
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setSelectedClinicId("");
              }}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>

            {selectedCategoryName && (
              <p className={styles.modalHint}>
                Selected category: <strong>{selectedCategoryName}</strong>
              </p>
            )}

            <label className={styles.fieldLabel}>Clinic Name</label>
            <select
              className={styles.field}
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              disabled={!selectedCategoryId || filteredClinics.length === 0}
            >
              <option value="">
                {!selectedCategoryId
                  ? "Select a category first"
                  : filteredClinics.length === 0
                    ? "No clinics in this category"
                    : "Select a clinic"}
              </option>
              {filteredClinics.map((clinic) => (
                <option key={clinic._id} value={clinic._id}>
                  {clinic.clinicName}
                </option>
              ))}
            </select>

            {selectedCategoryId && filteredClinics.length > 0 && (
              <p className={styles.modalHint}>
                {filteredClinics.length} clinic
                {filteredClinics.length === 1 ? "" : "s"} found in this category.
              </p>
            )}

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
                onClick={closeUploadModal}
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
            <img src={offer.imageBase64} alt="offer" className={styles.offerImage} />
            <div className={styles.offerMeta}>
              <p>
                <strong>Clinic Name:</strong> {getClinicLabel(offer)}
              </p>
              <p>
                <strong>Category:</strong> {getCategoryLabel(offer)}
              </p>
            </div>
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

export default ListofClinicOffer;
