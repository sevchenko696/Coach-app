// API base URL — set via EXPO_PUBLIC_API_URL env variable
// For local dev, use your machine's LAN IP (not localhost) since the phone is a separate device
// Example: EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
