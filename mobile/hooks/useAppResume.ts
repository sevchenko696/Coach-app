import { useEffect, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

/**
 * Calls the callback when the app transitions from background to active.
 * Useful for refreshing data when the user returns to the app.
 */
export function useAppResume(callback: () => void) {
  const appState = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        callback()
      }
      appState.current = nextState
    })

    return () => subscription.remove()
  }, [callback])
}
