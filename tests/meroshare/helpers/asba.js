/**
 * ASBA page helper functions
 */

const { waitForPageReady } = require('./common');

/**
 * Check if "Apply" text/button exists on My ASBA page and verify it's for Ordinary Shares
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<{found: boolean, element?: any, text?: string, shareType?: string, ipoDetails?: object, rowElement?: any}>}
 */
async function checkForApplyButton(page) {
  await page.waitForTimeout(2000);
  
  try {
    await waitForPageReady(page, [
      'body',
      'table',
      '.table',
      '[class*="asba" i]',
      '.company-list'
    ], 10000);
  } catch (e) {}
  
  try {
    const pageContent = await page.textContent('body');
    if (pageContent) {
      if (/No Record/i.test(pageContent)) {
        return { found: false, reason: 'No Record(s) Found' };
      }
    }
  } catch (e) {}
  
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
          return { found: false, reason: 'No Record(s) Found' };
        }
      } catch (e) {
        continue;
      }
    }
  } catch (e) {}
  
  try {
    const companyRows = await page.locator('div.company-list').all();
    
    for (const row of companyRows) {
      try {
        const rowText = await row.textContent({ timeout: 2000 });
        
        // Check if this row contains "Ordinary Shares"
        if (!/ordinary\s+shares?/i.test(rowText)) {
          continue;
        }
        
        // Find the Apply button in this row
        const applyButton = row.locator('button:has-text("Apply")').first();
        
        if (await applyButton.isVisible({ timeout: 2000 })) {
          
          // Extract IPO details
          let companyName = '';
          let subGroup = '';
          let shareType = '';
          let shareGroup = 'Ordinary Shares';
          
          try {
            const companySpan = await row.locator('span[tooltip="Company Name"]').first().textContent({ timeout: 1000 });
            companyName = companySpan.trim();
          } catch (e) {}
          
          try {
            const subGroupSpan = await row.locator('span[tooltip="Sub Group"]').first().textContent({ timeout: 1000 });
            subGroup = subGroupSpan.trim();
          } catch (e) {}
          
          try {
            const shareTypeSpan = await row.locator('span[tooltip="Share Type"]').first().textContent({ timeout: 1000 });
            shareType = shareTypeSpan.trim();
          } catch (e) {}
          
          try {
            const shareGroupSpan = await row.locator('span[tooltip="Share Group"]').first().textContent({ timeout: 1000 });
            shareGroup = shareGroupSpan.trim();
          } catch (e) {}
          
          return {
            found: true,
            element: applyButton,
            rowElement: row,
            text: 'Apply',
            isOrdinaryShares: true,
            ipoDetails: {
              companyName: companyName,
              subGroup: subGroup,
              shareType: shareType,
              shareGroup: shareGroup
            }
          };
        }
        
      } catch (e) {
        continue;
      }
    }
    
    // Fallback: If no company-list divs found, try table rows
    if (companyRows.length === 0) {
      const tableRows = await page.locator('table tr, .table tr').all();
      
      for (const row of tableRows) {
        try {
          const rowHTML = await row.innerHTML({ timeout: 1000 });
          
          if (!/ordinary\s+shares?/i.test(rowHTML)) {
            continue;
          }
          
          const applyButton = row.locator('button:has-text("Apply"), a:has-text("Apply")').first();
          
          if (await applyButton.isVisible({ timeout: 1000 })) {
            return {
              found: true,
              element: applyButton,
              rowElement: row,
              text: 'Apply',
              isOrdinaryShares: true,
              ipoDetails: {
                companyName: '',
                subGroup: '',
                shareType: '',
                shareGroup: 'Ordinary Shares'
              }
            };
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    return { found: false, reason: 'No Ordinary Shares IPO available' };
    
  } catch (e) {
    return { found: false, reason: 'Error checking page' };
  }
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
    // Try to find company name from table cells
    const tableRows = await page.locator('table tr, .table tr').all();
    
    for (const row of tableRows) {
      try {
        const cells = await row.locator('td, th').all();
        
        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i];
          const cellText = await cell.textContent();
          
          // Look for "Company Name" or "Scrip Name" label
          if (cellText && /company|scrip|name|issue/i.test(cellText)) {
            // Get the next cell or same cell content
            if (i + 1 < cells.length) {
              const valueCell = cells[i + 1];
              const value = await valueCell.textContent();
              if (value && value.trim() && !/(company|scrip|name|issue)/i.test(value)) {
                details.name = value.trim();
                details.company = value.trim();
                break;
              }
            } else {
              // Sometimes the value is in the same cell after the label
              const parts = cellText.split(/[:]/)
              if (parts.length > 1) {
                details.name = parts[1].trim();
                details.company = parts[1].trim();
                break;
              }
            }
          }
        }
        
        if (details.name) break;
      } catch (e) {
        continue;
      }
    }
    
    // Fallback: try to find text containing company-like patterns
    if (!details.name) {
      for (const row of tableRows) {
        const rowText = await row.textContent();
        if (rowText && rowText.length > 10 && rowText.length < 150) {
          // Look for patterns like "Limited", "Ltd.", "Bank", etc.
          if (/(Limited|Ltd\.|Bank|Finance|Insurance|Hydropower|Power)/i.test(rowText)) {
            // Extract just the company name part
            const cleaned = rowText.replace(/Apply|Action|Status|Open|Close/gi, '').trim();
            if (cleaned.length > 5 && cleaned.length < 100) {
              details.name = cleaned;
              details.company = cleaned;
              break;
            }
          }
        }
      }
    }
  } catch (e) {
    // Could not extract IPO details
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
    await page.waitForTimeout(2000);
  } catch (e) {
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

/**
 * Click on the share row to view Company Share Details
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} applyInfo - Apply button information from checkForApplyButton
 */
async function clickShareRow(page, applyInfo) {
  try {
    // Click on the row (not the Apply button)
    if (applyInfo.rowElement) {
      // Click on company name or the row itself
      const companyNameSpan = applyInfo.rowElement.locator('span[tooltip="Company Name"]').first();
      if (await companyNameSpan.isVisible({ timeout: 2000 })) {
        await companyNameSpan.click();
      } else {
        // Click on the row area (not the button)
        await applyInfo.rowElement.locator('div.company-name').first().click();
      }
    } else {
      throw new Error('Row element not available');
    }
    
    await page.waitForTimeout(3000);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Verify Share Details - Check Share Value Per Unit and MinUnit
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} expectedShareValue - Expected Share Value Per Unit (default: 100)
 * @param {number} expectedMinUnit - Expected MinUnit (default: 10)
 * @returns {Promise<{valid: boolean, shareValuePerUnit?: number, minUnit?: number, reason?: string}>}
 */
async function verifyShareDetails(page, expectedShareValue = 100, expectedMinUnit = 10) {
  await page.waitForTimeout(2000);
  
  let shareValuePerUnit = null;
  let minUnit = null;
  
  try {
    // Wait for Company Share Details page to load
    await page.waitForSelector('text="Company Share Details"', { timeout: 5000 });
    
    // Extract Share Value Per Unit
    try {
      // Look for "Share Value Per Unit" label and get its value
      const shareValueLabel = page.locator('text="Share Value Per Unit"').first();
      if (await shareValueLabel.isVisible({ timeout: 2000 })) {
        // The value is usually in a sibling or nearby element
        const parent = shareValueLabel.locator('xpath=..').first();
        const parentText = await parent.textContent();
        
        // Try to find the value after the label
        const match = parentText.match(/Share Value Per Unit[\s\S]*?(\d+\.?\d*)/i);
        if (match) {
          shareValuePerUnit = parseFloat(match[1]);
        }
      }
      
      // Fallback: Look for the value in the next element
      if (shareValuePerUnit === null) {
        const allText = await page.textContent('body');
        const match = allText.match(/Share Value Per Unit[\s\S]*?(\d+\.?\d*)/i);
        if (match) {
          shareValuePerUnit = parseFloat(match[1]);
        }
      }
    } catch (e) {
      // Could not extract Share Value Per Unit
    }
    
    // Extract MinUnit
    try {
      const allText = await page.textContent('body');
      const minUnitMatch = allText.match(/MinUnit[\s\S]*?(\d+)/i);
      if (minUnitMatch) {
        minUnit = parseInt(minUnitMatch[1]);
      }
    } catch (e) {
      // Could not extract MinUnit
    }
    
    // Validate
    const isShareValueValid = shareValuePerUnit === expectedShareValue;
    const isMinUnitValid = minUnit === expectedMinUnit;
    
    if (isShareValueValid && isMinUnitValid) {
      return {
        valid: true,
        shareValuePerUnit: shareValuePerUnit,
        minUnit: minUnit
      };
    } else {
      let reason = '';
      if (!isShareValueValid) {
        reason += `Share Value Per Unit is ${shareValuePerUnit} (expected ${expectedShareValue}). `;
      }
      if (!isMinUnitValid) {
        reason += `MinUnit is ${minUnit} (expected ${expectedMinUnit}).`;
      }
      return {
        valid: false,
        shareValuePerUnit: shareValuePerUnit,
        minUnit: minUnit,
        reason: reason.trim()
      };
    }
    
  } catch (e) {
    return {
      valid: false,
      reason: `Error verifying share details: ${e.message}`
    };
  }
}

/**
 * Go back to My ASBA page
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function goBackToMyASBA(page) {
  try {
    // Try clicking the back arrow
    const backButton = page.locator('button:has-text("←"), a:has-text("←"), .back-button, [class*="back"]').first();
    if (await backButton.isVisible({ timeout: 2000 })) {
      await backButton.click();
      await page.waitForTimeout(2000);
      return true;
    }
    
    // Try browser back
    await page.goBack();
    await page.waitForTimeout(2000);
    return true;
  } catch (e) {
    // Navigate directly to My ASBA
    try {
      await page.locator('a:has-text("My ASBA")').first().click();
      await page.waitForTimeout(2000);
      return true;
    } catch (e2) {
      return false;
    }
  }
}

module.exports = {
  checkForApplyButton,
  getIPODetails,
  clickApplyButton,
  clickShareRow,
  verifyShareDetails,
  goBackToMyASBA,
};

