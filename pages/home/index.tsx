// pages/index.tsx
"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import styles from "@/styles/Home.module.css";
import SearchBar from "@/components/Layout/SearchBar";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import ProductCard from "@/components/Layout/ProductCard";
import ClinicCategories from "@/components/homePage/categories";
import OfferCard from "@/components/homePage/offerCard";
import FeaturedSection from "@/components/Layout/FeaturedSection";
import Offer from "./Offer";
import LatestOffer from "./LatestOffer";
import Offer3 from "./Offer3";
import Offer4 from "./Offer4";

import Treatment from "./Treatment";
import HappyStories from "./HappyStories";
import Link from "next/link";
import TopProducts from "@/components/TopProducts";
import ProductCategory from "@/components/homePage/productCategories";
import FullPageLoader from "@/components/common/FullPageLoader";

const Index = () => {
  const router = useRouter();

  // loader / prefetch state
  const [appReady, setAppReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Preparing...");

  useEffect(() => {
    let mounted = true;

    // const API_BASE =
    //   process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

    const endpoints = [
      "/api/clinic-categories",
      "/api/top-products",
      "/api/offers",
      "/api/latest-offers",
      "/api/categories",
      "/api/treatment-shorts",
      "/api/latest-shorts",
    ];

    const fetchWithTimeout = async (url: string, ms = 10000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), ms);
      try {
        const res = await fetch(url, { signal: controller.signal });
        return res;
      } finally {
        clearTimeout(id);
      }
    };

    (async () => {
      try {
        setMessage("Loading homepage data...");
        for (let i = 0; i < endpoints.length; i++) {
          if (!mounted) return;
          const ep = endpoints[i];
          setMessage(`Loading ${ep.replace("/api/", "")}...`);
          try {
            const res = await fetchWithTimeout(`${API_URL}${ep}`, 10_000);
            try {
              await res?.json();
            } catch {
              // ignore JSON parse errors
            }
          } catch (err) {
            console.warn(`Prefetch failed for ${ep}`, err);
          }
          setProgress(Math.round(((i + 1) / endpoints.length) * 100));
        }

        if (!mounted) return;
        setMessage("Finalizing...");
        await new Promise((r) => setTimeout(r, 200));
        setAppReady(true);
      } catch (err) {
        console.error("Prefetch error", err);
        if (!mounted) return;
        setMessage("Some data failed to load — opening page");
        setAppReady(true);
      }
    })();

    const safetyTimeout = setTimeout(() => {
      if (mounted && !appReady) {
        console.warn("Safety timeout reached, opening page anyway.");
        setMessage("Taking too long — opening the page");
        setAppReady(true);
      }
    }, 20_000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
    };
  }, []);

  return (
    <>
      {/* Loader overlay */}
      {!appReady && <FullPageLoader />}

      {/* Main page */}
      <Topbar />

      <div className={styles.blueBackground}>
        <SearchBar />
        <div style={{ position: "relative" }}>
          <FeaturedSection
            slides={[
              { url: "/card-1.png", heading: "Book A Clinic Appointment" },
              { url: "/card-2.png", heading: "Book A Video Consultation" },
              { url: "/card-3.png", heading: "Take Free Hair & Skin Test" },
            ]}
            loading={!appReady} // 👈 pass loader state
          />
        </div>
      </div>

      <div className={styles.bgcolor}>
        <ClinicCategories
          title="Find Top Derma Clinic"
          backgroundColor="white"
          textBg="#D9EBFD"
          border="2px solid #D9EBFD"
        />

<h2
          style={{
            textAlign: "center",
            margin: "20px",
            fontWeight: "700",
            fontSize: "26px",
          }}
        >
           Offer1
        </h2>
        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Offer3/>
        </div>


        <div
          style={{
            padding: "16px 0px",
            backgroundColor: "#ffffff",
            marginTop: "1rem",
          }}
        >
          <h1
            style={{
              textAlign: "center",
              marginBottom: "30px",
              fontWeight: "700",
              fontSize: "26px",
            }}
          >
            Top Products
          </h1>
          {<TopProducts />}
          <Link href="/product-listing">
            <h5
              style={{
                textAlign: "center",
                marginBottom: "40px",
                textDecoration: "underline",
              }}
            >
              Show More
            </h5>
          </Link>
          <div
            style={{
              padding: "0px 0px",
              backgroundColor: "#ffffff",
              marginTop: "0px",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                marginBottom: "20px",
                fontWeight: "700",
                fontSize: "26px",
              }}
            >
              Offer2
            </h2>
            <div
              style={{
                display: "flex",
                gap: "20px",
                justifyContent: "center",
                flexWrap: "nowrap",
              }}
            >
              <Offer></Offer>
            </div>
          </div>
        </div>

        <div style={{ padding: "0px 0 0px 0" }}>
          <ProductCategory
            title="Popular Product Categories"
            backgroundColor="#ffffff"
            textBg="white"
            border="7px solid white"
          />
        </div>

        <ClinicCategories
          title="Find The Best Treatment Plans"
          backgroundColor="white"
          textBg="#D9EBFD"
          border="2px solid #D9EBFD"
        />
      </div>

      <div
        style={{
          padding: "10px 0px",
          backgroundColor: "#ffffff",
          marginTop: "-40px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            margin: "20px",
            fontWeight: "700",
            fontSize: "26px",
          }}
        >
          Offer 3
        </h2>
        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <LatestOffer />
        </div>







      </div>






      <div
        style={{
          padding: "10px 20px",
          backgroundColor: "#ffffff",
          marginTop: "-40px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "14px",
            marginTop: "32px",
            fontWeight: "700",
            fontSize: "26px",
          }}
        >
          Treatment Procedure
        </h2>
        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Treatment />
        </div>
      </div>


<h2
          style={{
            textAlign: "center",
            margin: "20px",
            fontWeight: "700",
            fontSize: "26px",
          }}
        >
          Offer 4
        </h2>
        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Offer4/>
        </div>


      <div
        style={{
          padding: "10px 20px",
          backgroundColor: "#ffffff",
          marginTop: "-40px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "14px",
            marginTop: "32px",
            fontWeight: "700",
            fontSize: "26px",
          }}
        >
          Happy Stories
        </h2>
        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <HappyStories />
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Index;
