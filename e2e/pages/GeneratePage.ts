import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Generate page (/generate)
 * Handles AI flashcard generation flow
 */
export class GeneratePage extends BasePage {
  // Header
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;

  // Form elements
  readonly sourceTextArea: Locator;
  readonly characterCounter: Locator;
  readonly generateButton: Locator;
  readonly rateLimitInfo: Locator;

  // Proposal list
  readonly proposalSection: Locator;
  readonly proposalCards: Locator;
  readonly acceptAllButton: Locator;
  readonly rejectAllButton: Locator;
  readonly saveButton: Locator;

  // Statistics
  readonly acceptedCount: Locator;
  readonly rejectedCount: Locator;
  readonly pendingCount: Locator;

  // Loading states
  readonly loadingSpinner: Locator;
  readonly loadingText: Locator;

  // Alerts
  readonly successAlert: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);

    // Header
    this.pageTitle = page.getByRole("heading", { name: /generuj fiszki/i });
    this.pageDescription = page.getByText(/wklej tekst źródłowy/i);

    // Form
    this.sourceTextArea = page.getByRole("textbox", { name: /tekst źródłowy/i });
    this.characterCounter = page.locator("[class*='counter'], [class*='text-xs']").filter({
      hasText: /\d+.*\/.*\d+/,
    });
    this.generateButton = page.getByRole("button", { name: /generuj fiszki/i });
    this.rateLimitInfo = page.locator("[class*='rate-limit'], [class*='limit']");

    // Proposals
    this.proposalSection = page.locator("section").filter({ hasText: /propozycje fiszek/i });
    this.proposalCards = page.locator("[class*='proposal'], [class*='card']").filter({
      has: page.locator("button"),
    });
    this.acceptAllButton = page.getByRole("button", { name: /akceptuj wszystkie/i });
    this.rejectAllButton = page.getByRole("button", { name: /odrzuć wszystkie/i });
    this.saveButton = page.getByRole("button", { name: /zapisz/i });

    // Statistics
    this.acceptedCount = page.locator("[class*='green']").filter({ hasText: /\d+/ });
    this.rejectedCount = page
      .locator("[class*='muted']")
      .filter({ hasText: /odrzuconych/i })
      .locator("span")
      .first();
    this.pendingCount = page.getByText(/oczekujących/i);

    // Loading
    this.loadingSpinner = page.locator("[class*='animate-spin']");
    this.loadingText = page.getByText(/generowanie fiszek/i);

    // Alerts
    this.successAlert = page.locator("[class*='alert']").filter({ hasText: /sukces/i });
    this.errorAlert = page.getByRole("alert").filter({ hasText: /błąd/i });
  }

  async goto(): Promise<void> {
    await this.page.goto("/generate");
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await this.sourceTextArea.waitFor({ state: "visible" });
  }

  // Form actions
  async fillSourceText(text: string): Promise<void> {
    await this.sourceTextArea.fill(text);
  }

  async clearSourceText(): Promise<void> {
    await this.sourceTextArea.clear();
  }

  async generateFlashcards(sourceText: string): Promise<void> {
    await this.fillSourceText(sourceText);
    await this.generateButton.click();
  }

  async waitForGeneration(timeout: number = 60000): Promise<void> {
    // Wait for loading to start
    await this.loadingSpinner.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    // Wait for loading to finish
    await this.loadingSpinner.waitFor({ state: "hidden", timeout });
  }

  // Proposal actions
  async acceptProposal(index: number): Promise<void> {
    const card = this.proposalCards.nth(index);
    const acceptButton = card.getByRole("button", { name: /akceptuj|✓/i });
    await acceptButton.click();
  }

  async rejectProposal(index: number): Promise<void> {
    const card = this.proposalCards.nth(index);
    const rejectButton = card.getByRole("button", { name: /odrzuć|✕|×/i });
    await rejectButton.click();
  }

  async editProposal(index: number, front: string, back: string): Promise<void> {
    const card = this.proposalCards.nth(index);
    const editButton = card.getByRole("button", { name: /edytuj/i });
    await editButton.click();

    const frontInput = card.getByRole("textbox").first();
    const backInput = card.getByRole("textbox").last();

    await frontInput.clear();
    await frontInput.fill(front);
    await backInput.clear();
    await backInput.fill(back);

    const saveButton = card.getByRole("button", { name: /zapisz/i });
    await saveButton.click();
  }

  async acceptAllProposals(): Promise<void> {
    await this.acceptAllButton.click();
  }

  async rejectAllProposals(): Promise<void> {
    await this.rejectAllButton.click();
  }

  async saveAcceptedFlashcards(): Promise<void> {
    await this.saveButton.click();
    // Wait for save to complete
    await this.page.waitForResponse((response) =>
      response.url().includes("/api/flashcards") && response.status() === 201
    ).catch(() => {});
  }

  // State checks
  async getCharacterCount(): Promise<string | null> {
    return this.characterCounter.textContent();
  }

  async isGenerateButtonEnabled(): Promise<boolean> {
    return this.generateButton.isEnabled();
  }

  async hasProposals(): Promise<boolean> {
    return this.proposalSection.isVisible();
  }

  async getProposalCount(): Promise<number> {
    if (!(await this.hasProposals())) return 0;
    return this.proposalCards.count();
  }

  async isLoading(): Promise<boolean> {
    return this.loadingSpinner.isVisible();
  }

  async hasSuccessAlert(): Promise<boolean> {
    return this.successAlert.isVisible();
  }

  async hasErrorAlert(): Promise<boolean> {
    return this.errorAlert.isVisible();
  }

  async getErrorMessage(): Promise<string | null> {
    if (await this.hasErrorAlert()) {
      return this.errorAlert.textContent();
    }
    return null;
  }

  async isRateLimited(): Promise<boolean> {
    const rateLimitText = await this.rateLimitInfo.textContent({ timeout: 2000 }).catch(() => null);
    return rateLimitText?.includes("0") ?? false;
  }
}

