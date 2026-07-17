export type QuizCategoryKey = "hair" | "skin";

export interface QuizOption {
  icon: string;
  label: string;
  desc?: string;
  val: number;
}

export interface QuizQuestion {
  cat: string;
  text: string;
  hint?: string;
  options: QuizOption[];
  isPhoto?: boolean;
}

export interface ProfileScore {
  label: string;
  v: number;
}

export interface ProfileRec {
  t: string;
  b: string;
}

export interface QuizProfile {
  type: string;
  desc: string;
  concerns: string[];
  scores: ProfileScore[];
  recs: ProfileRec[];
}

export type QuizAnswerValue = number | "photo_uploaded" | undefined;

export interface QuizTest {
  key: QuizCategoryKey;
  title: string;
  tagline: string;
  emoji: string;
  questions: QuizQuestion[];
  getProfile: (answers: QuizAnswerValue[]) => QuizProfile;
}

/* =================== HAIR =================== */

const hairQuestions: QuizQuestion[] = [
  {
    cat: "Hair Loss",
    text: "How many strands do you lose daily on average?",
    hint: "Check your pillow, comb, or shower drain",
    options: [
      { icon: "😊", label: "Less than 50", desc: "Normal", val: 1 },
      { icon: "😐", label: "50–100", desc: "Mild", val: 2 },
      { icon: "🙁", label: "100–200", desc: "Moderate", val: 3 },
      { icon: "😟", label: "200+ or clumps", desc: "Severe", val: 4 },
    ],
  },
  {
    cat: "Scalp Health",
    text: "How does your scalp feel most of the time?",
    options: [
      { icon: "🧴", label: "Oily / Greasy quickly", val: 3 },
      { icon: "❄️", label: "Dry, flaky or dandruff", val: 3 },
      { icon: "⚖️", label: "Balanced and comfortable", val: 1 },
      { icon: "🔥", label: "Itchy, red or sensitive", val: 4 },
    ],
  },
  {
    cat: "Hair Density",
    text: "Have you noticed thinning or reduced volume?",
    hint: "Compare with old photos",
    options: [
      { icon: "👍", label: "No noticeable change", val: 1 },
      { icon: "📉", label: "Mild thinning", val: 2 },
      { icon: "📉📉", label: "Moderate thinning (visible scalp)", val: 3 },
      { icon: "📉📉📉", label: "Significant thinning / bald patches", val: 4 },
    ],
  },
  {
    cat: "Stress",
    text: "How high is your stress level on most days?",
    hint: "Work, family, sleep",
    options: [
      { icon: "🌿", label: "Low", val: 1 },
      { icon: "🌊", label: "Moderate", val: 2 },
      { icon: "⛰️", label: "High", val: 3 },
      { icon: "🌋", label: "Very high / chronic", val: 4 },
    ],
  },
  {
    cat: "Diet",
    text: "How would you describe your diet in the last 3 months?",
    options: [
      { icon: "🥗", label: "Balanced & nutritious", val: 1 },
      { icon: "🥬", label: "Vegetarian / Vegan", val: 2 },
      { icon: "🍔", label: "High in junk / processed food", val: 4 },
      { icon: "⏰", label: "Irregular meals", val: 3 },
    ],
  },
  {
    cat: "Duration",
    text: "How long have you faced this hair concern?",
    options: [
      { icon: "📅", label: "Less than 1 month", val: 1 },
      { icon: "📆", label: "1 to 6 months", val: 2 },
      { icon: "📅📅", label: "6 to 12 months", val: 3 },
      { icon: "📅📅📅", label: "More than 1 year", val: 4 },
    ],
  },
  {
    cat: "Hormones",
    text: "Do you have any known hormonal conditions?",
    hint: "PCOS, thyroid, postpartum etc.",
    options: [
      { icon: "✅", label: "None", val: 1 },
      { icon: "⚠️", label: "Suspected", val: 3 },
      { icon: "🩺", label: "Diagnosed", val: 4 },
    ],
  },
  {
    cat: "Family",
    text: "Family history of hair loss?",
    hint: "Parents or siblings",
    options: [
      { icon: "🧬", label: "No", val: 1 },
      { icon: "🧬", label: "One side", val: 3 },
      { icon: "🧬🧬", label: "Both sides", val: 4 },
    ],
  },
  {
    cat: "Treatments",
    text: "Have you tried hair treatments before?",
    options: [
      { icon: "❌", label: "None yet", val: 1 },
      { icon: "🧴", label: "Shampoos / Oils", val: 2 },
      { icon: "💊", label: "Medicines / Supplements", val: 3 },
      { icon: "🔄", label: "Multiple with limited success", val: 4 },
    ],
  },
  {
    cat: "Sleep",
    text: "How many hours of quality sleep do you get?",
    options: [
      { icon: "🌙", label: "7–9 hours", val: 1 },
      { icon: "⏰", label: "5–6 hours", val: 3 },
      { icon: "😴", label: "Less than 5 hours", val: 4 },
    ],
  },
  {
    cat: "Age",
    text: "What is your age group?",
    options: [
      { icon: "🧒", label: "Under 25", val: 1 },
      { icon: "🧑", label: "25–35", val: 2 },
      { icon: "🧓", label: "36–45", val: 3 },
      { icon: "👴", label: "46+", val: 4 },
    ],
  },
  {
    cat: "Photo",
    text: "Upload a clear photo of your scalp/hairline (optional)",
    hint: "Helps for better analysis",
    options: [],
    isPhoto: true,
  },
];

