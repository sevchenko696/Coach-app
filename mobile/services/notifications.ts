import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { apiFetch } from './api'

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

/** Request push notification permissions and get the Expo push token. */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null // Push notifications don't work on simulators
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return null
  }

  // Set notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  const tokenData = await Notifications.getExpoPushTokenAsync()
  return tokenData.data
}

/** Register push token with the backend. */
export async function savePushToken(token: string): Promise<void> {
  try {
    await apiFetch('/api/push-tokens', {
      method: 'POST',
      body: JSON.stringify({
        token,
        platform: Platform.OS,
      }),
    })
  } catch {
    // Non-critical — don't block the user
  }
}

/** Unregister push token from the backend. */
export async function removePushToken(token: string): Promise<void> {
  try {
    await apiFetch('/api/push-tokens', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    })
  } catch {
    // Non-critical
  }
}
