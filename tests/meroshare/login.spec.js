const { test } = require('@playwright/test');
require('dotenv').config();
const { performLogin, isLoginSuccessful, clickMyASBA } = require('./helpers');

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
});
