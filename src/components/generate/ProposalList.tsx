import { ProposalCard } from "./ProposalCard";
import type { ProposalViewModel } from "./types";

interface ProposalListProps {
  proposals: ProposalViewModel[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, front: string, back: string) => void;
  onUndo: (id: string) => void;
}

/**
 * ProposalList - kontener renderujący listę kart z propozycjami fiszek
 */
export function ProposalList({
  proposals,
  onAccept,
  onReject,
  onEdit,
  onUndo,
}: ProposalListProps) {
  if (proposals.length === 0) {
    return null;
  }

  return (
    <div
      className="space-y-4"
      role="region"
      aria-label="Lista propozycji fiszek"
      aria-live="polite"
    >
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          onAccept={() => onAccept(proposal.id)}
          onReject={() => onReject(proposal.id)}
          onEdit={(front, back) => onEdit(proposal.id, front, back)}
          onUndo={() => onUndo(proposal.id)}
        />
      ))}
    </div>
  );
}

