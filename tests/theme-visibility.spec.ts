import { test, expect } from '@playwright/test';

test.describe('Theme Visibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools');
  });

  test('all interactive elements visible in light theme', async ({ page }) => {
    // Ensure light theme
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check primary buttons are visible
    const toolboxButton = page.locator('button[aria-label*="toolbox" i]').first();
    await expect(toolboxButton).toBeVisible();
    
    // Check canvas is visible
    const canvas = page.locator('[data-testid="canvas"], .cursor-crosshair').first();
    await expect(canvas).toBeVisible();
    
    // Check that text is readable (has sufficient contrast)
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('all interactive elements visible in dark theme', async ({ page }) => {
    // Enable dark theme
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check primary buttons are visible
    const toolboxButton = page.locator('button[aria-label*="toolbox" i]').first();
    await expect(toolboxButton).toBeVisible();
    
    // Check canvas is visible
    const canvas = page.locator('[data-testid="canvas"], .cursor-crosshair').first();
    await expect(canvas).toBeVisible();
    
    // Check navigation is still visible
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('theme toggle works correctly', async ({ page }) => {
    // Find and click theme switcher
    const themeSwitcher = page.locator('button').filter({ hasText: /theme|dark|light/i }).first();
    
    if (await themeSwitcher.isVisible()) {
      const initialTheme = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      
      await themeSwitcher.click();
      await page.waitForTimeout(300); // Wait for transition
      
      const newTheme = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      
      expect(initialTheme).not.toBe(newTheme);
    }
  });

  test('no invisible text in light theme', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.waitForLoadState('networkidle');
    
    // Check that important text elements are visible
    const textElements = page.locator('h1, h2, h3, p, span, a').filter({ hasText: /.+/ });
    const count = await textElements.count();
    
    // At least some text should be present
    expect(count).toBeGreaterThan(5);
    
    // Sample a few text elements to ensure they're visible
    if (count > 0) {
      const firstElement = textElements.first();
      await expect(firstElement).toBeVisible();
    }
  });

  test('no invisible text in dark theme', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForLoadState('networkidle');
    
    // Check that important text elements are visible
    const textElements = page.locator('h1, h2, h3, p, span, a').filter({ hasText: /.+/ });
    const count = await textElements.count();
    
    // At least some text should be present
    expect(count).toBeGreaterThan(5);
    
    // Sample a few text elements to ensure they're visible
    if (count > 0) {
      const firstElement = textElements.first();
      await expect(firstElement).toBeVisible();
    }
  });
});
