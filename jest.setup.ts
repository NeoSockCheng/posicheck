import '@testing-library/jest-dom';

// Mock electron window object
(global as any).window = global.window || {};
(global as any).window.electron = {
  sendFileForInference: jest.fn(),
  sendFileForFeedback: jest.fn(),
  saveToHistory: jest.fn(),
  getAllHistory: jest.fn(),
  getHistoryItem: jest.fn(),
  deleteHistoryItem: jest.fn(),
  getUserProfile: jest.fn(),
  saveUserProfile: jest.fn(),
  getAllFeedback: jest.fn(),
  getFeedbackImage: jest.fn(),
  exportFeedback: jest.fn(),
  getAppVersion: jest.fn(),
  getModelInfo: jest.fn()
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Suppress console errors in tests (optional)
// global.console.error = jest.fn();
// global.console.warn = jest.fn();
