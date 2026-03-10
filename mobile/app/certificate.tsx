import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { apiFetch } from '../services/api'
import { hapticSuccess } from '../services/haptics'
import { useToast } from '../contexts/ToastContext'
import { PROGRAM_DAYS } from '../shared'
import { colors, spacing, fontSize, borderRadius } from '../constants/theme'
import ContentContainer from '../components/ContentContainer'
import ErrorState from '../components/ErrorState'
import { SkeletonBlock } from '../components/Skeleton'
import { contentPadding } from '../constants/responsive'

interface CertData {
  name: string
  batchName: string
  completedDays: number
  checkinCount: number
  completionDate: string
}

export default function CertificateScreen() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState<CertData | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(false)
      const [meRes, viewsRes, checkinsRes] = await Promise.all([
        apiFetch<{ user: { name: string; batches?: { name: string; start_date: string } | null } }>('/api/auth/me'),
        apiFetch<{ views: { day_number: number }[] }>('/api/content-views/my'),
        apiFetch<{ checkins: { day_number: number; created_at: string }[] }>('/api/checkins'),
      ])
      const viewedDays = (viewsRes.views || []).map(v => v.day_number)
      const checkins = checkinsRes.checkins || []
      const lastCheckin = checkins.length
        ? checkins.reduce((latest, c) => c.created_at > latest ? c.created_at : latest, checkins[0].created_at)
        : new Date().toISOString()

      setData({
        name: meRes.user.name,
        batchName: meRes.user.batches?.name || 'L1 Detox Program',
        completedDays: viewedDays.filter(d => d <= PROGRAM_DAYS).length,
        checkinCount: checkins.length,
        completionDate: new Date(lastCheckin).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        }),
      })
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleShare() {
    try {
      await Share.share({
        message: `I completed the HealEasy ${data?.batchName || 'L1 Detox Program'}! ${data?.completedDays}/${PROGRAM_DAYS} days completed with ${data?.checkinCount} daily check-ins. #HealEasy`,
      })
      hapticSuccess()
    } catch {
      showToast('Failed to share', 'error')
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Certificate',
          headerBackTitle: 'Back',
          headerTintColor: colors.primary,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ContentContainer>
          {loading ? (
            <View style={{ gap: spacing.md, paddingTop: spacing.md }}>
              <SkeletonBlock height={400} borderRadius={borderRadius.lg} />
            </View>
          ) : error ? (
            <ErrorState message="Failed to load certificate data." onRetry={fetchData} />
          ) : data ? (
            <>
              {/* Certificate Card */}
              <View style={styles.certCard}>
                <View style={styles.certBorder}>
                  {/* Header */}
                  <View style={styles.certHeader}>
                    <View style={styles.certLogo}>
                      <Text style={styles.certLogoText}>H</Text>
                    </View>
                    <Text style={styles.certOrg}>HealEasy</Text>
                  </View>

                  <Text style={styles.certTitle}>Certificate of Completion</Text>
                  <View style={styles.certDivider} />

                  <Text style={styles.certPresented}>This is to certify that</Text>
                  <Text style={styles.certName}>{data.name}</Text>

                  <Text style={styles.certBody}>
                    has successfully completed the
                  </Text>
                  <Text style={styles.certProgram}>{data.batchName}</Text>

                  <View style={styles.certStats}>
                    <View style={styles.certStat}>
                      <Text style={styles.certStatValue}>{data.completedDays}/{PROGRAM_DAYS}</Text>
                      <Text style={styles.certStatLabel}>Days Completed</Text>
                    </View>
                    <View style={styles.certStatDivider} />
                    <View style={styles.certStat}>
                      <Text style={styles.certStatValue}>{data.checkinCount}</Text>
                      <Text style={styles.certStatLabel}>Check-ins</Text>
                    </View>
                  </View>

                  <View style={styles.certDivider} />
                  <Text style={styles.certDate}>{data.completionDate}</Text>
                </View>
              </View>

              {/* Share Button */}
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={18} color="#fff" />
                <Text style={styles.shareBtnText}>Share Achievement</Text>
              </TouchableOpacity>

              <View style={{ height: spacing['3xl'] }} />
            </>
          ) : null}
        </ContentContainer>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: contentPadding(), gap: spacing.md },
  certCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  certBorder: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
  },
  certHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  certLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  certLogoText: {
    color: '#fff',
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  certOrg: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  certTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  certDivider: {
    width: 60,
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: spacing.lg,
    borderRadius: 1,
  },
  certPresented: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  certName: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  certBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  certProgram: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  certStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xl,
  },
  certStat: {
    alignItems: 'center',
  },
  certStatValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  certStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  certStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  certDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '600',
  },
})
