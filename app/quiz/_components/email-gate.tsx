"use client";

import Link from "next/link";
import { validateEmailAddress } from "@/lib/email-validation";
import { calculateResult, type QuizTest, type TraitKey } from "@/lib/quiz";

export function EmailGateView({
  answers,
  email,
  error,
  onEmailChange,
  onSubmit,
  profileEmail,
  selectedTest,
  setError,
  submitting,
}: {
  answers: Record<string, TraitKey>;
  email: string;
  error: string;
  onEmailChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  profileEmail?: string;
  selectedTest: QuizTest;
  setError: (value: string) => void;
  submitting: boolean;
}) {
  const preview = calculateResult(answers, selectedTest.results);

  return (
    <main className="gate-shell">
      <section className="email-gate">
        <div className="result-teaser">
          <span className="result-seal">Profile found</span>
          <div className="blurred-result">
            <span>{selectedTest.title}</span>
            <h2>{preview.title}</h2>
            <p>{preview.summary}</p>
          </div>
        </div>
        <form className="email-form" onSubmit={onSubmit}>
          <span className="pill">Your complete visual reading is ready</span>
          <h1>See what every choice reveals.</h1>
          <p>
            You have completed all of the visual choices. Enter your email to unlock the meaning behind every image, your personal
            projection, and the full pattern they form together.
          </p>
          {profileEmail ? (
            <div className="saved-profile-email">
              <span>Saving this reflection to</span>
              <strong>{profileEmail}</strong>
            </div>
          ) : (
            <>
              <label htmlFor="email">Email address</label>
              <input
                aria-invalid={Boolean(error)}
                autoComplete="email"
                id="email"
                onBlur={(event) => {
                  const validation = validateEmailAddress(event.target.value);
                  if (!validation.valid) setError(validation.message);
                }}
                onChange={(event) => {
                  onEmailChange(event.target.value);
                  setError("");
                }}
                placeholder="name@gmail.com"
                required
                type="email"
                value={email}
              />
              <small className="email-hint">
                Use an email you can access. Test, placeholder, and malformed addresses are not accepted.
              </small>
            </>
          )}
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="primary-button full-button" disabled={submitting} type="submit">
            {submitting ? "Unlocking your reading…" : "Unlock my full reading →"}
          </button>
          <small className="privacy-note">
            No password is needed on this device. By continuing, you acknowledge our <Link href="/privacy">Privacy Policy</Link> and{" "}
            <Link href="/terms">Terms</Link>.
          </small>
        </form>
      </section>
    </main>
  );
}
