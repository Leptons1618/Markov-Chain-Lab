# Automated Testing Setup

This project uses [Playwright](https://playwright.dev/) for automated end-to-end testing, focusing on theme consistency, responsive design, and visual regression.

## Test Suites

### 1. Theme Visibility Tests (`tests/theme-visibility.spec.ts`)
- Verifies all interactive elements are visible in both light and dark themes
- Tests theme toggle functionality
- Ensures no invisible text in either theme
- Validates color contrast and accessibility

### 2. Responsive Layout Tests (`tests/responsive-layout.spec.ts`)
- Tests layout across mobile (375px), tablet (768px), and desktop (1920px) viewports
- Verifies no button overlaps on mobile/tablet
- Tests double-tap behavior on mobile (should not create nodes)
- Validates that keyboard doesn't auto-popup on node creation
- Ensures pages are full-screen on all devices
- Checks markdown equations don't overflow containers

### 3. Visual Regression Tests (`tests/visual-regression.spec.ts`)
- Captures screenshots of key pages in both themes
- Detects visual regressions between code changes
- Validates component consistency across themes
- Ensures no layout shift when switching themes

## Running Tests

```bash
# Run all tests
npm test

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests
npm run test:debug

# View test report
npm run test:report
```

## Running Specific Test Suites

```bash
# Theme tests only
npx playwright test theme-visibility

# Responsive tests only
npx playwright test responsive-layout

# Visual regression tests only
npx playwright test visual-regression
```

## Test on Specific Browsers

```bash
# Chrome only
npx playwright test --project=chromium

# Mobile Chrome
npx playwright test --project="Mobile Chrome"

# All mobile devices
npx playwright test --project="Mobile Chrome" --project="Mobile Safari"
```

## Updating Visual Regression Baselines

When you intentionally change the UI and visual regression tests fail:

```bash
# Update all screenshots
npx playwright test --update-snapshots

# Update specific test screenshots
npx playwright test visual-regression --update-snapshots
```

## Continuous Integration

The tests are configured to run automatically in CI with:
- 2 retries for flaky tests
- Parallel execution disabled (1 worker)
- HTML report generation
- Automatic dev server startup

## Test Coverage

Current test coverage includes:
- ✅ Theme visibility (light/dark mode)
- ✅ Responsive layouts (mobile/tablet/desktop)
- ✅ Button positioning and overlaps
- ✅ Double-tap gesture handling
- ✅ Keyboard auto-popup prevention
- ✅ Full-screen page layouts
- ✅ Markdown equation overflow
- ✅ Visual consistency across themes
- ✅ Layout stability during theme switches

## Tips for Writing Tests

1. **Wait for network idle**: Use `await page.waitForLoadState('networkidle')` before assertions
2. **Theme switching**: Add `await page.waitForTimeout(300)` after theme changes for animations
3. **Mobile testing**: Some browsers (Firefox) have limited touch support - use `test.skip()` when needed
4. **Visual tests**: Disable animations with `animations: 'disabled'` for consistent screenshots
5. **Flaky tests**: If a test is flaky, add appropriate waits or use `test.retry()`

## Troubleshooting

### Tests fail on first run
Run `npx playwright install` to install required browsers.

### Screenshots don't match
Visual regression tests may need baseline updates after intentional UI changes. Use `--update-snapshots`.

### Mobile tests skip
Check that you're not running on Firefox for touch-based tests.

### Timeout errors
Increase timeout in `playwright.config.ts` or add more specific waits in tests.
