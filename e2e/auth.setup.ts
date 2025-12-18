import { test as setup, expect } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Plik konfiguracyjny z credentials użytkownika testowego
 */
const AUTH_FILE = join(__dirname, ".auth", "user.json");
const CREDENTIALS_FILE = join(__dirname, ".auth", "credentials.json");

/**
 * Generuje unikalne dane użytkownika testowego
 */
function generateTestUser() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return {
    email: `e2e-test-${timestamp}-${random}@test.local`,
    password: `TestPassword${timestamp}!`,
  };
}

/**
 * Setup: Rejestracja lub logowanie użytkownika testowego
 * Ten test uruchamia się jako pierwszy i tworzy/loguje użytkownika do pozostałych testów
 *
 * WAŻNE: Jeśli Supabase wymaga weryfikacji email, ustaw zmienne środowiskowe:
 * E2E_TEST_USER_EMAIL - email istniejącego użytkownika
 * E2E_TEST_USER_PASSWORD - hasło tego użytkownika
 */
setup("create test user and authenticate", async ({ page }) => {
  // Utwórz folder .auth jeśli nie istnieje
  const authDir = dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  let testUser: { email: string; password: string };
  let authenticated = false;

  // OPCJA 1: Użyj credentials ze zmiennych środowiskowych (zalecane)
  if (process.env.E2E_TEST_USER_EMAIL && process.env.E2E_TEST_USER_PASSWORD) {
    testUser = {
      email: process.env.E2E_TEST_USER_EMAIL,
      password: process.env.E2E_TEST_USER_PASSWORD,
    };
    console.log(`Using test user from env: ${testUser.email}`);

    await page.goto("/auth");
    await page.waitForLoadState("domcontentloaded");

    // Sprawdź czy już zalogowany
    if (!page.url().includes("/auth")) {
      console.log("Already authenticated (redirected from /auth)");
      authenticated = true;
    } else {
      // Zaloguj się
      await page.getByLabel(/email/i).fill(testUser.email);
      await page.getByLabel(/^hasło$/i).fill(testUser.password);
      await page.getByRole("button", { name: /zaloguj się/i }).click();

      try {
        await page.waitForURL("**/generate", { timeout: 10000 });
        authenticated = true;
      } catch {
        // Sprawdź czy jest błąd logowania
        const hasError = await page
          .getByText(/nieprawidłowy|błąd/i)
          .isVisible()
          .catch(() => false);
        if (hasError) {
          throw new Error(
            `Login failed for ${testUser.email}. ` + "Sprawdź czy użytkownik istnieje i ma poprawne hasło."
          );
        }
      }
    }
  }

  // OPCJA 2: Spróbuj utworzyć nowego użytkownika
  if (!authenticated) {
    testUser = generateTestUser();
    console.log(`Attempting to register new user: ${testUser.email}`);

    await page.goto("/auth?tab=register");
    await page.waitForLoadState("domcontentloaded");

    // Poczekaj aż tab rejestracji jest aktywny
    await page.getByRole("tab", { name: /zarejestruj się/i }).click();
    await page.waitForTimeout(500);

    // Wypełnij formularz rejestracji - użyj dokładnych labels
    const emailInput = page.getByLabel("Email");
    const passwordInput = page.getByLabel("Hasło", { exact: true });
    const confirmPasswordInput = page.getByLabel("Powtórz hasło");

    await emailInput.fill(testUser.email);
    await passwordInput.fill(testUser.password);
    await confirmPasswordInput.fill(testUser.password);

    // Kliknij przycisk rejestracji
    await page.getByRole("button", { name: /zarejestruj się/i }).click();

    // Poczekaj na wynik
    await page.waitForTimeout(3000);

    // Sprawdź czy redirect na /generate (auto-login po rejestracji)
    if (page.url().includes("/generate")) {
      authenticated = true;
      console.log("Registration successful - auto-logged in");
    }

    // Sprawdź czy wymagana weryfikacja email
    const requiresVerification = await page
      .getByText(/sprawdź swoją skrzynkę/i)
      .isVisible()
      .catch(() => false);

    if (requiresVerification) {
      throw new Error(
        "Email verification is required by Supabase.\n" +
          "Rozwiązania:\n" +
          "1. Wyłącz weryfikację email w Supabase Dashboard > Authentication > Settings\n" +
          "2. LUB ustaw zmienne środowiskowe z credentials istniejącego użytkownika:\n" +
          "   export E2E_TEST_USER_EMAIL='twoj@email.com'\n" +
          "   export E2E_TEST_USER_PASSWORD='TwojeHaslo123!'"
      );
    }

    // Sprawdź czy jest inny błąd
    const errorAlert = page.getByRole("alert");
    if (await errorAlert.isVisible().catch(() => false)) {
      const errorText = await errorAlert.textContent();
      if (!authenticated && errorText?.includes("Błąd")) {
        throw new Error(`Registration failed: ${errorText}`);
      }
    }
  }

  // Finalna weryfikacja
  if (!authenticated) {
    throw new Error("Could not authenticate test user");
  }

  await expect(page).toHaveURL(/\/generate/);
  // eslint-disable-next-line no-console
  console.log(`✓ Successfully authenticated as: ${testUser.email}`);

  // Zapisz credentials do pliku
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(testUser, null, 2));

  // Zapisz stan storage (cookies, localStorage)
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`✓ Auth state saved to: ${AUTH_FILE}`);
});
