import { test, expect } from "@playwright/test";

test.describe("Admin auth (debug)", () => {
  test("login flow and in-page /api/auth check", async ({ page }) => {
    const base = process.env.BASE_URL || "http://localhost:5173";
    page.on("console", (msg) => console.log("PAGE LOG>", msg.text()));
    page.on("pageerror", (err) => console.log("PAGE ERROR>", err.message));

    await page.goto(`${base}/adminx`);

    await page.fill(
      'input[placeholder="Usuario"]',
      process.env.ADMIN_USERNAME || "admin"
    );
    await page.fill(
      'input[placeholder="Contraseña"]',
      process.env.ADMIN_PASSWORD || "NFTX1234"
    );

    // Capture response to /api/auth
    let authResp = null;
    page.on("response", async (response) => {
      try {
        if (response.url().endsWith("/api/auth")) {
          const body = await response.text().catch(() => null);
          authResp = {
            status: response.status(),
            headers: response.headers(),
            body,
          };
          console.log(
            "DBG: /api/auth response",
            authResp.status,
            authResp.headers,
            authResp.body
          );
        }
      } catch (e) {
        /* ignore */
      }
    });

    // Submit login
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith("/api/auth") && r.status() === 200,
        { timeout: 5000 }
      ),
      page.click('form button[type="submit"]'),
    ]);

    // Small delay to allow cookie processing
    await page.waitForTimeout(300);

    // In-page fetch to /api/auth?action=me so the request is made from the browser context
    const me = await page.evaluate(async () => {
      try {
        const r = await fetch("/api/auth?action=me", {
          method: "GET",
          credentials: "include",
        });
        const txt = await r.text().catch(() => null);
        let json = null;
        try {
          json = txt ? JSON.parse(txt) : null;
        } catch {}
        return { status: r.status, bodyText: txt, bodyJson: json };
      } catch (e) {
        return { error: String(e) };
      }
    });

    console.log("DBG: in-page /api/auth?action=me ->", me);

    const cookies = await page.context().cookies();
    console.log("DBG: cookies after login ->", cookies);

    expect(me && me.bodyJson && me.bodyJson.authenticated).toBeTruthy();
  });
});
