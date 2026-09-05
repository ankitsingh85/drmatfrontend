"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "@/styles/HappyStories.module.css";
import { API_URL } from "@/config/api";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { loadYouTubeIframeApi } from "@/lib/youtubeIframeApi";

interface Short {
  _id: string;
  platform: "youtube" | "instagram";
  videoUrl: string;
  title?: string; // 🔥 SAFE ADD (does not break backend)
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const TreatmentStories = () => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const playersRef = useRef<any[]>([]);

  const fetchShorts = async () => {
    try {
      const res = await axios.get(`${API_URL}/treatment-shorts`);
      setShorts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch treatment shorts", err);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  useEffect(() => {
    if (!shorts.length) return;
    loadYouTubeIframeApi(initYouTubePlayers);
  }, [shorts]);

  const initYouTubePlayers = () => {
    shorts.forEach((short, index) => {
      if (short.platform === "youtube" && !playersRef.current[index]) {
        const videoId = extractVideoId(short.videoUrl);
        if (!videoId) return;

        new (window as any).YT.Player(
          `yt-player-${index}`,
          {
            videoId,
            playerVars: {
              autoplay: 0,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              fs: 0,
              playsinline: 1,
              iv_load_policy: 3,
              disablekb: 1,
              loop: 1,
              playlist: videoId,
            },
            events: {
              onReady: (event: any) => {
                playersRef.current[index] = event.target;
                event.target.mute();
              },
              onStateChange: (event: any) => {
                if ((window as any).YT?.PlayerState?.ENDED === event.data) {
                  event.target.seekTo(0);
                  event.target.playVideo();
                }
              },
            },
          }
        );
      }
    });
  };

  const getPlayer = (index: number) => {
    const player = playersRef.current[index];
    if (!player || typeof player.playVideo !== "function") return null;
    return player;
  };

  const extractVideoId = extractYouTubeVideoId;

  // Instagram reels embed via Instagram's own oEmbed widget (an iframe on
  // Instagram's origin) — there's no direct play()/pause() access to that,
  // so hover play/pause only applies to YouTube, same as HappyStories.tsx.
  const handleMouseEnter = (index: number) => {
    setIsHovered(true);
    const short = shorts[index];
    if (short.platform === "youtube") getPlayer(index)?.playVideo();
  };

  const handleMouseLeave = (index: number) => {
    setIsHovered(false);
    const short = shorts[index];
    if (short.platform === "youtube") getPlayer(index)?.pauseVideo();
  };

  // Load Instagram's embed script whenever a reel is present, and re-run
  // Embeds.process() so newly added blockquotes actually render.
  useEffect(() => {
    if (!shorts.some((short) => short.platform === "instagram")) return;

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

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      playersRef.current.forEach((p) => {
        if (!p || typeof p.mute !== "function" || typeof p.unMute !== "function") return;
        if (next) p.mute();
        else p.unMute();
      });
      return next;
    });
  };

  /* ================= 🔥 ARROW SCROLL (ADDED) ================= */

  const scroll = (dir: "left" | "right") => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({
      left: dir === "left" ? -260 : 260,
      behavior: "smooth",
    });
  };

  if (!shorts.length)
    return <p style={{ textAlign: "center" }}>No treatment shorts available</p>;

  return (
    <div className={styles.wrapper}>
      <button className={`${styles.arrow} ${styles.left}`} onClick={() => scroll("left")}>
        ‹
      </button>

      <div className={styles.slider} ref={containerRef}>
        {shorts.map((short, index) => (
          <div
            key={short._id}
            className={styles.card}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={() => handleMouseLeave(index)}
          >
            {/* 🔥 CARD HEADING */}
            <p className={styles.cardTitle}>
              {short.title ||
                [
                  "HOW SOHAM'S CONSISTENCY LED HIM TO HAIR GROWTH 💯",
                  "Revanth's story of achieving hair growth 🧑‍🦱",
                  "HERE'S HOW I GOT MY HAIR VOLUME BACK",
                  "HOW I MANAGED HAIR FALL NATURALLY WITH TRAYA",
                  "STOPPED MY HAIRFALL WITH TRAYA 💯",
                ][index % 5]}
            </p>

            <div className={styles.videoWrapper}>
              {short.platform === "youtube" ? (
                <div className={styles.youtubeFrame}>
                  <div id={`yt-player-${index}`} />
                </div>
              ) : (
                <div className={styles.videoCrop}>
                  <blockquote
                    className="instagram-media"
                    data-instgrm-permalink={short.videoUrl}
                    data-instgrm-version="14"
                  />
                </div>
              )}

              <button className={styles.muteBtn} onClick={toggleMute}>
                {isMuted ? "🔇" : "🔊"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className={`${styles.arrow} ${styles.right}`} onClick={() => scroll("right")}>
        ›
      </button>
    </div>
  );
};

export default TreatmentStories;
