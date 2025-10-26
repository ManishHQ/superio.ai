/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Get API URL from environment variable or use Heroku production URL
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://superio-2ebc48e7fe3e.herokuapp.com';

// Chat API endpoints
export const API_ENDPOINTS = {
  chat: `${API_URL}/api/chat`,
  chatHistory: (walletAddress: string) => `${API_URL}/api/chat/history?wallet_address=${walletAddress}`,
  chatMessage: `${API_URL}/api/chat/message`,
  chatSummary: `${API_URL}/api/chat/summary`,
  yieldMetta: `${API_URL}/api/yield/metta`,
  health: `${API_URL}/api/health`,
  chart: (filename: string) => `${API_URL}/api/chart/${filename}`,
};
