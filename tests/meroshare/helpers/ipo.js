/**
 * IPO application helper functions
 */

const { waitForPageReady } = require('./common');

/**
 * Select bank from dropdown
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} bankName - Bank name to select
 */
/**
 * Normalize bank name for matching (handles variations like "Limited" vs "Ltd.")
 * @param {string} bankName - Bank name to normalize
 * @returns {string} - Normalized bank name
 */
function normalizeBankName(bankName) {
  if (!bankName) return '';
  
  return bankName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\blimited\b/gi, 'limited')
    .replace(/\bltd\.?\b/gi, 'limited')
    .replace(/\bltd\b/gi, 'limited');
}

/**
 * Check if two bank names match (handles variations)
 * @param {string} name1 - First bank name
 * @param {string} name2 - Second bank name
 * @returns {boolean} - True if they match
 */
function bankNamesMatch(name1, name2) {
  if (!name1 || !name2) return false;
  
  const norm1 = normalizeBankName(name1);
  const norm2 = normalizeBankName(name2);
  
  return norm1 === norm2 || 
         norm1.includes(norm2) || 
         norm2.includes(norm1);
}

async function selectBank(page, bankName) {
  if (!bankName || !bankName.trim()) {
    return false;
  }
  
  const searchText = bankName.trim();
  
  await page.waitForTimeout(1000);
  
  let bankSelected = false;
  
  const select2Selectors = [
    'span.select2-container:has-text("Please choose one")',
    'span.select2-selection:has-text("Please choose one")',
    'span.select2-container',
    '[role="combobox"]:has-text("Please choose one")',
  ];
  
  for (const selector of select2Selectors) {
    try {
      const dropdown = page.locator(selector).first();
      if (await dropdown.isVisible({ timeout: 2000 })) {
        await dropdown.click();
        await page.waitForTimeout(1000);
        
        try {
          await page.waitForSelector('ul.select2-results__options', { timeout: 3000, state: 'visible' });
        } catch (e) {
          await page.waitForTimeout(1000);
        }
        
        try {
          const allOptions = await page.locator('li.select2-results__option').all();
          for (const option of allOptions) {
            try {
              const optionText = await option.textContent();
              if (optionText) {
                const trimmedOption = optionText.trim();
                if (bankNamesMatch(trimmedOption, searchText)) {
                  await option.scrollIntoViewIfNeeded();
                  await option.click({ force: true });
                  bankSelected = true;
                  await page.waitForTimeout(1000);
                  break;
                }
              }
            } catch (e) {
              continue;
            }
          }
        } catch (e) {}
        
        if (bankSelected) break;
        
        const optionSelectors = [
          `li.select2-results__option:has-text("${searchText}")`,
          `ul.select2-results__options li:has-text("${searchText}")`,
          `li:has-text("${searchText}")`,
        ];
        
        for (const optionSelector of optionSelectors) {
          try {
            const option = page.locator(optionSelector).first();
            if (await option.isVisible({ timeout: 2000 })) {
              await option.scrollIntoViewIfNeeded();
              await option.click({ force: true });
              bankSelected = true;
              await page.waitForTimeout(1000);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (bankSelected) break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!bankSelected) {
    const nativeSelectSelectors = [
      'select[name*="bank" i]',
      'select[id*="bank" i]',
      'select',
    ];
    
    for (const selector of nativeSelectSelectors) {
      try {
        const dropdown = page.locator(selector).first();
        if (await dropdown.isVisible({ timeout: 2000 })) {
          try {
            await dropdown.selectOption({ label: searchText });
            bankSelected = true;
            await page.waitForTimeout(500);
            break;
          } catch (e) {
            try {
              const allOptions = await dropdown.locator('option').all();
              for (const option of allOptions) {
                const optionText = await option.textContent();
                if (optionText && bankNamesMatch(optionText.trim(), searchText)) {
                  await dropdown.selectOption({ value: await option.getAttribute('value') });
                  bankSelected = true;
                  await page.waitForTimeout(500);
                  break;
                }
              }
              if (bankSelected) break;
            } catch (e2) {
              continue;
            }
          }
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  if (!bankSelected) {
    try {
      const underlyingSelect = page.locator('select[name*="bank" i], select[id*="bank" i]').first();
      if (await underlyingSelect.isVisible({ timeout: 2000 })) {
        const allOptions = await underlyingSelect.locator('option').all();
        for (const option of allOptions) {
          const optionText = await option.textContent();
          if (optionText && bankNamesMatch(optionText.trim(), searchText)) {
            const optionValue = await option.getAttribute('value');
            await underlyingSelect.evaluate((select, value) => {
              select.value = value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }, optionValue);
            bankSelected = true;
            await page.waitForTimeout(1000);
            break;
          }
        }
      }
    } catch (e) {}
  }
  
  return bankSelected;
}

/**
 * Select account number from dropdown
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} accountNumber - Account number to select
 */
async function selectAccountNumber(page, accountNumber) {
  if (!accountNumber || !accountNumber.trim()) {
    return false;
  }
  
  await page.waitForTimeout(1000);
  
  const accountSelectors = [
    'span.select2-container:has-text("Please choose one of Account Number")',
    'span.select2-selection:has-text("Please choose one of Account Number")',
    'span.select2-container',
    'select[name*="account" i]',
    'select[id*="account" i]',
    'select',
  ];
  
  let accountSelected = false;
  
  for (const selector of accountSelectors) {
    try {
      const dropdown = page.locator(selector).first();
      if (await dropdown.isVisible({ timeout: 2000 })) {
        await dropdown.click();
        await page.waitForTimeout(1000);
        
        const optionSelectors = [
          `li.select2-results__option:has-text("${accountNumber}")`,
          `ul.select2-results__options li:has-text("${accountNumber}")`,
          `li:has-text("${accountNumber}")`,
          `text="${accountNumber}"`,
        ];
        
        for (const optionSelector of optionSelectors) {
          try {
            const option = page.locator(optionSelector).first();
            if (await option.isVisible({ timeout: 2000 })) {
              await option.click();
              accountSelected = true;
              await page.waitForTimeout(500);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (accountSelected) break;
        
        try {
          const allOptions = await page.locator('li.select2-results__option').all();
          for (const option of allOptions) {
            try {
              const optionText = await option.textContent();
              if (optionText && optionText.trim() === accountNumber.trim()) {
                await option.click();
                accountSelected = true;
                await page.waitForTimeout(500);
                break;
              }
            } catch (e) {
              continue;
            }
          }
        } catch (e) {}
        
        if (accountSelected) break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!accountSelected) {
    const nativeSelectSelectors = [
      'select[name*="account" i]',
      'select[id*="account" i]',
      'select',
    ];
    
    for (const selector of nativeSelectSelectors) {
      try {
        const dropdown = page.locator(selector).first();
        if (await dropdown.isVisible({ timeout: 2000 })) {
          try {
            await dropdown.selectOption({ label: accountNumber.trim() });
            accountSelected = true;
            await page.waitForTimeout(500);
            break;
          } catch (e) {
            try {
              await dropdown.selectOption({ value: accountNumber });
              accountSelected = true;
              await page.waitForTimeout(500);
              break;
            } catch (e2) {
              continue;
            }
          }
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  return accountSelected;
}

/**
 * Fill IPO application form
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} applicationData - IPO application data
 * @param {string} applicationData.bank - Bank name from MEROSHARE_DP_NP
 * @param {string} applicationData.accountNumber - Account number from MEROSHARE_P_ACCOUNT_NO
 * @param {string} applicationData.kitta - Applied Kitta number from MEROSHARE_KITTA_N0
 * @param {string} applicationData.crn - CRN number from MEROSHARE_CRN_NO
 */
async function fillIPOApplication(page, applicationData = {}) {
  const { bank, accountNumber, kitta, crn } = applicationData;
  
  await page.waitForTimeout(2000);
  
  try {
    await waitForPageReady(page, [
      'form',
      'select',
      'input[type="text"]',
      'input[placeholder*="kitta" i]',
      'input[placeholder*="CRN" i]'
    ], 10000);
  } catch (e) {}
  
  if (bank) {
    await selectBank(page, bank);
    await page.waitForTimeout(2000);
    
    if (accountNumber) {
      try {
        await waitForPageReady(page, [
          'select[name*="account" i]',
          'select[id*="account" i]',
          'span.select2-container',
          'select'
        ], 5000);
      } catch (e) {}
    }
  }
  
  if (accountNumber) {
    await selectAccountNumber(page, accountNumber);
    await page.waitForTimeout(1000);
  }
  
  if (kitta) {
    const kittaSelectors = [
      'input[placeholder*="kitta" i]',
      'input[name*="kitta" i]',
      'input[id*="kitta" i]',
      'input[placeholder*="Applied Kitta" i]',
      'input[placeholder*="Enter Applied Kitta Number" i]',
    ];
    
    for (const selector of kittaSelectors) {
      try {
        const field = page.locator(selector).first();
        if (await field.isVisible({ timeout: 2000 })) {
          await field.clear();
          await field.fill(kitta);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    await page.waitForTimeout(500);
  }
  
  if (crn) {
    const crnSelectors = [
      'input[placeholder*="CRN" i]',
      'input[name*="crn" i]',
      'input[id*="crn" i]',
      'input[placeholder*="Enter CRN" i]',
    ];
    
    for (const selector of crnSelectors) {
      try {
        const field = page.locator(selector).first();
        if (await field.isVisible({ timeout: 2000 })) {
          await field.clear();
          await field.fill(crn);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    await page.waitForTimeout(500);
  }
  
  const declarationText = 'I hereby declare that I am applying with the above mentioned details';
  const checkboxSelectors = [
    `input[type="checkbox"]:near(text="${declarationText}")`,
    `input[type="checkbox"]:near(text="I hereby declare")`,
    'input[type="checkbox"]',
    'input[name*="declare" i]',
    'input[id*="declare" i]',
  ];
  
  for (const selector of checkboxSelectors) {
    try {
      const checkbox = page.locator(selector).first();
      if (await checkbox.isVisible({ timeout: 2000 })) {
        const isChecked = await checkbox.isChecked();
        if (!isChecked) {
          await checkbox.check();
        }
        await page.waitForTimeout(500);
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  try {
    const declarationCheckbox = page.locator(`text="${declarationText}"`).locator('..').locator('input[type="checkbox"]').first();
    if (await declarationCheckbox.isVisible({ timeout: 2000 })) {
      const isChecked = await declarationCheckbox.isChecked();
      if (!isChecked) {
        await declarationCheckbox.check();
      }
      await page.waitForTimeout(500);
    }
  } catch (e) {}
  
  await page.waitForTimeout(1000);
  
  return { filled: true };
}

/**
 * Submit IPO application (handles Proceed -> PIN -> Apply flow)
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<boolean>} - True if submitted, false if button not found
 */
async function submitIPOApplication(page) {
  await page.waitForTimeout(1000);
  
  const proceedSelectors = [
    'button:has-text("Proceed")',
    'button[type="submit"]:has-text("Proceed")',
    'button.btn-primary:has-text("Proceed")',
    'button:has-text("Submit")',
    'button:has-text("Confirm")',
    'button[type="submit"]',
    'input[type="submit"]',
    'button.btn-primary',
    'button.btn-submit',
  ];
  
  let proceedClicked = false;
  for (const selector of proceedSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 3000 })) {
        await button.click();
        proceedClicked = true;
        await page.waitForTimeout(2000);
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!proceedClicked) {
    return false;
  }
  
  const txnPin = process.env.MEROSHARE_TXN_PIN;
  if (!txnPin) {
    return false;
  }
  
  const pinInputSelectors = [
    'input[placeholder="Enter Pin"]',
    'input[placeholder*="PIN" i]',
    'input[placeholder*="Pin" i]',
    'input[type="password"]',
    'input[type="text"][placeholder*="pin" i]',
    'input.form-control[type="password"]',
    'input.form-control[type="text"]',
  ];
  
  let pinEntered = false;
  for (const selector of pinInputSelectors) {
    try {
      const pinInput = page.locator(selector).first();
      if (await pinInput.isVisible({ timeout: 3000 })) {
        await pinInput.clear();
        await pinInput.fill(txnPin);
        pinEntered = true;
        await page.waitForTimeout(500);
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!pinEntered) {
    return false;
  }
  
  const applySelectors = [
    'button:has-text("Apply")',
    'button.btn-primary:has-text("Apply")',
    'button[type="submit"]:has-text("Apply")',
    'button.btn-primary',
    'button[type="submit"]',
  ];
  
  for (const selector of applySelectors) {
    try {
      const applyButton = page.locator(selector).first();
      if (await applyButton.isVisible({ timeout: 3000 })) {
        await applyButton.click();
        await page.waitForTimeout(3000);
        return true;
      }
    } catch (e) {
      continue;
    }
  }
  
  return false;
}

/**
 * Check if application was successful
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function checkApplicationStatus(page) {
  await page.waitForTimeout(2000);
  
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

