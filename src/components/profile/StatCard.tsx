import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  /** Etykieta opisująca statystykę */
  label: string;
  /** Wartość do wyświetlenia */
  value: number | string;
  /** Opcjonalna ikona (element React) */
  icon?: React.ReactNode;
  /** Wariant wyświetlania */
  variant?: "default" | "highlight";
  /** Czy pokazać skeleton podczas ładowania */
  isLoading?: boolean;
}

/**
 * Pojedyncza karta statystyki z etykietą, wartością liczbową i opcjonalną ikoną.
 */
export function StatCard({ label, value, icon, variant = "default", isLoading = false }: StatCardProps) {
  return (
    <Card className={variant === "highlight" ? "border-primary/50 bg-primary/5" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon && (
          <div className={variant === "highlight" ? "text-primary" : "text-muted-foreground"} aria-hidden="true">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className={`text-2xl font-bold tabular-nums ${variant === "highlight" ? "text-primary" : ""}`}>
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
