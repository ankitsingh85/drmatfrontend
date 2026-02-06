import React from "react";
import styles from "@/styles/components/VideoConsult/VideoConsult.module.css";

interface VideoConsultProps {
  name: string;
  image: string;
  description: string;
  address: string;
}

const VideoConsultTemplate: React.FC<VideoConsultProps> = ({ name, image, description, address }) => {
  return (
    <div className={styles.container}>
      <h1>Book a Video Consultation</h1>
      <div className={styles.clinicDetails}>
        <img src={image} alt={name} className={styles.clinicImage} />
        <h2>{name}</h2>
        <p>{description}</p>
        <p>{address}</p>
      </div>
      <form className={styles.form}>
        <label className={styles.form_label}>
          Doctor's Name:
          <input type="text" placeholder="Enter doctor's name" />
        </label>
        <label className={styles.form_label}>
          Upload Reports:
          <input type="file" />
        </label>
        <label className={styles.form_label}>
          <input type="checkbox" /> I agree to the terms and conditions.
        </label>
        <button className={styles.button} type="submit">Book Appointment</button>
      </form>
    </div>
  );
};

export default VideoConsultTemplate;
