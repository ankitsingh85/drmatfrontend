import React from "react";
import styles from "@/styles/components/Layout/Footer.module.css";

const Footer = () => {
  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.container}>
          {/* Left Section (1/3) */}
          <div className={styles.leftSection}>
            <img src="/logo.jpeg" alt="Dr. Dermat Logo" className={styles.logo} />
            <p className={styles.description}>
              Welcome to Dr. Dermat, your premier destination for advanced dermatological care. <br />
              We specialize in personalized skin treatments, expert consultations, and cutting-edge solutions <br />
              to help you achieve healthy, radiant skin.
            </p>
          </div>

          {/* Right Section (2/3) */}
          <div className={styles.rightSection}>
            {/* Column 1: About */}
            <div className={styles.linkColumn}>
              <h3>About Us</h3>
              <ul>
                <li><a href="#">Our Story</a></li>
                <li><a href="#">Our Team</a></li>
                <li><a href="#">Testimonials</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">News</a></li>
                <li><a href="#">Events</a></li>
                <li><a href="#">Gallery</a></li>
              </ul>
            </div>

            {/* Column 2: Services */}
            <div className={styles.linkColumn}>
              <h3>Services</h3>
              <ul>
                <li><a href="#">Skin Consultations</a></li>
                <li><a href="#">Acne Treatment</a></li>
                <li><a href="#">Anti-Aging</a></li>
                <li><a href="#">Laser Therapy</a></li>
                <li><a href="#">Dermatology Surgery</a></li>
                <li><a href="#">Cosmetic Procedures</a></li>
                <li><a href="#">Skin Care Products</a></li>
              </ul>
            </div>

            {/* Column 3: Support */}
            <div className={styles.linkColumn}>
              <h3>Support</h3>
              <ul>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">Locations</a></li>
                <li><a href="#">Book Appointment</a></li>
                <li><a href="#">Patient Portal</a></li>
                <li><a href="#">Insurance</a></li>
                <li><a href="#">FAQs</a></li>
                <li><a href="#">Help Center</a></li>
              </ul>
            </div>

            {/* Column 4: Resources */}
            <div className={styles.linkColumn}>
              <h3>Resources</h3>
              <ul>
                <li><a href="#">Skin Care Tips</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Educational Videos</a></li>
                <li><a href="#">Research</a></li>
                <li><a href="#">Community</a></li>
                <li><a href="#">Newsletter</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
      <div className={styles.footerBottom}>
        <p style={{
          padding: "2rem 0"
        }}>
          © 2026 Dr. Dermat - All Rights Reserved | Terms & Condition | Privacy & Policy | Developed by LYB Technology
        </p>
      </div>
    </>
  );
};

export default Footer;
