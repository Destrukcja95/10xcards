import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Profile page (/profile)
 * Handles user profile, statistics, and account settings
 */
export class ProfilePage extends BasePage {
  // Header
  readonly profileHeader: Locator;
  readonly userEmail: Locator;

  // Statistics overview
  readonly statsSection: Locator;
  readonly totalFlashcardsCount: Locator;
  readonly totalGeneratedCount: Locator;
  readonly acceptanceRate: Locator;

  // Generation history
  readonly historySection: Locator;
  readonly historyTable: Locator;
  readonly historyRows: Locator;
  readonly historyEmptyState: Locator;
  readonly historyPagination: Locator;
  readonly historyPreviousButton: Locator;
  readonly historyNextButton: Locator;

  // Account settings
  readonly accountSettingsSection: Locator;
  readonly deleteAccountButton: Locator;

  // Delete account dialog
  readonly deleteDialog: Locator;
  readonly deleteConfirmInput: Locator;
  readonly deleteConfirmButton: Locator;
  readonly deleteCancelButton: Locator;
  readonly deleteError: Locator;

  // Alerts
  readonly successAlert: Locator;
  readonly errorAlert: Locator;

  // Loading states
  readonly statsSkeleton: Locator;
  readonly historySkeleton: Locator;

  constructor(page: Page) {
    super(page);

    // Header
    this.profileHeader = page.getByRole("heading", { name: /profil|mój profil/i });
    this.userEmail = page.locator("[class*='email'], [class*='header']").filter({
      hasText: /@/,
    });

    // Statistics
    this.statsSection = page.locator("[class*='stats'], section").filter({
      hasText: /statystyki|fiszek/i,
    });
    this.totalFlashcardsCount = page.locator("[class*='stat']").filter({
      hasText: /fiszek/i,
    });
    this.totalGeneratedCount = page.locator("[class*='stat']").filter({
      hasText: /wygenerowanych/i,
    });
    this.acceptanceRate = page.locator("[class*='stat']").filter({
      hasText: /akceptacji/i,
    });

    // Generation history
    this.historySection = page.locator("section").filter({
      hasText: /historia generowania/i,
    });
    this.historyTable = page.locator("table");
    this.historyRows = page.locator("tbody tr");
    this.historyEmptyState = page.getByText(/brak historii|nie masz jeszcze/i);
    this.historyPagination = page.locator("[class*='pagination']").last();
    this.historyPreviousButton = this.historyPagination.getByRole("button", { name: /poprzedni|previous/i });
    this.historyNextButton = this.historyPagination.getByRole("button", { name: /następn|next/i });

    // Account settings
    this.accountSettingsSection = page.locator("section").filter({
      hasText: /ustawienia konta/i,
    });
    this.deleteAccountButton = page.getByRole("button", { name: /usuń konto/i });

    // Delete dialog
    this.deleteDialog = page.getByRole("dialog");
    this.deleteConfirmInput = page.getByPlaceholder(/usuń|delete/i);
    this.deleteConfirmButton = this.deleteDialog.getByRole("button", { name: /usuń konto|potwierdź/i });
    this.deleteCancelButton = this.deleteDialog.getByRole("button", { name: /anuluj/i });
    this.deleteError = this.deleteDialog.locator("[class*='error'], [class*='destructive']");

    // Alerts
    this.successAlert = page.locator("[class*='alert']").filter({ hasText: /sukces/i });
    this.errorAlert = page.getByRole("alert").filter({ hasText: /błąd/i });

    // Loading
    this.statsSkeleton = page.locator("[class*='skeleton']").first();
    this.historySkeleton = page.locator("[class*='skeleton']").last();
  }

  async goto(): Promise<void> {
    await this.page.goto("/profile");
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for stats to load
    await Promise.race([
      this.statsSection.waitFor({ state: "visible", timeout: 10000 }).catch(() => {
        /* intentionally empty - race condition handling */
      }),
      this.profileHeader.waitFor({ state: "visible", timeout: 10000 }).catch(() => {
        /* intentionally empty - race condition handling */
      }),
    ]);
  }

  // Statistics
  async getStats(): Promise<{
    totalFlashcards?: string;
    totalGenerated?: string;
    acceptanceRate?: string;
  }> {
    const stats: {
      totalFlashcards?: string;
      totalGenerated?: string;
      acceptanceRate?: string;
    } = {};

    if (await this.totalFlashcardsCount.isVisible()) {
      stats.totalFlashcards = (await this.totalFlashcardsCount.textContent()) ?? undefined;
    }
    if (await this.totalGeneratedCount.isVisible()) {
      stats.totalGenerated = (await this.totalGeneratedCount.textContent()) ?? undefined;
    }
    if (await this.acceptanceRate.isVisible()) {
      stats.acceptanceRate = (await this.acceptanceRate.textContent()) ?? undefined;
    }

    return stats;
  }

  // Generation history
  async getHistoryRowCount(): Promise<number> {
    return this.historyRows.count();
  }

  async hasHistoryEmptyState(): Promise<boolean> {
    return this.historyEmptyState.isVisible();
  }

  async goToNextHistoryPage(): Promise<void> {
    await this.historyNextButton.click();
    await this.waitForNetworkIdle();
  }

  async goToPreviousHistoryPage(): Promise<void> {
    await this.historyPreviousButton.click();
    await this.waitForNetworkIdle();
  }

  // Account deletion flow
  async openDeleteDialog(): Promise<void> {
    await this.deleteAccountButton.click();
    await this.deleteDialog.waitFor({ state: "visible" });
  }

  async fillDeleteConfirmation(text: string): Promise<void> {
    await this.deleteConfirmInput.fill(text);
  }

  async confirmDeleteAccount(): Promise<void> {
    await this.deleteConfirmButton.click();
  }

  async cancelDeleteAccount(): Promise<void> {
    await this.deleteCancelButton.click();
    await this.deleteDialog.waitFor({ state: "hidden" });
  }

  async deleteAccount(confirmText = "usuń"): Promise<void> {
    await this.openDeleteDialog();
    await this.fillDeleteConfirmation(confirmText);
    await this.confirmDeleteAccount();
  }

  // State checks
  async getUserEmail(): Promise<string | null> {
    return this.userEmail.textContent();
  }

  async hasSuccessAlert(): Promise<boolean> {
    return this.successAlert.isVisible();
  }

  async hasErrorAlert(): Promise<boolean> {
    return this.errorAlert.isVisible();
  }

  async hasDeleteError(): Promise<boolean> {
    return this.deleteError.isVisible();
  }

  async isStatsLoading(): Promise<boolean> {
    return this.statsSkeleton.isVisible();
  }

  async isHistoryLoading(): Promise<boolean> {
    return this.historySkeleton.isVisible();
  }
}
