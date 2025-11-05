import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
  });

  test('tools page - light theme screenshot', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('tools-light-theme.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('tools page - dark theme screenshot', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('tools-dark-theme.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('examples page - light theme', async ({ page }) => {
    await page.goto('/examples');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('examples-light-theme.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('examples page - dark theme', async ({ page }) => {
    await page.goto('/examples');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('examples-dark-theme.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('mobile view - tools page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('tools-mobile.png', {
      fullPage: false, // Don't need full page on mobile
      animations: 'disabled',
    });
  });

  test('tablet view - tools page', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('tools-tablet.png', {
      fullPage: false,
      animations: 'disabled',
    });
  });

  test('component consistency - buttons in both themes', async ({ page }) => {
    // Light theme
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.waitForTimeout(300);
    
    const buttons = page.locator('button').first();
    if (await buttons.isVisible()) {
      await expect(buttons).toHaveScreenshot('button-light.png');
    }
    
    // Dark theme
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(300);
    
    if (await buttons.isVisible()) {
      await expect(buttons).toHaveScreenshot('button-dark.png');
    }
  });

  test('no layout shift between themes', async ({ page }) => {
    // Capture layout in light theme
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.waitForTimeout(300);
    
    const lightNav = await page.locator('nav').first().boundingBox();
    const lightMain = await page.locator('main').first().boundingBox();
    
    // Switch to dark theme
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(300);
    
    const darkNav = await page.locator('nav').first().boundingBox();
    const darkMain = await page.locator('main').first().boundingBox();
    
    // Layout should be identical (within 2px tolerance for rendering differences)
    if (lightNav && darkNav) {
      expect(Math.abs(lightNav.height - darkNav.height)).toBeLessThan(2);
    }
    
    if (lightMain && darkMain) {
      expect(Math.abs(lightMain.height - darkMain.height)).toBeLessThan(2);
    }
  });
});
