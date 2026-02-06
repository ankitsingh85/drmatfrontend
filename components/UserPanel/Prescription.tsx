"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import { API_URL } from "@/config/api";

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const Prescription = () => {
  const { user } = useUser();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [previewItem, setPreviewItem] = useState<any>(null); // For fullscreen preview

  /* ---------------- FETCH USER DATA ---------------- */
  useEffect(() => {
    if (!user?._id) return;

    axios.get(`${API_URL}/userprofile/id/${user._id}`).then((res) => {
      setPrescriptions(res.data.prescriptions || []);
      setReports(res.data.reports || []);
    });
  }, [user?._id]);

  const convertToBase64 = (file: File) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  /* ---------------- UPLOAD PRESCRIPTION ---------------- */
  const handlePrescriptionUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = await convertToBase64(file);

    const res = await axios.post(
      `${API_URL}/userprofile/${user?._id}/upload-prescription`,
      { fileName: file.name, fileType: file.type, data }
    );

    setPrescriptions(res.data.prescriptions);
  };

  /* ---------------- UPLOAD REPORT ---------------- */
  const handleReportUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = await convertToBase64(file);

    const res = await axios.post(
      `${API_URL}/userprofile/${user?._id}/upload-report`,
      { fileName: file.name, fileType: file.type, data }
    );

    setReports(res.data.reports);
  };

  /* ---------------- DELETE ---------------- */
  const deletePrescription = async (i: number) => {
    const res = await axios.delete(
      `${API_URL}/userprofile/${user?._id}/prescriptions/${i}`
    );
    setPrescriptions(res.data.prescriptions);
  };

  const deleteReport = async (i: number) => {
    const res = await axios.delete(
      `${API_URL}/userprofile/${user?._id}/reports/${i}`
    );
    setReports(res.data.reports);
  };

  /* ---------------- INTERNAL CSS ---------------- */
  const styles: any = {
    container: {
      padding: "25px",
      maxWidth: "1100px",
      margin: "auto",
      fontFamily: "Inter, sans-serif",
    },

    sectionTitle: {
      fontSize: "26px",
      fontWeight: 700,
      marginBottom: "20px",
      color: "#2a2a2a",
    },

    wrapper: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "25px",
    },

    box: {
      background: "#ffffff",
      padding: "20px",
      borderRadius: "15px",
      boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
      transition: "0.3s",
    },

    boxTitle: {
      fontSize: "20px",
      fontWeight: 600,
      marginBottom: "15px",
      color: "#1f3b77",
    },

    uploadBox: {
      border: "2px dashed #4c7cf5",
      padding: "20px",
      textAlign: "center",
      color: "#4c7cf5",
      cursor: "pointer",
      borderRadius: "12px",
      marginBottom: "20px",
      fontWeight: 600,
      transition: "0.2s",
    },

    previewContainer: {
      display: "grid",
      gap: "18px",
    },

    card: {
      background: "#f7f9ff",
      padding: "12px",
      borderRadius: "12px",
      boxShadow: "0px 2px 10px rgba(0,0,0,0.08)",
      transition: "0.3s",
    },

    cardFileName: {
      fontSize: "15px",
      fontWeight: 600,
      marginBottom: "10px",
      color: "#333",
    },

    previewImg: {
      width: "100%",
      height: "180px",
      objectFit: "cover",
      borderRadius: "10px",
      cursor: "pointer",
      boxShadow: "0px 2px 8px rgba(0,0,0,0.15)",
    },

    previewPdf: {
      width: "100%",
      height: "180px",
      borderRadius: "10px",
      border: "1px solid #ccc",
      cursor: "pointer",
    },

    deleteBtn: {
      marginTop: "10px",
      background: "#ff4d4d",
      width: "100%",
      border: "none",
      padding: "8px",
      borderRadius: "8px",
      cursor: "pointer",
      color: "#fff",
      fontWeight: 600,
      transition: "0.3s",
    },

    /* FULLSCREEN PREVIEW MODAL */
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    },

    modalContent: {
      background: "#ffffff",
      padding: "20px",
      borderRadius: "12px",
      maxWidth: "80%",
      maxHeight: "80%",
      overflow: "auto",
    },

    closeBtn: {
      background: "#e84d4d",
      padding: "10px 15px",
      borderRadius: "6px",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      marginBottom: "15px",
      fontWeight: 600,
    },
  };

  /* ---------------- PREVIEW COMPONENT ---------------- */
  const Preview = (file: any, index: number, remove: any) => (
    <div style={styles.card} key={index}>
      <p style={styles.cardFileName}>{file.fileName}</p>

      {file.fileType === "application/pdf" ? (
        <iframe
          src={file.data}
          style={styles.previewPdf}
          onClick={() => setPreviewItem(file)}
        ></iframe>
      ) : (
        <img
          src={file.data}
          style={styles.previewImg}
          onClick={() => setPreviewItem(file)}
        />
      )}

      <button style={styles.deleteBtn} onClick={() => remove(index)}>
        Delete
      </button>
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>📄 Medical Records</h2>

      <div style={styles.wrapper}>
        {/* PRESCRIPTIONS */}
        <div style={styles.box}>
          <h3 style={styles.boxTitle}>Prescription Upload</h3>

          <label style={styles.uploadBox}>
            Click to Upload (PDF / Image)
            <input
              type="file"
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              onChange={handlePrescriptionUpload}
            />
          </label>

          <div style={styles.previewContainer}>
            {prescriptions.map((p, i) => Preview(p, i, deletePrescription))}
          </div>
        </div>

        {/* REPORTS */}
        <div style={styles.box}>
          <h3 style={styles.boxTitle}>Report Upload</h3>

          <label style={styles.uploadBox}>
            Click to Upload (PDF / Image)
            <input
              type="file"
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              onChange={handleReportUpload}
            />
          </label>

          <div style={styles.previewContainer}>
            {reports.map((r, i) => Preview(r, i, deleteReport))}
          </div>
        </div>
      </div>

      {/* FULLSCREEN PREVIEW MODAL */}
      {previewItem && (
        <div style={styles.modalOverlay} onClick={() => setPreviewItem(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setPreviewItem(null)}>
              Close Preview
            </button>

            {previewItem.fileType === "application/pdf" ? (
              <iframe src={previewItem.data} width="100%" height="600px"></iframe>
            ) : (
              <img src={previewItem.data} style={{ width: "100%" }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescription;
