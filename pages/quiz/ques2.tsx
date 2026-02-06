import React, { useState } from "react";
import styles from "@/styles/quiz/ques2.module.css";
import { useRouter } from "next/router";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";

const otherConcerns = [
  {
    label: 'Acne / Pimples',
    description: 'Comedonal, blackheads or pus-filled pimples',
  },
  {
    label: 'Dark Spots / Marks',
    description: 'Flat spots, melanin buildup due to hormonal changes',
  },
  {
    label: 'Acne Scars',
    description: 'Pits or marks remaining after severe or prolonged acne',
  },
  {
    label: 'Pigmentation',
    description: 'Irregular dark patches on the skin',
  },
  {
    label: 'Dull Skin',
    description: 'Skin that lacks lustre, is flat, or even grey',
  },
];

const OtherConcerns = () => {
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const router = useRouter();

  const toggleConcern = (label: string) => {
    setSelectedConcerns(prev =>
      prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]
    );
  };

  const handleNext = () => {
    // Save state or call backend
    router.push('/quiz/ques3'); // Navigate to the next question
  };

  return (
    <>
    <Topbar/>
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.heading}>Do you have any other concerns?</div>
        <div className={styles.options}>
          {otherConcerns.map(({ label, description }) => (
            <label className={styles.option} key={label}>
              <input
                type="checkbox"
                checked={selectedConcerns.includes(label)}
                onChange={() => toggleConcern(label)}
              />
              <div>
                <div className={styles.label}>{label}</div>
                <div className={styles.description}>{description}</div>
              </div>
            </label>
          ))}
        </div>
        <button className={styles.button} onClick={handleNext}>Next</button>
        <div className={styles.skip}>I don’t have a concern</div>
      </div>
    </div>
    <Footer/>
    </>
  );
};
export default OtherConcerns;
