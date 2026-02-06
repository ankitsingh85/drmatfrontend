import React from "react";
import styles from "@/styles/components/Clinic/ClinicTemplate.module.css";

interface ClinicTemplateProps {
  clinicName: string;
  clinicDoctorName: string;
  clinicImage: string;
  address: string;
  additionalDetails: string;
  onSelect: () => void;
}

const ClinicTemplate: React.FC<ClinicTemplateProps> = ({
  clinicName,
  clinicDoctorName,
  clinicImage,
  address,
  additionalDetails,
  onSelect,
}) => {
  return (
    <div className={styles.card}>
      <img src={clinicImage} alt={`${clinicName} Image`} className={styles.image} />
      <div className={styles.info}>
        <h3>{clinicName}</h3>
        <p>{clinicDoctorName}</p>
        <p>{address}</p>
        <p className={styles.details}>{additionalDetails}</p>
        <button className={styles.detailsButton} onClick={onSelect}>
          See Details
        </button>
      </div>
    </div>
  );
};

export default ClinicTemplate;
