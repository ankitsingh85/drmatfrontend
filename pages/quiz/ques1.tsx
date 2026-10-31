"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import { useUser } from "@/context/UserContext";
import styles from "@/styles/quiz/ques1.module.css";
import {
  QUIZ_TESTS,
  type QuizCategoryKey,
  type QuizAnswerValue,
  type QuizProfile,
  type QuizTest,
} from "@/data/hairSkinQuizData";
import {
  FiArrowLeft,
  FiUploadCloud,
  FiCheckCircle,
  FiShoppingBag,
  FiRefreshCw,
  FiUserCheck,
  FiClipboard,
  FiDownload,
  FiLock,
} from "react-icons/fi";

const PENDING_QUIZ_KEY = "pendingQuizSubmission";

const describeAnswer = (
  question: QuizTest["questions"][number],
  value: QuizAnswerValue
): string => {
  if (question.isPhoto) {
    return value === "photo_uploaded" ? "Photo uploaded" : "Skipped (optional)";
  }
  if (typeof value !== "number") return "Not answered";
  const option = question.options[value];
  if (!option) return "Not answered";
  return option.desc ? `${option.label} (${option.desc})` : option.label;
};

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

interface PendingQuizSubmission {
  testKey: QuizCategoryKey;
  answers: QuizAnswerValue[];
  startedAt: string;
}

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
  // Strictly scoped to the test taken — a hair test only ever recommends
  // hair products, a skin test only ever recommends skin products, even if
  // that means showing fewer than 4 (or none) rather than falling back to
  // unrelated items.
  const inCategory = active.filter((product) => matchesCategory(product, key));

  return [...inCategory]
    .map((product) => ({ product, score: concernScore(product, profile.concerns) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.product);
};

export default function UserQuiz() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [screen, setScreen] = useState<Screen>("home");
  const [activeKey, setActiveKey] = useState<QuizCategoryKey | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswerValue[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [products, setProducts] = useState<RawProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [testStartedAt, setTestStartedAt] = useState<string>("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [savedReportUrl, setSavedReportUrl] = useState("");
  const [resumePending, setResumePending] = useState(false);
  const recommendedRef = useRef<HTMLDivElement | null>(null);

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
    setTestStartedAt(new Date().toISOString());
    setSubmitError("");
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

  // Submits a completed test to the backend, which computes the final
  // profile-derived report, generates the full PDF, and saves it to the
  // logged-in user's profile. Shared by the normal "finish quiz" path and
  // the "resume after login" path below.
  const submitQuizReport = async (
    key: QuizCategoryKey,
    submittedAnswers: QuizAnswerValue[],
    startedAtIso: string,
    userId: string
  ) => {
    const test = QUIZ_TESTS[key];
    const resultProfile = test.getProfile(submittedAnswers);
    const hasPhotoQuestion = test.questions.some((q) => q.isPhoto);
    const photoAnswer = submittedAnswers[test.questions.findIndex((q) => q.isPhoto)];
    const photoUploadStatus = !hasPhotoQuestion
      ? "Not applicable"
      : photoAnswer === "photo_uploaded"
      ? "Provided"
      : "Not provided";

    setSubmittingReport(true);
    setSubmitError("");
    try {
      const res = await axios.post(`${API_URL}/users/${userId}/quiz-reports`, {
        testType: key,
        startedAt: startedAtIso,
        completedAt: new Date().toISOString(),
        profileTitle: resultProfile.type,
        profileDescription: resultProfile.desc,
        mainConcerns: resultProfile.concerns,
        primaryNextStep: resultProfile.recs[0]
          ? `${resultProfile.recs[0].t} — ${resultProfile.recs[0].b}`
          : "",
        indicators: resultProfile.scores.map((score, index) => ({
          label: score.label,
          value: score.v,
          interpretation: resultProfile.indicatorInterpretations[index] || "",
        })),
        factors: resultProfile.factors,
        interpretation: resultProfile.interpretation,
        nextSteps: resultProfile.recs.map((rec) => ({ title: rec.t, description: rec.b })),
        routineTitle: resultProfile.routine.title,
        routineGuidance: resultProfile.routine.guidance,
        clinicianReview: resultProfile.clinicianReview,
        followUp: resultProfile.followUp,
        photoUploadStatus,
        questions: test.questions
          .filter((q) => !q.isPhoto)
          .map((q, index) => ({
            category: q.cat,
            text: q.text,
            selectedAnswer: describeAnswer(q, submittedAnswers[index]),
          })),
      });

      const latestReport = res.data?.quizReports?.[0];
      setSavedReportUrl(latestReport?.fileUrl || "");
      setActiveKey(key);
      setAnswers(submittedAnswers);
      setScreen("result");
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message || "Could not save your report. Please try again."
      );
    } finally {
      setSubmittingReport(false);
    }
  };

  const goNext = () => {
    if (!activeTest || !activeKey || !canContinue) return;
    if (currentIndex < activeTest.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      return;
    }

    if (userLoading) return;

    if (!user?._id) {
      const pending: PendingQuizSubmission = {
        testKey: activeKey,
        answers,
        startedAt: testStartedAt || new Date().toISOString(),
      };
      localStorage.setItem(PENDING_QUIZ_KEY, JSON.stringify(pending));
      router.push(`/Login?next=${encodeURIComponent("/quiz/ques1?resume=1")}`);
      return;
    }

    submitQuizReport(activeKey, answers, testStartedAt || new Date().toISOString(), user._id);
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
    setSavedReportUrl("");
    setSubmitError("");
  };

  // Auto-resume: if the quiz redirected to /Login (saving answers to
  // localStorage first) and the user has just logged in and landed back
  // here with ?resume=1, pick the submission back up automatically.
  useEffect(() => {
    if (resumePending) return;
    if (router.query.resume !== "1") return;
    if (userLoading || !user?._id) return;

    const raw = localStorage.getItem(PENDING_QUIZ_KEY);
    if (!raw) return;

    let pending: PendingQuizSubmission | null = null;
    try {
      pending = JSON.parse(raw);
    } catch {
      pending = null;
    }
    if (!pending) {
      localStorage.removeItem(PENDING_QUIZ_KEY);
      return;
    }

    setResumePending(true);
    localStorage.removeItem(PENDING_QUIZ_KEY);
    setTestStartedAt(pending.startedAt);
    router.replace("/quiz/ques1", undefined, { shallow: true });
    submitQuizReport(pending.testKey, pending.answers, pending.startedAt, user._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.resume, userLoading, user?._id, resumePending]);

  const scrollToRecommended = () => {
    recommendedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

            <p className={styles.trustLine}>Free to take • Log in to save your personalised report</p>
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

            {submitError && <p className={styles.photoSkipNote}>{submitError}</p>}

            <button
              type="button"
              className={styles.nextBtn}
              onClick={goNext}
              disabled={!canContinue || submittingReport}
            >
              {currentIndex < activeTest.questions.length - 1 ? (
                "Continue →"
              ) : submittingReport ? (
                "Saving your report..."
              ) : user?._id ? (
                "See My Results →"
              ) : (
                <>
                  <FiLock /> Log In &amp; See My Results
                </>
              )}
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
              {savedReportUrl ? (
                <>
                  <a
                    href={resolveMediaUrl(savedReportUrl) || savedReportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.downloadReportBtn}
                  >
                    <FiDownload /> Download PDF Report
                  </a>
                  <p className={styles.photoSkipNote}>
                    Saved to your profile —{" "}
                    <Link href="/UserDashboard?section=yourresult&tab=reports">
                      view it anytime under Your Result → Online Test Report
                    </Link>
                    .
                  </p>
                </>
              ) : null}
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

            <p className={styles.sectionTitle}>What Would You Like To Do Next?</p>
            <div className={styles.actionGrid}>
              <Link href="/video-consultation" className={styles.actionCard}>
                <FiUserCheck className={styles.actionIcon} />
                <span className={styles.actionLabel}>Book Dermatologist Consultation</span>
              </Link>
              <Link href="/TreatmentCategoryList" className={styles.actionCard}>
                <FiClipboard className={styles.actionIcon} />
                <span className={styles.actionLabel}>Explore Treatment Plan</span>
              </Link>
              <button
                type="button"
                className={styles.actionCard}
                onClick={scrollToRecommended}
              >
                <FiShoppingBag className={styles.actionIcon} />
                <span className={styles.actionLabel}>Explore Recommended Products</span>
              </button>
            </div>

            <div ref={recommendedRef}>
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
                No matching products right now for this test — check back soon as we add more.
              </p>
            )}
            </div>

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
