import React, { useState } from "react";
import QuizTemplate from "@/components/Quiz/QuizTemplate";

interface Question {
  image?: string[];
  question: string;
  options: string[];
  isMultiSelect?: boolean;
}

const questions: Question[] = [
  {
    question: "Choose your concern",
    options: ["Hair", "Skin"],
  },
  {
    question: "What skin concerns do you have?",
    options: ["Acne", "Pigmentation", "Wrinkles", "Redness"],
    isMultiSelect: true,
  },
  {
    question: "What are your skincare goals?",
    options: ["Hydration", "Anti-aging", "Brightening", "Soothing"],
    isMultiSelect: true,
  },
];

const DermatTest: React.FC = () => {
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<(string | string[])[]>([]);

  const handleNext = (answer: string | string[]) => {
    setAnswers([...answers, answer]);
    setPage((prev) => prev + 1);
  };

  return page < questions.length ? (
    <QuizTemplate
      questionNumber={page + 1}
      question={questions[page].question}
      options={questions[page].options}
      isMultiSelect={questions[page].isMultiSelect}
      onNext={handleNext}
    />
  ) : (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Thank you for completing the form!</h2>
      <pre>{JSON.stringify(answers, null, 2)}</pre>
    </div>
  );
};

export default DermatTest;
