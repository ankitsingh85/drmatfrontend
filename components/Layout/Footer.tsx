import React from "react";
import styles from "@/styles/components/Layout/Footer.module.css";

const Footer = () => {
  return (
    <>
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Left Section (1/3) */}
        <div className={styles.leftSection}>
          <img src="/logo.png" alt="Logo" className={styles.logo} />
          <p className={styles.description}>
            Lorem ipsum dolor sit amet, <br />
            consectetur adipiscing elit. <br />
            Nam a metus sed lacus elementum congue.
          </p>
        </div>

        {/* Right Section (2/3) */}
        <div className={styles.rightSection}>
          {/* 4 Columns */}
          {Array(4)
            .fill(null)
            .map((_, index) => (
              <div key={index} className={styles.linkColumn}>
                <h3>Important Links</h3>
                <ul>
                  {Array(7)
                    .fill("Link")
                    .map((link, i) => (
                      <li key={i}>
                        <a href="#">{link}</a>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
        </div>
      </div>
    </footer>
    <div className={styles.footerBottom}>
        <p style={{
          padding: "2rem 0"
           }}>© 2025 Dr. Dermat - All Rights Reserved | Terms & Condition | Privacy & Policy </p>
      </div>
    </>
  );
};

export default Footer;
