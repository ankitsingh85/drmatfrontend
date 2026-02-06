"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "@/styles/quiz/ques1.module.css";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import { API_URL } from "@/config/api";

interface Option {
  text: string;
  isCorrect: boolean;
}

interface Question {
  _id: string;
  category: "Hair" | "Skin";
  question: string;
  options: Option[];
  type: "single" | "multiple";
}

const categories: { key: "Hair" | "Skin"; label: string; img: string }[] = [
  { key: "Skin", label: "Skin", img: "/skin.png" },
  { key: "Hair", label: "Hair", img: "/hair.png" },
];

const UserQuiz: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<"Hair" | "Skin" | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number[]>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [slideClass, setSlideClass] = useState("");
  const [showCategory, setShowCategory] = useState(true);

  // const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

  // ✅ Fetch questions when category selected
  useEffect(() => {
    if (!activeCategory) return;
    fetchQuestions(activeCategory);
  }, [activeCategory]);

  const fetchQuestions = async (category: "Hair" | "Skin") => {
    try {
      const res = await axios.get<Question[]>(`${API_URL}/quiz/${category}`);
      setQuestions(res.data);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShowSummary(false);
    } catch (err) {
      console.error("Error loading quiz:", err);
    }
  };

  // ✅ Handle slide transition
  const triggerSlide = (direction: "left" | "right", callback: () => void) => {
    setSlideClass(direction === "left" ? styles["slide-left"] : styles["slide-right"]);
    setTimeout(() => {
      callback();
      setSlideClass("");
    }, 300);
  };

  // ✅ Select category
  const handleCategorySelect = (category: "Hair" | "Skin") => {
    triggerSlide("left", () => {
      setActiveCategory(category);
      setShowCategory(false);
    });
  };

  // ✅ Go back
  const handlePrev = () => {
    if (currentIndex > 0) {
      triggerSlide("right", () => setCurrentIndex((prev) => prev - 1));
    } else {
      triggerSlide("right", () => {
        setShowCategory(true);
        setActiveCategory(null);
      });
    }
  };

  // ✅ Next question
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      triggerSlide("left", () => setCurrentIndex((prev) => prev + 1));
    } else {
      setShowSummary(true);
    }
  };

  // ✅ Restart quiz
  const handleRestart = () => {
    setActiveCategory(null);
    setQuestions([]);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowSummary(false);
    setShowCategory(true);
    setSlideClass("");
  };

  // ✅ Select answer
  const handleOptionChange = (questionId: string, optionIndex: number, type: "single" | "multiple") => {
    setSelectedAnswers((prev) => {
      const prevSelected = prev[questionId] || [];
      if (type === "single") return { ...prev, [questionId]: [optionIndex] };

      // toggle for multiple
      if (prevSelected.includes(optionIndex)) {
        return { ...prev, [questionId]: prevSelected.filter((i) => i !== optionIndex) };
      } else {
        return { ...prev, [questionId]: [...prevSelected, optionIndex] };
      }
    });
  };

  // ✅ Category screen
  if (showCategory) {
    return (
      <>
        <Topbar />
        <div className={styles.pageWrapper}>
          <div className={`${styles.cardWrapper} ${slideClass}`}>
            <h2 className={styles.mainHeading}>Choose Your Concern</h2>
            <div className={styles.categoryGrid}>
              {categories.map((cat) => (
                <div key={cat.key} className={styles.categoryCard}>
                  <img src={cat.img} alt={cat.label} className={styles.categoryImg} />
                  <p className={styles.categoryLabel}>{cat.label}</p>
                  <button className={styles.ctaBtn} onClick={() => handleCategorySelect(cat.key)}>
                    Click Here
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (questions.length === 0) return <p>Loading questions...</p>;

  const currentQuestion = questions[currentIndex];
  const selected = selectedAnswers[currentQuestion._id] || [];

  return (
    <>
      <Topbar />
      <div className={styles.pageWrapper}>
        <div className={`${styles.cardWrapper} ${slideClass}`}>
          {!showSummary ? (
            <>
              <h2 className={styles.mainHeading}>
                Q{currentIndex + 1}. {currentQuestion.question}
              </h2>

              <div className={styles.optionList}>
                {currentQuestion.options.map((opt, i) => (
                  <label
                    key={i}
                    className={`${styles.optionRow} ${
                      selected.includes(i) ? styles.optionSelected : ""
                    }`}
                    onClick={() =>
                      handleOptionChange(currentQuestion._id, i, currentQuestion.type)
                    }
                  >
                    <input
                      type={currentQuestion.type === "single" ? "radio" : "checkbox"}
                      checked={selected.includes(i)}
                      readOnly
                    />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>

              <div className={styles.navButtons}>
                <button
                  className={`${styles.navBtn} ${currentIndex === 0 ? styles.disabledBtn : ""}`}
                  onClick={handlePrev}
                  disabled={currentIndex === 0 && !activeCategory}
                >
                  Previous
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button className={styles.navBtn} onClick={handleNext}>
                    Next
                  </button>
                ) : (
                  <button className={styles.navBtn} onClick={() => setShowSummary(true)}>
                    Finish
                  </button>
                )}
              </div>
            </>
          ) : (
            // ✅ Summary Section
            <div className={styles.summaryBox}>
              <h2 className={styles.mainHeading}>
                Quiz Summary ({activeCategory})
              </h2>

              {questions.map((q, idx) => {
                const userSelected = selectedAnswers[q._id] || [];
                return (
                  <div key={q._id} className={styles.summaryItem}>
                    <p className={styles.summaryQ}>
                      {idx + 1}. {q.question}
                    </p>
                    <ul>
                      {q.options.map((opt, i) => (
                        <li
                          key={i}
                          className={`${styles.summaryOption} ${
                            userSelected.includes(i) ? styles.optionSelected : ""
                          }`}
                        >
                          {opt.text}{" "}
                          {userSelected.includes(i) ? (
                            <strong>(Selected)</strong>
                          ) : (
                            ""
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              <button className={styles.ctaBtn} onClick={handleRestart}>
                Restart Quiz
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default UserQuiz;
