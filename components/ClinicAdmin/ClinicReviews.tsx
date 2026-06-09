"use client";

import { API_URL } from "@/config/api";
import { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import styles from "@/styles/clinicReviews.module.css";

interface Review {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  reply: string;
}

export default function ClinicReviews({ clinicId }: { clinicId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);

  const [reply, setReply] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const res = await fetch(`${API_URL}/clinic-reviews/${clinicId}`);

    const data = await res.json();

    setReviews(data);
  };

  const submitReply = async (id: string) => {
    await fetch(`${API_URL}/clinic-reviews/reply/${id}`, {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        reply: reply[id],
      }),
    });

    setReply({
      ...reply,
      [id]: "",
    });

    fetchReviews();
  };

  return (
    <div className={styles.wrapper}>
      <h2>Patient Reviews</h2>

      {reviews.length === 0 ? (
        <p>No reviews yet</p>
      ) : (
        reviews.map((item) => (
          <div className={styles.card} key={item._id}>
            <h3>{item.name}</h3>

            <div>
              {[1, 2, 3, 4, 5].map((s) => (
                <FaStar
                  key={s}
                  className={s <= item.rating ? styles.gold : styles.gray}
                />
              ))}
            </div>

            <p>{item.comment}</p>

            {item.reply && (
              <div className={styles.replyBox}>
                <strong>Your Reply</strong>

                <p>{item.reply}</p>
              </div>
            )}

            <textarea
              placeholder="Write reply..."
              value={reply[item._id] || ""}
              onChange={(e) =>
                setReply({
                  ...reply,

                  [item._id]: e.target.value,
                })
              }
            />

            <button onClick={() => submitReply(item._id)}>Reply</button>
          </div>
        ))
      )}
    </div>
  );
}
