"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "@/styles/clinicdashboard/test.module.css";
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

const categories: ("Hair" | "Skin")[] = ["Hair", "Skin"];

// ✅ Configurable API URL for localhost and server
// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const Test: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeCategory, setActiveCategory] = useState<"Hair" | "Skin">("Hair");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [options, setOptions] = useState<Option[]>([{ text: "", isCorrect: false }]);
  const [questionType, setQuestionType] = useState<"single" | "multiple">("single");

  // unique radio group name for modal
  const modalRadioNameRef = useRef(`radio-${Date.now()}`);

  useEffect(() => {
    fetchQuestions();
  }, [activeCategory]);

  const fetchQuestions = async () => {
    try {
      const res = await axios.get<Question[]>(`${API_URL}/quiz/${activeCategory}`);
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    }
  };

  const openModal = (q?: Question) => {
    modalRadioNameRef.current = `radio-${Date.now()}`;
    if (q) {
      setEditId(q._id);
      setNewQuestion(q.question);
      setOptions(q.options);
      setQuestionType(q.type);
    } else {
      setEditId(null);
      setNewQuestion("");
      setOptions([{ text: "", isCorrect: false }]);
      setQuestionType("single");
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setNewQuestion("");
    setOptions([{ text: "", isCorrect: false }]);
    setQuestionType("single");
  };

  const saveQuestion = async () => {
    if (!newQuestion.trim()) return alert("Enter a question");
    if (options.some((o) => !o.text.trim())) return alert("Fill all options");

    const payload = { category: activeCategory, question: newQuestion, options, type: questionType };

    try {
      if (editId) {
        const res = await axios.put<Question>(`${API_URL}/quiz/${editId}`, payload);
        setQuestions((prev) => prev.map((q) => (q._id === editId ? res.data : q)));
      } else {
        const res = await axios.post<Question>(`${API_URL}/quiz`, payload);
        setQuestions((prev) => [...prev, res.data]);
      }
      closeModal();
    } catch (err) {
      console.error("Failed to save question:", err);
      alert("Failed to save question");
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await axios.delete(`${API_URL}/quiz/${id}`);
      setQuestions((prev) => prev.filter((q) => q._id !== id));
    } catch (err) {
      console.error("Failed to delete question:", err);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Quiz Management</h1>

      {/* Category Buttons */}
      <div className={styles.categoryButtons}>
        {categories.map((c) => (
          <button
            key={c}
            className={activeCategory === c ? styles.activeCategory : ""}
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <button className={styles.addBtn} onClick={() => openModal()}>
        Add Question
      </button>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{editId ? "Edit Question" : "Add Question"}</h2>

            {/* Question Type */}
            <div className={styles.questionType}>
              <label>
                <input
                  type="radio"
                  name="type"
                  checked={questionType === "single"}
                  onChange={() => setQuestionType("single")}
                />
                Single
              </label>
              <label>
                <input
                  type="radio"
                  name="type"
                  checked={questionType === "multiple"}
                  onChange={() => setQuestionType("multiple")}
                />
                Multiple
              </label>
            </div>

            {/* Question input */}
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Enter question"
              className={styles.input}
            />

            {/* Options */}
            <div className={styles.optionsBox}>
              {options.map((opt, idx) => (
                <div key={idx} className={styles.optionRow}>
                  {questionType === "single" ? (
                    <input
                      type="radio"
                      name={modalRadioNameRef.current}
                      checked={opt.isCorrect}
                      onChange={() =>
                        setOptions(options.map((o, i) => ({ ...o, isCorrect: i === idx })))
                      }
                    />
                  ) : (
                    <input
                      type="checkbox"
                      checked={opt.isCorrect}
                      onChange={(e) =>
                        setOptions(
                          options.map((o, i) =>
                            i === idx ? { ...o, isCorrect: e.target.checked } : o
                          )
                        )
                      }
                    />
                  )}
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) =>
                      setOptions(options.map((o, i) => (i === idx ? { ...o, text: e.target.value } : o)))
                    }
                    placeholder={`Option ${idx + 1}`}
                    className={styles.input}
                  />
                  <button
                    className={styles.deleteBtn}
                    onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                className={styles.addOptBtn}
                onClick={() => setOptions([...options, { text: "", isCorrect: false }])}
              >
                + Add Option
              </button>
            </div>

            {/* Actions */}
            <div className={styles.modalActions}>
              <button className={styles.saveBtn} onClick={saveQuestion}>
                Save
              </button>
              <button className={styles.cancelBtn} onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions list */}
      <div className={styles.questionsList}>
        {questions.map((q) => (
          <div key={q._id} className={styles.questionCard}>
            <h3>{q.question}</h3>
            <ul>
              {q.options.map((o, i) => (
                <li key={i} className={o.isCorrect ? styles.correctOpt : styles.option}>
                  {o.text}
                </li>
              ))}
            </ul>
            <div className={styles.questionActions}>
              <button className={styles.editBtn} onClick={() => openModal(q)}>
                Edit
              </button>
              <button className={styles.deleteBtn} onClick={() => deleteQuestion(q._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Test;
