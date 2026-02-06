"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/LatestUpdateShorts.module.css";
import { API_URL } from "@/config/api";

interface Short {
  _id: string;
  platform: "youtube" | "instagram";
  videoUrl: string;
}

// ✅ Use environment variable for API base URL
// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const TreatmentShorts: React.FC = () => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [platform, setPlatform] = useState<"youtube" | "instagram">("youtube");
  const [videoUrl, setVideoUrl] = useState("");

  // ✅ Fetch shorts
  const fetchShorts = async () => {
    try {
      const res = await axios.get<Short[]>(`${API_URL}/treatment-shorts`);
      setShorts(res.data);
    } catch (err) {
      console.error("Failed to fetch treatment shorts", err);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  // ✅ Add short
  const handleAddShort = async () => {
    if (!videoUrl.trim()) return alert("Please enter a video URL");

    try {
      await axios.post(`${API_URL}/treatment-shorts`, {
        platform,
        videoUrl,
      });
      setVideoUrl("");
      fetchShorts();
    } catch (err) {
      console.error("Failed to add treatment short", err);
      alert("Invalid URL format. Only YouTube Shorts or Instagram Reels are allowed.");
    }
  };

  // ✅ Delete short
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/treatment-shorts/${id}`);
      fetchShorts();
    } catch (err) {
      console.error("Failed to delete treatment short", err);
    }
  };

  // ✅ Update short
  const handleUpdate = async (id: string) => {
    const newUrl = prompt("Enter new video URL:")?.trim();
    if (!newUrl) return;

    try {
      await axios.put(`${API_URL}/treatment-shorts/${id}`, {
        platform: newUrl.includes("instagram") ? "instagram" : "youtube",
        videoUrl: newUrl,
      });
      fetchShorts();
    } catch (err) {
      console.error("Failed to update treatment short", err);
      alert("Invalid URL format.");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Manage Treatment Shorts</h1>

      {/* Upload Section */}
      <div className={styles.uploadSection}>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as "youtube" | "instagram")}
          className={styles.select}
        >
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
        </select>

        <input
          type="text"
          placeholder="Paste YouTube Shorts or Instagram Reel link"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className={styles.input}
        />

        <button onClick={handleAddShort} className={styles.addBtn}>
          Add Short
        </button>
      </div>

      {/* Shorts List */}
      <div className={styles.grid}>
        {shorts.map((short) => (
          <div key={short._id} className={styles.card}>
            {short.platform === "youtube" ? (
              <iframe
                width="100%"
                height="250"
                src={short.videoUrl.replace("shorts/", "embed/")}
                title="YouTube Shorts"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <iframe
                src={`${short.videoUrl}embed`}
                width="100%"
                height="400"
                frameBorder="0"
                allowFullScreen
              />
            )}

            <div className={styles.actions}>
              <button
                onClick={() => handleUpdate(short._id)}
                className={styles.updateBtn}
              >
                Update
              </button>
              <button
                onClick={() => handleDelete(short._id)}
                className={styles.deleteBtn}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TreatmentShorts;
