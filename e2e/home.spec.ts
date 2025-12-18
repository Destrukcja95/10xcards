import { test, expect } from "./fixtures/test-fixtures";

test.describe("Home Page", () => {
  test("should load the home page successfully", async ({ homePage }) => {
    await homePage.goto();
    await homePage.waitForPageLoad();

    // Verify page loaded
    await expect(homePage.page).toHaveURL("/");
  });

  test("should have correct page title", async ({ homePage }) => {
    await homePage.goto();

    const title = await homePage.getTitle();
    expect(title).toBeTruthy();
  });

  test("should display main content area", async ({ homePage }) => {
    await homePage.goto();
    await homePage.waitForPageLoad();

    // Verify main content is visible
    await expect(homePage.mainContent).toBeVisible();
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Verify page loads correctly on mobile
    await expect(page.locator("main")).toBeVisible();
  });

  // Visual regression test example
  test("should match visual snapshot", async ({ homePage }) => {
    await homePage.goto();
    await homePage.waitForPageLoad();
    await homePage.waitForNetworkIdle();

    // Take screenshot for visual comparison
    await expect(homePage.page).toHaveScreenshot("home-page.png", {
      fullPage: true,
    });
  });
});

// API testing example
test.describe("API Health", () => {
  test("should respond to health check endpoint", async ({ request }) => {
    // Example of API testing - adjust endpoint as needed
    const response = await request.get("/api/health");

    // If endpoint exists
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty("status");
    }
  });
});

