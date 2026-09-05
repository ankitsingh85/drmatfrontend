"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/LatestUpdateShorts.module.css";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

interface Short {
  _id: string;
  platform: "youtube" | "instagram";
  videoUrl: string;
  title?: string;
}

// ✅ Use environment variable for API base URL
// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

type TreatmentShortsProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

const TreatmentShorts: React.FC<TreatmentShortsProps> = ({
  canEdit = true,
  canDelete = true,
}) => {
  const toast = useToast();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [platform, setPlatform] = useState<"youtube" | "instagram">("youtube");
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");

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

  // ✅ Inject Instagram embed script when reels are present
  useEffect(() => {
    if (!shorts.some((s) => s.platform === "instagram")) return;

    const existing = document.getElementById("instagram-embed-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "instagram-embed-script";
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.onload = () => {
        (window as any).instgrm?.Embeds?.process?.();
      };
      document.body.appendChild(script);
    } else {
      (window as any).instgrm?.Embeds?.process?.();
    }
  }, [shorts]);

  // ✅ Add short
  const handleAddShort = async () => {
    if (!videoUrl.trim()) return toast.error("Please enter a video URL");

    try {
      await axios.post(`${API_URL}/treatment-shorts`, {
        platform,
        videoUrl,
        title,
      });
      setVideoUrl("");
      setTitle("");
      fetchShorts();
    } catch (err) {
      console.error("Failed to add treatment short", err);
      toast.error("Invalid URL format. Only YouTube Shorts or Instagram Reels are allowed.");
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
  const handleUpdate = async (short: Short) => {
    const newUrl = prompt("Enter new video URL:")?.trim();
    if (!newUrl) return;
    const newTitle = prompt("Enter reel text / title:", short.title || "");
    if (newTitle === null) return;

    try {
      await axios.put(`${API_URL}/treatment-shorts/${short._id}`, {
        platform: newUrl.includes("instagram") ? "instagram" : "youtube",
        videoUrl: newUrl,
        title: newTitle.trim(),
      });
      fetchShorts();
    } catch (err) {
      console.error("Failed to update treatment short", err);
      toast.error("Invalid URL format.");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Manage Treatment Shorts</h1>

      {/* Upload Section */}
      {canEdit && (
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

        <input
          type="text"
          placeholder="Enter text to show above the reel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={styles.input}
        />

        <button onClick={handleAddShort} className={styles.addBtn}>
          Add Short
        </button>
      </div>
      )}

      {/* Shorts List */}
      <div className={styles.grid}>
        {shorts.map((short) => (
          <div key={short._id} className={styles.card}>
            {short.title && <p className={styles.cardTitle}>{short.title}</p>}
            {short.platform === "youtube" ? (
              <iframe
                width="100%"
                height="250"
                src={getYouTubeEmbedUrl(short.videoUrl)}
                title="YouTube Shorts"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={short.videoUrl}
                data-instgrm-version="14"
                style={{
                  maxWidth: "320px",
                  minWidth: "240px",
                  margin: "auto",
                }}
              />
            )}

            <div className={styles.actions}>
              {canEdit && (
                <button
                  onClick={() => handleUpdate(short)}
                  className={styles.updateBtn}
                >
                  Update
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDelete(short._id)}
                  className={styles.deleteBtn}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TreatmentShorts;
