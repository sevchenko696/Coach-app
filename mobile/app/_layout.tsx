import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { NetworkProvider, useNetwork } from '../contexts/NetworkContext'
import LoadingScreen from '../components/LoadingScreen'
import OfflineBanner from '../components/OfflineBanner'

function RootNavigator() {
  const { status } = useAuth()
  const { isConnected } = useNetwork()

  if (status === 'loading') {
    return <LoadingScreen />
  }

  return (
    <>
      <StatusBar style="dark" />
      {!isConnected && <OfflineBanner />}
      <Stack screenOptions={{ headerShown: false }}>
        {status === 'authenticated' ? (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="day/[day]"
              options={{
                headerShown: true,
                headerTitle: '',
                headerBackTitle: 'Back',
                headerTintColor: '#16a34a',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="certificate"
              options={{
                headerShown: true,
                headerTitle: 'Certificate',
                headerBackTitle: 'Back',
                headerTintColor: '#16a34a',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="onboarding"
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="(auth)" />
        )}
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <NetworkProvider>
      <AuthProvider>
        <ToastProvider>
          <RootNavigator />
        </ToastProvider>
      </AuthProvider>
    </NetworkProvider>
  )
}
