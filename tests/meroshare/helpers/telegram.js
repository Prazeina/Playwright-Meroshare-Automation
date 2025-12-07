/**
 * Telegram bot helper functions for notifications
 */

const TelegramBot = require('node-telegram-bot-api');

let bot = null;

/**
 * Initialize Telegram bot
 * @param {string} token - Telegram bot token
 * @returns {TelegramBot} - Initialized bot instance
 */
function initBot(token) {
  if (!token) {
    throw new Error('Telegram bot token is required');
  }
  
  if (!bot) {
    bot = new TelegramBot(token, { polling: false });
  }
  
  return bot;
}

/**
 * Send message to Telegram
 * @param {string} chatId - Telegram chat ID
 * @param {string} message - Message to send
 * @param {Object} options - Additional options (parse_mode, etc.)
 */
async function sendMessage(chatId, message, options = {}) {
  if (!bot) {
    console.warn('Telegram bot not initialized. Skipping message.');
    return;
  }
  
  try {
    await bot.sendMessage(chatId, message, options);
    console.log('Telegram message sent successfully');
  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
    // Don't throw - make Telegram errors non-blocking
    console.warn('Continuing without Telegram notification...');
  }
}

/**
 * Send notification about IPO availability
 * @param {string} chatId - Telegram chat ID
 * @param {string} ipoName - Name of the IPO
 */
async function notifyIPOAvailable(chatId, ipoName) {
  const message = `🚀 *IPO Open*`;
  
  await sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Send notification about IPO application status
 * @param {string} chatId - Telegram chat ID
 * @param {string} status - Application status (success, failed, etc.)
 * @param {string} details - Additional details
 */
async function notifyIPOStatus(chatId, status, details = '') {
  const emoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⚠️';
  const message = `${emoji} *IPO Application ${status.toUpperCase()}*\n\n` +
    `${details}\n` +
    `Time: ${new Date().toLocaleString()}`;
  
  await sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Send error notification
 * @param {string} chatId - Telegram chat ID
 * @param {string} error - Error message
 */
async function notifyError(chatId, error) {
  const message = `❌ *Error Occurred*\n\n` +
    `Error: ${error}\n` +
    `Time: ${new Date().toLocaleString()}`;
  
  await sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Send daily check notification
 * @param {string} chatId - Telegram chat ID
 * @param {boolean} applyFound - Whether Apply button was found
 */
async function notifyDailyCheck(chatId, applyFound) {
  const message = applyFound
    ? `✅ *Daily Check Complete*\n\nApply button found! Starting IPO application...`
    : `ℹ️ *IPO Not Found*\n\nNo Apply button found on My ASBA page.\nNo IPO available at this time.\n\nTime: ${new Date().toLocaleString()}`;
  
  await sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Send notification when IPO is not found
 * @param {string} chatId - Telegram chat ID
 */
async function notifyIPONotFound(chatId) {
  const message = `ℹ️ *No IPO Today*`;
  
  await sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

module.exports = {
  initBot,
  sendMessage,
  notifyIPOAvailable,
  notifyIPOStatus,
  notifyError,
  notifyDailyCheck,
  notifyIPONotFound,
};

