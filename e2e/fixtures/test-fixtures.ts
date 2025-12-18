import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { AuthPage } from "../pages/AuthPage";
import { FlashcardsPage } from "../pages/FlashcardsPage";
import { GeneratePage } from "../pages/GeneratePage";
import { StudyPage } from "../pages/StudyPage";
import { ProfilePage } from "../pages/ProfilePage";

/**
 * Test user credentials for E2E tests
 * In real tests, these should come from environment variables or test data setup
 */
export const TEST_USER = {
  email: process.env.E2E_TEST_USER_EMAIL ?? "test@example.com",
  password: process.env.E2E_TEST_USER_PASSWORD ?? "TestPassword123!",
};

/**
 * Sample source text for AI generation tests (minimum 1000 characters)
 */
export const SAMPLE_SOURCE_TEXT = `
Programowanie obiektowe (ang. object-oriented programming, OOP) – paradygmat programowania, 
w którym programy definiuje się za pomocą obiektów – elementów łączących stan (czyli dane, 
najczęściej nazywane atrybutami lub polami) i zachowanie (czyli procedury, nazywane 
metodami). Obiektowy program komputerowy wyrażony jest jako zbiór takich obiektów, 
komunikujących się pomiędzy sobą w celu wykonywania zadań.

Podejście to różni się od tradycyjnego programowania proceduralnego, gdzie dane i procedury 
nie są ze sobą bezpośrednio związane. Programowanie obiektowe ma ułatwić pisanie, 
konserwację i wielokrotne użycie programów lub ich fragmentów.

Największym atutem programowania obiektowego jest znaczne ułatwienie tworzenia 
skomplikowanych programów przez pogrupowanie powiązanych ze sobą danych i działających 
na nich funkcji w jedną całość – obiekt.

Główne założenia programowania obiektowego to:
1. Abstrakcja - każdy obiekt w systemie służy jako model abstrakcyjnego "wykonawcy"
2. Enkapsulacja - ukrywanie implementacji, czyli sprawienie, by obiekt nie mógł zmieniać 
   stanu wewnętrznego innych obiektów w nieoczekiwany sposób
3. Polimorfizm - referencje i kolekcje obiektów mogą dotyczyć obiektów różnego typu
4. Dziedziczenie - klasy mogą dziedziczyć metody i pola po innych klasach

Programowanie obiektowe zostało zapoczątkowane przez język Simula 67, stworzony przez 
norweskich informatyków Kristen Nygaard i Ole-Johan Dahl. Następnie rozwinięte przez 
Alana Kaya w języku Smalltalk. Obecnie najpopularniejszymi obiektowymi językami 
programowania są Java, C++, Python, JavaScript i C#.
`.trim();

/**
 * Extended test fixtures with all Page Objects
 */
export const test = base.extend<{
  homePage: HomePage;
  authPage: AuthPage;
  flashcardsPage: FlashcardsPage;
  generatePage: GeneratePage;
  studyPage: StudyPage;
  profilePage: ProfilePage;
  authenticatedPage: Page;
  authenticatedContext: BrowserContext;
}>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },

  flashcardsPage: async ({ page }, use) => {
    const flashcardsPage = new FlashcardsPage(page);
    await use(flashcardsPage);
  },

  generatePage: async ({ page }, use) => {
    const generatePage = new GeneratePage(page);
    await use(generatePage);
  },

  studyPage: async ({ page }, use) => {
    const studyPage = new StudyPage(page);
    await use(studyPage);
  },

  profilePage: async ({ page }, use) => {
    const profilePage = new ProfilePage(page);
    await use(profilePage);
  },

  /**
   * Pre-authenticated browser context
   * Logs in before the test and provides an authenticated page
   */
  authenticatedContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Perform login
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.waitForPageLoad();
    await authPage.loginAndWaitForRedirect(TEST_USER.email, TEST_USER.password);

    await use(context);
    await context.close();
  },

  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from "@playwright/test";

/**
 * Helper function to generate unique test email
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Helper function to generate unique flashcard content
 */
export function generateFlashcardContent(): { front: string; back: string } {
  const timestamp = Date.now();
  return {
    front: `Test question ${timestamp}`,
    back: `Test answer ${timestamp}`,
  };
}
