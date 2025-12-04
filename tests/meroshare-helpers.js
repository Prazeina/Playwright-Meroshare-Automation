/**
 * Helper functions for MeroShare automation
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
 * Select Depository Participant (DP) from dropdown
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} dpName - Name of the DP to select (e.g., "Nepal Bank Limited")
 */
async function selectDP(page, dpName) {
  // Wait for the DP dropdown to be visible instead of networkidle
  await waitForPageReady(page, [
    'span.select2-container',
    'select2#selectBranch',
    'form'
  ], 10000);
  await page.waitForTimeout(1000);
  
  // MeroShare uses Select2 for the DP dropdown
  // First, try to find and click the Select2 container
  const select2Selectors = [
    'span.select2-container:has-text("Select your DP")',
    'span.select2-selection:has-text("Select your DP")',
    'span.select2-selection__rendered:has-text("Select your DP")',
    '#select2-dk1h-container',
    'span.select2-container',
    'select2#selectBranch + span.select2-container',
  ];
  
  let dpSelected = false;
  
  // Try Select2 approach first
  for (const selector of select2Selectors) {
    try {
      const select2Container = page.locator(selector).first();
      if (await select2Container.isVisible({ timeout: 2000 })) {
        console.log(`Found Select2 container with selector: ${selector}`);
        await select2Container.click();
        await page.waitForTimeout(1000);
        
        // Wait for Select2 dropdown to open and look for the option
        // Select2 options are usually in a ul with class select2-results__options
        const optionSelectors = [
          `li.select2-results__option:has-text("${dpName}")`,
          `li:has-text("${dpName}")`,
          `ul.select2-results__options li:has-text("${dpName}")`,
          `text="${dpName}"`,
        ];
        
        for (const optionSelector of optionSelectors) {
          try {
            const option = page.locator(optionSelector).first();
            if (await option.isVisible({ timeout: 2000 })) {
              await option.click();
              dpSelected = true;
              console.log(`Selected DP "${dpName}" from Select2 dropdown`);
              await page.waitForTimeout(500);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (dpSelected) break;
      }
    } catch (e) {
      continue;
    }
  }
  
  // If Select2 didn't work, try native select
  if (!dpSelected) {
    // Common selectors for DP dropdown
    const dpSelectors = [
      'select#selectBranch',
      'select[name*="dp" i]',
      'select[id*="dp" i]',
      'select[class*="dp" i]',
      'select',
      '[role="combobox"]',
      'input[role="combobox"]',
    ];
  
    for (const selector of dpSelectors) {
      try {
        const dropdown = page.locator(selector).first();
        if (await dropdown.isVisible({ timeout: 2000 })) {
          // Try select option by text
          try {
            await dropdown.selectOption({ label: dpName });
            dpSelected = true;
            console.log(`Selected DP "${dpName}" using selector: ${selector}`);
            break;
          } catch (e) {
            // If selectOption doesn't work, try clicking and selecting
            await dropdown.click();
            await page.waitForTimeout(500);
            // Try to find option in dropdown
            const option = page.locator(`option:has-text("${dpName}")`).first();
            if (await option.isVisible({ timeout: 1000 })) {
              await option.click();
              dpSelected = true;
              break;
            }
          }
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  // If it's a custom dropdown (not native select), try different approach
  if (!dpSelected) {
    // Try clicking on dropdown and then selecting from list
    const customDropdownSelectors = [
      'ng-select',
      'ng-select .ng-select-container',
      'ng-select .ng-arrow-wrapper',
      'div[class*="select" i]',
      'div[class*="dropdown" i]',
      '[aria-haspopup="listbox"]',
      'div[class*="ng-select"]',
      'div[class*="form-control"][class*="select"]',
      // Try finding by text "Select your DP" or similar
      'div:has-text("Select your DP")',
      'div:has-text("Select DP")',
      'label:has-text("DP") + *',
      'label:has-text("Depository") + *',
    ];
    
    for (const selector of customDropdownSelectors) {
      try {
        const dropdown = page.locator(selector).first();
        if (await dropdown.isVisible({ timeout: 2000 })) {
          console.log(`Found dropdown with selector: ${selector}, clicking...`);
          await dropdown.click();
          await page.waitForTimeout(1000);
          
          // Wait for dropdown options to appear
          await page.waitForTimeout(500);
          
          // Look for the option in the dropdown list
          const optionSelectors = [
            `text="${dpName}"`,
            `text=/.*${dpName}.*/i`,
            `[role="option"]:has-text("${dpName}")`,
            `li:has-text("${dpName}")`,
            `div:has-text("${dpName}")`,
            `ng-option:has-text("${dpName}")`,
            `.ng-option:has-text("${dpName}")`,
            `div[class*="option"]:has-text("${dpName}")`,
          ];
          
          for (const optionSelector of optionSelectors) {
            try {
              const option = page.locator(optionSelector).first();
              if (await option.isVisible({ timeout: 2000 })) {
                await option.click();
                dpSelected = true;
                console.log(`Selected DP "${dpName}" from custom dropdown using: ${optionSelector}`);
                break;
              }
            } catch (e) {
              continue;
            }
          }
          
          if (dpSelected) break;
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  if (!dpSelected) {
    throw new Error(`Could not select DP: ${dpName}`);
  }
  
  await page.waitForTimeout(500);
  return dpSelected;
}

/**
 * Fill login form with credentials
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.username - Username or email
 * @param {string} credentials.password - Password
 */
async function fillLoginForm(page, { username, password }) {
  // Wait for login form fields to be visible instead of networkidle
  await waitForPageReady(page, [
    'input#username',
    'input[name="username"]',
    'input[type="text"]'
  ], 10000);
  await page.waitForTimeout(500);
  
  // Common selectors for MeroShare login form
  // Based on actual page inspection: input#username and input#password
  const usernameSelectors = [
    'input#username',
    'input[name="username"]',
    'input[name="email"]',
    'input[type="text"]',
    'input[id*="user"]',
    'input[id*="email"]',
    'input[placeholder*="user" i]',
    'input[placeholder*="email" i]',
    'input[placeholder*="username" i]',
  ];
  
  const passwordSelectors = [
    'input#password',
    'input[name="password"]',
    'input[type="password"]',
    'input[id*="pass"]',
  ];
  
  // Fill username
  let usernameFilled = false;
  for (const selector of usernameSelectors) {
    try {
      const field = page.locator(selector).first();
      if (await field.isVisible({ timeout: 1000 })) {
        await field.clear();
        await field.fill(username);
        usernameFilled = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!usernameFilled) {
    throw new Error('Could not find username field');
  }
  
  // Fill password
  let passwordFilled = false;
  for (const selector of passwordSelectors) {
    try {
      const field = page.locator(selector).first();
      if (await field.isVisible({ timeout: 1000 })) {
        await field.clear();
        await field.fill(password);
        passwordFilled = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!passwordFilled) {
    throw new Error('Could not find password field');
  }
  
  return { usernameFilled, passwordFilled };
}

/**
 * Click login button
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function clickLoginButton(page) {
  const loginButtonSelectors = [
    'button[type="submit"]',
    'button:has-text("Login")',
    'button:has-text("Sign in")',
    'button:has-text("Log in")',
    'button:has-text("LOGIN")',
    'input[type="submit"]',
    'button.btn-primary',
    'button.btn-login',
    'button.login-btn',
  ];
  
  for (const selector of loginButtonSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 })) {
        await button.click();
        return true;
      }
    } catch (e) {
      continue;
    }
  }
  
  throw new Error('Could not find login button');
}

/**
 * Perform complete login
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.username - Username
 * @param {string} credentials.password - Password
 * @param {string} credentials.dp - Depository Participant name (optional)
 */
async function performLogin(page, { username, password, dp }) {
  // Select DP first if provided
  if (dp) {
    await selectDP(page, dp);
  }
  
  // Fill login form
  await fillLoginForm(page, { username, password });
  
  // Click login button
  await clickLoginButton(page);
  
  // Wait for navigation or response
  await page.waitForTimeout(2000);
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
    // Try by exact text match
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
  selectDP,
  fillLoginForm,
  clickLoginButton,
  performLogin,
  isLoginSuccessful,
  clickMyASBA,
};

