import React from "react";
import styles from "@/styles/components/homePage/offerCard.module.css"; // Import CSS for styling


// Define Props Type
interface OfferCardProps {
  title: string;
  image: string;
}

// Functional Component
const OfferCard: React.FC<OfferCardProps> = ({ title, image }) => {
  return (
    <div className={styles.OfferCardContainer}>
    <div className={styles.offerCard}>
      <h2 className={styles.offerTitle}>{title}</h2>
      <img src={image} className={styles.offerImage} />
    </div>
    </div>
  );
};

export default OfferCard;