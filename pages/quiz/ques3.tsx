import React, { useState } from "react";
import styles from "@/styles/quiz/ques3.module.css";
import { useRouter } from "next/router";
import Footer from "@/components/Layout/Footer";
import Topbar from "@/components/Layout/Topbar";


const importantConcerns = [
  'Acne / Pimples',
  'Dark Spots / Marks',
  'Freckles',
  'Pigmentation',
  'Melasma',
  'Dry Skin',
  'Oily Skin',
  'Under Eye Dark Circles',
  'Wrinkles',
  'Fine Lines'
];

const ImportantConcern = () => {
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const router = useRouter();

  const handleSelect = (concern: string) => {
    setSelectedConcerns(prev =>
      prev.includes(concern) ? prev.filter(c => c !== concern) : [...prev, concern]
    );
  };

  const handleNext = () => {
    // Save to context or state and navigate
    router.push('/home');
  };

  return (
    <>
    <Topbar />
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.heading}>Choose your most important concern</div>
        <div className={styles.options}>
          {importantConcerns.map(concern => (
            <label className={styles.option} key={concern}>
              <input
                type="checkbox"
                checked={selectedConcerns.includes(concern)}
                onChange={() => handleSelect(concern)}
              />
              <span>{concern}</span>
            </label>
          ))}
        </div>
        <button className={styles.button} onClick={handleNext}>Next</button>
        <div className={styles.skip}>I don’t have a concern</div>
      </div>
    </div>
    <Footer />
    </>
  );
};
export default ImportantConcern;
