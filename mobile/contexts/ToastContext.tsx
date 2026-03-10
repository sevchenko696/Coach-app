import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { Animated, Text, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, fontSize, borderRadius } from '../constants/theme'

type ToastType = 'success' | 'error' | 'info'

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_COLORS: Record<ToastType, { bg: string; text: string }> = {
  success: { bg: colors.primary, text: '#fff' },
  error: { bg: colors.error, text: '#fff' },
  info: { bg: colors.info, text: '#fff' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()
  const [message, setMessage] = useState('')
  const [type, setType] = useState<ToastType>('success')
  const [visible, setVisible] = useState(false)
  const translateYRef = useRef(new Animated.Value(-100))
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string, toastType: ToastType = 'success') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    setMessage(msg)
    setType(toastType)
    setVisible(true)

    Animated.spring(translateYRef.current, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start()

    timeoutRef.current = setTimeout(() => {
      Animated.timing(translateYRef.current, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false))
    }, 3000)
  }, [])

  const toastColors = TOAST_COLORS[type]

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.toast,
            {
              top: insets.top + spacing.sm,
              backgroundColor: toastColors.bg,
              transform: [{ translateY: translateYRef.current }],
            },
          ]}
        >
          <Text style={[styles.toastText, { color: toastColors.text }]}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    zIndex: 9999,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  toastText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
})
