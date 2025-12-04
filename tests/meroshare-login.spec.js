const { test, expect } = require('@playwright/test');
require('dotenv').config();
const { performLogin, selectDP, isLoginSuccessful, clickMyASBA } = require('./meroshare-helpers');

test.describe('MeroShare Login Page Automation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to MeroShare login page before each test
    await page.goto('https://meroshare.cdsc.com.np/#/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait for login form to be visible instead of networkidle
    try {
      await page.waitForSelector('form, input#username, select2#selectBranch', { timeout: 15000 });
    } catch (e) {
      // Fallback: just wait for any content
      await page.waitForSelector('body', { timeout: 5000 });
    }
  });

  test('should load login page successfully', async ({ page }) => {
    // Verify page URL contains login
    await expect(page).toHaveURL(/.*login/);
    
    // Wait a bit to see the page (useful for debugging)
    await page.waitForTimeout(2000);
  });

  test('should display login form elements', async ({ page }) => {
    // Wait for the login form to be visible
    // Adjust selectors based on actual page structure
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Check if form is visible
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  test('should fill login form fields', async ({ page }) => {
    // Wait for form to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Common field selectors - adjust based on actual page structure
    // Try different possible selectors for username/email
    const usernameSelectors = [
      'input[name="username"]',
      'input[name="email"]',
      'input[type="text"]',
      'input[id*="user"]',
      'input[id*="email"]',
      'input[placeholder*="user" i]',
      'input[placeholder*="email" i]',
    ];
    
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[id*="pass"]',
    ];
    
    // Find and fill username field
    let usernameFilled = false;
    for (const selector of usernameSelectors) {
      try {
        const field = page.locator(selector).first();
        if (await field.isVisible({ timeout: 1000 })) {
          await field.fill('test_username');
          usernameFilled = true;
          console.log(`Filled username using selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Find and fill password field
    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        const field = page.locator(selector).first();
        if (await field.isVisible({ timeout: 1000 })) {
          await field.fill('test_password');
          passwordFilled = true;
          console.log(`Filled password using selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Log which fields were found
    console.log(`Username filled: ${usernameFilled}, Password filled: ${passwordFilled}`);
  });

  test('should login with credentials from .env file', async ({ page }) => {
    // Get credentials from environment variables
    const username = process.env.MEROSHARE_USERNAME;
    const password = process.env.MEROSHARE_PASSWORD;
    const dp = process.env.MEROSHARE_DP_NP || 'Nepal Bank Limited';
    
    if (!username || !password) {
      throw new Error('MEROSHARE_USERNAME and MEROSHARE_PASSWORD must be set in .env file');
    }
    
    console.log(`Attempting login with username: ${username}`);
    console.log(`Selecting DP: ${dp}`);
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Perform login with DP selection
    try {
      await performLogin(page, { username, password, dp });
      
      // Wait for navigation or response
      await page.waitForTimeout(3000);
      
      // Check if login was successful
      const success = await isLoginSuccessful(page);
      console.log(`Login successful: ${success}`);
      
      if (success) {
        console.log('Login completed successfully!');
      } else {
        console.log('Login may have failed.');
      }
    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  });

  test('should login and click on My ASBA', async ({ page }) => {
    // Get credentials from environment variables
    const username = process.env.MEROSHARE_USERNAME;
    const password = process.env.MEROSHARE_PASSWORD;
    const dp = process.env.MEROSHARE_DP_NP || 'Nepal Bank Limited';
    
    if (!username || !password) {
      throw new Error('MEROSHARE_USERNAME and MEROSHARE_PASSWORD must be set in .env file');
    }
    
    console.log(`Attempting login with username: ${username}`);
    console.log(`Selecting DP: ${dp}`);
    
    // Wait for login form to be ready instead of networkidle
    try {
      await page.waitForSelector('form, input#username, select2#selectBranch', { timeout: 15000 });
    } catch (e) {
      console.log('Form not found, continuing anyway...');
    }
    await page.waitForTimeout(1000);
    
    // Perform login with DP selection
    try {
      await performLogin(page, { username, password, dp });
      
      // Wait for navigation after login
      await page.waitForTimeout(3000);
      
      // Check if login was successful
      const success = await isLoginSuccessful(page);
      if (!success) {
        throw new Error('Login failed');
      }
      
      console.log('Login successful! Now clicking on My ASBA...');
      
      // Click on My ASBA
      try {
        await clickMyASBA(page);
        console.log('Successfully clicked on My ASBA');
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Verify we're on the My ASBA page
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);
        
      } catch (error) {
        console.error('Error clicking My ASBA:', error.message);
        throw error;
      }
      
    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  });

  test('should select Nepal Bank Limited from DP dropdown', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    try {
      await selectDP(page, 'Nepal Bank Limited');
      console.log('Successfully selected Nepal Bank Limited');
    } catch (error) {
      console.error('DP selection error:', error.message);
      throw error;
    }
  });

  test('should handle login validation errors', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible({ timeout: 5000 })) {
      await submitButton.click();
    }
    
    // Wait for validation messages
    await page.waitForTimeout(2000);
    
    // Check for error messages
    const errorMessages = page.locator('.error, .alert, [role="alert"]');
    const count = await errorMessages.count();
    
    if (count > 0) {
      console.log(`Found ${count} error message(s)`);
    }
  });

  test('should inspect page structure', async ({ page }) => {
    // This test helps identify the actual structure of the login page
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Get all input fields
    const inputs = await page.locator('input').all();
    console.log(`\nFound ${inputs.length} input fields:`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      const className = await input.getAttribute('class');
      
      console.log(`Input ${i + 1}:`);
      console.log(`  Type: ${type}`);
      console.log(`  Name: ${name}`);
      console.log(`  ID: ${id}`);
      console.log(`  Placeholder: ${placeholder}`);
      console.log(`  Class: ${className}`);
    }
    
    // Get all select elements
    const selects = await page.locator('select').all();
    console.log(`\nFound ${selects.length} select element(s):`);
    
    for (let i = 0; i < selects.length; i++) {
      const select = selects[i];
      const name = await select.getAttribute('name');
      const id = await select.getAttribute('id');
      const className = await select.getAttribute('class');
      const options = await select.locator('option').all();
      
      console.log(`Select ${i + 1}:`);
      console.log(`  Name: ${name}`);
      console.log(`  ID: ${id}`);
      console.log(`  Class: ${className}`);
      console.log(`  Options: ${options.length}`);
      for (let j = 0; j < Math.min(options.length, 5); j++) {
        const optionText = await options[j].textContent();
        console.log(`    - ${optionText}`);
      }
    }
    
    // Look for ng-select (Angular custom dropdown)
    const ngSelects = await page.locator('ng-select').all();
    console.log(`\nFound ${ngSelects.length} ng-select element(s):`);
    
    for (let i = 0; i < ngSelects.length; i++) {
      const ngSelect = ngSelects[i];
      const className = await ngSelect.getAttribute('class');
      const text = await ngSelect.textContent();
      console.log(`ng-select ${i + 1}:`);
      console.log(`  Class: ${className}`);
      console.log(`  Text: ${text?.substring(0, 100)}`);
    }
    
    // Get all buttons
    const buttons = await page.locator('button').all();
    console.log(`\nFound ${buttons.length} button(s):`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      const className = await button.getAttribute('class');
      
      console.log(`Button ${i + 1}:`);
      console.log(`  Text: ${text}`);
      console.log(`  Type: ${type}`);
      console.log(`  Class: ${className}`);
    }
    
    // Look for any element containing "DP" or "Depository"
    const dpElements = await page.locator('*:has-text("DP"), *:has-text("Depository"), *:has-text("Select your DP")').all();
    console.log(`\nFound ${Math.min(dpElements.length, 10)} element(s) containing DP/Depository text:`);
    
    for (let i = 0; i < Math.min(dpElements.length, 10); i++) {
      const element = dpElements[i];
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      const text = await element.textContent();
      const className = await element.getAttribute('class');
      console.log(`Element ${i + 1} (${tagName}):`);
      console.log(`  Text: ${text?.substring(0, 50)}`);
      console.log(`  Class: ${className}`);
    }
  });
});
