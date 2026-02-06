import React from 'react';
import styles from '@/styles/components/Layout/Reviews.module.css';

const ratingsSummary = {
  average: 4.8,
  total: 390,
  breakdown: {
    5: 333,
    4: 47,
    3: 3,
    2: 2,
    1: 2,
  },
};

const Ratings: React.FC = () => {
  return (
    <section className={styles.ratingOverview}>
      <div className={styles.ratingHeader}>
        <h3>Ratings & Reviews</h3>
        <button className={styles.writeReviewBtn}>Write a Review</button>
      </div>

      <div className={styles.averageRating}>
        <span className={styles.ratingValue}>{ratingsSummary.average.toFixed(1)}</span>
        <span className={styles.star}>★</span>
        <span className={styles.totalReviews}>Based on {ratingsSummary.total} reviews</span>
      </div>

      <div className={styles.ratingBars}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingsSummary.breakdown[star as keyof typeof ratingsSummary.breakdown];
          const percent = (count / ratingsSummary.total) * 100;

          return (
            <div key={star} className={styles.ratingRow}>
              <span className={styles.starLabel}>{star}</span>
              <div className={styles.barWrapper}>
                <div className={styles.barFill} style={{ width: `${percent}%` }} />
              </div>
              <span className={styles.reviewCount}>({count})</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Ratings;
