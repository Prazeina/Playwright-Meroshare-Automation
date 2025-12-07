# MeroShare Automation with Playwright

Automation project for MeroShare website (https://meroshare.cdsc.com.np) using Playwright.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

3. **Create `.env` file** in the project root:
   ```bash
   MEROSHARE_USERNAME=your_username
   MEROSHARE_PASSWORD=your_password
   MEROSHARE_DP_NP=bank_name
   
   # Telegram Bot (optional, for notifications)
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   
   # IPO Application Settings (optional)
   IPO_QUANTITY=10
   IPO_CRN=your_crn_number
   IPO_PIN=your_pin_number
   
   # Scheduler Settings (optional)
   SCHEDULE_TIME=0 9 * * *  # 9:00 AM daily (cron format)
   RUN_ON_START=true         # Run immediately on scheduler start
   ```

4. **Setup Telegram Bot (optional):**
   - Create a bot by messaging [@BotFather](https://t.me/botfather) on Telegram
   - Get your bot token
   - Get your chat ID by messaging [@userinfobot](https://t.me/userinfobot)
   - **Alternative: Get Chat ID programmatically:**
     ```python
     import requests
     import json
     
     your_token = "XYZ"
     # Let's get your chat id! Be sure to have sent a message to your bot.
     url = 'https://api.telegram.org/bot'+str(your_token)+'/getUpdates'
     response = requests.get(url)
     myinfo = response.json()
     if response.status_code == 401:
       raise NameError('Check if your token is correct.')
     
     try:
       CHAT_ID: int = myinfo['result'][1]['message']['chat']['id']
     
       print('This is your Chat ID:', CHAT_ID)
     
     except:
       print('Have you sent a message to your bot? Telegram bot are quite shy 🤣.')
     ```
   - Add both to your `.env` file

## Running Tests

### Basic Commands

- **Run all tests:**
  ```bash
  npm test
  ```

- **Run with browser visible:**
  ```bash
  npm run test:headed
  ```

- **Run in UI mode (interactive):**
  ```bash
  npm run test:ui
  ```

### Automation Scripts

- **Run automation once (check for IPO and apply if found):**
  ```bash
  npm run automate
  ```

- **Start daily scheduler:**
  ```bash
  npm run schedule
  ```
  
  The scheduler will run the automation daily at the time specified in `SCHEDULE_TIME` (default: 9:00 AM).

## Project Structure

```
.
├── tests/
│   └── meroshare/
│       ├── login.spec.js       # Login -  MyAsba automation tests
│       └── helpers/            # Helper functions
│           ├── index.js        # Central export point
│           ├── common.js       # Common utilities
│           ├── login.js        # Login-related helpers
│           ├── navigation.js  # Navigation helpers
│           ├── asba.js         # ASBA page helpers
│           ├── ipo.js          # IPO application helpers
│           └── telegram.js    # Telegram notification helpers
├── scripts/
│   └── scheduler.js           # Daily scheduler script
├── playwright.config.js        # Playwright configuration
├── .env                        # Environment variables
└── package.json                # Project dependencies
```

## Helper Functions

Helper functions are organized by feature in `tests/meroshare/helpers/`:

**Common Utilities** (`helpers/common.js`):
- `waitForPageReady(page, selectors, timeout)` - Waits for page elements (reliable alternative to networkidle)
- `isLoginSuccessful(page)` - Checks if login was successful

**Login Helpers** (`helpers/login.js`):
- `selectDP(page, dpName)` - Selects a Depository Participant from the dropdown
- `fillLoginForm(page, { username, password })` - Fills the login form
- `clickLoginButton(page)` - Clicks the login button
- `performLogin(page, { username, password, dp })` - Complete login flow

**Navigation Helpers** (`helpers/navigation.js`):
- `clickMyASBA(page)` - Clicks on "My ASBA" link after login

**ASBA Helpers** (`helpers/asba.js`):
- `checkForApplyButton(page)` - Checks if Apply button exists on My ASBA page
- `getIPODetails(page)` - Extracts IPO details from ASBA page
- `clickApplyButton(page, applyInfo)` - Clicks the Apply button

**IPO Helpers** (`helpers/ipo.js`):
- `fillIPOApplication(page, applicationData)` - Fills IPO application form
- `submitIPOApplication(page)` - Submits the IPO application
- `checkApplicationStatus(page)` - Checks if application was successful

**Telegram Helpers** (`helpers/telegram.js`):
- `initBot(token)` - Initializes Telegram bot
- `notifyIPOAvailable(chatId, ipoName)` - Sends IPO availability notification
- `notifyIPOStatus(chatId, status, details)` - Sends application status notification
- `notifyError(chatId, error)` - Sends error notification
- `notifyDailyCheck(chatId, applyFound)` - Sends daily check notification

All helpers are exported through `helpers/index.js` for easy importing.

## Features

- ✅ Automated login with credentials from `.env` file
- ✅ Select2 dropdown handling for DP selection
- ✅ Element-based waits (more reliable than networkidle)
- ✅ Graceful timeout handling with fallback strategies
- ✅ Navigation to My ASBA page after login
- ✅ **Telegram notifications** for IPO availability and application status
- ✅ **Daily automated checks** for IPO availability
- ✅ WIP: **Automatic IPO application** when Apply button is found
- ✅ **Scheduled execution** using cron jobs

## Configuration

Edit `playwright.config.js` to customize:
- Test directory
- Browsers to test against
- Timeouts (default: 60 seconds)
- Screenshots and videos
- Base URL

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
