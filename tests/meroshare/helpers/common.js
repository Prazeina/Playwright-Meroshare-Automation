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
  // Wait a bit for page to potentially navigate
  await page.waitForTimeout(2000);
  
  const currentUrl = page.url();
  console.log('Current URL after login attempt:', currentUrl);
  
  // Check if URL changed (not on login page anymore) - this is the strongest indicator
  if (!currentUrl.includes('login') && !currentUrl.includes('#/login')) {
    console.log('✅ Login successful - URL changed away from login page');
    return true;
  }
  
  // Check for success indicators (dashboard, profile, etc.)
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
        console.log('✅ Login successful - found success indicator:', selector);
        return true;
      }
    } catch (e) {
      continue;
    }
  }
  
  // Check for error messages
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
        const errorText = await error.textContent();
        console.log('❌ Login error detected:', errorText?.trim() || selector);
        return false;
      }
    } catch (e) {
      continue;
    }
  }
  
  // Check for captcha or other blockers
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
        console.log('⚠️ Captcha or blocker detected:', selector);
        return false;
      }
    } catch (e) {
      continue;
    }
  }
  
  // If still on login page after all checks, assume failed
  if (currentUrl.includes('login') || currentUrl.includes('#/login')) {
    console.log('❌ Login failed - still on login page');
    // Take screenshot for debugging
    try {
      await page.screenshot({ path: 'login-failed-debug.png', fullPage: true });
      console.log('Screenshot saved: login-failed-debug.png');
    } catch (e) {
      console.log('Could not take screenshot:', e.message);
    }
    return false;
  }
  
  // Default: assume failed if we can't determine success
  return false;
}

module.exports = {
  waitForPageReady,
  isLoginSuccessful,
};

