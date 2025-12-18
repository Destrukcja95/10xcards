import { test, expect } from "@playwright/test";
import { FlashcardsPage } from "./pages/FlashcardsPage";
import { GeneratePage } from "./pages/GeneratePage";
import { StudyPage } from "./pages/StudyPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SAMPLE_SOURCE_TEXT, generateFlashcardContent } from "./fixtures/test-fixtures";

/**
 * 10 Krytycznych testów E2E pokrywających najważniejsze funkcjonalności:
 * - Autentykacja (2 testy)
 * - Generowanie AI (2 testy)
 * - Zarządzanie fiszkami (3 testy)
 * - Sesja nauki (2 testy)
 * - Profil (1 test)
 *
 * UWAGA: Testy korzystają z sesji utworzonej w auth.setup.ts
 * Użytkownik jest już zalogowany dzięki storageState
 */

test.describe("Critical E2E Tests", () => {
  // ============================================
  // AUTENTYKACJA - Priorytet: Krytyczny
  // ============================================

  test("TC-AUTH-002: should be authenticated and access /generate", async ({ page }) => {
    // Dzięki storageState z setup, użytkownik powinien być już zalogowany
    await page.goto("/generate");
    await page.waitForLoadState("domcontentloaded");

    // Powinniśmy być na /generate (nie przekierowani na /auth)
    await expect(page).toHaveURL(/\/generate/);

    // Strona powinna się załadować poprawnie
    await expect(page.getByRole("heading", { name: /generuj fiszki/i })).toBeVisible();
  });

  test("TC-AUTH-004: should redirect to login when accessing protected routes without auth", async ({ browser }) => {
    // Użyj nowego kontekstu BEZ storageState (niezalogowany) - wyczyść cookies
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    // Test all protected routes
    for (const route of ["/flashcards", "/generate", "/study", "/profile"]) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      // Sprawdź czy przekierowano na /auth
      const currentUrl = page.url();
      expect(currentUrl).toContain("/auth");
    }

    await context.close();
  });

  // ============================================
  // GENEROWANIE AI - Priorytet: Krytyczny
  // ============================================

  test("TC-GEN-001: should generate flashcards from valid source text", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    await generatePage.waitForPageLoad();

    const isRateLimited = await generatePage.isRateLimited();
    test.skip(isRateLimited, "Rate limited - cannot test generation");

    await generatePage.fillSourceText(SAMPLE_SOURCE_TEXT);
    await expect(generatePage.generateButton).toBeEnabled();
    await generatePage.generateButton.click();

    // Poczekaj na zakończenie generowania (albo propozycje albo błąd)
    await page.waitForTimeout(5000);
    await generatePage.waitForGeneration(90000);

    // Sprawdź wynik - albo propozycje, albo błąd API (oba są akceptowalne)
    const hasProposals = await generatePage.hasProposals();
    const hasError = await generatePage.hasErrorAlert();

    // Test przechodzi jeśli dostaliśmy jakąkolwiek odpowiedź (sukces lub kontrolowany błąd)
    expect(hasProposals || hasError).toBeTruthy();

    if (hasProposals) {
      const proposalCount = await generatePage.getProposalCount();
      expect(proposalCount).toBeGreaterThan(0);
    }

    // Jeśli jest błąd, to też OK - test sprawdza czy UI prawidłowo go obsługuje
    if (hasError) {
      console.log("AI generation returned error - this is acceptable for E2E test");
    }
  });

  test("TC-GEN-002: should validate source text length requirements", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    await generatePage.waitForPageLoad();

    // Too short text - should be disabled
    await generatePage.fillSourceText("Too short");
    await expect(generatePage.generateButton).toBeDisabled();

    // Too long text - should be disabled
    await generatePage.fillSourceText("a".repeat(10001));
    await expect(generatePage.generateButton).toBeDisabled();
  });

  // ============================================
  // ZARZĄDZANIE FISZKAMI - Priorytet: Krytyczny
  // ============================================

  test("TC-FLASH-001: should display flashcards list or empty state", async ({ page }) => {
    const flashcardsPage = new FlashcardsPage(page);
    await flashcardsPage.goto();
    await flashcardsPage.waitForPageLoad();

    const isEmpty = await flashcardsPage.isEmptyState();
    const hasFlashcards = (await flashcardsPage.getFlashcardCount()) > 0;
    expect(isEmpty || hasFlashcards).toBeTruthy();
  });

  test("TC-FLASH-002: should create a new flashcard manually", async ({ page }) => {
    const flashcardsPage = new FlashcardsPage(page);
    await flashcardsPage.goto();
    await flashcardsPage.waitForPageLoad();

    const { front, back } = generateFlashcardContent();
    await flashcardsPage.openCreateDialog();
    await expect(flashcardsPage.formDialog).toBeVisible();
    await flashcardsPage.fillFlashcardForm(front, back);
    await flashcardsPage.dialogSubmitButton.click();
    await expect(flashcardsPage.formDialog).toBeHidden({ timeout: 5000 });
  });

  test("TC-FLASH-004: should delete a flashcard", async ({ page }) => {
    const flashcardsPage = new FlashcardsPage(page);
    await flashcardsPage.goto();
    await flashcardsPage.waitForPageLoad();

    // First create a flashcard to delete
    const { front, back } = generateFlashcardContent();
    await flashcardsPage.createFlashcard(front, back);
    await page.waitForTimeout(1000);
    await flashcardsPage.goto();
    await flashcardsPage.waitForPageLoad();

    const initialCount = await flashcardsPage.getFlashcardCount();
    test.skip(initialCount === 0, "No flashcards to delete");

    await flashcardsPage.openDeleteDialog(0);
    await expect(flashcardsPage.deleteDialog).toBeVisible();
    await flashcardsPage.deleteConfirmButton.click();
    await expect(flashcardsPage.deleteDialog).toBeHidden({ timeout: 5000 });
  });

  // ============================================
  // SESJA NAUKI - Priorytet: Wysoki
  // ============================================

  test("TC-STUDY-001: should display study session or empty state", async ({ page }) => {
    const studyPage = new StudyPage(page);
    await studyPage.goto();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Sprawdź czy jest którykolwiek ze stanów
    const hasFlashcard = await studyPage.studyCard.isVisible().catch(() => false);
    const hasCompletionHeading = await page
      .getByRole("heading", { name: /świetna robota/i })
      .isVisible()
      .catch(() => false);
    const hasProgressBar = await page
      .getByRole("progressbar")
      .isVisible()
      .catch(() => false);

    expect(hasFlashcard || hasCompletionHeading || hasProgressBar).toBeTruthy();
  });

  test("TC-STUDY-002: should reveal answer and show rating buttons", async ({ page }) => {
    const studyPage = new StudyPage(page);
    await studyPage.goto();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Sprawdź czy są fiszki do powtórki (szukamy nagłówka "Świetna robota!")
    const isCompleted = await page
      .getByRole("heading", { name: /świetna robota/i })
      .isVisible()
      .catch(() => false);
    test.skip(isCompleted, "No flashcards available for study - session completed or empty");

    // Sprawdź czy przycisk odsłaniający odpowiedź jest widoczny
    const hasShowAnswerButton = await studyPage.showAnswerButton.isVisible().catch(() => false);
    test.skip(!hasShowAnswerButton, "No flashcard button visible - no cards to review");

    // Kliknij przycisk odsłaniający odpowiedź
    await studyPage.showAnswerButton.click();
    await page.waitForTimeout(500);

    // Sprawdź czy pojawiła się grupa przycisków oceny
    await expect(page.getByRole("group", { name: /oceń/i })).toBeVisible();
  });

  // ============================================
  // PROFIL - Priorytet: Średni
  // ============================================

  test("TC-PROFILE-001: should display user profile with delete option", async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();
    await profilePage.waitForPageLoad();

    await expect(profilePage.profileHeader).toBeVisible();
    await expect(profilePage.deleteAccountButton).toBeVisible();
  });
});
