const { test, expect } = require('@playwright/test');

test.describe('Website Automation Examples', () => {
  
  test('basic navigation and interaction', async ({ page }) => {
    // Navigate to a website
    await page.goto('https://example.com');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page).toHaveTitle(/Example Domain/);
    
    // Take a screenshot
    await page.screenshot({ path: 'screenshot.png' });
  });

  test('form filling example', async ({ page }) => {
    // Navigate to a form page (example)
    await page.goto('https://example.com');
    
    // Example: Fill a form field (if it exists)
    // await page.fill('input[name="username"]', 'testuser');
    // await page.fill('input[name="password"]', 'password123');
    
    // Example: Click a button
    // await page.click('button[type="submit"]');
    
    // Example: Wait for navigation after form submission
    // await page.waitForURL('**/dashboard');
  });

  test('element interaction examples', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Wait for an element to be visible
    // const element = await page.waitForSelector('h1');
    
    // Get text content
    // const text = await page.textContent('h1');
    // console.log('Heading text:', text);
    
    // Click an element
    // await page.click('a');
    
    // Hover over an element
    // await page.hover('a');
    
    // Check if element is visible
    // const isVisible = await page.isVisible('h1');
    // expect(isVisible).toBeTruthy();
  });

  test('handling multiple pages/tabs', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('https://example.com');
    
    // Open a new page/tab
    const newPage = await context.newPage();
    await newPage.goto('https://example.com');
    
    // Switch between pages
    await page.bringToFront();
    
    await page.close();
    await newPage.close();
  });

  test('waiting for network requests', async ({ page }) => {
    // Wait for a specific network request
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('api') && response.status() === 200
    );
    
    await page.goto('https://example.com');
    
    // Wait for the response
    // const response = await responsePromise;
    // const data = await response.json();
  });

  test('handling dialogs', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Handle alert dialogs
    page.on('dialog', async dialog => {
      console.log('Dialog message:', dialog.message());
      await dialog.accept();
    });
    
    // Trigger a dialog (example)
    // await page.evaluate(() => alert('Hello!'));
  });

  test('taking screenshots and videos', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Full page screenshot
    await page.screenshot({ path: 'full-page.png', fullPage: true });
    
    // Screenshot of a specific element
    // const element = await page.locator('h1');
    // await element.screenshot({ path: 'element.png' });
  });

  test('executing JavaScript', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Execute custom JavaScript
    const title = await page.evaluate(() => document.title);
    console.log('Page title:', title);
    
    // Modify page content
    // await page.evaluate(() => {
    //   document.body.style.backgroundColor = 'red';
    // });
  });
});

