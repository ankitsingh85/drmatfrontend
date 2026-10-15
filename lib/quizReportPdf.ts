// Branded, properly laid-out PDF for the hair/skin quiz assessment report —
// built with jsPDF so we get real typography (bold/regular), color, drawn
// progress bars and automatic pagination, instead of a flat monospace text
// dump. Mirrors the on-screen result page's visual language (navy/blue
// brand gradient, pill tags, numbered step cards).
import type { QuizAnswerValue, QuizProfile, QuizTest } from "@/data/hairSkinQuizData";

type RGB = [number, number, number];

const COLOR = {
  navy: [16, 48, 107] as RGB,
  blue: [31, 73, 190] as RGB,
  lightBlue: [41, 129, 183] as RGB,
  green: [15, 157, 88] as RGB,
  textDark: [22, 50, 82] as RGB,
  textMuted: [95, 113, 138] as RGB,
  trackBg: [233, 238, 245] as RGB,
  cardBorder: [226, 232, 240] as RGB,
  pillBg: [234, 243, 255] as RGB,
  pillText: [10, 75, 131] as RGB,
  white: [255, 255, 255] as RGB,
  badgeBg: [220, 252, 231] as RGB,
  badgeText: [22, 101, 52] as RGB,
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
const lerpColor = (from: RGB, to: RGB, t: number): RGB => [
  lerp(from[0], to[0], t),
  lerp(from[1], to[1], t),
  lerp(from[2], to[2], t),
];

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

export const generateQuizReportPdf = async (
  test: QuizTest,
  answers: QuizAnswerValue[],
  profile: QuizProfile
) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = 0;

  const setFill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const setText = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const setDraw = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);

  const newPage = () => {
    doc.addPage();
    y = MARGIN;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_H - MARGIN - 10) newPage();
  };

  /* ---------- Header ---------- */
  const drawHeader = (title: string, subtitle: string) => {
    const headerH = 34;
    const strips = 60;
    for (let i = 0; i < strips; i += 1) {
      const t = i / (strips - 1);
      setFill(lerpColor(COLOR.navy, COLOR.lightBlue, t));
      doc.rect((PAGE_W / strips) * i, 0, PAGE_W / strips + 0.5, headerH, "F");
    }

    setText(COLOR.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("DR DERMAT", MARGIN, 12, { charSpace: 0.6 });

    doc.setFontSize(17);
    const titleLines = doc.splitTextToSize(title, CONTENT_W - 10);
    doc.text(titleLines, MARGIN, 21);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(subtitle, MARGIN, 21 + titleLines.length * 6.5);

    y = headerH + 10;
  };

  drawHeader(`${test.title} — Assessment Report`, `Generated on ${new Date().toLocaleString("en-IN")}`);

  /* ---------- Status badge ---------- */
  setFill(COLOR.badgeBg);
  doc.roundedRect(MARGIN, y, 48, 7, 3.5, 3.5, "F");
  setText(COLOR.badgeText);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("✓ ASSESSMENT COMPLETE", MARGIN + 3, y + 4.8);
  y += 14;

  /* ---------- Result card ---------- */
  setText(COLOR.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const typeLines = doc.splitTextToSize(profile.type, CONTENT_W);
  doc.text(typeLines, MARGIN, y);
  y += typeLines.length * 7 + 2;

  setText(COLOR.textMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const descLines = doc.splitTextToSize(profile.desc, CONTENT_W);
  doc.text(descLines, MARGIN, y);
  y += descLines.length * 5.2 + 8;

  /* ---------- Concern pills ---------- */
  const drawSectionHeading = (label: string) => {
    ensureSpace(14);
    setFill(COLOR.lightBlue);
    doc.rect(MARGIN, y - 3.2, 3, 3, "F");
    setText(COLOR.textMuted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(label.toUpperCase(), MARGIN + 6, y);
    y += 8;
  };

  drawSectionHeading("Your Main Concerns");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  let pillX = MARGIN;
  profile.concerns.forEach((concern) => {
    const textW = doc.getTextWidth(concern);
    const pillW = textW + 8;
    if (pillX + pillW > PAGE_W - MARGIN) {
      pillX = MARGIN;
      y += 10;
      ensureSpace(10);
    }
    setFill(COLOR.pillBg);
    doc.roundedRect(pillX, y - 5, pillW, 7.5, 3.5, 3.5, "F");
    setText(COLOR.pillText);
    doc.text(concern, pillX + 4, y);
    pillX += pillW + 4;
  });
  y += 14;

  /* ---------- Severity breakdown ---------- */
  drawSectionHeading("Severity Breakdown");
  const barX = MARGIN + 32;
  const barW = CONTENT_W - 32 - 16;
  profile.scores.forEach((score) => {
    ensureSpace(11);
    setText(COLOR.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(score.label, MARGIN, y);

    setFill(COLOR.trackBg);
    doc.roundedRect(barX, y - 4, barW, 4.5, 2.2, 2.2, "F");
    setFill(COLOR.blue);
    const fillW = Math.max(3, (barW * Math.min(100, score.v)) / 100);
    doc.roundedRect(barX, y - 4, fillW, 4.5, 2.2, 2.2, "F");

    setText(COLOR.textDark);
    doc.setFont("helvetica", "bold");
    doc.text(`${score.v}%`, PAGE_W - MARGIN, y, { align: "right" });

    y += 10;
  });
  y += 4;

  /* ---------- Recommended next steps ---------- */
  drawSectionHeading("Recommended Next Steps");
  profile.recs.forEach((rec, i) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.3);
    const bodyLines = doc.splitTextToSize(rec.b, CONTENT_W - 16);
    const cardH = 9 + bodyLines.length * 4.6 + 4;
    ensureSpace(cardH + 3);

    setFill([248, 250, 252] as RGB);
    setDraw(COLOR.cardBorder);
    doc.roundedRect(MARGIN, y - 5, CONTENT_W, cardH, 3, 3, "FD");

    setFill(COLOR.pillBg);
    doc.circle(MARGIN + 7, y + 1, 3.6, "F");
    setText(COLOR.pillText);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(String(i + 1), MARGIN + 7, y + 2.2, { align: "center" });

    setText(COLOR.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(rec.t, MARGIN + 14, y);

    setText(COLOR.textMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.3);
    doc.text(bodyLines, MARGIN + 14, y + 5);

    y += cardH + 4;
  });
  y += 4;

  /* ---------- Questions & answers ---------- */
  drawSectionHeading("Questions & Answers");
  test.questions.forEach((question, index) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const qLines = doc.splitTextToSize(`${index + 1}. ${question.text}`, CONTENT_W);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.3);
    const answerText = `Answer: ${describeAnswer(question, answers[index])}`;
    const aLines = doc.splitTextToSize(answerText, CONTENT_W);

    const blockH = 5 + qLines.length * 5 + aLines.length * 4.8 + 6;
    ensureSpace(blockH);

    setText(COLOR.textMuted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(question.cat.toUpperCase(), MARGIN, y);
    y += 4.5;

    setText(COLOR.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(qLines, MARGIN, y);
    y += qLines.length * 5;

    setText(COLOR.pillText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.3);
    doc.text(aLines, MARGIN, y);
    y += aLines.length * 4.8 + 3;

    setDraw(COLOR.cardBorder);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 6;
  });

  /* ---------- Footer on every page ---------- */
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    setDraw(COLOR.cardBorder);
    doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
    setText(COLOR.textMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Dr Dermat — drdermat.com", MARGIN, PAGE_H - 9);
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 9, { align: "right" });
  }

  doc.save(`${test.key}-assessment-report.pdf`);
};
