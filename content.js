// Meeting Insights Pro - Content Script
// Developed by the Meeting Insights Pro Team

import { debounce } from './utils.js';
import { PLATFORM_SELECTORS, CAPTURE_INTERVAL, DEBOUNCE_DELAY } from './constants.js';
import { logError, logInfo } from './logger.js';
import { sendMessageToBackground } from './messaging.js';

const GOOGLE_MEET_URL_PATTERN = /^https:\/\/meet\.google\.com\//;

class MeetingCapture {
	constructor() {
		this.transcript = '';
		this.startTime = null;
		this.speakerTimes = {};
		this.captureInterval = null;
		this.platform = this.detectPlatform();
		this.checkForGoogleMeet();
		this.recognition = null;
	}

	detectPlatform() {
		const hostname = window.location.hostname;
		const platform = Object.keys(PLATFORM_SELECTORS).find(platform => 
			hostname.includes(platform)) || 'unknown';
		
		if (platform === 'unknown') {
			logError('Unsupported platform detected:', hostname);
		}
		
		return platform;
	}

	checkForGoogleMeet() {
		if (GOOGLE_MEET_URL_PATTERN.test(window.location.href)) {
			this.showRecordingReminder();
		}
	}

	showRecordingReminder() {
		const reminder = document.createElement('div');
		reminder.innerHTML = `
			<div style="position: fixed; top: 20px; right: 20px; background-color: #f0f0f0; padding: 15px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 9999;">
				<p>Do you want to record this meeting?</p>
				<button id="startRecordingBtn">Start Recording</button>
				<button id="dismissReminderBtn">Dismiss</button>
			</div>
		`;
		document.body.appendChild(reminder);

		document.getElementById('startRecordingBtn').addEventListener('click', () => {
			this.start();
			reminder.remove();
		});

		document.getElementById('dismissReminderBtn').addEventListener('click', () => {
			reminder.remove();
		});
	}

	extractTranscript() {
		try {
			const selector = PLATFORM_SELECTORS[this.platform];
			if (!selector) return;

			const captions = document.querySelectorAll(selector);
			let newTranscript = '';

			captions.forEach(caption => {
				const speakerName = this.extractSpeakerName(caption);
				const text = caption.innerText;
				newTranscript += `${speakerName}: ${text}\n`;

				// Update speaker times
				this.updateSpeakerTime(speakerName);
			});

			if (newTranscript) {
				this.transcript += newTranscript;
				this.debouncedSendTranscript(this.transcript);
			}
		} catch (error) {
			logError('Error extracting transcript:', error);
		}
	}

	extractSpeakerName(captionElement) {
		// Implement platform-specific speaker name extraction
		// This is a placeholder and should be customized for each platform
		return captionElement.getAttribute('data-speaker-name') || 'Unknown Speaker';
	}

	updateSpeakerTime(speakerName) {
		const currentTime = new Date().getTime();
		if (!this.speakerTimes[speakerName]) {
			this.speakerTimes[speakerName] = 0;
		}
		this.speakerTimes[speakerName] += CAPTURE_INTERVAL / 1000; // Add time in seconds
	}

	debouncedSendTranscript = debounce((transcript) => {
		sendMessageToBackground({ 
			action: 'processTranscript', 
			transcript 
		});
	}, DEBOUNCE_DELAY);

	start() {
		logInfo('Meeting capture started.');
		this.transcript = '';
		this.startTime = new Date();
		this.speakerTimes = {};
		this.captureInterval = setInterval(() => this.extractTranscript(), CAPTURE_INTERVAL);
		sendMessageToBackground({ action: 'updateIcon', status: 'active' });
		this.startSpeechRecognition();
	}

	startSpeechRecognition() {
		if ('webkitSpeechRecognition' in window) {
			this.recognition = new webkitSpeechRecognition();
			this.recognition.continuous = true;
			this.recognition.interimResults = true;

			this.recognition.onresult = (event) => {
				let interimTranscript = '';
				let finalTranscript = '';

				for (let i = event.resultIndex; i < event.results.length; ++i) {
					if (event.results[i].isFinal) {
						finalTranscript += event.results[i][0].transcript;
					} else {
						interimTranscript += event.results[i][0].transcript;
					}
				}

				this.transcript += finalTranscript;
				this.updateTranscript(this.transcript + interimTranscript);
			};

			this.recognition.start();
		} else {
			console.error('Web Speech API is not supported in this browser.');
		}
	}

	stop() {
		logInfo('Meeting capture stopped.');
		clearInterval(this.captureInterval);
		sendMessageToBackground({ action: 'updateIcon', status: 'inactive' });
		
		const duration = (new Date() - this.startTime) / 1000; // in seconds
		sendMessageToBackground({ 
			action: 'meetingAnalytics', 
			duration,
			speakerTimes: this.speakerTimes
		});
		if (this.recognition) {
			this.recognition.stop();
		}
	}

	updateTranscript(newTranscript) {
		// Send the updated transcript to the popup
		chrome.runtime.sendMessage({
			action: 'updateTranscript',
			transcript: newTranscript
		});

		// If the transcript has changed significantly, request AI summary
		if (newTranscript.length - this.transcript.length > 100) {
			this.requestAISummary(newTranscript);
		}
	}

	requestAISummary(transcript) {
		chrome.runtime.sendMessage({
			action: 'requestAISummary',
			transcript: transcript
		});
	}

	updatePopupWithAIResults(summary, actionItems) {
		logInfo('Updating popup with AI results:', { summary, actionItems });
		// Implement logic to update popup with AI-processed results
	}

	handleInterruption() {
		logInfo('Meeting capture interrupted.');
		clearInterval(this.captureInterval);
		sendMessageToBackground({ action: 'updateIcon', status: 'inactive' });
		// Implement logic to save partial transcript and analytics
	}

	resume() {
		logInfo('Resuming meeting capture.');
		this.captureInterval = setInterval(() => this.extractTranscript(), CAPTURE_INTERVAL);
		sendMessageToBackground({ action: 'updateIcon', status: 'active' });
	}

	getStats() {
		const duration = (new Date() - this.startTime) / 1000; // in seconds
		const wordCount = this.transcript.split(/\s+/).length;
		return {
			duration,
			wordCount,
			speakerTimes: this.speakerTimes
		};
	}

	cleanup() {
		clearInterval(this.captureInterval);
		this.transcript = '';
		this.startTime = null;
		this.speakerTimes = {};
		logInfo('Meeting capture resources cleaned up.');
	}
}

const meetingCapture = new MeetingCapture();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch(request.action) {
		case 'aiProcessingComplete':
			meetingCapture.updatePopupWithAIResults(request.summary, request.actionItems);
			break;
		case 'getStats':
			sendResponse(meetingCapture.getStats());
			break;
		case 'interrupt':
			meetingCapture.handleInterruption();
			break;
		case 'resume':
			meetingCapture.resume();
			break;
		case 'startMeetingCapture':
			meetingCapture.start();
			sendResponse({success: true});
			break;
		default:
			logError('Unknown action received:', request.action);
	}
});

export const startMeetingCapture = () => meetingCapture.start();
export const stopMeetingCapture = () => meetingCapture.stop();
