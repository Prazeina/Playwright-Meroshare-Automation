# MeroShare Automation with Playwright

Automation project for MeroShare website (https://meroshare.cdsc.com.np) using Playwright.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

3. **Create `.env` file** in the project root:
   ```bash
   MEROSHARE_USERNAME=your_username
   MEROSHARE_PASSWORD=your_password
   MEROSHARE_DP_NP=Nepal Bank Limited
   ```

## Running Tests

### Basic Commands

- **Run all tests:**
  ```bash
  npm test
  ```

- **Run with browser visible:**
  ```bash
  npm run test:headed
  ```

- **Run in debug mode:**
  ```bash
  npm run test:debug
  ```

- **Run in UI mode (interactive):**
  ```bash
  npm run test:ui
  ```

- **View test report:**
  ```bash
  npm run test:report
  ```

### MeroShare Specific Commands

- **Run login test:**
  ```bash
  npx playwright test tests/meroshare/login.spec.js --project=chromium --headed
  ```

- **Run specific test:**
  ```bash
  npx playwright test tests/meroshare/login.spec.js -g "should login and click on My ASBA" --project=chromium --headed
  ```

- **Run in debug mode:**
  ```bash
  npx playwright test tests/meroshare/login.spec.js --debug
  ```

## Project Structure

```
.
├── tests/
│   └── meroshare/
│       ├── login.spec.js       # Login automation tests
│       └── helpers/            # Helper functions
│           ├── index.js        # Central export point
│           ├── common.js       # Common utilities
│           ├── login.js        # Login-related helpers
│           └── navigation.js   # Navigation helpers
├── playwright.config.js        # Playwright configuration
├── .env                        # Environment variables (not committed)
└── package.json                # Project dependencies
```

## Helper Functions

Helper functions are organized by feature in `tests/meroshare/helpers/`:

**Common Utilities** (`helpers/common.js`):
- `waitForPageReady(page, selectors, timeout)` - Waits for page elements (reliable alternative to networkidle)
- `isLoginSuccessful(page)` - Checks if login was successful

**Login Helpers** (`helpers/login.js`):
- `selectDP(page, dpName)` - Selects a Depository Participant from the dropdown
- `fillLoginForm(page, { username, password })` - Fills the login form
- `clickLoginButton(page)` - Clicks the login button
- `performLogin(page, { username, password, dp })` - Complete login flow

**Navigation Helpers** (`helpers/navigation.js`):
- `clickMyASBA(page)` - Clicks on "My ASBA" link after login

All helpers are exported through `helpers/index.js` for easy importing.

## Features

- ✅ Automated login with credentials from `.env` file
- ✅ Select2 dropdown handling for DP selection
- ✅ Element-based waits (more reliable than networkidle)
- ✅ Graceful timeout handling with fallback strategies
- ✅ Navigation to My ASBA page after login

## Best Practices

- **Element-based waits**: Instead of waiting for `networkidle`, we wait for specific elements to appear
- **Try-catch with fallbacks**: Multiple fallback strategies if primary selectors fail
- **Environment variables**: Credentials stored securely in `.env` file (not committed to git)
- **Reusable helpers**: Common functionality extracted into helper functions organized by feature

## Configuration

Edit `playwright.config.js` to customize:
- Test directory
- Browsers to test against
- Timeouts (default: 60 seconds)
- Screenshots and videos
- Base URL

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
