/**
 * Scheduler script to run automation daily
 * Uses node-cron to schedule daily execution
 */

require('dotenv').config();
const cron = require('node-cron');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { initBot, notifyError } = require('../tests/meroshare/helpers/telegram');

// Schedule time (default: 9:00 AM daily)
// Format: minute hour day month weekday
// '0 9 * * *' = 9:00 AM every day
const scheduleTime = process.env.SCHEDULE_TIME || '0 9 * * *';
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

// Initialize Telegram bot if token is provided
if (telegramToken) {
  try {
    initBot(telegramToken);
    console.log('Telegram bot initialized for scheduler.');
  } catch (error) {
    console.error('Failed to initialize Telegram bot for scheduler:', error.message);
  }
}

console.log(`Scheduler started. Will run daily at schedule: ${scheduleTime}`);
console.log('To change schedule, set SCHEDULE_TIME in .env file (cron format)');
console.log('Example: SCHEDULE_TIME="0 9 * * *" (9:00 AM daily)');

// Run immediately on start (optional)
if (process.env.RUN_ON_START === 'true') {
  console.log('Running automation immediately...');
  execAsync('npx playwright test tests/meroshare/login.spec.js --reporter=list')
    .then(({ stdout, stderr }) => {
      console.log(stdout);
      if (stderr) console.error('Warnings:', stderr);
      console.log('Initial run completed.');
    })
    .catch((error) => {
      console.error('Initial run failed:', error.message);
      if (telegramChatId && telegramToken) {
        notifyError(telegramChatId, `Initial automation run failed: ${error.message}`);
      }
    });
}

// Schedule daily execution
cron.schedule(scheduleTime, async () => {
  console.log(`\n[${new Date().toISOString()}] Running scheduled automation...`);
  
  try {
    const { stdout, stderr } = await execAsync('npx playwright test tests/meroshare/login.spec.js --reporter=list');
    console.log(stdout);
    if (stderr) {
      console.error('Test warnings:', stderr);
    }
    console.log(`[${new Date().toISOString()}] Automation completed.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Automation failed:`, error.message);
    if (telegramChatId && telegramToken) {
      await notifyError(telegramChatId, `Scheduled automation failed: ${error.message}`);
    }
  }
});

console.log('Scheduler is running. Press Ctrl+C to stop.');

// Keep process alive
process.on('SIGINT', () => {
  console.log('\nScheduler stopped.');
  process.exit(0);
});

