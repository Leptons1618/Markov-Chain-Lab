# Quick Start Guide - Testing Your Fixes

## Prerequisites
Make sure the dev server is running or will start automatically with tests.

## Step 1: Install Playwright Browsers (First Time Only)
```bash
npx playwright install
```

## Step 2: Run Quick Test Suite
```bash
# Run all tests (takes ~2-3 minutes)
npm test

# Or run specific categories
npm test theme-visibility      # Theme tests only (~30 seconds)
npm test responsive-layout      # Layout tests only (~1 minute)
npm test visual-regression      # Visual tests only (~1 minute)
```

## Step 3: View Results
After tests complete, view the HTML report:
```bash
npm run test:report
```

## Interactive Testing (Recommended for First Run)
```bash
# Opens interactive UI - great for debugging
npm run test:ui
```

## What to Expect

### ✅ Passing Tests Mean:
- Theme switching works correctly
- No invisible elements in dark/light mode
- Responsive layouts are correct on all devices
- No button overlaps
- Double-tap behavior fixed
- Keyboard doesn't auto-popup
- Math equations don't overflow
- Visual consistency maintained

### ❌ If Tests Fail:
1. **First time visual tests fail**: Normal! Run `npm test -- --update-snapshots` to create baselines
2. **Timeout errors**: Dev server may not be ready - wait and retry
3. **Touch tests skip**: Expected on some browsers (Firefox)
4. **Flaky tests**: Re-run with `npm test --retries=2`

## Testing Manually

### Mobile Testing
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select "iPhone 12" or "Pixel 5"
4. Navigate to http://localhost:3000/tools
5. Test:
   - Double-tap canvas → should reset zoom
   - Single tap → creates node
   - Node creation → keyboard stays closed

### Theme Testing
1. Open any page
2. Click theme switcher button
3. Verify:
   - All text visible
   - All buttons visible
   - No color issues
   - Layout doesn't shift

### Responsive Testing
1. Resize browser window to:
   - 375px (mobile)
   - 768px (tablet)  
   - 1920px (desktop)
2. Check:
   - No button overlaps
   - Full-screen layout
   - Content accessible

## Quick Diagnostic Commands

```bash
# Check for compilation errors
npm run lint

# Test single browser
npx playwright test --project=chromium

# Test mobile only
npx playwright test --project="Mobile Chrome"

# Debug specific test
npx playwright test --debug theme-visibility

# Run tests in visible browser
npm run test:headed
```

## CI/CD Integration

Tests are configured to run automatically in CI with:
- Dev server auto-start
- 2 retries for flaky tests  
- HTML report generation
- Multi-browser testing

Add to your GitHub Actions workflow:
```yaml
- name: Install dependencies
  run: npm ci
  
- name: Install Playwright
  run: npx playwright install --with-deps
  
- name: Run tests
  run: npm test
  
- name: Upload test report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Need Help?

- **Playwright Docs**: https://playwright.dev/
- **Test Examples**: See `tests/*.spec.ts`
- **Configuration**: `playwright.config.ts`
- **Detailed Guide**: `tests/README.md`

## Summary of What Was Fixed

1. ✅ Mobile double-tap → Reset zoom (not create node)
2. ✅ No auto-keyboard on node creation
3. ✅ Examples load centered and zoomed to fit
4. ✅ Math equations don't overflow
5. ✅ Full-screen layouts on all devices
6. ✅ No button overlaps
7. ✅ Theme consistency (all colors use CSS variables)
8. ✅ Comprehensive automated test coverage

**All 10 issues resolved + automated testing implemented!** 🎉
