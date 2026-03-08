import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { apiFetch } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import CheckinForm from '../../components/CheckinForm'
import {
  getCurrentDay,
  getDaysUntilStart,
  calculateStreak,
  PROGRAM_DAYS,
  SESSION_TIME,
} from '../../shared'
import type { DailyContent, DailyCheckin, Announcement } from '../../shared'
import { colors, spacing, fontSize, borderRadius, elementSize } from '../../constants/theme'
import ContentContainer from '../../components/ContentContainer'
import { DashboardSkeleton } from '../../components/Skeleton'
import ErrorState from '../../components/ErrorState'
import { useAppResume } from '../../hooks/useAppResume'
import { contentPadding } from '../../constants/responsive'

interface UserData {
  id: string
  name: string
  phone: string
  batch_id: string | null
  created_at: string
  batches?: { name: string; start_date: string; zoom_link: string | null; is_active: boolean } | null
}

export default function DashboardScreen() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [content, setContent] = useState<DailyContent[]>([])
  const [viewedDays, setViewedDays] = useState<number[]>([])
  const [checkins, setCheckins] = useState<DailyCheckin[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set())
  const [unreadQueries, setUnreadQueries] = useState(0)

  const batch = userData?.batches || null
  const currentDay = batch ? getCurrentDay(batch.start_date) : 0
  const hasStarted = currentDay >= 1
  const daysUntil = batch ? getDaysUntilStart(batch.start_date) : 0
  const streak = calculateStreak(viewedDays, currentDay)
  const isComplete = currentDay >= PROGRAM_DAYS && viewedDays.length === PROGRAM_DAYS
  const todayCheckin = checkins.find(c => c.day_number === currentDay) || null

  const fetchData = useCallback(async () => {
    try {
      setError(false)
      const [meRes, contentRes, viewsRes, checkinsRes, announcementsRes, queriesRes] = await Promise.all([
        apiFetch<{ user: UserData }>('/api/auth/me'),
        apiFetch<{ content: DailyContent[] }>('/api/content'),
        apiFetch<{ views: { day_number: number }[] }>('/api/content-views/my'),
        apiFetch<{ checkins: DailyCheckin[] }>('/api/checkins'),
        apiFetch<{ announcements: Announcement[] }>('/api/announcements'),
        apiFetch<{ unreadCount: number }>('/api/queries/my').catch(() => ({ unreadCount: 0 })),
      ])
      setUserData(meRes.user)
      setContent(contentRes.content || [])
      setViewedDays((viewsRes.views || []).map(v => v.day_number))
      setCheckins(checkinsRes.checkins || [])
      setAnnouncements((announcementsRes.announcements || []).filter(a => a.is_active))
      setUnreadQueries(queriesRes.unreadCount || 0)
    } catch (err) {
      if (err instanceof Error && err.message !== 'Unauthorized') {
        setError(true)
      }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerLogo}>
              <Text style={styles.headerLogoText}>H</Text>
            </View>
            <Text style={styles.headerTitle}>HealEasy</Text>
          </View>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <ContentContainer>
            <DashboardSkeleton />
          </ContentContainer>
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (error && !userData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerLogo}>
              <Text style={styles.headerLogoText}>H</Text>
            </View>
            <Text style={styles.headerTitle}>HealEasy</Text>
          </View>
        </View>
        <ErrorState message="Failed to load dashboard data." onRetry={fetchData} />
      </SafeAreaView>
    )
  }

  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.has(a.id))

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogo}>
            <Text style={styles.headerLogoText}>H</Text>
          </View>
          <Text style={styles.headerTitle}>HealEasy</Text>
        </View>
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={14} color={colors.amber} />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <ContentContainer>
        {/* Announcements */}
        {visibleAnnouncements.map(a => (
          <View key={a.id} style={styles.announcement}>
            <Ionicons name="megaphone-outline" size={16} color={colors.amber} />
            <View style={styles.announcementContent}>
              <Text style={styles.announcementTitle}>{a.title}</Text>
              <Text style={styles.announcementMsg}>{a.message}</Text>
            </View>
            <TouchableOpacity onPress={() => setDismissedAnnouncements(p => new Set([...p, a.id]))}>
              <Ionicons name="close" size={16} color={colors.amber} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Status Card */}
        {isComplete ? (
          <View style={styles.completeCard}>
            <Ionicons name="trophy" size={28} color="#fff" />
            <Text style={styles.completeTitle}>Congratulations, {userData?.name}!</Text>
            <Text style={styles.completeSubtext}>You've completed the 12-day L1 Detox Program!</Text>
            <TouchableOpacity
              style={styles.certBtn}
              onPress={() => router.push('/certificate')}
            >
              <Ionicons name="ribbon-outline" size={16} color={colors.primary} />
              <Text style={styles.certBtnText}>View Certificate</Text>
            </TouchableOpacity>
          </View>
        ) : batch && hasStarted ? (
          <View style={styles.batchCard}>
            <Text style={styles.batchName}>{batch.name}</Text>
            <Text style={styles.batchDay}>Day {currentDay} of {PROGRAM_DAYS}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(currentDay / PROGRAM_DAYS) * 100}%` }]} />
            </View>
            <Text style={styles.batchRemaining}>{PROGRAM_DAYS - currentDay} days remaining</Text>
          </View>
        ) : batch && !hasStarted ? (
          <View style={styles.comingSoonCard}>
            <Text style={styles.batchName}>{batch.name}</Text>
            <Text style={styles.comingSoonTitle}>
              {daysUntil === 1 ? 'Starts Tomorrow!' : `Starts in ${daysUntil} days`}
            </Text>
          </View>
        ) : (
          <View style={styles.noBatchCard}>
            <Ionicons name="time-outline" size={24} color={colors.warning} />
            <Text style={styles.noBatchTitle}>Waiting for batch assignment</Text>
            <Text style={styles.noBatchSubtext}>Your coordinator will assign you to a batch.</Text>
          </View>
        )}

        {/* Zoom Session */}
        {batch?.zoom_link && hasStarted && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="videocam-outline" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Today's Session</Text>
              <Text style={styles.sessionTime}>{SESSION_TIME}</Text>
            </View>
            <TouchableOpacity
              style={styles.joinBtn}
              onPress={() => Linking.openURL(batch.zoom_link!)}
            >
              <Ionicons name="videocam" size={16} color="#fff" />
              <Text style={styles.joinBtnText}>Join Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Daily Check-in */}
        {batch && hasStarted && currentDay >= 1 && (
          <CheckinForm
            currentDay={currentDay}
            existing={todayCheckin}
            onSaved={(checkin) => {
              setCheckins(prev => {
                const without = prev.filter(c => c.day_number !== checkin.day_number)
                return [...without, checkin]
              })
            }}
          />
        )}

        {/* Content List */}
        <Text style={styles.sectionTitle}>Program Content</Text>
        {content.map(day => {
          const isUnlocked = batch ? day.day_number <= currentDay : false
          const isToday = day.day_number === currentDay
          const isViewed = viewedDays.includes(day.day_number)
          const isBonus = day.day_number > 10

          return (
            <TouchableOpacity
              key={day.day_number}
              style={[styles.dayCard, isToday && styles.dayCardToday, !isUnlocked && styles.dayCardLocked]}
              onPress={() => isUnlocked && router.push(`/day/${day.day_number}`)}
              disabled={!isUnlocked}
            >
              <View style={[
                styles.dayBadge,
                isViewed && styles.dayBadgeViewed,
                isToday && !isViewed && styles.dayBadgeToday,
                !isUnlocked && styles.dayBadgeLocked,
              ]}>
                {isViewed ? (
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                ) : isUnlocked ? (
                  <Text style={styles.dayBadgeText}>{day.day_number}</Text>
                ) : (
                  <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
                )}
              </View>
              <View style={styles.dayInfo}>
                <View style={styles.dayTitleRow}>
                  <Text style={styles.dayTitle}>{day.title}</Text>
                  {isBonus && <Text style={styles.bonusBadge}>Bonus</Text>}
                  {isToday && <Text style={styles.todayBadge}>Today</Text>}
                </View>
                <Text style={styles.daySubtext}>
                  {isUnlocked
                    ? day.notes_url || day.recording_url ? 'Notes & recording available' : 'No content yet'
                    : `Unlocks on Day ${day.day_number}`}
                </Text>
              </View>
              {isUnlocked && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
            </TouchableOpacity>
          )
        })}

        {/* Bottom padding for tab bar */}
        <View style={{ height: spacing['2xl'] }} />
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textMuted },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerLogo: {
    width: elementSize.logoSmall,
    height: elementSize.logoSmall,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoText: { color: '#fff', fontWeight: '700', fontSize: fontSize.base },
  headerTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.amberLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  streakText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.amber },
  scroll: { flex: 1 },
  scrollContent: { padding: contentPadding(), gap: spacing.md },
  // Announcements
  announcement: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.amberLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  announcementContent: { flex: 1 },
  announcementTitle: { fontSize: fontSize.sm, fontWeight: '600', color: '#92400e' },
  announcementMsg: { fontSize: fontSize.sm, color: '#b45309', marginTop: spacing.xs },
  // Status cards
  completeCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  completeTitle: { fontSize: fontSize.lg, fontWeight: '700', color: '#fff' },
  completeSubtext: { fontSize: fontSize.sm, color: '#bbf7d0' },
  certBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  certBtnText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
  batchCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  batchName: { fontSize: fontSize.sm, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  batchDay: { fontSize: fontSize['2xl'], fontWeight: '700', color: '#fff', marginTop: spacing.xs },
  progressBar: {
    height: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: borderRadius.full },
  batchRemaining: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.6)', marginTop: spacing.xs },
  comingSoonCard: {
    backgroundColor: colors.info,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  comingSoonTitle: { fontSize: fontSize['2xl'], fontWeight: '700', color: '#fff', marginTop: spacing.xs },
  noBatchCard: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noBatchTitle: { fontSize: fontSize.base, fontWeight: '600', color: '#92400e' },
  noBatchSubtext: { fontSize: fontSize.sm, color: '#b45309', textAlign: 'center' },
  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, flex: 1 },
  sessionTime: { fontSize: fontSize.sm, color: colors.textSecondary },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  joinBtnText: { color: '#fff', fontSize: fontSize.base, fontWeight: '600' },
  // Content list
  sectionTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginTop: spacing.sm },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayCardToday: { backgroundColor: colors.successLight, borderColor: '#bbf7d0' },
  dayCardLocked: { opacity: 0.5 },
  dayBadge: {
    width: elementSize.dayBadge,
    height: elementSize.dayBadge,
    borderRadius: borderRadius.md,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBadgeViewed: { backgroundColor: colors.primary },
  dayBadgeToday: { backgroundColor: colors.primary },
  dayBadgeLocked: { backgroundColor: '#e5e7eb' },
  dayBadgeText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primaryDark },
  dayInfo: { flex: 1 },
  dayTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayTitle: { fontSize: fontSize.base, fontWeight: '500', color: colors.text },
  bonusBadge: {
    fontSize: fontSize.xs,
    backgroundColor: colors.amberLight,
    color: colors.amber,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    fontWeight: '500',
    overflow: 'hidden',
  },
  todayBadge: {
    fontSize: fontSize.xs,
    backgroundColor: colors.successLight,
    color: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    fontWeight: '500',
    overflow: 'hidden',
  },
  daySubtext: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
})
