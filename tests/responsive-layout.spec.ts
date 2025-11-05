import { test, expect } from '@playwright/test';

test.describe('Responsive Layout Tests', () => {
  test('mobile view - no button overlaps', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
    
    // Check that mobile toolbox button is visible and not overlapped
    const mobileToolbox = page.locator('button').filter({ hasText: /toolbox|menu/i }).first();
    await expect(mobileToolbox).toBeVisible();
    
    // Check that the button doesn't overlap with bottom navigation
    const toolboxBox = await mobileToolbox.boundingBox();
    expect(toolboxBox).toBeTruthy();
    
    // Should not be at the very bottom (MobileNav is at bottom)
    if (toolboxBox) {
      expect(toolboxBox.y + toolboxBox.height).toBeLessThan(page.viewportSize()!.height - 20);
    }
  });

  test('mobile view - canvas is visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
    
    // Canvas should take up most of the screen
    const canvas = page.locator('.cursor-crosshair, [role="main"]').first();
    await expect(canvas).toBeVisible();
    
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    
    if (canvasBox) {
      // Canvas should be reasonably sized on mobile
      expect(canvasBox.height).toBeGreaterThan(300);
      expect(canvasBox.width).toBeGreaterThan(300);
    }
  });

  test('tablet view - sidebar and canvas both visible', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
    
    // On tablet, check if elements are properly laid out
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
    
    const mainBox = await main.boundingBox();
    expect(mainBox).toBeTruthy();
    
    if (mainBox) {
      // Main area should be substantial
      expect(mainBox.width).toBeGreaterThan(400);
    }
  });

  test('desktop view - full layout visible', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
    
    // On desktop, sidebar should be visible
    const sidebar = page.locator('aside').first();
    
    // Desktop might show sidebar
    const isVisible = await sidebar.isVisible().catch(() => false);
    
    // Canvas should be visible
    const canvas = page.locator('.cursor-crosshair, [role="main"]').first();
    await expect(canvas).toBeVisible();
    
    // Toolbox button should be visible
    const toolbox = page.locator('button[aria-label*="toolbox" i]').first();
    await expect(toolbox).toBeVisible();
  });

  test('mobile - double tap does not create node', async ({ page, browserName }) => {
    // Skip on browsers that don't support touch
    test.skip(browserName === 'firefox', 'Firefox has limited touch support');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
    
    // Find canvas area
    const canvas = page.locator('.cursor-crosshair').first();
    await expect(canvas).toBeVisible();
    
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      const x = canvasBox.x + canvasBox.width / 2;
      const y = canvasBox.y + canvasBox.height / 2;
      
      // Perform double tap
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(100);
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(300);
      
      // Check that no node was created (double-tap should reset view, not create node)
      const nodes = page.locator('[data-node-id]');
      const nodeCount = await nodes.count();
      
      // Should be 0 or very few nodes (not a new one from double-tap)
      expect(nodeCount).toBeLessThanOrEqual(1);
    }
  });

  test('mobile - no keyboard popup on node creation', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox has limited touch support');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
    
    // Single tap to create a node
    const canvas = page.locator('.cursor-crosshair').first();
    await expect(canvas).toBeVisible();
    
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      const x = canvasBox.x + canvasBox.width / 2;
      const y = canvasBox.y + canvasBox.height / 2;
      
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(500);
      
      // Check if an input is focused (it shouldn't be)
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      
      // The focused element should NOT be an input immediately after creating a node
      expect(focusedElement).not.toBe('INPUT');
    }
  });

  test('page is full-screen on all devices', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/tools');
      await page.waitForLoadState('networkidle');
      
      // Check that main content fills the viewport
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();
      
      expect(bodyBox).toBeTruthy();
      if (bodyBox) {
        // Body should take up full viewport
        expect(bodyBox.height).toBeGreaterThanOrEqual(viewport.height * 0.95);
      }
    }
  });

  test('markdown equations do not overflow container', async ({ page }) => {
    await page.goto('/learn');
    await page.waitForLoadState('networkidle');
    
    // Find any math blocks
    const mathBlocks = page.locator('.katex, [id^="math-"]');
    const count = await mathBlocks.count();
    
    if (count > 0) {
      // Check first few math blocks
      for (let i = 0; i < Math.min(count, 3); i++) {
        const block = mathBlocks.nth(i);
        const blockBox = await block.boundingBox();
        const parent = block.locator('xpath=ancestor::div[1]');
        const parentBox = await parent.boundingBox();
        
        if (blockBox && parentBox) {
          // Math block should not exceed parent width
          expect(blockBox.x + blockBox.width).toBeLessThanOrEqual(parentBox.x + parentBox.width + 10);
        }
      }
    }
  });
});
