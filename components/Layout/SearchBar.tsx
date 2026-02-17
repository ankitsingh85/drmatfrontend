// components/SearchBar.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import styles from "@/styles/components/Layout/SearchBar.module.css";

const SearchBar = () => {
  const words = ["Clinic", "Tests", "Products"];
  const [placeholderText, setPlaceholderText] = useState("Search");
  const [query, setQuery] = useState("");
  const wordIndexRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const run = () => {
      if (wordIndexRef.current < words.length) {
        const nextText = `Search ${words[wordIndexRef.current]}`;
        setPlaceholderText(nextText);
        wordIndexRef.current += 1;
        timeoutRef.current = window.setTimeout(run, 1300);
        return;
      }

      // pause at full phrase, then restart
      timeoutRef.current = window.setTimeout(() => {
        wordIndexRef.current = 0;
        setPlaceholderText("");
        timeoutRef.current = window.setTimeout(run, 1300);
      }, 1000);
    };

    timeoutRef.current = window.setTimeout(run, 1300);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.searchContainer}>
      {/* Heading */}
      <h2 className={styles.heading}>
        Search Best Derma Clinic, Hair & Skin Treatment Plan, Derma Products
      </h2>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        {(() => {
          const parts = placeholderText.split(" ");
          const lastWord = parts[parts.length - 1] || "";
          const prefix = "Search ";
          return (
            <span
              className={`${styles.animatedPlaceholder} ${
                query ? styles.placeholderHidden : ""
              }`}
            >
              <span className={styles.placeholderPrefix}>{prefix}</span>
              <span key={lastWord} className={styles.placeholderWord}>
                {lastWord}
              </span>
            </span>
          );
        })()}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
        />

        <button className={styles.searchButton}>
          <Search size={20} />
        </button>

        
      </div>
    </div>
  );
};

export default SearchBar;
