import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Study page (/study)
 * Handles flashcard study session flow
 */
export class StudyPage extends BasePage {
  // Progress indicators
  readonly progressBar: Locator;
  readonly progressText: Locator;
  readonly currentIndex: Locator;
  readonly totalCount: Locator;

  // Study card
  readonly studyCard: Locator;
  readonly cardFront: Locator;
  readonly cardBack: Locator;
  readonly showAnswerButton: Locator;

  // Rating buttons
  readonly ratingButtons: Locator;
  readonly ratingButton0: Locator;
  readonly ratingButton1: Locator;
  readonly ratingButton2: Locator;
  readonly ratingButton3: Locator;
  readonly ratingButton4: Locator;
  readonly ratingButton5: Locator;

  // Empty state
  readonly emptyState: Locator;
  readonly noFlashcardsMessage: Locator;

  // Complete state
  readonly completeState: Locator;
  readonly reviewedCountText: Locator;
  readonly continueButton: Locator;

  // Next review info
  readonly nextReviewInfo: Locator;

  // Loading and error states
  readonly skeleton: Locator;
  readonly errorAlert: Locator;
  readonly retryButton: Locator;

  constructor(page: Page) {
    super(page);

    // Progress
    this.progressBar = page.locator("[class*='progress']");
    this.progressText = page.getByText(/\d+\s*\/\s*\d+/);
    this.currentIndex = page.locator("[class*='current']");
    this.totalCount = page.locator("[class*='total']");

    // Study card
    this.studyCard = page.getByRole("button", { name: /odsłonić odpowiedź|pokaż odpowiedź/i });
    this.cardFront = page.locator("[class*='front'], [class*='question']");
    this.cardBack = page.locator("[class*='back'], [class*='answer']");
    this.showAnswerButton = page.getByRole("button", { name: /odsłonić odpowiedź|pokaż odpowiedź/i });

    // Rating
    this.ratingButtons = page.getByRole("group", { name: /oceń/i });
    this.ratingButton0 = page.getByRole("button", { name: /0|nie pamiętam|całkowicie/i });
    this.ratingButton1 = page.getByRole("button", { name: /1|ledwo/i });
    this.ratingButton2 = page.getByRole("button", { name: /2|trudno/i });
    this.ratingButton3 = page.getByRole("button", { name: /3|dobrze/i });
    this.ratingButton4 = page.getByRole("button", { name: /4|łatwo/i });
    this.ratingButton5 = page.getByRole("button", { name: /5|bardzo łatwo|perfekcyjnie/i });

    // Empty state
    this.emptyState = page.getByText(/brak fiszek do powtórki/i);
    this.noFlashcardsMessage = page.getByText(/gratulacje|wszystkie fiszki powtórzone/i);

    // Complete state
    this.completeState = page.locator("[class*='complete']");
    this.reviewedCountText = page.getByText(/powtórzono|ukończono/i);
    this.continueButton = page.getByRole("button", { name: /kontynuuj|następn/i });

    // Next review
    this.nextReviewInfo = page.locator("[class*='next-review'], [class*='info']").filter({
      hasText: /następna powtórka/i,
    });

    // Loading/Error
    this.skeleton = page.locator("[class*='skeleton']").first();
    this.errorAlert = page.getByRole("alert").filter({ hasText: /błąd/i });
    this.retryButton = page.getByRole("button", { name: /spróbuj ponownie/i });
  }

  async goto(): Promise<void> {
    await this.page.goto("/study");
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for either study card, empty state, or loading to appear
    await Promise.race([
      this.studyCard.waitFor({ state: "visible", timeout: 10000 }).catch(() => {
        /* intentionally empty - race condition handling */
      }),
      this.emptyState.waitFor({ state: "visible", timeout: 10000 }).catch(() => {
        /* intentionally empty - race condition handling */
      }),
      this.skeleton.waitFor({ state: "visible", timeout: 5000 }).catch(() => {
        /* intentionally empty - race condition handling */
      }),
    ]);
    // If skeleton appeared, wait for it to disappear
    if (await this.skeleton.isVisible()) {
      await this.skeleton.waitFor({ state: "hidden", timeout: 10000 });
    }
  }

  // Study session actions
  async showAnswer(): Promise<void> {
    await this.showAnswerButton.click();
    // Wait for rating buttons to appear
    await this.ratingButtons
      .first()
      .waitFor({ state: "visible", timeout: 5000 })
      .catch(() => {
        /* intentionally empty - buttons may already be visible */
      });
  }

  async rateFlashcard(rating: 0 | 1 | 2 | 3 | 4 | 5): Promise<void> {
    const ratingButtonMap: Record<number, Locator> = {
      0: this.ratingButton0,
      1: this.ratingButton1,
      2: this.ratingButton2,
      3: this.ratingButton3,
      4: this.ratingButton4,
      5: this.ratingButton5,
    };
    await ratingButtonMap[rating].click();
  }

  async studyCard(rating: 0 | 1 | 2 | 3 | 4 | 5): Promise<void> {
    await this.showAnswer();
    await this.rateFlashcard(rating);
  }

  async continueSession(): Promise<void> {
    await this.continueButton.click();
  }

  async retryAfterError(): Promise<void> {
    await this.retryButton.click();
  }

  // State checks
  async isEmpty(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  async isComplete(): Promise<boolean> {
    return this.completeState.isVisible() || (await this.page.getByText(/gratulacje/i).isVisible());
  }

  async isLoading(): Promise<boolean> {
    return this.skeleton.isVisible();
  }

  async hasError(): Promise<boolean> {
    return this.errorAlert.isVisible();
  }

  async isCardFlipped(): Promise<boolean> {
    // Check if answer/back side is visible
    const isBackVisible = await this.cardBack.isVisible().catch(() => false);
    const hasRatingButtons = await this.ratingButtons
      .first()
      .isVisible()
      .catch(() => false);
    return isBackVisible || hasRatingButtons;
  }

  async getCurrentFlashcardText(): Promise<{ front: string; back?: string }> {
    const front = (await this.cardFront.textContent()) ?? "";
    let back: string | undefined;
    if (await this.isCardFlipped()) {
      back = (await this.cardBack.textContent()) ?? undefined;
    }
    return { front, back };
  }

  async getProgress(): Promise<{ current: number; total: number } | null> {
    const progressText = await this.progressText.textContent();
    if (!progressText) return null;

    const match = progressText.match(/(\d+)\s*\/\s*(\d+)/);
    if (!match) return null;

    return {
      current: parseInt(match[1], 10),
      total: parseInt(match[2], 10),
    };
  }
}
