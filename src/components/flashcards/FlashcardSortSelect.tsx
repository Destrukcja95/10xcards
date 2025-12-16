import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, type SortOption, type SortOrder, type SortValue } from "./types";

interface FlashcardSortSelectProps {
  value: SortValue;
  onChange: (sort: SortOption, order: SortOrder) => void;
  disabled?: boolean;
}

/**
 * Dropdown do wyboru pola i kierunku sortowania listy fiszek
 */
export function FlashcardSortSelect({
  value,
  onChange,
  disabled = false,
}: FlashcardSortSelectProps) {
  const handleValueChange = (newValue: string) => {
    const option = SORT_OPTIONS.find((opt) => opt.value === newValue);
    if (option) {
      onChange(option.sort, option.order);
    }
  };

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger
        className="w-[220px]"
        aria-label="Sortuj fiszki według"
      >
        <SelectValue placeholder="Wybierz sortowanie" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

