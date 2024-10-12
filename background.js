// background.js

import OpenAI from 'openai';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { ICON_PATHS, MEETING_STATUS, AI_MODEL, FIREBASE_COLLECTION } from './constants.js';
import { handleError, logInfo } from './utils/logger.js';
import { createAIMessages, parseAIResponse } from './utils/aiHelpers.js';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Updates the extension icon based on the current status
 * @param {MEETING_STATUS} status - The current meeting status
 */
const updateIcon = (status) => {
  chrome.action.setIcon({ path: ICON_PATHS[status] || ICON_PATHS[MEETING_STATUS.INACTIVE] });
};

// Initialize meeting status
chrome.storage.local.set({ meetingStatus: MEETING_STATUS.INACTIVE });

// Message listener
chrome.runtime.onMessage.addListener(handleMessage);

/**
 * Handles incoming messages
 * @param {Object} request - The incoming message
 * @param {Object} sender - The sender of the message
 * @param {Function} sendResponse - Function to send a response
 */
function handleMessage(request, sender, sendResponse) {
  const { action, status, transcript } = request;
  
  switch (action) {
    case 'updateIcon':
      updateIcon(status);
      chrome.storage.local.set({ meetingStatus: status });
      break;
    case 'processTranscript':
      processTranscriptWithAI(transcript, language)
        .then(result => {
          chrome.runtime.sendMessage({ 
            action: 'aiProcessingComplete', 
            summary: result.summary,
            actionItems: result.actionItems
          });
        })
        .catch(error => handleError("Error processing transcript", error));
      break;
    case 'requestAISummary':
      processTranscriptWithAI(transcript)
        .then(result => {
          chrome.tabs.sendMessage(sender.tab.id, { 
            action: 'aiProcessingComplete', 
            summary: result.summary,
            actionItems: result.actionItems
          });
        })
        .catch(error => handleError("Error processing transcript", error));
      break;
    default:
      handleError("Unknown action received", new Error(`Unhandled action: ${action}`));
  }
}

/**
 * Processes the transcript using OpenAI's GPT model
 * @param {string} transcript - The meeting transcript
 * @param {string} language - The language to use for the response
 * @returns {Promise<Object>} - The processed result containing summary and action items
 */
async function processTranscriptWithAI(transcript, language) {
  try {
    const messages = createAIMessages(transcript, language);
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages,
    });

    return parseAIResponse(response);
  } catch (error) {
    handleError("Error processing transcript with AI", error);
    throw error;
  }
}

/**
 * Syncs user data to Firebase
 * @param {string} userId - The user's unique identifier
 * @param {Object} data - The data to be synced
 * @returns {Promise<void>}
 */
async function syncToCloud(userId, data) {
  try {
    await setDoc(doc(db, FIREBASE_COLLECTION.USERS, userId), data, { merge: true });
    logInfo(`Data synced to cloud for user: ${userId}`);
  } catch (error) {
    handleError("Error syncing to cloud", error);
    throw error;
  }
}

/**
 * Retrieves user data from Firebase
 * @param {string} userId - The user's unique identifier
 * @returns {Promise<Object|null>} - The user's data or null if not found
 */
async function syncFromCloud(userId) {
  try {
    const docSnap = await getDoc(doc(db, FIREBASE_COLLECTION.USERS, userId));
    if (docSnap.exists()) {
      logInfo(`Data retrieved from cloud for user: ${userId}`);
      return docSnap.data();
    } else {
      logInfo(`No data found in cloud for user: ${userId}`);
      return null;
    }
  } catch (error) {
    handleError("Error syncing from cloud", error);
    throw error;
  }
}

export { syncToCloud, syncFromCloud };

console.log('Background script loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  // Handle messages here
});

chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked');
});
