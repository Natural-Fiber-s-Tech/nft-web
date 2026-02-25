import { test, expect } from "@playwright/test";

/**
 * Test: Verificar que el botón "Consultar/Consult" cambia de idioma
 * en el modo VIEW del CMS de Servicios
 *
 * Flujo:
 * 1. Navegar a /adminx
 * 2. Click en "Servicios"
 * 3. Click en botón "Ver" (ojo) de un registro
 * 4. Verificar que se renderiza el modal
 * 5. Cambiar idioma a ES → Verificar botón "Consultar"
 * 6. Cambiar idioma a EN → Verificar botón "Consult"
 */

test.describe("Admin Services - Button Language Change", () => {
  test.beforeEach(async ({ page }) => {
    // Navegar al admin
    await page.goto("/adminx");

    // Esperar que la página cargue
    await page.waitForLoadState("networkidle");

    // Verificar si estamos en el login o ya autenticados
    const isLoginPage = await page
      .locator('input[type="password"]')
      .isVisible();

    if (isLoginPage) {
      console.log("📝 Haciendo login...");

      // Llenar credenciales (ajusta según tus credenciales de test)
      await page.fill('input[placeholder="Usuario"]', "admin");
      await page.fill('input[type="password"]', "admin123");

      // Click en botón "Entrar"
      await page.click('button[type="submit"]:has-text("Entrar")');

      // Esperar que el login complete y cargue el dashboard
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      console.log("✅ Login exitoso");
    } else {
      console.log("✅ Ya autenticado (sesión activa)");
    }
  });

  test("Botón Consultar/Consult debe cambiar idioma en modo VIEW", async ({
    page,
  }) => {
    // 1. Click en sección "Servicios"
    const servicesButton = page.locator('button:has-text("Servicios")');
    await expect(servicesButton).toBeVisible();
    await servicesButton.click();

    // 2. Esperar que cargue la lista de servicios
    await page.waitForTimeout(1000);

    // 3. Buscar el primer botón "Ver" (ícono de ojo)
    // Usamos el selector específico: button.icon-btn.icon-view
    const viewButton = page.locator("button.icon-btn.icon-view").first();

    await expect(viewButton).toBeVisible({ timeout: 5000 });

    console.log("📍 Click en botón Ver...");
    await viewButton.click();

    // 4. Esperar que se abra el modal (modo VIEW)
    // Buscar el modal por su backdrop o contenido
    const modal = page.locator('[role="dialog"], .fixed.inset-0').first();
    await expect(modal).toBeVisible({ timeout: 3000 });

    console.log("✅ Modal abierto");

    // 5. Verificar que existe el ServiceCard (vista previa)
    // El ServiceCard tiene clases: rounded-2xl, transition-all, group, etc.
    const serviceCard = page.locator(".rounded-2xl").first();
    await expect(serviceCard).toBeVisible({ timeout: 3000 });

    console.log("✅ ServiceCard visible");

    // 6. Buscar botones de idioma dentro del modal
    const spanishButton = page.locator('button:has-text("Español")').first();
    const englishButton = page.locator('button:has-text("Inglés")').first();

    await expect(spanishButton).toBeVisible();
    await expect(englishButton).toBeVisible();

    console.log("✅ Botones de idioma visibles");

    // =========================================
    // TEST 1: Idioma Español
    // =========================================
    console.log("\n🔍 TEST 1: Cambiar a Español (ES)");

    await spanishButton.click();
    await page.waitForTimeout(300); // Dar tiempo para re-render

    // Buscar el botón "Consultar" dentro del ServiceCard
    const consultButtonES = serviceCard.locator(
      'button:has-text("Consultar"), a:has-text("Consultar")'
    );

    // Verificar que existe y es visible
    await expect(consultButtonES).toBeVisible({ timeout: 2000 });

    // Verificar el texto exacto
    const textES = await consultButtonES.textContent();
    console.log(`📝 Texto del botón en ES: "${textES}"`);

    expect(textES.trim()).toContain("Consultar");
    expect(textES.trim()).not.toContain("Consult"); // No debe tener "Consult"

    console.log("✅ Botón muestra 'Consultar' en Español");

    // =========================================
    // TEST 2: Idioma Inglés
    // =========================================
    console.log("\n🔍 TEST 2: Cambiar a Inglés (EN)");

    await englishButton.click();
    await page.waitForTimeout(300); // Dar tiempo para re-render

    // Buscar el botón "Consult" dentro del ServiceCard
    const consultButtonEN = serviceCard.locator(
      'button:has-text("Consult"), a:has-text("Consult")'
    );

    // Verificar que existe y es visible
    await expect(consultButtonEN).toBeVisible({ timeout: 2000 });

    // Verificar el texto exacto
    const textEN = await consultButtonEN.textContent();
    console.log(`📝 Texto del botón en EN: "${textEN}"`);

    expect(textEN.trim()).toContain("Consult");
    expect(textEN.trim()).not.toContain("Consultar"); // No debe tener "Consultar"

    console.log("✅ Botón muestra 'Consult' en Inglés");

    // =========================================
    // TEST 3: Alternar múltiples veces
    // =========================================
    console.log("\n🔍 TEST 3: Alternar idiomas múltiples veces");

    // ES
    await spanishButton.click();
    await page.waitForTimeout(200);
    const text1 = await serviceCard
      .locator('button:has-text("Consultar"), button:has-text("Consult")')
      .textContent();
    expect(text1.trim()).toBe("Consultar");
    console.log("✅ ES → Consultar");

    // EN
    await englishButton.click();
    await page.waitForTimeout(200);
    const text2 = await serviceCard
      .locator('button:has-text("Consultar"), button:has-text("Consult")')
      .textContent();
    expect(text2.trim()).toBe("Consult");
    console.log("✅ EN → Consult");

    // ES nuevamente
    await spanishButton.click();
    await page.waitForTimeout(200);
    const text3 = await serviceCard
      .locator('button:has-text("Consultar"), button:has-text("Consult")')
      .textContent();
    expect(text3.trim()).toBe("Consultar");
    console.log("✅ ES → Consultar (segunda vez)");

    // =========================================
    // Cerrar modal y finalizar
    // =========================================
    console.log("\n🏁 Test completado exitosamente");

    // Cerrar el modal
    const closeButton = page.getByRole("button", { name: /Cerrar/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  test("Verificar que useMemo recrea el objeto cuando cambia activeLang", async ({
    page,
  }) => {
    // Este test verifica a nivel de renderizado que el componente
    // se actualiza correctamente

    // 1. Abrir modal de servicios
    await page.locator('button:has-text("Servicios")').click();
    await page.waitForTimeout(1000);

    const viewButton = page.locator("button.icon-btn.icon-view").first();
    await viewButton.click();

    const modal = page.locator('[role="dialog"], .fixed.inset-0').first();
    await expect(modal).toBeVisible();

    // 2. Capturar referencia del botón
    const serviceCard = page.locator(".rounded-2xl").first();
    const consultButton = serviceCard.locator(
      'button:has-text("Consultar"), button:has-text("Consult")'
    );

    // 3. Cambiar idiomas y verificar que React detecta cambios
    await page.locator('button:has-text("Español")').first().click();
    await page.waitForTimeout(100);

    const textES = await consultButton.textContent();
    expect(textES.trim()).toBe("Consultar");

    await page.locator('button:has-text("Inglés")').first().click();
    await page.waitForTimeout(100);

    const textEN = await consultButton.textContent();
    expect(textEN.trim()).toBe("Consult");

    // Si llegamos aquí, useMemo está funcionando correctamente
    console.log("✅ useMemo recrea previewService correctamente");
  });

  test("Comparar con web pública - ambos deben tener mismo comportamiento", async ({
    page,
  }) => {
    console.log("\n🔍 TEST: Comparación CMS vs Web Pública");

    // =========================================
    // PARTE 1: Verificar CMS
    // =========================================
    console.log("\n📱 PARTE 1: Verificar CMS (/adminx)");

    await page.goto("/adminx");
    await page.waitForLoadState("networkidle");

    // Abrir servicios en CMS
    await page.locator('button:has-text("Servicios")').click();
    await page.waitForTimeout(1000);

    const viewButton = page.locator("button.icon-btn.icon-view").first();
    await viewButton.click();

    const modalCMS = page.locator('[role="dialog"], .fixed.inset-0').first();
    await expect(modalCMS).toBeVisible();

    const serviceCardCMS = page.locator(".rounded-2xl").first();

    // Cambiar a ES en CMS
    await page.locator('button:has-text("Español")').first().click();
    await page.waitForTimeout(200);
    const textCMS_ES = await serviceCardCMS
      .locator('button:has-text("Consultar"), button:has-text("Consult")')
      .textContent();

    console.log(`📝 CMS (ES): "${textCMS_ES.trim()}"`);

    // Cambiar a EN en CMS
    await page.locator('button:has-text("Inglés")').first().click();
    await page.waitForTimeout(200);
    const textCMS_EN = await serviceCardCMS
      .locator('button:has-text("Consultar"), button:has-text("Consult")')
      .textContent();

    console.log(`📝 CMS (EN): "${textCMS_EN.trim()}"`);

    // =========================================
    // PARTE 2: Verificar Web Pública
    // =========================================
    console.log("\n🌐 PARTE 2: Verificar Web Pública (/)");

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Scroll a la sección de servicios
    const servicesSection = page.locator(
      "#services, [data-section='services']"
    );
    if (await servicesSection.isVisible()) {
      await servicesSection.scrollIntoViewIfNeeded();
    } else {
      // Scroll alternativo
      await page.evaluate(() => window.scrollTo(0, 1500));
    }

    await page.waitForTimeout(500);

    // Encontrar el primer ServiceCard
    const serviceCardPublic = page.locator(".rounded-2xl").first();
    await expect(serviceCardPublic).toBeVisible();

    // Cambiar a ES en web pública
    const langButtonES_Public = page.locator('button:has-text("ES")').first();
    if (await langButtonES_Public.isVisible()) {
      await langButtonES_Public.click();
      await page.waitForTimeout(200);
    }

    const textPublic_ES = await serviceCardPublic
      .locator('button:has-text("Consultar"), button:has-text("Consult")')
      .textContent();

    console.log(`📝 Web Pública (ES): "${textPublic_ES.trim()}"`);

    // Cambiar a EN en web pública
    const langButtonEN_Public = page.locator('button:has-text("EN")').first();
    if (await langButtonEN_Public.isVisible()) {
      await langButtonEN_Public.click();
      await page.waitForTimeout(200);
    }

    const textPublic_EN = await serviceCardPublic
      .locator('button:has-text("Consultar"), button:has-text("Consult")')
      .textContent();

    console.log(`📝 Web Pública (EN): "${textPublic_EN.trim()}"`);

    // =========================================
    // COMPARACIÓN
    // =========================================
    console.log("\n🔍 COMPARACIÓN DE RESULTADOS:");
    console.log(`CMS (ES): ${textCMS_ES.trim()}`);
    console.log(`Web Pública (ES): ${textPublic_ES.trim()}`);
    console.log(`CMS (EN): ${textCMS_EN.trim()}`);
    console.log(`Web Pública (EN): ${textPublic_EN.trim()}`);

    // Ambos deben tener el mismo comportamiento
    expect(textCMS_ES.trim()).toBe("Consultar");
    expect(textPublic_ES.trim()).toBe("Consultar");
    expect(textCMS_EN.trim()).toBe("Consult");
    expect(textPublic_EN.trim()).toBe("Consult");

    console.log("\n✅ CMS y Web Pública tienen el MISMO comportamiento");
  });
});
