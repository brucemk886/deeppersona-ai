"use client";

import { AtlasImage } from "@/app/quiz/_components/atlas-image";
import type { QuizQuestion, QuizTest } from "@/lib/quiz";
import type { TraitKey } from "@/lib/quiz";
import type { RelationshipNode } from "@/lib/relationship-network";

export function QuizView({
  activeQuestion,
  isAdvancing,
  onBack,
  onChoose,
  onReturnHome,
  progress,
  questionIndex,
  questionsLength,
  relationshipContext,
  selectedOptionIndex,
  selectedTest,
}: {
  activeQuestion: QuizQuestion;
  isAdvancing: boolean;
  onBack: () => void;
  onChoose: (scoreKey: TraitKey, optionLabel: string, optionIndex: number) => void;
  onReturnHome: () => void;
  progress: number;
  questionIndex: number;
  questionsLength: number;
  relationshipContext: RelationshipNode | null;
  selectedOptionIndex?: number;
  selectedTest: QuizTest;
}) {
  return (
    <main className="quiz-shell">
      <header className="quiz-header">
        <button className="brand brand-button" onClick={onReturnHome}>
          <span className="brand-mark">DP</span>
          <span>DeepPersona AI</span>
        </button>
        <div className="progress-copy">
          <span>
            {relationshipContext ? `With ${relationshipContext.nickname} · ${selectedTest.title}` : selectedTest.title} ·{" "}
            {questionIndex + 1} of {questionsLength}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%`, background: selectedTest.accent }} />
        </div>
      </header>
      <section className="question-section">
        <div className="question-heading">
          <span>{relationshipContext ? `Thinking of ${relationshipContext.nickname}` : activeQuestion.kicker}</span>
          <h1>{activeQuestion.prompt}</h1>
          <p>
            {relationshipContext
              ? `Keep ${relationshipContext.nickname} in mind. Notice the first response this relationship brings up.`
              : "There is no correct choice. Notice your first emotional response."}
          </p>
        </div>
        <div className="option-grid" role="radiogroup" aria-label={activeQuestion.prompt}>
          {activeQuestion.options.map((option, index) => {
            const selected = selectedOptionIndex === index;
            const letter = String.fromCharCode(65 + index);
            return (
              <article
                className={`option-card ${selected ? "selected" : ""} ${isAdvancing && selected ? "is-confirming" : ""}`}
                key={`${activeQuestion.id}-${index}`}
              >
                <button
                  aria-label={`Choose ${letter}: ${option.label}`}
                  className="option-image-trigger"
                  disabled={isAdvancing}
                  onClick={() => onChoose(option.scoreKey, option.label, index)}
                  type="button"
                >
                  <AtlasImage
                    className="option-image"
                    index={index}
                    loading="eager"
                    path={activeQuestion.atlasPath}
                    priority={index === 0}
                  />
                </button>
                <button
                  aria-checked={selected}
                  className="option-select"
                  disabled={isAdvancing}
                  onClick={() => onChoose(option.scoreKey, option.label, index)}
                  role="radio"
                  type="button"
                >
                  <span className="option-meta">
                    <span className="option-letter">{letter}</span>
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.microcopy}</small>
                    </span>
                    <span className="selection-mark" aria-hidden="true">
                      ✓
                    </span>
                  </span>
                </button>
              </article>
            );
          })}
        </div>
        <div className="quiz-actions">
          <button className="text-button" disabled={questionIndex === 0 || isAdvancing} onClick={onBack}>
            ← Back
          </button>
        </div>
      </section>
    </main>
  );
}
