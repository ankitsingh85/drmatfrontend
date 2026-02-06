// components/SearchBar.tsx
"use client";

import React from "react";
import { Search } from "lucide-react";
import styles from "@/styles/components/Layout/SearchBar.module.css";

const SearchBar = () => {
  return (
    <div className={styles.searchContainer}>
      {/* Heading */}
      <h2 className={styles.heading}>
        Search Best Derma Clinic, Hair & Skin Treatment Plan, Derma Products
      </h2>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search tests or full body checkups"
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
