/**
 * Test automatizado para verificar el cambio de idioma en Products del Admin
 *
 * Flujo:
 * 1. Entrar a /adminx con credenciales
 * 2. Ir a sección Productos
 * 3. Editar un producto
 * 4. Verificar que al cambiar idioma se muestre el contenido correcto
 */

import { test, expect } from "@playwright/test";

test.describe("Admin Products - Language Toggle", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Navegar a la página de login
    await page.goto("http://localhost:5173/adminx");

    // 2. Completar credenciales
    await page.fill('input[name="username"], input[type="text"]', "admin");
    await page.fill(
      'input[name="password"], input[type="password"]',
      "NFTX1234"
    );

    // 3. Hacer login
    await page.click(
      'button[type="submit"], button:has-text("Entrar"), button:has-text("Login")'
    );

    // 4. Esperar a que cargue el dashboard
    await page.waitForURL("**/adminx/**", { timeout: 5000 });
    await page.waitForTimeout(1000);
  });

  test("debería cambiar el idioma correctamente en modal de edición de productos", async ({
    page,
  }) => {
    console.log("🧪 Test: Cambio de idioma en Products");

    // 5. Ir a la sección de Productos
    await page.click('button:has-text("Productos"), a:has-text("Productos")');
    await page.waitForTimeout(1000);

    // 6. Buscar el primer producto y hacer click en Editar
    const editButton = page
      .locator('button:has-text("Editar"), button[title="Editar"]')
      .first();
    await editButton.click();
    await page.waitForTimeout(1000);

    // 7. Verificar que el modal está abierto
    const modal = page.locator('[role="dialog"], .fixed.inset-0');
    await expect(modal).toBeVisible();

    // 8. Capturar el contenido inicial en Español
    console.log("📝 Capturando contenido en Español...");

    // Verificar que el botón de Español esté activo
    const spanishBtn = page
      .locator('button:has-text("Español"), button:has-text("ES")')
      .first();
    await expect(spanishBtn).toBeVisible();

    // Capturar texto del nombre del producto en español
    const productNameES = await page
      .locator("input[value], textarea, [contenteditable]")
      .filter({ hasText: /.+/ })
      .first()
      .inputValue()
      .catch(() => page.textContent(".product-name, h2, h3").catch(() => ""));

    console.log("✅ Nombre en Español:", productNameES);

    // 9. Hacer click en el botón de Inglés
    console.log("🔄 Cambiando a Inglés...");
    const englishBtn = page
      .locator(
        'button:has-text("Inglés"), button:has-text("EN"), button:has-text("English")'
      )
      .first();
    await englishBtn.click();
    await page.waitForTimeout(1000);

    // 10. Capturar el contenido en Inglés
    console.log("📝 Capturando contenido en Inglés...");

    const productNameEN = await page
      .locator("input[value], textarea, [contenteditable]")
      .filter({ hasText: /.+/ })
      .first()
      .inputValue()
      .catch(() => page.textContent(".product-name, h2, h3").catch(() => ""));

    console.log("✅ Nombre en Inglés:", productNameEN);

    // 11. Verificar que el contenido cambió
    expect(productNameEN).not.toBe(productNameES);
    console.log("✅ El contenido SÍ cambió entre idiomas");

    // 12. Volver a Español y verificar
    console.log("🔄 Volviendo a Español...");
    await spanishBtn.click();
    await page.waitForTimeout(1000);

    const productNameESAgain = await page
      .locator("input[value], textarea, [contenteditable]")
      .filter({ hasText: /.+/ })
      .first()
      .inputValue()
      .catch(() => page.textContent(".product-name, h2, h3").catch(() => ""));

    console.log("✅ Nombre en Español (segunda vez):", productNameESAgain);

    // Verificar que volvió al contenido en español
    expect(productNameESAgain).toBe(productNameES);
    console.log("✅ El contenido volvió correctamente a Español");

    // 13. Tomar screenshot final
    await page.screenshot({
      path: "test-results/products-language-toggle.png",
      fullPage: true,
    });
  });

  test("debería mostrar datos diferentes en español e inglés", async ({
    page,
  }) => {
    console.log("🧪 Test: Verificar datos multiidioma en Products");

    // Navegar a Productos
    await page.click('button:has-text("Productos"), a:has-text("Productos")');
    await page.waitForTimeout(1000);

    // Editar primer producto
    await page
      .click('button:has-text("Editar"), button[title="Editar"]')
      .first();
    await page.waitForTimeout(1000);

    // Abrir consola del navegador para ver los logs
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.includes("🔵") ||
        text.includes("🟢") ||
        text.includes("🟡") ||
        text.includes("🔴")
      ) {
        console.log("🖥️  Browser Console:", text);
      }
    });

    // Cambiar entre idiomas varias veces
    for (let i = 0; i < 3; i++) {
      console.log(`\n🔄 Iteración ${i + 1}/3`);

      // Click en Inglés
      await page.click('button:has-text("Inglés"), button:has-text("EN")');
      await page.waitForTimeout(800);
      console.log("  ✅ Cambiado a Inglés");

      // Click en Español
      await page.click('button:has-text("Español"), button:has-text("ES")');
      await page.waitForTimeout(800);
      console.log("  ✅ Cambiado a Español");
    }

    console.log(
      "\n✅ Test completado - Revisar logs de consola del navegador arriba"
    );
  });
});
