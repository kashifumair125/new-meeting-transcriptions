import { MEETING_STATUS, UI_ELEMENTS, MESSAGE_ACTIONS } from './constants.js';
import { handleError, logInfo } from './utils/logger.js';
import { updateUIBasedOnMeetingStatus, updateTranscriptCount, updateAIResults } from './utils/uiHelpers.js';
import { downloadTranscript } from './utils/fileHelpers.js';
import { sendMessageToBackground, executeScriptInActiveTab } from './utils/chromeHelpers.js';

class PopupManager {
	constructor() {
		this.transcript = '';
		this.summary = '';
		this.actionItems = [];
		this.initializeEventListeners();
		this.checkMeetingStatus();
	}

	initializeEventListeners() {
		document.getElementById(UI_ELEMENTS.START_BTN).addEventListener('click', () => this.handleStartMeeting());
		document.getElementById(UI_ELEMENTS.STOP_BTN).addEventListener('click', () => this.handleStopMeeting());
		document.getElementById(UI_ELEMENTS.DOWNLOAD_BTN).addEventListener('click', () => this.handleDownloadTranscript());
		document.getElementById(UI_ELEMENTS.CLEAR_BTN).addEventListener('click', () => this.handleClearTranscript());
		document.getElementById(UI_ELEMENTS.SETTINGS_BTN).addEventListener('click', () => chrome.runtime.openOptionsPage());

		chrome.runtime.onMessage.addListener(this.handleIncomingMessages.bind(this));
	}

	async handleStartMeeting() {
		try {
			await this.updateUIForMeetingStart();
			await sendMessageToBackground(MESSAGE_ACTIONS.UPDATE_ICON, { status: MEETING_STATUS.ACTIVE });
			await chrome.tabs.sendMessage(tab.id, { action: 'startMeetingCapture' });
		} catch (error) {
			handleError('Error starting meeting capture', error);
			document.getElementById(UI_ELEMENTS.STATUS).textContent = "Error starting capture. Please try again.";
		}
	}

	async handleStopMeeting() {
		try {
			await this.updateUIForMeetingStop();
			await sendMessageToBackground(MESSAGE_ACTIONS.UPDATE_ICON, { status: MEETING_STATUS.INACTIVE });
			await executeScriptInActiveTab(() => {
				if (typeof stopMeetingCapture === 'function') {
					stopMeetingCapture();
				}
			});
		} catch (error) {
			handleError('Error stopping meeting capture', error);
			document.getElementById(UI_ELEMENTS.STATUS).textContent = "Error stopping capture. Please try again.";
		}
	}

	handleDownloadTranscript() {
		downloadTranscript(this.transcript);
	}

	handleClearTranscript() {
		this.transcript = '';
		document.getElementById(UI_ELEMENTS.TRANSCRIPT).textContent = "Transcript will appear here...";
		document.getElementById(UI_ELEMENTS.DOWNLOAD_BTN).style.display = "none";
		updateTranscriptCount(this.transcript);
	}

	handleIncomingMessages(request, sender, sendResponse) {
		switch (request.action) {
			case MESSAGE_ACTIONS.UPDATE_TRANSCRIPT:
				this.updateTranscript(request.transcript);
				break;
			case MESSAGE_ACTIONS.AI_PROCESSING_COMPLETE:
				this.updateAIResults(request.summary, request.actionItems);
				break;
			case MESSAGE_ACTIONS.UPDATE_PLATFORM:
				this.updatePlatformStatus(request.platform);
				break;
			default:
				logInfo(`Unhandled message action: ${request.action}`);
		}
	}

	updateTranscript(newTranscript) {
		this.transcript = newTranscript;
		document.getElementById(UI_ELEMENTS.TRANSCRIPT).textContent = this.transcript;
		updateTranscriptCount(this.transcript);
	}

	updateAIResults(summary, actionItems) {
		this.summary = summary;
		this.actionItems = actionItems;
		document.getElementById('aiSummary').textContent = this.summary;
		const actionItemsList = document.getElementById('actionItems');
		actionItemsList.innerHTML = this.actionItems.map(item => `<li>${item}</li>`).join('');
	}

	updatePlatformStatus(platform) {
		document.getElementById(UI_ELEMENTS.PLATFORM_STATUS).textContent = `Detected Platform: ${platform}`;
	}

	async updateUIForMeetingStart() {
		updateUIBasedOnMeetingStatus(true);
		document.getElementById(UI_ELEMENTS.TRANSCRIPT).textContent = "";
		document.getElementById(UI_ELEMENTS.TRANSCRIPT_COUNT).textContent = "Characters: 0";
	}

	async updateUIForMeetingStop() {
		updateUIBasedOnMeetingStatus(false);
	}

	async checkMeetingStatus() {
		try {
			const { meetingStatus } = await chrome.storage.local.get('meetingStatus');
			updateUIBasedOnMeetingStatus(meetingStatus === MEETING_STATUS.ACTIVE);
		} catch (error) {
			handleError('Error checking meeting status', error);
		}
	}

	// These methods would be injected into the active tab
	startMeetingCapture() {
		// Implementation details...
	}

	stopMeetingCapture() {
		// Implementation details...
	}
}

// Initialize the popup
const popupManager = new PopupManager();
