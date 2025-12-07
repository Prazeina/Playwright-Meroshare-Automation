/**
 * Navigation-related helper functions for MeroShare automation
 */

const { waitForPageReady } = require('./common');

/**
 * Click on "My ASBA" link/button after login
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function clickMyASBA(page) {
  // Wait for "My ASBA" link to be visible instead of networkidle
  try {
    await page.waitForSelector('a:has-text("My ASBA"), *:has-text("My ASBA")', { timeout: 15000 });
  } catch (e) {
    // Fallback: wait for navigation to complete (URL changed from login)
    try {
      await page.waitForFunction(
        () => !window.location.href.includes('login'),
        { timeout: 10000 }
      );
    } catch (e2) {
      // Last resort: use our helper function
      await waitForPageReady(page, ['body'], 5000);
    }
  }
  await page.waitForTimeout(1000);
  
  // Common selectors for "My ASBA" link/button
  const myASBASelectors = [
    'a:has-text("My ASBA")',
    'button:has-text("My ASBA")',
    'a[href*="asba" i]',
    'a[href*="ASBA" i]',
    '*:has-text("My ASBA")',
    'li:has-text("My ASBA")',
    'nav a:has-text("My ASBA")',
    'menu a:has-text("My ASBA")',
    'text=My ASBA',
    'text=/My ASBA/i',
  ];
  
  let clicked = false;
  
  for (const selector of myASBASelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 })) {
        await element.click();
        clicked = true;
        console.log(`Clicked "My ASBA" using selector: ${selector}`);
        // Wait for navigation or page update
        await page.waitForTimeout(2000);
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!clicked) {
    throw new Error('Could not find "My ASBA" link/button');
  }
  
  return clicked;
}

module.exports = {
  clickMyASBA,
};

