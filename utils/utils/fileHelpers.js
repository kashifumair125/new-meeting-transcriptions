import { handleError } from './logger.js';

/**
 * Downloads the transcript as a text file
 * @param {string} transcript - The transcript content
 * @param {string} [filename] - Optional custom filename
 */
export function downloadTranscript(transcript, filename) {
  try {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `transcript_${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    handleError('Error downloading transcript', error);
  }
}

/**
 * Reads a file and returns its contents as a string
 * @param {File} file - The file to read
 * @returns {Promise<string>}
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => resolve(event.target.result);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  });
}
