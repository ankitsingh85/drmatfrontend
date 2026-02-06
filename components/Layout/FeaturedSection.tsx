"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/components/Layout/FeaturedSection.module.css";
import { useRouter } from "next/router";
import MobileNavbar from "./MobileNavbar";

type ImageSliderItem = {
  url: string;
  heading: string;
};

type ImageSliderProps = {
  slides: ImageSliderItem[];
  loading: boolean;
};

const FeaturedSection = ({ slides, loading }: ImageSliderProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animate, setAnimate] = useState(false);
  const router = useRouter();

  const sliderRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const imagePaths = ["/home/findClinicsPage", "/#", "/#"];

  const handleImageClick = (index: number) => {
    router.push(imagePaths[index] || "/");
  };

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Enable animation when loaded
  useEffect(() => {
    if (!loading) setAnimate(true);
  }, [loading]);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 50) {
      if (distance > 0) {
        // swipe left
        setCurrentIndex((prev) =>
          prev === slides.length - 1 ? prev : prev + 1
        );
      } else {
        // swipe right
        setCurrentIndex((prev) => (prev === 0 ? prev : prev - 1));
      }
    }
  };

  return (
    <div className={styles.featuredSection}>
      <div
        className={`${styles.sliderWrapper} ${
          isMobile ? styles.mobileSliderWrapper : ""
        }`}
        ref={sliderRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ✅ Desktop View - 3 Static Images */}
        {!isMobile &&
          slides.map((slide, index) => {
            let animationClass = "";
            if (animate) {
              if (index === 0) animationClass = styles.leftImage;
              else if (index === 1) animationClass = styles.centerImage;
              else if (index === 2) animationClass = styles.rightImage;
            }

            return (
              <div
                key={index}
                className={`${styles.imageContainer} ${animationClass}`}
                onClick={() => handleImageClick(index)}
              >
                <img
                  src={slide.url}
                  alt={`Slide ${index}`}
                  className={styles.imageSliderImage}
                />
                <div className={styles.imageOverlay}>
                  <h3 className={styles.imageHeading}>{slide.heading}</h3>
                </div>
              </div>
            );
          })}

        {/* ✅ Mobile View - Peek Slider */}
        {isMobile && (
          <div
            className={styles.mobileSliderInner}
            style={{
              transform: `translateX(calc(-${currentIndex * 80}%))`,
            }}
          >
            {slides.map((slide, index) => (
              <div
                key={index}
                className={styles.mobileImageContainer}
                onClick={() => handleImageClick(index)}
              >
                <img
                  src={slide.url}
                  alt={`Slide ${index}`}
                  className={styles.mobileImage}
                />
                <div className={styles.imageOverlay}>
                  <h3 className={styles.imageHeading}>{slide.heading}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dots for Mobile */}
      {isMobile && (
        <div className={styles.dots}>
          {slides.map((_, index) => (
            <span
              key={index}
              className={`${styles.dot} ${
                index === currentIndex ? styles.activeDot : ""
              }`}
            />
          ))}
        </div>
      )}

      <MobileNavbar />
    </div>
  );
};

export default FeaturedSection;
