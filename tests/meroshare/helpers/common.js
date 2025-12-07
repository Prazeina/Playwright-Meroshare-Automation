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
      return; // Successfully found element
    } catch (e) {
      continue; // Try next selector
    }
  }
  
  // If all selectors failed, wait for basic page load as fallback
  try {
    await page.waitForLoadState('load', { timeout: 5000 });
  } catch (e) {
    // Last resort: just wait a short time
    await page.waitForTimeout(1000);
  }
}

/**
 * Check if login was successful
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<boolean>} - True if login appears successful
 */
async function isLoginSuccessful(page) {
  // Check if URL changed (not on login page anymore)
  const currentUrl = page.url();
  if (!currentUrl.includes('login')) {
    return true;
  }
  
  // Check for error messages
  const errorSelectors = [
    '.error',
    '.alert-danger',
    '.alert-error',
    '[role="alert"]',
    '.invalid-feedback',
  ];
  
  for (const selector of errorSelectors) {
    const error = page.locator(selector).first();
    if (await error.isVisible({ timeout: 1000 })) {
      const errorText = await error.textContent();
      console.log('Login error:', errorText);
      return false;
    }
  }
  
  // If still on login page, assume failed
  return !currentUrl.includes('login');
}

module.exports = {
  waitForPageReady,
  isLoginSuccessful,
};

