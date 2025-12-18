import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProposalEditForm } from "./ProposalEditForm";
import { cn } from "@/lib/utils";
import type { ProposalViewModel } from "./types";

interface ProposalCardProps {
  proposal: ProposalViewModel;
  onAccept: () => void;
  onReject: () => void;
  onEdit: (front: string, back: string) => void;
  onUndo: () => void;
}

/**
 * ProposalCard - pojedyncza karta propozycji fiszki z akcjami i możliwością edycji inline
 */
export function ProposalCard({ proposal, onAccept, onReject, onEdit, onUndo }: ProposalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { status, front, back } = proposal;

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = (newFront: string, newBack: string) => {
    onEdit(newFront, newBack);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Style zależne od stanu
  const cardStyles = cn(
    "transition-all duration-200",
    status === "accepted" && "border-green-500 bg-green-50/50 dark:bg-green-950/20",
    status === "rejected" && "border-muted bg-muted/30 opacity-60"
  );

  // Tryb edycji - renderuj formularz
  if (isEditing) {
    return (
      <Card className={cardStyles}>
        <CardContent className="pt-6">
          <ProposalEditForm
            initialFront={front}
            initialBack={back}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardStyles}>
      {/* Nagłówek z przód fiszki */}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Przód</div>
            <p className={cn("text-base font-medium", status === "rejected" && "line-through")}>{front}</p>
          </div>
          {/* Status badge */}
          {status === "accepted" && <StatusBadge variant="success">Zaakceptowana</StatusBadge>}
          {status === "rejected" && <StatusBadge variant="muted">Odrzucona</StatusBadge>}
        </div>
      </CardHeader>

      {/* Treść z tył fiszki */}
      <CardContent className="pt-0">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Tył</div>
        <p className={cn("text-sm text-muted-foreground", status === "rejected" && "line-through")}>{back}</p>
      </CardContent>

      {/* Przyciski akcji */}
      <CardFooter className="flex justify-end gap-2 pt-0">
        {status === "pending" && (
          <>
            <Button variant="outline" size="sm" onClick={onReject}>
              <XIcon />
              Odrzuć
            </Button>
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              <PencilIcon />
              Edytuj
            </Button>
            <Button size="sm" onClick={onAccept}>
              <CheckIcon />
              Akceptuj
            </Button>
          </>
        )}

        {status === "accepted" && (
          <>
            <Button variant="outline" size="sm" onClick={onUndo}>
              <UndoIcon />
              Cofnij
            </Button>
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              <PencilIcon />
              Edytuj
            </Button>
          </>
        )}

        {status === "rejected" && (
          <Button variant="outline" size="sm" onClick={onUndo}>
            <UndoIcon />
            Przywróć
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * StatusBadge - mały badge ze statusem
 */
function StatusBadge({ children, variant }: { children: React.ReactNode; variant: "success" | "muted" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        variant === "success" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        variant === "muted" && "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

// Ikony SVG
function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
  );
}
