import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import { hapticSelection, hapticSuccess } from '../../services/haptics'
import { hasOnboarded } from '../onboarding'
import { normalizePhone } from '../../shared'
import { colors, spacing, fontSize, borderRadius, elementSize } from '../../constants/theme'
import ContentContainer from '../../components/ContentContainer'

export default function LoginScreen() {
  const router = useRouter()
  const { login } = useAuth()
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    const normalized = normalizePhone(phone)
    if (!normalized) {
      Alert.alert('Invalid Phone', 'Enter a valid 10-digit Indian mobile number.')
      return
    }

    const loginPassword = isFirstTime ? dob : password
    if (!loginPassword) {
      Alert.alert('Missing Field', isFirstTime ? 'Enter your date of birth.' : 'Enter your password.')
      return
    }

    setLoading(true)
    try {
      const { firstLogin } = await login(normalized, loginPassword)
      hapticSuccess()
      const onboarded = await hasOnboarded()
      if (firstLogin && !onboarded) {
        router.replace('/onboarding')
      } else if (firstLogin) {
        router.replace('/(tabs)/profile')
      } else {
        router.replace('/(tabs)')
      }
    } catch (err) {
      Alert.alert('Login Failed', err instanceof Error ? err.message : 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  function formatDobInput(text: string) {
    // Auto-format to YYYY-MM-DD as user types
    const digits = text.replace(/\D/g, '')
    let formatted = digits
    if (digits.length > 4) formatted = digits.slice(0, 4) + '-' + digits.slice(4)
    if (digits.length > 6) formatted = digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6, 8)
    setDob(formatted)
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ContentContainer>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>H</Text>
              </View>
              <Text style={styles.title}>HealEasy</Text>
              <Text style={styles.subtitle}>L1 10+2 Detox Program</Text>
            </View>

            {/* Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, !isFirstTime && styles.toggleActive]}
                onPress={() => { setIsFirstTime(false); hapticSelection() }}
              >
                <Text style={[styles.toggleText, !isFirstTime && styles.toggleTextActive]}>Returning User</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, isFirstTime && styles.toggleActive]}
                onPress={() => { setIsFirstTime(true); hapticSelection() }}
              >
                <Text style={[styles.toggleText, isFirstTime && styles.toggleTextActive]}>First Time</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={13}
                autoComplete="tel"
              />

              {isFirstTime ? (
                <>
                  <Text style={styles.label}>Date of Birth</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={dob}
                    onChangeText={formatDobInput}
                    maxLength={10}
                  />
                  <Text style={styles.hint}>
                    Your first password is your date of birth in YYYY-MM-DD format
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    autoComplete="password"
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={loading ? 'Signing in' : 'Sign in'}
              >
                <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footer}>
              {isFirstTime
                ? 'Use your phone number and date of birth to log in for the first time.'
                : 'Forgot password? Your initial password is your date of birth (YYYY-MM-DD).'}
            </Text>
          </ContentContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logo: {
    width: elementSize.logo,
    height: elementSize.logo,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logoText: {
    color: '#fff',
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    marginBottom: spacing['2xl'],
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  toggleActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.text,
  },
  form: {
    marginBottom: spacing['2xl'],
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.text,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: fontSize.sm * 1.5,
  },
})
