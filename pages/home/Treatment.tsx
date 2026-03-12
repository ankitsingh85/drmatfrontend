"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "@/styles/HappyStories.module.css";
import { API_URL } from "@/config/api";

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
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const playersRef = useRef<any[]>([]);
  const ytReadyRef = useRef<boolean>(false);

  /* ================= EXISTING CODE (UNCHANGED) ================= */

  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    } else {
      ytReadyRef.current = true;
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      ytReadyRef.current = true;
      initYouTubePlayers();
    };
  }, []);

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
    if (shorts.length && ytReadyRef.current) {
      initYouTubePlayers();
    }
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

  const extractVideoId = (url: string) => {
    const regex =
      /(?:youtube\.com\/shorts\/|youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : "";
  };

  const handleMouseEnter = (index: number) => {
    setIsHovered(true);
    const short = shorts[index];

    if (short.platform === "instagram") {
      videoRefs.current[index]?.play();
    } else {
      getPlayer(index)?.playVideo();
    }
  };

  const handleMouseLeave = (index: number) => {
    setIsHovered(false);
    const short = shorts[index];

    if (short.platform === "instagram") {
      const v = videoRefs.current[index];
      if (v) {
        v.pause();
        v.currentTime = 0;
      }
    } else {
      getPlayer(index)?.pauseVideo();
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      videoRefs.current.forEach((v) => v && (v.muted = next));
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
                  <video
                    ref={(el) => { videoRefs.current[index] = el; }}
                    src={short.videoUrl}
                    muted={isMuted}
                    playsInline
                    loop
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
