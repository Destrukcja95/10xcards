import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Home page
 */
export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators - define page elements here
  get heading() {
    return this.getByRole("heading", { level: 1 });
  }

  get mainContent() {
    return this.page.locator("main");
  }

  // Actions
  async goto() {
    await this.page.goto("/");
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState("domcontentloaded");
  }

  // Add more page-specific methods as needed
}

