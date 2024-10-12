const LOG_LEVELS = Object.freeze({
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
});

/**
 * Logs a message with the specified level
 * @param {string} level - The log level
 * @param {string} message - The message to log
 * @param {Error} [error] - Optional error object
 */
function log(level, message, error) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error(logMessage, error);
      break;
    case LOG_LEVELS.WARN:
      console.warn(logMessage, error);
      break;
    case LOG_LEVELS.INFO:
      console.info(logMessage);
      break;
    case LOG_LEVELS.DEBUG:
      console.debug(logMessage);
      break;
    default:
      console.log(logMessage);
  }
  
  // Here you could add logic to send logs to a remote service
}

export const handleError = (message, error) => log(LOG_LEVELS.ERROR, message, error);
export const logWarning = (message) => log(LOG_LEVELS.WARN, message);
export const logInfo = (message) => log(LOG_LEVELS.INFO, message);
export const logDebug = (message) => log(LOG_LEVELS.DEBUG, message);
