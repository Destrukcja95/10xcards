import { DeleteAccountButton } from "./DeleteAccountButton";

interface AccountSettingsProps {
  /** Callback wywoływany przy kliknięciu przycisku usunięcia */
  onDeleteClick: () => void;
}

/**
 * Sekcja ustawień konta z przyciskiem usunięcia konta.
 */
export function AccountSettings({ onDeleteClick }: AccountSettingsProps) {
  return (
    <section className="mt-10" aria-labelledby="account-settings-heading">
      <h2 id="account-settings-heading" className="mb-4 text-xl font-semibold">
        Ustawienia konta
      </h2>

      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
        <h3 className="mb-2 font-medium text-destructive">Strefa zagrożenia</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Po usunięciu konta wszystkie Twoje dane zostaną trwale usunięte. Ta
          operacja jest nieodwracalna.
        </p>
        <DeleteAccountButton onClick={onDeleteClick} />
      </div>
    </section>
  );
}

