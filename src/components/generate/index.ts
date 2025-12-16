// Główny komponent widoku
export { GenerateView } from "./GenerateView";

// Komponenty formularza
export { GenerateForm } from "./GenerateForm";
export { SourceTextArea } from "./SourceTextArea";
export { CharacterCounter } from "./CharacterCounter";
export { RateLimitInfo } from "./RateLimitInfo";

// Komponenty propozycji
export { ProposalCard } from "./ProposalCard";
export { ProposalList } from "./ProposalList";
export { ProposalEditForm } from "./ProposalEditForm";
export { BulkActions } from "./BulkActions";
export { SaveProposalsButton } from "./SaveProposalsButton";

// Hook zarządzania stanem
export { useGenerateView } from "./hooks/useGenerateView";

// Typy eksportowane dla potrzeb zewnętrznych
export type {
  ProposalStatus,
  ProposalViewModel,
  RateLimitInfoViewModel,
  GenerateViewState,
  GenerateViewAction,
} from "./types";

export { VALIDATION_CONSTANTS } from "./types";