// Faithful port of the original scoring formula: it deliberately uses the
// *selected option index* (0-3) for a handful of questions, not the
// option's `val`. Some questions (Scalp Health, Family, Treatments,
// Sleep, Age, Photo) intentionally don't factor into the severity score.
// The profile (including its score breakdown) is built fresh on every
// call — never mutate a shared/module-level profile object here.
const calculateHairProfile = (answers: QuizAnswerValue[]): QuizProfile => {
  const num = (value: QuizAnswerValue) => (typeof value === "number" ? value : 0);
  const fall = num(answers[0]) || 1;
  const density = num(answers[2]) || 1;
  const stress = num(answers[3]) || 1;
  const diet = num(answers[4]) || 1;
  const duration = num(answers[5]) || 1;
  const hormones = num(answers[6]) || 1;

  const severity = Math.min(
    100,
    Math.round(
      fall * 22 + density * 22 + stress * 15 + diet * 15 + duration * 13 + hormones * 13
    )
  );

  let idx = 0;
  if (severity >= 72) idx = 2;
  else if (severity >= 45) idx = 1;

  const profiles: QuizProfile[] = [
    {
      type: "Mild Hair Shedding",
      desc: "Your hair is mostly healthy with minor stress or nutritional factors. Simple changes can restore full strength.",
      concerns: ["Mild shedding", "Scalp imbalance"],
      scores: [
        { label: "Hair Fall", v: Math.round(severity * 0.6) },
        { label: "Density", v: 35 },
        { label: "Stress", v: stress * 20 },
        { label: "Nutrition", v: diet * 22 },
      ],
      recs: [
        { t: "Rosemary Oil Massage", b: "3x/week to improve blood flow" },
        { t: "Biotin + Zinc", b: "Daily supplement for keratin support" },
        { t: "Protein-rich diet", b: "Eggs, nuts, lentils" },
      ],
    },
    {
      type: "Moderate Thinning",
      desc: "Combination of lifestyle, nutrition, and possible hormonal factors. A structured 90-day plan is recommended.",
      concerns: ["Thinning at crown/temples", "Nutritional gaps", "Stress impact"],
      scores: [
        { label: "Hair Fall", v: severity },
        { label: "Density", v: 65 },
        { label: "Stress", v: stress * 24 },
        { label: "Nutrition", v: diet * 25 },
      ],
      recs: [
        { t: "Minoxidil 5%", b: "Once daily (consult doctor)" },
        { t: "Ketoconazole Shampoo", b: "2-3x per week" },
        { t: "Blood tests", b: "Ferritin, Vitamin D, Thyroid" },
      ],
    },
    {
      type: "Advanced Hair Loss",
      desc: "Significant loss requiring professional intervention. Early action gives the best results.",
      concerns: ["Pattern baldness", "Chronic inflammation", "Hormonal imbalance"],
      scores: [
        { label: "Hair Fall", v: 92 },
        { label: "Density", v: 85 },
        { label: "Stress", v: 78 },
        { label: "Nutrition", v: 70 },
      ],
      recs: [
        { t: "Dermatologist / Trichologist", b: "Book consultation ASAP" },
        { t: "Finasteride or Spironolactone", b: "Under medical supervision" },
        { t: "PRP / Mesotherapy", b: "Advanced regenerative options" },
      ],
    },
  ];

  return profiles[idx];
};

