import { UI_ELEMENTS } from '../constants.js';
import { handleError } from './logger.js';

/**
 * Updates the UI based on the meeting status
 * @param {boolean} isActive - Whether the meeting is active
 */
export function updateUIBasedOnMeetingStatus(isActive) {
  document.getElementById(UI_ELEMENTS.START_BTN).style.display = isActive ? 'none' : 'inline-block';
  document.getElementById(UI_ELEMENTS.STOP_BTN).style.display = isActive ? 'inline-block' : 'none';
  document.getElementById(UI_ELEMENTS.STATUS).textContent = isActive ? 'Recording...' : 'Ready to start';
}

/**
 * Updates the transcript character count
 * @param {string} transcript - The current transcript
 */
export function updateTranscriptCount(transcript) {
  const count = transcript.length;
  document.getElementById(UI_ELEMENTS.TRANSCRIPT_COUNT).textContent = `Characters: ${count}`;
  document.getElementById(UI_ELEMENTS.DOWNLOAD_BTN).style.display = count > 0 ? 'inline-block' : 'none';
}

/**
 * Updates the AI processing results in the UI
 * @param {string} summary - The meeting summary
 * @param {string[]} actionItems - The list of action items
 */
export function updateAIResults(summary, actionItems) {
  const resultsElement = document.getElementById('aiResults');
  resultsElement.innerHTML = `
    <h3>Meeting Summary:</h3>
    <p>${summary}</p>
    <h3>Action Items:</h3>
    <ul>
      ${actionItems.map(item => `<li>${item}</li>`).join('')}
    </ul>
  `;
}

/**
 * Updates the visibility of a UI element
 * @param {string} elementId - The ID of the element to update
 * @param {boolean} isVisible - Whether the element should be visible
 */
export function updateElementVisibility(elementId, isVisible) {
  try {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = isVisible ? 'block' : 'none';
    } else {
      throw new Error(`Element with ID "${elementId}" not found`);
    }
  } catch (error) {
    handleError('Error updating element visibility', error);
  }
}

/**
 * Creates and appends a new element to the DOM
 * @param {string} tag - The HTML tag of the new element
 * @param {string} id - The ID for the new element
 * @param {string} [text] - Optional text content for the new element
 * @param {string} [parentId] - Optional ID of the parent element to append to
 * @returns {HTMLElement} The newly created element
 */
export function createAndAppendElement(tag, id, text, parentId) {
  try {
    const element = document.createElement(tag);
    element.id = id;
    if (text) element.textContent = text;
    
    const parent = parentId ? document.getElementById(parentId) : document.body;
    if (!parent) throw new Error(`Parent element with ID "${parentId}" not found`);
    
    parent.appendChild(element);
    return element;
  } catch (error) {
    handleError('Error creating and appending element', error);
    return null;
  }
}
