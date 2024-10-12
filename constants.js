export const MEETING_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

export const UI_ELEMENTS = Object.freeze({
  START_BTN: 'startBtn',
  STOP_BTN: 'stopBtn',
  DOWNLOAD_BTN: 'downloadBtn',
  CLEAR_BTN: 'clearBtn',
  SETTINGS_BTN: 'settingsBtn',
  TRANSCRIPT: 'transcript',
  TRANSCRIPT_COUNT: 'transcriptCount',
  STATUS: 'status',
  PLATFORM_STATUS: 'platformStatus',
});

export const MESSAGE_ACTIONS = Object.freeze({
  UPDATE_ICON: 'updateIcon',
  UPDATE_TRANSCRIPT: 'updateTranscript',
  AI_PROCESSING_COMPLETE: 'aiProcessingComplete',
  UPDATE_PLATFORM: 'updatePlatform',
});

export const AI_CONFIG = Object.freeze({
  MODEL: 'gpt-3.5-turbo',
  MAX_TOKENS: 500
});

export const FIREBASE_CONFIG = Object.freeze({
  COLLECTION: {
    USERS: 'users',
    TRANSCRIPTS: 'transcripts'
  },
  // Add other Firebase-related constants here
});

export const STORAGE_KEYS = Object.freeze({
  MEETING_STATUS: 'meetingStatus',
  USER_PREFERENCES: 'userPreferences'
});
