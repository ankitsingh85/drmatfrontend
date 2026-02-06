"use client";

import React from "react";
import styles from "@/styles/Loader.module.css";

const FullPageLoader: React.FC = () => {
  return (
     <div className={styles.blurOverlay}>
      <div className={styles.loaderContainer}>
        <div className={styles.spinner} />
      </div>
    </div>
    
  );
};

export default FullPageLoader;
