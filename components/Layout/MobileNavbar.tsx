"use client";

import React, { useState } from "react";
import { FaHome, FaUserMd, FaUser } from "react-icons/fa";
import { MdFolder, MdOutlineAssignment, MdOutlineClose } from "react-icons/md";
import styles from "@/styles/mobileNavbar.module.css";
import { useRouter } from "next/router";

const MobileNavbar = () => {
  const [showDrawer, setShowDrawer] = useState(false);
  const router = useRouter();

  const toggleDrawer = () => {
    setShowDrawer(!showDrawer);
  };

  return (
    <>
      <div className={styles.navbar}>
        {/* Home */}
        <div className={styles.navItem} onClick={() => router.push("/home")}>
          <FaHome className={styles.icon} />
          <span>Home</span>
        </div>

        {/* Book Appointment */}
        <div
          className={styles.navItem}
          onClick={() => router.push("/home/findClinicsPage")}
        >
          <MdOutlineAssignment className={styles.icon} />
          <span>Book <br />Appointment</span>
        </div>

        {/* Your Result Drawer */}
        <div
          className={`${styles.navItem} ${styles.centerItem}`}
          onClick={toggleDrawer}
        >
          {showDrawer ? (
            <MdOutlineClose className={styles.icon} />
          ) : (
            <MdFolder className={styles.icon} />
          )}
          <span>{showDrawer ? "Close" : "Your Result"}</span>
        </div>

        {/* Treatment */}
        <div className={styles.navItem}>
          <FaUserMd className={styles.icon} />
          <span>Treatment</span>
        </div>

        {/* Profile */}
        <div
          className={styles.navItem}
          onClick={() => router.push("/UserDashboard")}
        >
          <FaUser className={styles.icon} />
          <span>Profile</span>
        </div>
      </div>

      {/* Drawer Content */}
      {showDrawer && (
        <div className={styles.drawer}>
          <div className={styles.drawerContent}>
            <h4>Your Links</h4>
            <div className={styles.linkGrid}>
              <a href="#">Your Orders</a>
              <a href="#">Online Consultations</a>
              <a href="#">Online Test Report</a>
              <a href="#">Your Gallery</a>
              <a href="#">Upload a Prescription</a>
              <a href="#">Recommended Products for you</a>
              <a href="#">Recommended Treatment Plans for you</a>
              <a href="#">Avail Special Offers & Discount</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavbar;
