import { useCallback, useReducer } from "react";
import type { CodexQuestion } from "../types/codex";

// ─── State machine ─────────────────────────────────────────────────────────────

export type BuilderPhase =
  | "describing"   // user types their idea
  | "discovering"  // backend asks structured questions
  | "reviewing"    // user reviews requirements + success criteria
  | "approved";    // user clicked approve — goal creation in progress

export type DraftItem = { id: string; text: string };

export type BuilderState = {
  phase: BuilderPhase;
  idea: string;
  title: string;
  objective: string;
  currentQuestion: CodexQuestion | undefined;
  answeredQuestions: ReadonlyArray<{ questionId: string; answer: unknown }>;
  draftRequirements: DraftItem[];
  draftSuccessCriteria: DraftItem[];
  submitting: boolean;
  error: string;
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type BuilderAction =
  | { type: "SET_IDEA"; idea: string }
  | { type: "BEGIN_DISCOVERING"; title: string; objective: string }
  | { type: "SET_QUESTION"; question: CodexQuestion }
  | { type: "ANSWER_QUESTION"; questionId: string; answer: unknown }
  | { type: "BEGIN_REVIEWING"; requirements: DraftItem[]; criteria: DraftItem[] }
  | { type: "ADD_REQUIREMENT"; text: string }
  | { type: "REMOVE_REQUIREMENT"; id: string }
  | { type: "EDIT_REQUIREMENT"; id: string; text: string }
  | { type: "ADD_CRITERION"; text: string }
  | { type: "REMOVE_CRITERION"; id: string }
  | { type: "EDIT_CRITERION"; id: string; text: string }
  | { type: "APPROVE" }
  | { type: "SET_ERROR"; error: string }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_SUBMITTING"; value: boolean }
  | { type: "RESET" };

// ─── Initial state ─────────────────────────────────────────────────────────────

const INITIAL: BuilderState = {
  phase: "describing",
  idea: "",
  title: "",
  objective: "",
  currentQuestion: undefined,
  answeredQuestions: [],
  draftRequirements: [],
  draftSuccessCriteria: [],
  submitting: false,
  error: "",
};

// ─── Reducer ───────────────────────────────────────────────────────────────────

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "SET_IDEA":
      return { ...state, idea: action.idea, error: "" };

    case "BEGIN_DISCOVERING":
      return {
        ...state,
        phase: "discovering",
        title: action.title,
        objective: action.objective,
        error: "",
        submitting: false,
      };

    case "SET_QUESTION":
      return { ...state, currentQuestion: action.question };

    case "ANSWER_QUESTION":
      return {
        ...state,
        currentQuestion: undefined,
        answeredQuestions: [
          ...state.answeredQuestions,
          { questionId: action.questionId, answer: action.answer },
        ],
      };

    case "BEGIN_REVIEWING":
      return {
        ...state,
        phase: "reviewing",
        draftRequirements: action.requirements,
        draftSuccessCriteria: action.criteria,
        error: "",
        submitting: false,
      };

    case "ADD_REQUIREMENT":
      return {
        ...state,
        draftRequirements: [
          ...state.draftRequirements,
          { id: crypto.randomUUID(), text: action.text },
        ],
      };

    case "REMOVE_REQUIREMENT":
      return {
        ...state,
        draftRequirements: state.draftRequirements.filter((r) => r.id !== action.id),
      };

    case "EDIT_REQUIREMENT":
      return {
        ...state,
        draftRequirements: state.draftRequirements.map((r) =>
          r.id === action.id ? { ...r, text: action.text } : r
        ),
      };

    case "ADD_CRITERION":
      return {
        ...state,
        draftSuccessCriteria: [
          ...state.draftSuccessCriteria,
          { id: crypto.randomUUID(), text: action.text },
        ],
      };

    case "REMOVE_CRITERION":
      return {
        ...state,
        draftSuccessCriteria: state.draftSuccessCriteria.filter((c) => c.id !== action.id),
      };

    case "EDIT_CRITERION":
      return {
        ...state,
        draftSuccessCriteria: state.draftSuccessCriteria.map((c) =>
          c.id === action.id ? { ...c, text: action.text } : c
        ),
      };

    case "APPROVE":
      return { ...state, phase: "approved", submitting: true, error: "" };

    case "SET_ERROR":
      return { ...state, error: action.error, submitting: false };

    case "CLEAR_ERROR":
      return { ...state, error: "" };

    case "SET_SUBMITTING":
      return { ...state, submitting: action.value };

    case "RESET":
      return { ...INITIAL };

    default:
      return state;
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useGoalBuilder() {
  const [state, dispatch] = useReducer(builderReducer, INITIAL);

  const setIdea = useCallback((idea: string) => dispatch({ type: "SET_IDEA", idea }), []);

  const beginDiscovering = useCallback((title: string, objective: string) => {
    dispatch({ type: "BEGIN_DISCOVERING", title, objective });
  }, []);

  const setQuestion = useCallback((question: CodexQuestion) => {
    dispatch({ type: "SET_QUESTION", question });
  }, []);

  const answerQuestion = useCallback((questionId: string, answer: unknown) => {
    dispatch({ type: "ANSWER_QUESTION", questionId, answer });
  }, []);

  const beginReviewing = useCallback(
    (requirements: DraftItem[], criteria: DraftItem[]) => {
      dispatch({ type: "BEGIN_REVIEWING", requirements, criteria });
    },
    []
  );

  const addRequirement = useCallback((text: string) => {
    dispatch({ type: "ADD_REQUIREMENT", text });
  }, []);

  const removeRequirement = useCallback((id: string) => {
    dispatch({ type: "REMOVE_REQUIREMENT", id });
  }, []);

  const editRequirement = useCallback((id: string, text: string) => {
    dispatch({ type: "EDIT_REQUIREMENT", id, text });
  }, []);

  const addCriterion = useCallback((text: string) => {
    dispatch({ type: "ADD_CRITERION", text });
  }, []);

  const removeCriterion = useCallback((id: string) => {
    dispatch({ type: "REMOVE_CRITERION", id });
  }, []);

  const editCriterion = useCallback((id: string, text: string) => {
    dispatch({ type: "EDIT_CRITERION", id, text });
  }, []);

  const approve = useCallback(() => dispatch({ type: "APPROVE" }), []);

  const setError = useCallback((error: string) => dispatch({ type: "SET_ERROR", error }), []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    state,
    setIdea,
    beginDiscovering,
    setQuestion,
    answerQuestion,
    beginReviewing,
    addRequirement,
    removeRequirement,
    editRequirement,
    addCriterion,
    removeCriterion,
    editCriterion,
    approve,
    setError,
    reset,
  };
}
