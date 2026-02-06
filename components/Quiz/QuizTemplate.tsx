import React, { useState } from "react";
import styles from "@/styles/components/Quiz/QuizTemplate.module.css";

interface QuizTemplateProps {
  questionNumber: number;
  question: string;
  options: string[];
  isMultiSelect?: boolean;
  onNext: (selected: string[] | string) => void;
}

const QuizTemplate: React.FC<QuizTemplateProps> = ({
  questionNumber,
  question,
  options,
  isMultiSelect = false,
  onNext,
}) => {
  const [selected, setSelected] = useState<number | number[] | null>(
    isMultiSelect ? [] : null
  );

  const toggleOption = (index: number) => {
    if (isMultiSelect) {
      const selectedArray = selected as number[];
      setSelected(
        selectedArray.includes(index)
          ? selectedArray.filter((i) => i !== index)
          : [...selectedArray, index]
      );
    } else {
      setSelected(index);
    }
  };

  const handleNext = () => {
    if (isMultiSelect) {
      const selectedArray = selected as number[];
      onNext(selectedArray.map((i) => options[i]));
    } else if (selected !== null) {
      onNext(options[selected as number]);
    }
  };

  const isSelected = (index: number) => {
    return isMultiSelect
      ? (selected as number[]).includes(index)
      : selected === index;
  };

  return (
    <div className={styles.quizContainer}>
      <div className={styles.form}>
        <div className={styles.mainHeadding}>
          
        </div>
        <div className={styles.question}>
          <h2>
            Question {questionNumber}:
            <br />
            {question}
          </h2>
        </div>
        <div className={styles.optionsContainer}>
          {options.map((option, index) => (
            <label
              key={index}
              className={`${styles.option} ${
                isSelected(index) ? styles.selectedOption : ""
              }`}
            >
              <input
                type={isMultiSelect ? "checkbox" : "radio"}
                name={`option-${questionNumber}`}
                value={option}
                checked={isSelected(index)}
                onChange={() => toggleOption(index)}
                className={styles.radioInput}
              />
              {option}
            </label>
          ))}
        </div>
        <button
          onClick={handleNext}
          disabled={isMultiSelect ? 
            (selected as number[]).length === 0 : 
            selected === null}
          className={styles.nextButton}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default QuizTemplate;
