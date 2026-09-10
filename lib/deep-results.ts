import { buildAttachmentResult } from "./attachment";
import { ATTACHMENT_TEST_ID } from "./quiz-content";
import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";

export type DeepResultContent = {
  lens: { title: string; explanation: string; reflectionPrompt: string };
  // Present only in historical report snapshots.
  depth?: { coreDrive: string; inRelationships: string; underPressure: string };
};

export function buildChoiceReport(
  test: QuizTest,
  questions: QuizQuestion[],
  choices: Record<string, number>,
): { result: ResultProfile; deepResult: DeepResultContent } {
  if (test.id === ATTACHMENT_TEST_ID) {
    const result = buildAttachmentResult(questions, choices);
    return {
      result,
      deepResult: {
        lens: {
          title: "A pattern, not a verdict",
          explanation:
            "These scores describe how often your image choices leaned toward reaching, stepping back, staying steady, or doing both. They are a reflection prompt for this moment, not a diagnosis or a fixed identity.",
          reflectionPrompt:
            "Where did your first picture feel familiar, and where would you choose differently on a calmer day?",
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
        : "Your visual choices are saved in this reading.",
      strength: "",
      watchout: "",
      nextStep: "",
    },
    deepResult: {
      lens: {
        title: "Bring these choices back to your own experience",
        explanation:
          "Each section explains one image you selected. These interpretations are prompts for reflection, not scores or a fixed personality label. You can relate to different ideas in different situations.",
        reflectionPrompt:
          "Which interpretation connects with something happening in your life, and which would you describe differently?",
      },
    },
  };
}
