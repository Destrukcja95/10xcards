import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Flashcards page (/flashcards)
 * Handles CRUD operations on flashcards
 */
export class FlashcardsPage extends BasePage {
  // Header locators
  readonly pageTitle: Locator;
  readonly flashcardCount: Locator;
  readonly addButton: Locator;
  readonly sortSelect: Locator;

  // Flashcard list
  readonly flashcardList: Locator;
  readonly flashcardCards: Locator;
  readonly emptyState: Locator;

  // Pagination
  readonly pagination: Locator;
  readonly previousPageButton: Locator;
  readonly nextPageButton: Locator;

  // Dialog elements
  readonly formDialog: Locator;
  readonly frontInput: Locator;
  readonly backInput: Locator;
  readonly dialogSubmitButton: Locator;
  readonly dialogCancelButton: Locator;

  // Delete confirmation dialog
  readonly deleteDialog: Locator;
  readonly deleteConfirmButton: Locator;
  readonly deleteCancelButton: Locator;

  // Alerts
  readonly successAlert: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);

    // Header
    this.pageTitle = page.getByRole("heading", { name: /moje fiszki/i });
    this.flashcardCount = page.locator("[class*='header']").getByText(/fiszek/i);
    this.addButton = page.getByRole("button", { name: /dodaj fiszkę/i });
    this.sortSelect = page.locator("[data-testid='sort-select']");

    // List
    this.flashcardList = page.locator("[class*='grid'], [class*='list']").first();
    this.flashcardCards = page.locator("[class*='card']");
    this.emptyState = page.getByText(/nie masz jeszcze żadnych fiszek/i);

    // Pagination
    this.pagination = page.locator("[class*='pagination']");
    this.previousPageButton = page.getByRole("button", { name: /poprzedni|previous/i });
    this.nextPageButton = page.getByRole("button", { name: /następn|next/i });

    // Form dialog
    this.formDialog = page.getByRole("dialog");
    this.frontInput = page.getByLabel(/przód fiszki/i);
    this.backInput = page.getByLabel(/tył fiszki/i);
    this.dialogSubmitButton = this.formDialog.getByRole("button", { name: /zapisz|dodaj|utwórz/i });
    this.dialogCancelButton = this.formDialog.getByRole("button", { name: /anuluj/i });

    // Delete dialog
    this.deleteDialog = page.getByRole("dialog");
    this.deleteConfirmButton = page.getByRole("button", { name: /usuń$/i });
    this.deleteCancelButton = this.deleteDialog.getByRole("button", { name: /anuluj/i });

    // Alerts
    this.successAlert = page.locator("[class*='alert']").filter({ hasText: /sukces/i });
    this.errorAlert = page.getByRole("alert").filter({ hasText: /błąd/i });
  }

  async goto(): Promise<void> {
    await this.page.goto("/flashcards");
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for either flashcard list or empty state
    await Promise.race([
      this.flashcardList.waitFor({ state: "visible", timeout: 10000 }).catch(() => {}),
      this.emptyState.waitFor({ state: "visible", timeout: 10000 }).catch(() => {}),
    ]);
  }

  // Create flashcard
  async openCreateDialog(): Promise<void> {
    await this.addButton.click();
    await this.formDialog.waitFor({ state: "visible" });
  }

  async fillFlashcardForm(front: string, back: string): Promise<void> {
    await this.frontInput.fill(front);
    await this.backInput.fill(back);
  }

  async createFlashcard(front: string, back: string): Promise<void> {
    await this.openCreateDialog();
    await this.fillFlashcardForm(front, back);
    await this.dialogSubmitButton.click();
    await this.formDialog.waitFor({ state: "hidden" });
  }

  // Edit flashcard
  async openEditDialog(index: number = 0): Promise<void> {
    const editButton = this.flashcardCards.nth(index).getByRole("button", { name: /edytuj/i });
    await editButton.click();
    await this.formDialog.waitFor({ state: "visible" });
  }

  async editFlashcard(index: number, front: string, back: string): Promise<void> {
    await this.openEditDialog(index);
    await this.frontInput.clear();
    await this.frontInput.fill(front);
    await this.backInput.clear();
    await this.backInput.fill(back);
    await this.dialogSubmitButton.click();
    await this.formDialog.waitFor({ state: "hidden" });
  }

  // Delete flashcard
  async openDeleteDialog(index: number = 0): Promise<void> {
    const deleteButton = this.flashcardCards.nth(index).getByRole("button", { name: /usuń/i });
    await deleteButton.click();
    await this.deleteDialog.waitFor({ state: "visible" });
  }

  async deleteFlashcard(index: number = 0): Promise<void> {
    await this.openDeleteDialog(index);
    await this.deleteConfirmButton.click();
    await this.deleteDialog.waitFor({ state: "hidden" });
  }

  async cancelDelete(): Promise<void> {
    await this.deleteCancelButton.click();
    await this.deleteDialog.waitFor({ state: "hidden" });
  }

  // Pagination
  async goToNextPage(): Promise<void> {
    await this.nextPageButton.click();
    await this.waitForNetworkIdle();
  }

  async goToPreviousPage(): Promise<void> {
    await this.previousPageButton.click();
    await this.waitForNetworkIdle();
  }

  // Sort
  async changeSortBy(sortOption: string): Promise<void> {
    await this.sortSelect.click();
    await this.page.getByRole("option", { name: new RegExp(sortOption, "i") }).click();
    await this.waitForNetworkIdle();
  }

  // State checks
  async getFlashcardCount(): Promise<number> {
    return this.flashcardCards.count();
  }

  async isEmptyState(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  async hasSuccessAlert(): Promise<boolean> {
    return this.successAlert.isVisible();
  }

  async hasErrorAlert(): Promise<boolean> {
    return this.errorAlert.isVisible();
  }

  async getFlashcardContent(index: number): Promise<{ front: string; back: string }> {
    const card = this.flashcardCards.nth(index);
    const front = await card.locator("[class*='front'], p").first().textContent() ?? "";
    const back = await card.locator("[class*='back'], p").nth(1).textContent() ?? "";
    return { front, back };
  }
}

