/**
 * IPO application helper functions
 */

const { waitForPageReady } = require('./common');

/**
 * Fill IPO application form
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} applicationData - IPO application data
 * @param {number} applicationData.quantity - Number of units to apply for
 * @param {string} applicationData.crn - CRN number (optional)
 * @param {string} applicationData.pin - PIN number (optional)
 */
async function fillIPOApplication(page, applicationData = {}) {
  const { quantity = 10, crn, pin } = applicationData;
  
  await page.waitForTimeout(2000);
  
  // Wait for application form to load
  try {
    await waitForPageReady(page, [
      'form',
      'input[type="number"]',
      'input[name*="quantity" i]',
      'input[name*="unit" i]',
      'input[type="text"]'
    ], 10000);
  } catch (e) {
    console.log('Form not found, continuing...');
  }
  
  // Fill quantity field
  const quantitySelectors = [
    'input[name*="quantity" i]',
    'input[name*="unit" i]',
    'input[name*="share" i]',
    'input[type="number"]',
    'input[id*="quantity" i]',
    'input[id*="unit" i]',
  ];
  
  let quantityFilled = false;
  for (const selector of quantitySelectors) {
    try {
      const field = page.locator(selector).first();
      if (await field.isVisible({ timeout: 2000 })) {
        await field.clear();
        await field.fill(quantity.toString());
        quantityFilled = true;
        console.log(`Filled quantity: ${quantity} using selector: ${selector}`);
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  // Fill CRN if provided
  if (crn) {
    const crnSelectors = [
      'input[name*="crn" i]',
      'input[id*="crn" i]',
      'input[placeholder*="crn" i]',
    ];
    
    for (const selector of crnSelectors) {
      try {
        const field = page.locator(selector).first();
        if (await field.isVisible({ timeout: 2000 })) {
          await field.clear();
          await field.fill(crn);
          console.log(`Filled CRN using selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  // Fill PIN if provided
  if (pin) {
    const pinSelectors = [
      'input[name*="pin" i]',
      'input[id*="pin" i]',
      'input[type="password"]',
      'input[placeholder*="pin" i]',
    ];
    
    for (const selector of pinSelectors) {
      try {
        const field = page.locator(selector).first();
        if (await field.isVisible({ timeout: 2000 })) {
          await field.clear();
          await field.fill(pin);
          console.log(`Filled PIN using selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  await page.waitForTimeout(1000);
  
  return { quantityFilled };
}

/**
 * Submit IPO application
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<boolean>} - True if submitted, false if button not found
 */
async function submitIPOApplication(page) {
  await page.waitForTimeout(1000);
  
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("Submit")',
    'button:has-text("Apply")',
    'button:has-text("Confirm")',
    'button:has-text("Proceed")',
    'input[type="submit"]',
    'button.btn-primary',
    'button.btn-submit',
    'a:has-text("Submit")',
    'a:has-text("Apply")',
  ];
  
  for (const selector of submitSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 3000 })) {
        await button.click();
        console.log(`Clicked submit button using selector: ${selector}`);
        await page.waitForTimeout(3000);
        return true;
      }
    } catch (e) {
      continue;
    }
  }
  
  // If submit button not found, check if form auto-submits or if we're already on success page
  console.log('Submit button not found. Checking if form was already submitted...');
  const currentUrl = page.url();
  if (!currentUrl.includes('asba') && !currentUrl.includes('login')) {
    console.log('URL changed - form may have auto-submitted');
    return true;
  }
  
  // Return false instead of throwing error - make it non-blocking
  console.warn('Could not find submit button. Form may need manual submission.');
  return false;
}

/**
 * Check if application was successful
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function checkApplicationStatus(page) {
  await page.waitForTimeout(2000);
  
  // Check for success messages
  const successSelectors = [
    '*:has-text("success")',
    '*:has-text("applied")',
    '*:has-text("submitted")',
    '.success',
    '.alert-success',
    '[class*="success" i]',
  ];
  
  for (const selector of successSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        const text = await element.textContent();
        return {
          success: true,
          message: text?.trim()
        };
      }
    } catch (e) {
      continue;
    }
  }
  
  // Check for error messages
  const errorSelectors = [
    '*:has-text("error")',
    '*:has-text("failed")',
    '.error',
    '.alert-danger',
    '[class*="error" i]',
  ];
  
  for (const selector of errorSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        const text = await element.textContent();
        return {
          success: false,
          message: text?.trim()
        };
      }
    } catch (e) {
      continue;
    }
  }
  
  // Check URL change
  const currentUrl = page.url();
  if (!currentUrl.includes('asba') && !currentUrl.includes('login')) {
    return {
      success: true,
      message: 'Application may have been submitted (URL changed)'
    };
  }
  
  return {
    success: false,
    message: 'Could not determine application status'
  };
}

module.exports = {
  fillIPOApplication,
  submitIPOApplication,
  checkApplicationStatus,
};

