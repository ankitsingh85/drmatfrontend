"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "@/styles/HappyStories.module.css";

interface Short {
  _id: string;
  platform: "youtube" | "instagram";
  videoUrl: string;
}

// ✅ Backend API base URL (local or deployed)
// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const HappyStories = () => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [current, setCurrent] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const playersRef = useRef<any[]>([]); // ✅ YouTube players

  // ✅ Fetch shorts from backend
  useEffect(() => {
    const fetchShorts = async () => {
      try {
        const res = await axios.get(`${API_URL}/latest-shorts`);
        setShorts(res.data || []);
      } catch (err) {
        console.error("Failed to fetch shorts", err);
      }
    };
    fetchShorts();
  }, []);

  // ✅ Initialize YouTube API players
  useEffect(() => {
    if (!shorts.length) return;

    const initPlayers = () => {
      shorts.forEach((short, i) => {
        if (short.platform === "youtube" && !playersRef.current[i]) {
          const videoId = extractVideoId(short.videoUrl);
          if (!videoId) return;

          playersRef.current[i] = new (window as any).YT.Player(
            `yt-player-happy-${i}`,
            {
              videoId,
              playerVars: { autoplay: 0, controls: 0, modestbranding: 1, rel: 0, mute: 1 },
              events: {
                onReady: (event: any) => {
                  if (isMuted) event.target.mute();
                },
              },
            }
          );
        }
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayers();
    } else {
      if (!document.getElementById("youtube-iframe-api")) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        tag.id = "youtube-iframe-api";
        document.body.appendChild(tag);
      }
      (window as any).onYouTubeIframeAPIReady = () => {
        initPlayers();
      };
    }
  }, [shorts, isMuted]);

  // ✅ Auto-scroll every 5 seconds
  useEffect(() => {
    if (!shorts.length) return;
    const interval = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % shorts.length;
        containerRef.current?.scrollTo({
          left: next * (containerRef.current?.offsetWidth ?? 0),
          behavior: "smooth",
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [shorts]);

  // ✅ Toggle mute
  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    playersRef.current.forEach((player) => {
      if (player) {
        isMuted ? player.unMute() : player.mute();
      }
    });
  };

  // ✅ Hover play/pause for YouTube
  const handleHover = (index: number, action: "enter" | "leave") => {
    playersRef.current.forEach((player, i) => {
      if (player && typeof player.playVideo === "function") {
        if (i === index) {
          action === "enter" ? player.playVideo() : player.pauseVideo();
        } else {
          player.pauseVideo();
        }
      }
    });
  };

  if (!shorts.length)
    return <p style={{ textAlign: "center" }}>No shorts available</p>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.slider} ref={containerRef}>
        {shorts.map((short, index) => (
          <div
            key={short._id}
            className={`${styles.card} ${
              index === current ? styles.active : styles.inactive
            }`}
          >
            <div
              className={styles.videoWrapper}
              onMouseEnter={() =>
                short.platform === "youtube" && handleHover(index, "enter")
              }
              onMouseLeave={() =>
                short.platform === "youtube" && handleHover(index, "leave")
              }
            >
              {short.platform === "youtube" ? (
                <div
                  id={`yt-player-happy-${index}`}
                  className={styles.youtubeIframe}
                />
              ) : (
                <iframe
                  src={
                    short.videoUrl.includes("embed")
                      ? short.videoUrl
                      : `${short.videoUrl}embed`
                  }
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className={styles.videoTag}
                  title={`insta-${index}`}
                />
              )}
              {short.platform === "youtube" && (
                <button className={styles.muteBtn} onClick={toggleMute}>
                  {isMuted ? "🔇" : "🔊"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.dots}>
        {shorts.map((_, i) => (
          <span
            key={i}
            className={`${styles.dot} ${i === current ? styles.activeDot : ""}`}
            onClick={() => {
              setCurrent(i);
              containerRef.current?.scrollTo({
                left: i * (containerRef.current?.offsetWidth ?? 0),
                behavior: "smooth",
              });
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ✅ Extract YouTube video ID
const extractVideoId = (url: string) => {
  const regex =
    /(?:youtube\.com\/shorts\/|youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : "";
};

export default HappyStories;
