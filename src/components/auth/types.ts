/**
 * Błędy walidacji formularza logowania
 */
export interface LoginFormErrors {
  email?: string;
  password?: string;
}

/**
 * Błędy walidacji formularza rejestracji
 */
export interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Typ zakładki autoryzacji
 */
export type AuthTabValue = "login" | "register";

/**
 * Mapowanie kodów błędów Supabase na komunikaty użytkownika
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Nieprawidłowy email lub hasło",
  "Email not confirmed": "Email nie został potwierdzony. Sprawdź skrzynkę pocztową",
  "User already registered": "Użytkownik z tym adresem email już istnieje",
  "Password should be at least 6 characters": "Hasło musi mieć co najmniej 6 znaków",
  "Unable to validate email address: invalid format": "Nieprawidłowy format adresu email",
  "Signup requires a valid password": "Rejestracja wymaga podania hasła",
  "Email rate limit exceeded": "Zbyt wiele prób. Spróbuj ponownie za chwilę",
};

/**
 * Funkcja pomocnicza do tłumaczenia komunikatów błędów Supabase
 */
export function getAuthErrorMessage(errorMessage: string): string {
  return AUTH_ERROR_MESSAGES[errorMessage] ?? "Wystąpił nieoczekiwany błąd. Spróbuj ponownie";
}
