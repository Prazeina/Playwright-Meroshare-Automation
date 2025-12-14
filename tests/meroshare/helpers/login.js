/**
 * Login-related helper functions for MeroShare automation
 */

const { waitForPageReady } = require('./common');

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
          try {
            await dropdown.selectOption({ label: dpName });
            dpSelected = true;
            console.log(`Selected DP "${dpName}" using selector: ${selector}`);
            break;
          } catch (e) {
            await dropdown.click();
            await page.waitForTimeout(500);
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
    const customDropdownSelectors = [
      'ng-select',
      'ng-select .ng-select-container',
      'ng-select .ng-arrow-wrapper',
      'div[class*="select" i]',
      'div[class*="dropdown" i]',
      '[aria-haspopup="listbox"]',
      'div[class*="ng-select"]',
      'div[class*="form-control"][class*="select"]',
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
    console.warn(`⚠️ Could not select DP: ${dpName}. Continuing without DP selection...`);
    // Don't throw error - some sites might not require DP selection
    // The login might still work
  } else {
    console.log(`✅ Successfully selected DP: ${dpName}`);
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

module.exports = {
  selectDP,
  fillLoginForm,
  clickLoginButton,
  performLogin,
};