/* =================== SKIN =================== */

const skinQuestions: QuizQuestion[] = [
  {
    cat: "Skin Type",
    text: "How does your skin feel by midday?",
    hint: "Without applying products",
    options: [
      { icon: "🧴", label: "Oily all over", val: 4 },
      { icon: "⚖️", label: "Combination (T-zone oily)", val: 3 },
      { icon: "❄️", label: "Dry & tight", val: 3 },
      { icon: "🌟", label: "Balanced", val: 1 },
    ],
  },
  {
    cat: "Main Concern",
    text: "What bothers you the most about your skin?",
    options: [
      { icon: "🔴", label: "Acne / Breakouts", val: 4 },
      { icon: "🌑", label: "Dark spots / Pigmentation", val: 4 },
      { icon: "👵", label: "Ageing / Fine lines", val: 3 },
      { icon: "🔥", label: "Redness / Sensitivity", val: 3 },
    ],
  },
  {
    cat: "Acne",
    text: "How often do you get breakouts?",
    hint: "Last 3 months",
    options: [
      { icon: "✅", label: "Rarely", val: 1 },
      { icon: "📅", label: "Monthly", val: 2 },
      { icon: "📆", label: "Weekly", val: 3 },
      { icon: "🔥", label: "Constant / Severe", val: 4 },
    ],
  },
  {
    cat: "Pigmentation",
    text: "Do you have dark spots or uneven tone?",
    options: [
      { icon: "✅", label: "None", val: 1 },
      { icon: "🌥️", label: "Mild", val: 2 },
      { icon: "☁️", label: "Moderate", val: 3 },
      { icon: "🌑", label: "Severe / Melasma", val: 4 },
    ],
  },
  {
    cat: "Sun",
    text: "Daily sun exposure without protection?",
    options: [
      { icon: "🏠", label: "Minimal (indoors)", val: 1 },
      { icon: "🌤️", label: "1–2 hours", val: 2 },
      { icon: "☀️", label: "3–5 hours", val: 3 },
      { icon: "🔥", label: "5+ hours", val: 4 },
    ],
  },
  {
    cat: "Routine",
    text: "How consistent is your skincare routine?",
    options: [
      { icon: "🌅", label: "Twice daily", val: 1 },
      { icon: "🌞", label: "Morning only", val: 2 },
      { icon: "🌙", label: "Irregular", val: 3 },
      { icon: "❌", label: "None", val: 4 },
    ],
  },
  {
    cat: "Sensitivity",
    text: "How does your skin react to new products?",
    options: [
      { icon: "✅", label: "No reaction", val: 1 },
      { icon: "⚠️", label: "Mild irritation", val: 2 },
      { icon: "🔥", label: "Burns / Stings", val: 3 },
      { icon: "🚨", label: "Allergic reactions", val: 4 },
    ],
  },
  {
    cat: "Sleep",
    text: "Average sleep quality?",
    options: [
      { icon: "🌙", label: "7–9 hours good sleep", val: 1 },
      { icon: "⏰", label: "5–7 hours", val: 2 },
      { icon: "😣", label: "Under 5 hours", val: 4 },
    ],
  },
  {
    cat: "Diet",
    text: "Diet related to skin health?",
    options: [
      { icon: "🥗", label: "Balanced", val: 1 },
      { icon: "🍬", label: "High sugar / dairy", val: 3 },
      { icon: "🍟", label: "Junk food heavy", val: 4 },
    ],
  },
  {
    cat: "Age",
    text: "Your age group?",
    options: [
      { icon: "🧒", label: "Under 25", val: 1 },
      { icon: "🧑", label: "25–35", val: 2 },
      { icon: "🧓", label: "36–45", val: 3 },
      { icon: "👴", label: "46+", val: 4 },
    ],
  },
  {
    cat: "Photo",
    text: "Upload a clear face photo (optional)",
    hint: "Front view, good lighting, no makeup",
    options: [],
    isPhoto: true,
  },
];

