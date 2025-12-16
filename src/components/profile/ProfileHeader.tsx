interface ProfileHeaderProps {
  /** Email zalogowanego użytkownika */
  userEmail?: string;
}

/**
 * Nagłówek widoku profilu z tytułem i opcjonalnie emailem użytkownika.
 */
export function ProfileHeader({ userEmail }: ProfileHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
      {userEmail && (
        <p className="mt-2 text-muted-foreground">{userEmail}</p>
      )}
    </header>
  );
}

