import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Authentication page (/auth)
 * Handles login and registration forms
 */
export class AuthPage extends BasePage {
  // Login form locators
  readonly loginTab: Locator;
  readonly registerTab: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly authCard: Locator;
  readonly errorAlert: Locator;
  readonly emailVerificationCard: Locator;

  constructor(page: Page) {
    super(page);

    // Tabs
    this.loginTab = page.getByRole("tab", { name: /zaloguj/i });
    this.registerTab = page.getByRole("tab", { name: /zarejestruj/i });

    // Form inputs
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/^hasło$/i);
    this.confirmPasswordInput = page.getByLabel(/powtórz hasło/i);

    // Buttons
    this.loginButton = page.getByRole("button", { name: /zaloguj się/i });
    this.registerButton = page.getByRole("button", { name: /zarejestruj się/i });

    // Cards and alerts
    this.authCard = page.locator("[class*='card']").first();
    this.errorAlert = page.getByRole("alert");
    this.emailVerificationCard = page.getByText(/sprawdź swoją skrzynkę/i);
  }

  async goto(): Promise<void> {
    await this.page.goto("/auth");
  }

  async gotoWithTab(tab: "login" | "register"): Promise<void> {
    await this.page.goto(`/auth?tab=${tab}`);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await this.authCard.waitFor({ state: "visible" });
  }

  // Tab navigation
  async switchToLogin(): Promise<void> {
    await this.loginTab.click();
    await this.loginButton.waitFor({ state: "visible" });
  }

  async switchToRegister(): Promise<void> {
    await this.registerTab.click();
    await this.registerButton.waitFor({ state: "visible" });
  }

  // Login actions
  async fillLoginForm(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillLoginForm(email, password);
    await this.loginButton.click();
  }

  async loginAndWaitForRedirect(email: string, password: string, expectedUrl = "/generate"): Promise<void> {
    await this.login(email, password);
    await this.page.waitForURL(`**${expectedUrl}`);
  }

  // Register actions
  async fillRegisterForm(email: string, password: string, confirmPassword: string): Promise<void> {
    await this.switchToRegister();
    await this.emailInput.fill(email);
    // Need to get password fields by placeholder due to multiple password fields
    await this.page.getByPlaceholder(/minimum 8 znaków/i).fill(password);
    await this.page.getByPlaceholder(/powtórz hasło/i).fill(confirmPassword);
  }

  async register(email: string, password: string, confirmPassword?: string): Promise<void> {
    await this.fillRegisterForm(email, password, confirmPassword ?? password);
    await this.registerButton.click();
  }

  // Validation helpers
  async getFieldError(fieldLabel: string): Promise<string | null> {
    const field = this.page.getByLabel(new RegExp(fieldLabel, "i"));
    const errorId = await field.getAttribute("aria-describedby");
    if (!errorId) return null;

    const errorElement = this.page.locator(`#${errorId}`);
    if (await errorElement.isVisible()) {
      return errorElement.textContent();
    }
    return null;
  }

  async hasErrorAlert(): Promise<boolean> {
    return this.errorAlert.isVisible();
  }

  async getErrorAlertText(): Promise<string | null> {
    if (await this.hasErrorAlert()) {
      return this.errorAlert.textContent();
    }
    return null;
  }

  async isEmailVerificationVisible(): Promise<boolean> {
    return this.emailVerificationCard.isVisible();
  }

  // State checks
  async isOnLoginTab(): Promise<boolean> {
    return this.loginButton.isVisible();
  }

  async isOnRegisterTab(): Promise<boolean> {
    return this.registerButton.isVisible();
  }
}
