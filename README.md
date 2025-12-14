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

### GitHub Actions Automation

The project includes a GitHub Actions workflow (`.github/workflows/meroshare-automation.yml`) that runs the automation automatically:

- **Scheduled execution:** Runs daily at 9:00 AM Nepal Time (3:15 AM UTC)
- **Manual trigger:** Can be triggered manually from the GitHub Actions tab
- **No local machine required:** Runs on GitHub's servers
- **Secure:** Uses GitHub Secrets for credentials

**Setup GitHub Actions:**

1. **Add secrets to your GitHub repository:**
   - Go to: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
   - Add these secrets:
     - `MEROSHARE_USERNAME`
     - `MEROSHARE_PASSWORD`
     - `MEROSHARE_DP_NP` 
     - `TELEGRAM_BOT_TOKEN` 
     - `TELEGRAM_CHAT_ID` 
     - `IPO_QUANTITY` (optional)
     - `IPO_PIN` (optional)

2. **Push the workflow file** (already included in the project)

3. **Monitor runs:**
   - Go to the **Actions** tab in your GitHub repository
   - View workflow runs and logs
   - Download artifacts (screenshots/reports) on failure

**Benefits:**
- ✅ Runs automatically without keeping your computer on
- ✅ Free tier friendly (optimized for GitHub Actions free tier)
- ✅ Reliable cloud execution
- ✅ Manual trigger for testing anytime

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
├── .github/
│   └── workflows/
│       └── meroshare-automation.yml  # GitHub Actions automation workflow
├── playwright.config.js        # Playwright configuration
├── .env                        # Environment variables
└── package.json                # Project dependencies
```

## Features

- ✅ Element-based waits (more reliable than networkidle)
- ✅ Graceful timeout handling with fallback strategies
- ✅ **Telegram notifications** for IPO availability and application status
- ✅ **Daily automated checks** for IPO availability
- ✅ **Scheduled execution** using cron jobs (local) or GitHub Actions (cloud)
- ✅ **GitHub Actions integration** for cloud-based automation
- ✅ **Automatic IPO application** when Apply button is found (WIP)

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
