import type { GenerateViewState, GenerateViewAction, ProposalStatus } from "../types";

/**
 * Stan początkowy widoku generowania
 */
export const initialState: GenerateViewState = {
  sourceText: "",
  isGenerating: false,
  isSaving: false,
  generationId: null,
  proposals: [],
  rateLimit: {
    remaining: 10,
    resetAt: null,
    isLimited: false,
  },
  error: null,
  successMessage: null,
};

/**
 * Reducer zarządzający stanem widoku generowania fiszek
 */
export function generateViewReducer(state: GenerateViewState, action: GenerateViewAction): GenerateViewState {
  switch (action.type) {
    case "SET_SOURCE_TEXT":
      return { ...state, sourceText: action.payload, error: null };

    case "START_GENERATION":
      return { ...state, isGenerating: true, error: null, proposals: [] };

    case "GENERATION_SUCCESS":
      return {
        ...state,
        isGenerating: false,
        generationId: action.payload.generation_id,
        proposals: action.payload.proposals.map((p, index) => ({
          id: `proposal-${index}-${Date.now()}`,
          front: p.front,
          back: p.back,
          status: "pending" as ProposalStatus,
          originalFront: p.front,
          originalBack: p.back,
        })),
        rateLimit: {
          ...state.rateLimit,
          remaining: Math.max(0, state.rateLimit.remaining - 1),
        },
      };

    case "GENERATION_ERROR":
      return { ...state, isGenerating: false, error: action.payload };

    case "ACCEPT_PROPOSAL":
      return {
        ...state,
        proposals: state.proposals.map((p) =>
          p.id === action.payload ? { ...p, status: "accepted" as ProposalStatus } : p
        ),
      };

    case "REJECT_PROPOSAL":
      return {
        ...state,
        proposals: state.proposals.map((p) =>
          p.id === action.payload ? { ...p, status: "rejected" as ProposalStatus } : p
        ),
      };

    case "START_EDITING":
      return {
        ...state,
        proposals: state.proposals.map((p) =>
          p.id === action.payload ? { ...p, status: "editing" as ProposalStatus } : p
        ),
      };

    case "SAVE_EDIT":
      return {
        ...state,
        proposals: state.proposals.map((p) =>
          p.id === action.payload.id
            ? {
                ...p,
                front: action.payload.front,
                back: action.payload.back,
                status: "accepted" as ProposalStatus,
              }
            : p
        ),
      };

    case "CANCEL_EDIT":
      return {
        ...state,
        proposals: state.proposals.map((p) =>
          p.id === action.payload
            ? {
                ...p,
                front: p.originalFront,
                back: p.originalBack,
                status: "pending" as ProposalStatus,
              }
            : p
        ),
      };

    case "UNDO_PROPOSAL":
      return {
        ...state,
        proposals: state.proposals.map((p) =>
          p.id === action.payload ? { ...p, status: "pending" as ProposalStatus } : p
        ),
      };

    case "ACCEPT_ALL":
      return {
        ...state,
        proposals: state.proposals.map((p) =>
          p.status === "pending" ? { ...p, status: "accepted" as ProposalStatus } : p
        ),
      };

    case "REJECT_ALL":
      return {
        ...state,
        proposals: state.proposals.map((p) =>
          p.status === "pending" ? { ...p, status: "rejected" as ProposalStatus } : p
        ),
      };

    case "START_SAVING":
      return { ...state, isSaving: true, error: null };

    case "SAVE_SUCCESS":
      return {
        ...state,
        isSaving: false,
        proposals: [],
        generationId: null,
        sourceText: "",
        successMessage: `Zapisano ${action.payload} ${action.payload === 1 ? "fiszkę" : action.payload < 5 ? "fiszki" : "fiszek"}!`,
      };

    case "SAVE_ERROR":
      return { ...state, isSaving: false, error: action.payload };

    case "UPDATE_RATE_LIMIT":
      return { ...state, rateLimit: action.payload };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "CLEAR_SUCCESS":
      return { ...state, successMessage: null };

    default:
      return state;
  }
}
