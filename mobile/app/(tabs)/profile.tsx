import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { apiFetch } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { hapticSuccess } from '../../services/haptics'
import { colors, spacing, fontSize, borderRadius, elementSize } from '../../constants/theme'
import ContentContainer from '../../components/ContentContainer'
import { ProfileSkeleton } from '../../components/Skeleton'
import ErrorState from '../../components/ErrorState'
import { useAppResume } from '../../hooks/useAppResume'
import { contentPadding } from '../../constants/responsive'

interface UserProfile {
  id: string
  name: string
  phone: string
  dob: string
  batch_id: string | null
  created_at: string
  password?: string | null
  batches?: { name: string; start_date: string } | null
}

export default function ProfileScreen() {
  const { logout, refresh } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const hasCustomPassword = !!userData?.password

  const fetchData = useCallback(async () => {
    try {
      setError(false)
      const data = await apiFetch<{ user: UserProfile }>('/api/auth/me')
      setUserData(data.user)
      setName(data.user.name)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useAppResume(fetchData)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty')
      return
    }
    if (password && password.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters')
      return
    }
    if (password && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    setSaving(true)
    try {
      const body: Record<string, string> = { name: name.trim() }
      if (password) body.password = password

      await apiFetch(`/api/users/${userData!.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      showToast('Profile updated successfully!')
      hapticSuccess()
      setPassword('')
      setConfirmPassword('')
      await refresh()
      await fetchData()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ])
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.scroll}
      >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        keyboardShouldPersistTaps="handled"
      >
        <ContentContainer>
        {loading ? (
          <ProfileSkeleton />
        ) : userData ? (
          <>
            {/* Password warning */}
            {!hasCustomPassword && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning" size={20} color={colors.warning} />
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Set up your password</Text>
                  <Text style={styles.warningText}>
                    You're using your date of birth as your password. Set a custom password below for security.
                  </Text>
                </View>
              </View>
            )}

            {/* Avatar + Info */}
            <View style={styles.avatarCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userData.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.userName}>{userData.name}</Text>
              {userData.batches && (
                <Text style={styles.batchInfo}>{userData.batches.name}</Text>
              )}
            </View>

            {/* Account Info */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account Details</Text>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{userData.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Password</Text>
                <Text style={styles.infoValue}>{hasCustomPassword ? 'Custom password set' : 'Using date of birth'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Joined</Text>
                <Text style={styles.infoValue}>
                  {new Date(userData.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>

            {/* Edit Form */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Edit Profile</Text>

              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>{hasCustomPassword ? 'Change Password' : 'Set Password'}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="New password (min 4 chars)"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {password.length > 0 && (
                <>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <View style={{ height: spacing['2xl'] }} />
          </>
        ) : (
          <ErrorState message="Unable to load profile." onRetry={fetchData} />
        )}
        </ContentContainer>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  scroll: { flex: 1 },
  scrollContent: { padding: contentPadding(), gap: spacing.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: spacing['3xl'] * 3 },
  loadingText: { color: colors.textMuted },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warningContent: { flex: 1 },
  warningTitle: { fontSize: fontSize.base, fontWeight: '600', color: '#92400e' },
  warningText: { fontSize: fontSize.sm, color: '#b45309', marginTop: spacing.xs },
  avatarCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: elementSize.avatar,
    height: elementSize.avatar,
    borderRadius: elementSize.avatar / 2,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: fontSize['2xl'], fontWeight: '700', color: colors.primary },
  userName: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  batchInfo: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: fontSize.sm, color: colors.textSecondary, width: 70 },
  infoValue: { flex: 1, fontSize: fontSize.sm, color: colors.text, textAlign: 'right' },
  label: { fontSize: fontSize.sm, fontWeight: '500', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: borderRadius.md,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.text,
  },
  eyeBtn: { padding: spacing.md },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: fontSize.base, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: { fontSize: fontSize.base, fontWeight: '600', color: colors.error },
})
