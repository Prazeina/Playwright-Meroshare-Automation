const { test } = require('@playwright/test');
require('dotenv').config();
const {
  performLogin,
  isLoginSuccessful,
  clickMyASBA,
  checkForApplyButton,
  getIPODetails,
  clickApplyButton,
  fillIPOApplication,
  submitIPOApplication,
  checkApplicationStatus,
  initBot,
  notifyIPOAvailable,
  notifyIPOStatus,
  notifyError,
  notifyIPONotFound,
} = require('./helpers');

test.describe('MeroShare IPO Automation', () => {
  
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

  test('should check for IPO and send Telegram notification', async ({ page }) => {
    // Get credentials from environment variables
    const username = process.env.MEROSHARE_USERNAME;
    const password = process.env.MEROSHARE_PASSWORD;
    const dp = process.env.MEROSHARE_DP_NP;
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    const ipoQuantity = parseInt(process.env.IPO_QUANTITY || '10', 10);
    const ipoCrn = process.env.IPO_CRN;
    const ipoPin = process.env.IPO_PIN;
    
    if (!username || !password) {
      throw new Error('MEROSHARE_USERNAME and MEROSHARE_PASSWORD must be set in .env file');
    }
    
    // Initialize Telegram bot if token is provided
    if (telegramToken) {
      try {
        initBot(telegramToken);
        console.log('Telegram bot initialized');
      } catch (error) {
        console.error('Failed to initialize Telegram bot:', error.message);
        console.warn('Continuing without Telegram notifications...');
      }
    }
    
    console.log(`Attempting login with username: ${username}`);
    console.log(`Selecting DP: ${dp}`);
    
    // Wait for login form to be ready
    try {
      await page.waitForSelector('form, input#username, select2#selectBranch', { timeout: 15000 });
    } catch (e) {
      console.log('Form not found, continuing anyway...');
    }
    await page.waitForTimeout(1000);
    
    // Perform login with DP selection
    try {
      console.log(`Attempting login with DP: ${dp || 'not specified'}`);
      await performLogin(page, { username, password, dp });
      
      // Wait for navigation after login
      await page.waitForTimeout(3000);
      
      // Check if login was successful
      const success = await isLoginSuccessful(page);
      if (!success) {
        // Get more context about why login failed
        const currentUrl = page.url();
        const pageTitle = await page.title();
        const pageContent = await page.content();
        
        // Check for common error messages
        let errorMessage = 'Login failed';
        const errorText = await page.locator('.error, .alert-danger, [role="alert"]').first().textContent().catch(() => null);
        if (errorText) {
          errorMessage = `Login failed: ${errorText.trim()}`;
        }
        
        console.error('Login failure details:');
        console.error('- URL:', currentUrl);
        console.error('- Page title:', pageTitle);
        if (errorText) {
          console.error('- Error message:', errorText);
        }
        
        // Take screenshot for debugging
        await page.screenshot({ path: 'test-results/login-failure.png', fullPage: true });
        
        throw new Error(errorMessage);
      }
      
      console.log('Login successful! Now clicking on My ASBA...');
      
      // Click on My ASBA
      await clickMyASBA(page);
      console.log('Successfully clicked on My ASBA');
      await page.waitForTimeout(3000);
      console.log('On My ASBA page');

      // Check for Apply button
      console.log('Checking for Apply button...');
      const applyInfo = await checkForApplyButton(page);

      if (!applyInfo.found) {
        console.log('No Apply button found. No IPO available.');
        if (telegramChatId && telegramToken) {
          await notifyIPONotFound(telegramChatId);
        }
        return;
      }

      console.log('Apply button found! Starting IPO application...');
      const ipoDetails = await getIPODetails(page);
      if (telegramChatId && telegramToken) {
        await notifyIPOAvailable(telegramChatId, ipoDetails.name || 'Unknown IPO');
      }

      // If IPO application details are provided, fill and submit
      if (ipoCrn && ipoPin) {
        await clickApplyButton(page, applyInfo);
        await page.waitForTimeout(3000);

        await fillIPOApplication(page, { quantity: ipoQuantity, crn: ipoCrn, pin: ipoPin });
        await page.waitForTimeout(2000);

        const submitted = await submitIPOApplication(page);
        if (!submitted) {
          console.log('Note: Submit button not found. Form may need manual review.');
        }
        await page.waitForTimeout(3000);

        // Check if the page is still open after submission
        if (!page.isClosed()) {
          const status = await checkApplicationStatus(page);
          if (telegramChatId && telegramToken) {
            const statusText = status.success ? 'success' : 'failed';
            await notifyIPOStatus(telegramChatId, statusText, status.message || 'IPO application process completed');
          }
        } else {
          console.log('Page closed after submission - this is normal for successful submissions.');
          if (telegramChatId && telegramToken) {
            await notifyIPOStatus(telegramChatId, 'success', 'IPO application submitted successfully (page closed).');
          }
        }
      } else {
        console.log('IPO application details (CRN/PIN) not provided. Skipping application submission.');
      }
      
    } catch (error) {
      console.error('Automation error:', error.message);
      if (telegramChatId && telegramToken) {
        await notifyError(telegramChatId, error.message);
      }
      throw error;
    }
  });
});
