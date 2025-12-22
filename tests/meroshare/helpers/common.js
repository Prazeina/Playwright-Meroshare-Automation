/**
 * Common utility functions for MeroShare automation
 */

/**
 * Wait for page to be ready using element-based waits instead of networkidle
 * This is more reliable than waiting for networkidle which can timeout
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string|string[]} selectors - CSS selector(s) to wait for
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 */
async function waitForPageReady(page, selectors, timeout = 10000) {
  const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
  
  for (const selector of selectorArray) {
    try {
      await page.waitForSelector(selector, { timeout });
      return;
    } catch (e) {
      continue;
    }
  }
  
  try {
    await page.waitForLoadState('load', { timeout: 5000 });
  } catch (e) {
    await page.waitForTimeout(1000);
  }
}

/**
 * Check if login was successful
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<boolean>} - True if login appears successful
 */
async function isLoginSuccessful(page) {
  await page.waitForTimeout(2000);
  
  const currentUrl = page.url();
  
  if (!currentUrl.includes('login') && !currentUrl.includes('#/login')) {
    return true;
  }
  
  const successSelectors = [
    'a:has-text("My ASBA")',
    'a:has-text("Dashboard")',
    'a:has-text("Profile")',
    '[class*="dashboard" i]',
    '[class*="profile" i]',
    'text="My ASBA"',
  ];
  
  for (const selector of successSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        return true;
      }
    } catch (e) {
      continue;
    }
  }
  
  const errorSelectors = [
    '.error',
    '.alert-danger',
    '.alert-error',
    '.alert-warning',
    '[role="alert"]',
    '.invalid-feedback',
    '[class*="error" i]',
    '[class*="danger" i]',
    'text=/invalid/i',
    'text=/incorrect/i',
    'text=/failed/i',
    'text=/wrong/i',
  ];
  
  for (const selector of errorSelectors) {
    try {
      const error = page.locator(selector).first();
      if (await error.isVisible({ timeout: 1000 })) {
        return false;
      }
    } catch (e) {
      continue;
    }
  }
  
  const blockerSelectors = [
    '[class*="captcha" i]',
    '[id*="captcha" i]',
    'iframe[src*="recaptcha"]',
    'iframe[src*="captcha"]',
    'text=/captcha/i',
  ];
  
  for (const selector of blockerSelectors) {
    try {
      const blocker = page.locator(selector).first();
      if (await blocker.isVisible({ timeout: 1000 })) {
        return false;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (currentUrl.includes('login') || currentUrl.includes('#/login')) {
    try {
      await page.locator('input[type="password"], input[name*="password" i]').evaluate(el => el.value = '').catch(() => {});
      await page.locator('input[name*="username" i], input[id*="username" i]').evaluate(el => el.value = '').catch(() => {});
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/page-error.png', fullPage: true });
    } catch (e) {}
    return false;
  }
  
  return false;
}

module.exports = {
  waitForPageReady,
  isLoginSuccessful,
};

