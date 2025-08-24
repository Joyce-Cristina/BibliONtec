const { test, expect } = require('@playwright/test');
const path = require('path');

// Caminho absoluto para o arquivo HTML local
const localFilePath = 'Tcc biblion/index/homepageAdm2.html';
const url = 'file://' + path.resolve(__dirname, '..', localFilePath);

test.describe('Layout responsivo - homepageAdm', () => {

  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 },
  ];

  for (const vp of viewports) {
    test(`Layout responsivo em ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(url, { waitUntil: 'networkidle' });

      await page.waitForSelector('.main-container', { state: 'visible', timeout: 15000 });
      await expect(page.locator('h1')).toBeVisible();

      // Cards de estatísticas
      const statsCards = page.locator('.card-stat');
      await expect(statsCards).toHaveCount(4);

      // Cards de atividades recentes
      const activityCards = page.locator('.card-atividade');
      const count = await activityCards.count();
      expect(count).toBeGreaterThan(0);
    });
  }

  test('homepageAdm rápido', async ({ page }) => {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('.main-container', { state: 'visible', timeout: 15000 });
    await expect(page.locator('h1')).toBeVisible();
  });

});
