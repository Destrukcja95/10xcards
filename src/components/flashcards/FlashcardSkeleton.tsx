import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader dla karty fiszki
 * Dopasowany do layoutu FlashcardCard
 */
export function FlashcardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        {/* Badge placeholder */}
        <Skeleton className="h-5 w-12" />
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Przód fiszki */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        {/* Tył fiszki */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-2">
        {/* Przyciski akcji */}
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-16" />
      </CardFooter>
    </Card>
  );
}

