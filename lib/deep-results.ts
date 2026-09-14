import type { AiReading } from "./ai-reading-parse";
import { buildAttachmentResult, type DimensionScore, type WorthLevel } from "./attachment";
import { buildAttachmentReport } from "./attachment-report";
import { ATTACHMENT_TEST_ID } from "./quiz-content";
import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";

export type DeepResultContent = {
  aiReading?: AiReading;
  aiReadingFrozen?: boolean;
  aiRewriteAttempted?: boolean;
  modules?: { title: string; explanation: string; reflection: string }[];
  lens: { title: string; explanation: string; reflectionPrompt: string };
  // Present only in historical report snapshots.
  depth?: { coreDrive: string; inRelationships: string; underPressure: string };
  essay?: { dating: string; conflict: string; need: string };
  childhood?: { title: string; paragraphs: string[]; reflection: string };
  selfEsteem?: { title: string; paragraphs: string[]; rewrites: { from: string; to: string }[] };
  pairing?: { style: string; note: string }[];
  practices?: { day: number; title: string; body: string }[];
  loop?: { name: string; kind: string; steps: string[] };
  overview?: { title: string; points: string[] }[];
  romanceEssay?: string;
  scores?: DimensionScore;
  caregiver?: { intro: string } & DimensionScore;
  selfWorth?: { level: WorthLevel; percent: number; sentences: string };
  characteristics?: string[];
  superpowers?: string[];
  triggers?: string[];
};

export function buildChoiceReport(
  test: QuizTest,
  questions: QuizQuestion[],
  choices: Record<string, number>,
): { result: ResultProfile; deepResult: DeepResultContent } {
  if (test.id === ATTACHMENT_TEST_ID && questions.length > 0) {
    return buildAttachmentReport(questions, choices);
  }
  if (test.id === ATTACHMENT_TEST_ID) {
    const result = buildAttachmentResult(questions, choices);
    return {
      result,
      deepResult: {
        lens: {
          title: "A pattern, not a verdict",
          explanation:
            "These scores describe how often your choices leaned toward reaching, stepping back, staying steady, or doing both. They are a reflection prompt for this moment, not a diagnosis or a fixed identity.",
          reflectionPrompt:
            "Where did your first reaction feel familiar, and where would you choose differently on a calmer day?",
        },
      },
    };
  }

  const labels = questions.map((question) => question.options[choices[question.id]]?.label).filter(Boolean);
  return {
    result: {
      key: "choices",
      eyebrow: "Your personal reading",
      title: test.title,
      summary: labels.length
        ? `Your choices: ${labels.join(" · ")}. Explore what each selection means to you in the full reading.`
        : "Your choices are saved in this reading.",
      strength: "",
      watchout: "",
      nextStep: "",
    },
    deepResult: {
      lens: {
        title: "Bring these choices back to your own experience",
        explanation:
          "Each section explains one choice you selected. These interpretations are prompts for reflection, not scores or a fixed personality label. You can relate to different ideas in different situations.",
        reflectionPrompt:
          "Which interpretation connects with something happening in your life, and which would you describe differently?",
      },
    },
  };
}
