import { useState } from "react";
import type { CodexQuestion, QuestionType } from "../types/codex";

function QuestionHeader({ question }: { question: CodexQuestion }) {
  return (
    <>
      <div className="question-eyebrow">CODEX NEEDS YOUR INPUT</div>
      <h3>{question.title}</h3>
      {question.description && <p className="question-desc">{question.description}</p>}
    </>
  );
}

function CheckboxInput({
  question,
  answer,
  onChange,
}: {
  question: CodexQuestion;
  answer: string[];
  onChange: (value: string[]) => void;
}) {
  const toggle = (value: string) => {
    onChange(
      answer.includes(value)
        ? answer.filter((v) => v !== value)
        : [...answer, value],
    );
  };
  return (
    <div className="choice-group" role="group" aria-labelledby={`q-title-${question.id}`}>
      {(question.options ?? []).map((option) => (
        <label className="choice" key={option.value}>
          <input
            type="checkbox"
            name={question.id}
            value={option.value}
            checked={answer.includes(option.value)}
            onChange={() => toggle(option.value)}
          />
          <span>
            <b>{option.label}</b>
            {option.description && <small>{option.description}</small>}
          </span>
        </label>
      ))}
    </div>
  );
}

function RadioInput({
  question,
  answer,
  onChange,
}: {
  question: CodexQuestion;
  answer: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="choice-group" role="group" aria-labelledby={`q-title-${question.id}`}>
      {(question.options ?? []).map((option) => (
        <label className="choice" key={option.value}>
          <input
            type="radio"
            name={question.id}
            value={option.value}
            checked={answer === option.value}
            onChange={() => onChange(option.value)}
          />
          <span>
            <b>{option.label}</b>
            {option.description && <small>{option.description}</small>}
          </span>
        </label>
      ))}
    </div>
  );
}

function SelectInput({
  question,
  answer,
  onChange,
}: {
  question: CodexQuestion;
  answer: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={question.title}
      value={answer}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Choose an option</option>
      {(question.options ?? []).map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function TextInput({
  question,
  answer,
  onChange,
}: {
  question: CodexQuestion;
  answer: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      aria-label={question.title}
      value={answer}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write your answer…"
      rows={4}
    />
  );
}

function MultiFieldInput({
  question,
  answer,
  onChange,
}: {
  question: CodexQuestion;
  answer: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}) {
  return (
    <div className="multi-field-group">
      {(question.options ?? []).map((field) => (
        <label key={field.value} className="multi-field-label">
          <span>{field.label}</span>
          <input
            type="text"
            value={answer[field.value] ?? ""}
            onChange={(e) =>
              onChange({ ...answer, [field.value]: e.target.value })
            }
            placeholder={field.description}
          />
        </label>
      ))}
    </div>
  );
}

function ConfirmationInput({
  onSubmit,
}: {
  onSubmit: (answer: unknown) => void;
}) {
  return (
    <div className="decision">
      <button className="primary" onClick={() => onSubmit(true)}>
        Approve
      </button>
      <button onClick={() => onSubmit(false)}>Reject</button>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

function getInitialAnswer(
  type: QuestionType,
  defaultValue: CodexQuestion["defaultValue"],
): string | string[] | Record<string, string> {
  if (type === "checkbox") {
    return (defaultValue as string[] | undefined) ?? [];
  }
  if (type === "multi_field") {
    return (defaultValue as Record<string, string> | undefined) ?? {};
  }
  return (defaultValue as string | undefined) ?? "";
}

export function QuestionCard({
  question,
  onSubmit,
}: {
  question: CodexQuestion;
  onSubmit: (answer: unknown) => void;
}) {
  const [answer, setAnswer] = useState<string | string[] | Record<string, string>>(
    () => getInitialAnswer(question.type, question.defaultValue),
  );
  const [validationError, setValidationError] = useState("");

  const submit = () => {
    if (question.required) {
      const isEmpty =
        (typeof answer === "string" && !answer.trim()) ||
        (Array.isArray(answer) && answer.length === 0);
      if (isEmpty) {
        setValidationError("This question requires an answer.");
        return;
      }
    }
    setValidationError("");
    onSubmit(answer);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && question.type !== "text") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <section className="question-card" onKeyDown={handleKeyDown}>
      <div id={`q-title-${question.id}`} className="question-eyebrow">
        CODEX NEEDS YOUR INPUT
      </div>
      <QuestionHeader question={question} />

      {question.type === "checkbox" && (
        <CheckboxInput
          question={question}
          answer={answer as string[]}
          onChange={(v) => { setAnswer(v); setValidationError(""); }}
        />
      )}
      {question.type === "radio" && (
        <RadioInput
          question={question}
          answer={answer as string}
          onChange={(v) => { setAnswer(v); setValidationError(""); }}
        />
      )}
      {question.type === "select" && (
        <SelectInput
          question={question}
          answer={answer as string}
          onChange={(v) => { setAnswer(v); setValidationError(""); }}
        />
      )}
      {question.type === "text" && (
        <TextInput
          question={question}
          answer={answer as string}
          onChange={(v) => { setAnswer(v); setValidationError(""); }}
        />
      )}
      {question.type === "multi_field" && (
        <MultiFieldInput
          question={question}
          answer={answer as Record<string, string>}
          onChange={(v) => { setAnswer(v); setValidationError(""); }}
        />
      )}
      {question.type === "confirmation" && (
        <ConfirmationInput onSubmit={onSubmit} />
      )}

      {validationError && (
        <p className="form-error" role="alert">
          {validationError}
        </p>
      )}

      {question.type !== "confirmation" && (
        <button
          className="primary question-submit"
          onClick={submit}
          aria-label="Send answer"
        >
          Send answer
        </button>
      )}
    </section>
  );
}
