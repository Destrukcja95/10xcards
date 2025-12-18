// Main view component
export { ProfileView } from "./ProfileView";

// Sub-components
export { ProfileHeader } from "./ProfileHeader";
export { StatsOverview } from "./StatsOverview";
export { StatCard } from "./StatCard";
export { GenerationHistory } from "./GenerationHistory";
export { GenerationHistoryTable } from "./GenerationHistoryTable";
export { GenerationHistoryRow, GenerationHistoryCard } from "./GenerationHistoryRow";
export { GenerationHistoryPagination } from "./GenerationHistoryPagination";
export { EmptyGenerationHistory } from "./EmptyGenerationHistory";
export { AccountSettings } from "./AccountSettings";
export { DeleteAccountButton } from "./DeleteAccountButton";
export { DeleteAccountDialog } from "./DeleteAccountDialog";

// Hooks
export { useProfileView } from "./hooks/useProfileView";
export { profileViewReducer, initialState } from "./hooks/profileViewReducer";

// Types
export type { ProfileStatsDTO, ProfileViewState, ProfileViewAction, DeleteAccountDialogState } from "./types";
export { DELETE_CONFIRMATION_TEXT, DEFAULT_SESSIONS_PAGE_SIZE } from "./types";