const calculateSkinProfile = (answers: QuizAnswerValue[]): QuizProfile => {
  const num = (value: QuizAnswerValue) => (typeof value === "number" ? value : 0);
  const acne = num(answers[2]) || 1;
  const pigment = num(answers[3]) || 1;
  const sun = num(answers[4]) || 1;
  const routine = num(answers[5]) || 1;

  const severity = Math.min(
    100,
    Math.round(acne * 22 + pigment * 22 + sun * 18 + routine * 18 + 20)
  );

  let idx = 0;
  if (severity >= 70) idx = 2;
  else if (severity >= 45) idx = 1;

  const profiles: QuizProfile[] = [
    {
      type: "Healthy Balanced Skin",
      desc: "Your skin is in good condition. Focus on maintenance and prevention.",
      concerns: ["Minor dullness", "Early ageing signs"],
      scores: [
        { label: "Acne", v: 20 },
        { label: "Pigmentation", v: 25 },
        { label: "Barrier", v: 85 },
        { label: "Sun Damage", v: 30 },
      ],
      recs: [
        { t: "Daily SPF 50", b: "Non-negotiable" },
        { t: "Vitamin C Serum", b: "Morning routine" },
        { t: "Gentle Hydration", b: "Hyaluronic acid" },
      ],
    },
    {
      type: "Acne-Prone & Congested",
      desc: "Excess oil, clogged pores and inflammation are the main issues.",
      concerns: ["Active acne", "Post-acne marks", "Oil control"],
      scores: [
        { label: "Acne", v: severity },
        { label: "Pigmentation", v: 55 },
        { label: "Barrier", v: 45 },
        { label: "Inflammation", v: 70 },
      ],
      recs: [
        { t: "Salicylic Acid Cleanser", b: "2% BHA" },
        { t: "Niacinamide Serum", b: "10% for oil control" },
        { t: "Spot treatment", b: "Benzoyl Peroxide" },
      ],
    },
    {
      type: "Hyperpigmentation & Sun Damage",
      desc: "Dark spots and uneven tone are dominant. Consistent treatment needed.",
      concerns: ["Melasma / Dark spots", "Sun damage", "Post-inflammatory marks"],
      scores: [
        { label: "Acne", v: 35 },
        { label: "Pigmentation", v: 88 },
        { label: "Sun Damage", v: 82 },
        { label: "Barrier", v: 55 },
      ],
      recs: [
        { t: "SPF 50+ daily", b: "Broad spectrum" },
        { t: "Alpha Arbutin / Tranexamic", b: "Target melanin" },
        { t: "Azelaic Acid", b: "Multi-benefit" },
      ],
    },
  ];

  return profiles[idx];
};

export const QUIZ_TESTS: Record<QuizCategoryKey, QuizTest> = {
  hair: {
    key: "hair",
    title: "Hair Root Cause Test",
    tagline: "Hair fall, thinning, scalp health, hormones & lifestyle",
    emoji: "🌱",
    questions: hairQuestions,
    getProfile: calculateHairProfile,
  },
  skin: {
    key: "skin",
    title: "Skin Analysis Test",
    tagline: "Skin type, acne, pigmentation, ageing & barrier health",
    emoji: "✨",
    questions: skinQuestions,
    getProfile: calculateSkinProfile,
  },
};
