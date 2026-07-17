"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import styles from "@/styles/quiz/ques1.module.css";
import {
  QUIZ_TESTS,
  type QuizCategoryKey,
  type QuizAnswerValue,
  type QuizProfile,
} from "@/data/hairSkinQuizData";
import {
  FiArrowLeft,
  FiUploadCloud,
  FiCheckCircle,
  FiShoppingBag,
  FiRefreshCw,
} from "react-icons/fi";

interface RawProduct {
  _id: string;
  productName: string;
  category?: string[];
  skinHairType?: string;
  targetConcerns?: string;
  productImages?: string[];
  mrpPrice?: number;
  discountedPrice?: number;
  activeStatus?: boolean;
}

type Screen = "home" | "quiz" | "result";

const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* ================= PRODUCT MATCHING =================
   The Product model has no structured "hair vs skin" or "concern" tags,
   just free-text `skinHairType` / `targetConcerns` fields, so matching is
   done with keyword heuristics rather than exact lookups.
*/
const CATEGORY_KEYWORDS: Record<QuizCategoryKey, string[]> = {
  hair: ["hair", "scalp"],
  skin: ["skin", "face", "facial"],
};

const matchesCategory = (product: RawProduct, key: QuizCategoryKey) => {
  const haystack = [product.skinHairType, ...(product.category || []), product.productName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return CATEGORY_KEYWORDS[key].some((keyword) => haystack.includes(keyword));
};

const concernScore = (product: RawProduct, concerns: string[]) => {
  const haystack = [product.targetConcerns, product.productName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const keywords = concerns
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);

  let score = 0;
  for (const keyword of keywords) {
    if (haystack.includes(keyword)) score += 1;
  }
  return score;
};

const rankProductsForProfile = (
  products: RawProduct[],
  key: QuizCategoryKey,
  profile: QuizProfile
) => {
  const active = products.filter((product) => product.activeStatus !== false);
  const inCategory = active.filter((product) => matchesCategory(product, key));
  const pool = inCategory.length > 0 ? inCategory : active;

  return [...pool]
    .map((product) => ({ product, score: concernScore(product, profile.concerns) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.product);
};

export default function UserQuiz() {
  const [screen, setScreen] = useState<Screen>("home");
  const [activeKey, setActiveKey] = useState<QuizCategoryKey | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswerValue[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [products, setProducts] = useState<RawProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [barsAnimated, setBarsAnimated] = useState(false);

  const activeTest = activeKey ? QUIZ_TESTS[activeKey] : null;
  const currentQuestion = activeTest?.questions[currentIndex];
  const isPhotoStep = Boolean(currentQuestion?.isPhoto);
  const selectedOption =
    typeof answers[currentIndex] === "number" ? (answers[currentIndex] as number) : null;

  const profile = useMemo(() => {
    if (screen !== "result" || !activeTest) return null;
    return activeTest.getProfile(answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, activeTest]);

  useEffect(() => {
    if (screen !== "result") {
      setBarsAnimated(false);
      return;
    }
    const timer = setTimeout(() => setBarsAnimated(true), 300);
    return () => clearTimeout(timer);
  }, [screen, profile]);

  useEffect(() => {
    if (screen !== "result") return;
    let cancelled = false;
    setLoadingProducts(true);
    axios
      .get<RawProduct[]>(`${API_URL}/products`)
      .then((res) => {
        if (!cancelled) setProducts(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [screen]);

  const recommendedProducts = useMemo(() => {
    if (!activeKey || !profile) return [];
    return rankProductsForProfile(products, activeKey, profile);
  }, [products, activeKey, profile]);

  const startTest = (key: QuizCategoryKey) => {
    setActiveKey(key);
    setCurrentIndex(0);
    setAnswers([]);
    setPhotoPreview(null);
    setScreen("quiz");
  };

  const selectOption = (optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = optionIndex;
      return next;
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setPhotoPreview(result);
        setAnswers((prev) => {
          const next = [...prev];
          next[currentIndex] = "photo_uploaded";
          return next;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const canContinue = isPhotoStep || selectedOption !== null;

  const goNext = () => {
    if (!activeTest || !canContinue) return;
    if (currentIndex < activeTest.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setScreen("result");
    }
  };

  const goBack = () => {
    if (currentIndex === 0) {
      setScreen("home");
      setActiveKey(null);
    } else {
      setCurrentIndex((i) => i - 1);
    }
  };

  const restart = () => {
    setScreen("home");
    setActiveKey(null);
    setCurrentIndex(0);
    setAnswers([]);
    setPhotoPreview(null);
    setProducts([]);
  };

  // Keyboard support: Enter advances the quiz, matching the original tool.
  useEffect(() => {
    if (screen !== "quiz") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && canContinue) goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, canContinue, currentIndex, activeTest]);

  const progressPercent = activeTest
    ? Math.max(8, Math.round((currentIndex / activeTest.questions.length) * 100))
    : 0;

  /* ================= HOME ================= */
  if (screen === "home") {
    return (
      <>
        <Topbar />
        <div className={styles.page}>
          <div className={styles.homeWrap}>
            <p className={styles.eyebrow}>Dr Dermat • Diagnose</p>
            <h1 className={styles.heroTitle}>Understand your hair &amp; skin from within</h1>
            <p className={styles.heroSub}>
              Takes 4 minutes. Get a personalised, dermatology-backed care plan with root
              cause insights.
            </p>

            <div className={styles.testCards}>
              {Object.values(QUIZ_TESTS).map((test) => (
                <button
                  key={test.key}
                  type="button"
                  className={styles.testCard}
                  onClick={() => startTest(test.key)}
                >
                  <span className={styles.cardIcon}>{test.emoji}</span>
                  <h3 className={styles.testCardTitle}>{test.title}</h3>
                  <p className={styles.testCardDesc}>{test.tagline}</p>
                  <span className={styles.cardCta}>Start Test →</span>
                </button>
              ))}
            </div>

            <p className={styles.trustLine}>No account required • Trusted by thousands</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  /* ================= QUIZ ================= */
  if (screen === "quiz" && activeTest && currentQuestion) {
    return (
      <>
        <Topbar />
        <div className={styles.page}>
          <div className={styles.quizWrap}>
            <div className={styles.quizHeader}>
              <button type="button" className={styles.backBtn} onClick={goBack}>
                <FiArrowLeft /> Back
              </button>
              <div className={styles.progressWrap}>
                <p className={styles.progressLabel}>
                  Question {currentIndex + 1} of {activeTest.questions.length}
                </p>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <p className={styles.qCategory}>{currentQuestion.cat}</p>
            <h2 className={styles.qText}>{currentQuestion.text}</h2>
            {currentQuestion.hint && <p className={styles.qHint}>{currentQuestion.hint}</p>}

            {isPhotoStep ? (
              <div className={styles.photoStep}>
                <label className={styles.photoUpload}>
                  <FiUploadCloud className={styles.photoUploadIcon} />
                  <span>{photoPreview ? "Change photo" : "Tap to upload photo"}</span>
                  <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                </label>
                {photoPreview && (
                  <div className={styles.photoPreview}>
                    <img src={photoPreview} alt="Uploaded preview" />
                  </div>
                )}
                <p className={styles.photoSkipNote}>
                  This step is optional — you can continue without uploading.
                </p>
              </div>
            ) : (
              <div className={styles.optionsGrid}>
                {currentQuestion.options.map((option, i) => (
                  <button
                    key={option.label}
                    type="button"
                    className={cx(
                      styles.optionBtn,
                      selectedOption === i && styles.optionSelected
                    )}
                    onClick={() => selectOption(i)}
                  >
                    <span className={styles.optionIcon}>{option.icon}</span>
                    <span className={styles.optionCopy}>
                      <span className={styles.optionLabel}>{option.label}</span>
                      {option.desc && (
                        <span className={styles.optionDesc}>{option.desc}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              className={styles.nextBtn}
              onClick={goNext}
              disabled={!canContinue}
            >
              {currentIndex < activeTest.questions.length - 1
                ? "Continue →"
                : "See My Results →"}
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  /* ================= RESULT ================= */
  if (screen === "result" && activeTest && profile) {
    return (
      <>
        <Topbar />
        <div className={styles.page}>
          <div className={styles.resultWrap}>
            <div className={styles.resultHero}>
              <p className={styles.resultBadge}>
                <FiCheckCircle /> Assessment Complete
              </p>
              <p className={styles.resultType}>{profile.type}</p>
              <p className={styles.resultDesc}>{profile.desc}</p>
            </div>

            <p className={styles.sectionTitle}>Your Main Concerns</p>
            <div className={styles.concernTags}>
              {profile.concerns.map((concern) => (
                <span key={concern} className={styles.concernTag}>
                  {concern}
                </span>
              ))}
            </div>

            <p className={styles.sectionTitle}>Severity Breakdown</p>
            <div className={styles.scoreBars}>
              {profile.scores.map((score) => (
                <div key={score.label} className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>{score.label}</span>
                  <div className={styles.scoreTrack}>
                    <div
                      className={styles.scoreFill}
                      style={{ width: barsAnimated ? `${score.v}%` : "0%" }}
                    />
                  </div>
                  <span className={styles.scoreVal}>{score.v}%</span>
                </div>
              ))}
            </div>

            <p className={styles.sectionTitle}>Recommended Next Steps</p>
            <div className={styles.recs}>
              {profile.recs.map((rec, i) => (
                <div key={rec.t} className={styles.recCard}>
                  <span className={styles.recNum}>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className={styles.recTitle}>{rec.t}</p>
                    <p className={styles.recBody}>{rec.b}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className={styles.sectionTitle}>
              <FiShoppingBag /> Recommended For You
            </p>
            {loadingProducts ? (
              <p className={styles.productsHint}>Finding products that match your results...</p>
            ) : recommendedProducts.length > 0 ? (
              <div className={styles.productsGrid}>
                {recommendedProducts.map((product) => {
                  const image = resolveMediaUrl(product.productImages?.[0]) || "/product1.png";
                  const price = product.discountedPrice ?? product.mrpPrice;
                  const showStrike =
                    typeof product.mrpPrice === "number" &&
                    typeof product.discountedPrice === "number" &&
                    product.mrpPrice > product.discountedPrice;

                  return (
                    <Link
                      key={product._id}
                      href={`/product/${slugify(product.productName || product._id)}`}
                      className={styles.productCard}
                    >
                      <div className={styles.productImageWrap}>
                        <img src={image} alt={product.productName} />
                      </div>
                      <p className={styles.productName}>{product.productName}</p>
                      <div className={styles.productPriceRow}>
                        {typeof price === "number" && (
                          <span className={styles.productPrice}>₹{price}</span>
                        )}
                        {showStrike && (
                          <span className={styles.productMrp}>₹{product.mrpPrice}</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className={styles.productsHint}>
                No matching products right now — check back soon.
              </p>
            )}

            <div className={styles.ctaRow}>
              <Link href="/product-listing" className={styles.ctaPrimary}>
                <FiShoppingBag /> Browse Full Shop
              </Link>
              <button type="button" className={styles.ctaSecondary} onClick={restart}>
                <FiRefreshCw /> Retake Test
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return null;
}
