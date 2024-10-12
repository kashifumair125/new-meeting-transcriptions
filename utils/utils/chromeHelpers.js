/**
 * Sends a message to the background script
 * @param {string} action - The action to perform
 * @param {*} data - The data to send with the message
 * @returns {Promise<*>} - The response from the background script
 */
export function sendMessageToBackground(action, data) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action, ...data }, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Executes a script in the active tab
 * @param {Function} script - The script to execute
 * @returns {Promise<*>} - The result of the script execution
 */
export function executeScriptInActiveTab(script) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs.length === 0) {
        reject(new Error('No active tab found'));
        return;
      }
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: script,
        },
        results => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(results[0].result);
          }
        }
      );
    });
  });
}

import { handleError } from './logger.js';

// ... (existing functions)

/**
 * Gets the current active tab
 * @returns {Promise<chrome.tabs.Tab>}
 */
export async function getActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab found');
    return tab;
  } catch (error) {
    handleError('Error getting active tab', error);
    throw error;
  }
}

/**
 * Sets a value in chrome.storage.local
 * @param {string} key - The key to set
 * @param {*} value - The value to set
 * @returns {Promise<void>}
 */
export async function setStorageItem(key, value) {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    handleError(`Error setting storage item: ${key}`, error);
    throw error;
  }
}

/**
 * Gets a value from chrome.storage.local
 * @param {string} key - The key to get
 * @returns {Promise<*>}
 */
export async function getStorageItem(key) {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key];
  } catch (error) {
    handleError(`Error getting storage item: ${key}`, error);
    throw error;
  }
}
