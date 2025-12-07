/**
 * ASBA page helper functions
 */

const { waitForPageReady } = require('./common');

/**
 * Check if "Apply" text/button exists on My ASBA page
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<{found: boolean, element?: any, text?: string}>}
 */
async function checkForApplyButton(page) {
  await page.waitForTimeout(2000);
  
  // Wait for ASBA page to load
  try {
    await waitForPageReady(page, [
      'body',
      'table',
      '.table',
      '[class*="asba" i]'
    ], 10000);
  } catch (e) {
    console.log('Page not fully loaded, continuing...');
  }
  
  // First, check for "No Record(s) Found" - this means no IPO available
  try {
    const pageContent = await page.textContent('body');
    if (pageContent) {
      // Check for "No Record(s) Found" text (case insensitive)
      if (/No Record/i.test(pageContent)) {
        console.log('Found "No Record(s) Found" on page - no IPO available');
        return { found: false, reason: 'No Record(s) Found' };
      }
    }
  } catch (e) {
    console.log('Could not check page content for "No Record"');
  }
  
  // Also check with selectors
  try {
    const noRecordSelectors = [
      '*:has-text("No Record")',
      '*:has-text("No Record(s) Found")',
      'text=/No Record/i',
    ];
    
    for (const selector of noRecordSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          const text = await element.textContent();
          console.log(`Found "No Record" indicator: ${text}`);
          return { found: false, reason: 'No Record(s) Found' };
        }
      } catch (e) {
        continue;
      }
    }
  } catch (e) {
    // Continue to check for Apply button
  }
  
  // Multiple selectors to find Apply button/text
  const applySelectors = [
    'button:has-text("Apply")',
    'a:has-text("Apply")',
    'a:has-text("Apply for Issue")',
    '*:has-text("Apply for Issue")',
    'text=/Apply for Issue/i',
    'text=/Apply/i',
    '[class*="apply" i]',
    '[id*="apply" i]',
    'button[type="button"]:has-text("Apply")',
    'button[type="submit"]:has-text("Apply")',
  ];
  
  for (const selector of applySelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 })) {
        const text = await element.textContent();
        // Make sure it's not just the tab text "Apply for Issue" - it should be a clickable button/link
        if (text && (text.includes('Apply for Issue') || text.trim() === 'Apply' || text.includes('Apply'))) {
          // Check if it's actually clickable (not just a tab)
          const tagName = await element.evaluate(el => el.tagName.toLowerCase());
          if (tagName === 'button' || tagName === 'a' || await element.getAttribute('onclick')) {
            console.log(`Found Apply button with selector: ${selector}, text: ${text}`);
            return {
              found: true,
              element: element,
              text: text?.trim(),
              selector: selector
            };
          }
        }
      }
    } catch (e) {
      continue;
    }
  }
  
  console.log('No Apply button found on the page');
  return { found: false };
}

/**
 * Get IPO details from ASBA page
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<Object>} - IPO details
 */
async function getIPODetails(page) {
  await page.waitForTimeout(2000);
  
  const details = {
    name: '',
    company: '',
    issueSize: '',
    price: '',
    openDate: '',
    closeDate: '',
  };
  
  try {
    // Try to extract IPO information from table or page
    // Adjust selectors based on actual page structure
    const tableRows = await page.locator('table tr, .table tr').all();
    
    for (let i = 0; i < Math.min(tableRows.length, 10); i++) {
      const row = tableRows[i];
      const rowText = await row.textContent();
      
      if (rowText) {
        // Extract IPO name
        if (!details.name && /ipo|issue|company/i.test(rowText)) {
          details.name = rowText.trim().substring(0, 100);
        }
      }
    }
    
    // Try to get text from page
    const pageText = await page.textContent('body');
    if (pageText) {
      details.name = pageText.substring(0, 200);
    }
  } catch (e) {
    console.log('Could not extract IPO details:', e.message);
  }
  
  return details;
}

/**
 * Click Apply button on ASBA page
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} applyInfo - Apply button information from checkForApplyButton
 */
async function clickApplyButton(page, applyInfo) {
  if (!applyInfo.found || !applyInfo.element) {
    throw new Error('Apply button not found or element not available');
  }
  
  try {
    await applyInfo.element.click();
    console.log('Clicked Apply button');
    await page.waitForTimeout(2000);
  } catch (e) {
    // Try alternative approach
    const selector = applyInfo.selector || 'button:has-text("Apply"), a:has-text("Apply")';
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 3000 })) {
      await element.click();
      await page.waitForTimeout(2000);
    } else {
      throw new Error('Could not click Apply button');
    }
  }
}

module.exports = {
  checkForApplyButton,
  getIPODetails,
  clickApplyButton,
};

