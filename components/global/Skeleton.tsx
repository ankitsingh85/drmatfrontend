import React from "react";
import styles from "@/styles/Skeleton.module.css";

const Skeleton = ({ height = 20, width = "100%", radius = 8 }) => {
  return (
    <div
      className={styles.skeleton}
      style={{ height, width, borderRadius: radius }}
    ></div>
  );
};

export default Skeleton;
