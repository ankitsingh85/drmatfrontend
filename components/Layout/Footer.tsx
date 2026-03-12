import React from "react";
import Link from "next/link";
import {
  FaApple,
  FaFacebookF,
  FaGoogle,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
} from "react-icons/fa";
import { IoLogoGooglePlaystore } from "react-icons/io5";
import styles from "@/styles/components/Layout/Footer.module.css";

const serviceLinks = [
  { label: "Book Appointment", href: "/home/findClinicsPage" },
  { label: "Video Consultation", href: "/video-consultation" },
  { label: "Treatment Plans", href: "/plans" },
  { label: "Buy Products", href: "/product-listing" },
];

const policyLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms & Conditions", href: "#" },
  { label: "Refund Policy", href: "#" },
  { label: "Shipping Policy", href: "#" },
];

const aboutLinks = [
  { label: "About Dr Dermat", href: "#" },
  { label: "Our Clinics", href: "/home/findClinicsPage" },
  { label: "Contact Us", href: "#" },
  { label: "Support", href: "#" },
];

const socialLinks = [
  { label: "Facebook", href: "#", icon: <FaFacebookF /> },
  { label: "Instagram", href: "#", icon: <FaInstagram /> },
  { label: "Twitter", href: "#", icon: <FaTwitter /> },
  { label: "Google", href: "#", icon: <FaGoogle /> },
  { label: "LinkedIn", href: "#", icon: <FaLinkedinIn /> },
];

const Footer = () => {
  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.brandColumn}>
            <img src="/logo.jpeg" alt="Dr. Dermat Logo" className={styles.logo} />
            <p className={styles.description}>
              Dr. Dermat is a holistic dermatology ecosystem that connects
              patients with trusted skin and hair clinics, while empowering
              clinics to launch standardized treatment plans and curated
              dermatology products. Built on medical expertise and innovation,
              we ensure transparency, quality, and consistent results. Our
              mission is to elevate dermatology care by seamlessly supporting
              patients, doctors, and clinics on one unified platform.
            </p>
          </div>

          <div className={styles.linksGrid}>
            <div className={styles.linkColumn}>
              <h3>Our Services</h3>
              <ul>
                {serviceLinks.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h3>Our Policies</h3>
              <ul>
                {policyLinks.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h3>Know About Us</h3>
              <ul>
                {aboutLinks.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`${styles.linkColumn} ${styles.socialColumn}`}>
              <h3>Connect With Us</h3>
              <div className={styles.socialLinks}>
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={styles.socialLink}
                    aria-label={item.label}
                    title={item.label}
                  >
                    {item.icon}
                  </a>
                ))}
              </div>

              <div className={`${styles.appPanel} ${styles.sideAppPanel}`}>
                <p className={styles.panelTitle}>Download the Dr Dermat App</p>
                <div className={styles.appButtons}>
                  <a href="#" className={styles.appButton} aria-label="Download on Android">
                    <IoLogoGooglePlaystore />
                  </a>
                  <a href="#" className={styles.appButton} aria-label="Download on iOS">
                    <FaApple />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <div className={styles.footerBottom}>
        <p>© 2026 Dr. Dermat. All rights reserved. Developed by LYB Technology.</p>
      </div>
    </>
  );
};

export default Footer;
