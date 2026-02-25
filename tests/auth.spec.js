import { test, expect } from "@playwright/test";

// Ensure your dev server is running at http://localhost:5173 before running this test
test.describe("Admin auth", () => {
  test("login sets cookie and opens admin app", async ({ page }) => {
    const base = process.env.BASE_URL || "http://localhost:5173";
    await page.goto(`${base}/adminx`);

    // Fill form
    await page.fill(
      'input[placeholder="Usuario"]',
      process.env.ADMIN_USERNAME || "admin"
    );
    await page.fill(
      'input[placeholder="Contraseña"]',
      process.env.ADMIN_PASSWORD || "NFTX1234"
    );

    // Intercept network to capture Set-Cookie header
    let setCookieHeader = null;
    page.on("response", async (response) => {
      try {
        const url = response.url();
        if (url.endsWith("/api/auth")) {
          const headers = response.headers();
          if (headers["set-cookie"]) setCookieHeader = headers["set-cookie"];
        }
      } catch (e) {
        // ignore
      }
    });

    // Submit the form (the admin uses a form element)
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith("/api/auth") && r.status() === 200,
        { timeout: 5000 }
      ),
      page.click('form button[type="submit"]'),
    ]);

    // Give browser a moment to process set-cookie
    await page.waitForTimeout(250);

    // Check cookie existence via Playwright context
    const cookies = await page.context().cookies();
    const adminCookie = cookies.find((c) => c.name === "admin_token");

    // Diagnostics: print headers/cookie info to test output (helpful in CI)
    console.log("Set-Cookie header:", setCookieHeader);
    console.log("Cookies:", cookies);

    expect(adminCookie, "admin_token cookie should be present").toBeTruthy();

    // After login, admin app should show a control that only appears when authenticated.
    // We'll assert that the services table or admin UI element is visible.
    await expect(page.locator("text=Servicios").first()).toBeVisible({
      timeout: 3000,
    });
  });
});
