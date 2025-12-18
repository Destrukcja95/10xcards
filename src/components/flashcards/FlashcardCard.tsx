import { memo } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FlashcardDTO } from "@/types";

interface FlashcardCardProps {
  flashcard: FlashcardDTO;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Pojedyncza karta fiszki wyświetlająca przód, tył, badge źródła oraz przyciski akcji
 */
export const FlashcardCard = memo(function FlashcardCard({ flashcard, onEdit, onDelete }: FlashcardCardProps) {
  const isAiGenerated = flashcard.source === "ai_generated";

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        {isAiGenerated ? (
          <Badge
            variant="secondary"
            className="w-fit bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          >
            AI
          </Badge>
        ) : (
          <Badge variant="outline" className="w-fit">
            Ręczna
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Przód fiszki */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Przód</p>
          <p className="line-clamp-3 text-sm text-foreground">{flashcard.front}</p>
        </div>

        {/* Tył fiszki */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tył</p>
          <p className="line-clamp-4 text-sm text-foreground">{flashcard.back}</p>
        </div>
      </CardContent>

      <CardFooter className="gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          aria-label={`Edytuj fiszkę: ${flashcard.front.substring(0, 30)}...`}
        >
          Edytuj
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Usuń fiszkę: ${flashcard.front.substring(0, 30)}...`}
        >
          Usuń
        </Button>
      </CardFooter>
    </Card>
  );
});
