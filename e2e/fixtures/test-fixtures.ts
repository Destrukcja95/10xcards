import { test as base } from "@playwright/test";
import { HomePage } from "../pages/HomePage";

/**
 * Extended test fixtures with Page Objects
 * Import { test, expect } from this file in your tests
 */
export const test = base.extend<{
  homePage: HomePage;
}>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },
});

export { expect } from "@playwright/test";

