import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Rect } from 'react-native-svg'
import { apiFetch } from '../../services/api'
import {
  getCurrentDay,
  calculateStreak,
  PROGRAM_DAYS,
  MOOD_EMOJIS,
  MOOD_LABELS,
  ENERGY_LABELS,
} from '../../shared'
import type { DailyCheckin } from '../../shared'
import { colors, spacing, fontSize, borderRadius, elementSize } from '../../constants/theme'
import ContentContainer from '../../components/ContentContainer'
import { contentPadding, ms, SCREEN_WIDTH, MAX_CONTENT_WIDTH } from '../../constants/responsive'

interface UserData {
  batches?: { start_date: string } | null
}

export default function ProgressScreen() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [checkins, setCheckins] = useState<DailyCheckin[]>([])
  const [viewedDays, setViewedDays] = useState<number[]>([])
  const [currentDay, setCurrentDay] = useState(0)
  const [userName, setUserName] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [meRes, checkinsRes, viewsRes] = await Promise.all([
        apiFetch<{ user: UserData & { name: string } }>('/api/auth/me'),
        apiFetch<{ checkins: DailyCheckin[] }>('/api/checkins'),
        apiFetch<{ views: { day_number: number }[] }>('/api/content-views/my'),
      ])
      setUserName(meRes.user.name)
      setCheckins(checkinsRes.checkins || [])
      setViewedDays((viewsRes.views || []).map(v => v.day_number))
      const day = meRes.user.batches?.start_date ? getCurrentDay(meRes.user.batches.start_date) : 0
      setCurrentDay(day)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  const streak = calculateStreak(viewedDays, currentDay)
  const completedDays = viewedDays.length
  const sortedCheckins = [...checkins].sort((a, b) => a.day_number - b.day_number)

  // Averages
  const avgMood = checkins.length ? checkins.reduce((s, c) => s + c.mood, 0) / checkins.length : 0
  const avgEnergy = checkins.length ? checkins.reduce((s, c) => s + c.energy, 0) / checkins.length : 0
  const dietYes = checkins.filter(c => c.diet_compliance === 'yes').length
  const dietPct = checkins.length ? Math.round((dietYes / checkins.length) * 100) : 0

  // Chart dimensions — constrain to MAX_CONTENT_WIDTH on tablets
  const usableWidth = Math.min(SCREEN_WIDTH, MAX_CONTENT_WIDTH + contentPadding() * 2)
  const chartWidth = usableWidth - contentPadding() * 2 - spacing.lg * 2
  const barWidth = Math.max(ms(12), (chartWidth - (PROGRAM_DAYS - 1) * spacing.xs) / PROGRAM_DAYS)
  const chartHeight = elementSize.chartHeight

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Progress</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <ContentContainer>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {/* Stats cards */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{completedDays}/{PROGRAM_DAYS}</Text>
                <Text style={styles.statLabel}>Days Completed</Text>
                <View style={styles.miniProgressBar}>
                  <View style={[styles.miniProgressFill, { width: `${(completedDays / PROGRAM_DAYS) * 100}%` }]} />
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statValueRow}>
                  <Ionicons name="flame" size={18} color={colors.amber} />
                  <Text style={styles.statValue}>{streak}</Text>
                </View>
                <Text style={styles.statLabel}>Day Streak</Text>
                <Text style={styles.statSub}>{checkins.length} check-ins</Text>
              </View>
            </View>

            {/* Averages */}
            {checkins.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Averages</Text>
                <View style={styles.avgRow}>
                  <View style={styles.avgItem}>
                    <Text style={styles.avgEmoji}>{MOOD_EMOJIS[Math.round(avgMood) - 1] || '😐'}</Text>
                    <Text style={styles.avgValue}>{avgMood.toFixed(1)}</Text>
                    <Text style={styles.avgLabel}>Mood</Text>
                  </View>
                  <View style={styles.avgItem}>
                    <Ionicons name="flash" size={24} color={colors.amber} />
                    <Text style={styles.avgValue}>{avgEnergy.toFixed(1)}/5</Text>
                    <Text style={styles.avgLabel}>Energy</Text>
                  </View>
                  <View style={styles.avgItem}>
                    <Text style={styles.avgEmoji}>{dietPct >= 70 ? '✅' : dietPct >= 40 ? '🟡' : '❌'}</Text>
                    <Text style={styles.avgValue}>{dietPct}%</Text>
                    <Text style={styles.avgLabel}>Diet</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Mood trend chart */}
            {sortedCheckins.length >= 2 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Mood Trend</Text>
                <Svg width={chartWidth} height={chartHeight + 20}>
                  {Array.from({ length: PROGRAM_DAYS }, (_, i) => {
                    const ci = sortedCheckins.find(c => c.day_number === i + 1)
                    const val = ci ? ci.mood : 0
                    const h = val > 0 ? (val / 5) * chartHeight : 0
                    const x = i * (barWidth + 4)
                    return (
                      <Rect
                        key={i}
                        x={x}
                        y={chartHeight - h}
                        width={barWidth}
                        height={h || 2}
                        rx={4}
                        fill={val > 0 ? colors.pink : '#e5e7eb'}
                        opacity={val > 0 ? 0.8 : 0.3}
                      />
                    )
                  })}
                </Svg>
                <View style={styles.chartLabels}>
                  {Array.from({ length: PROGRAM_DAYS }, (_, i) => (
                    <Text key={i} style={[styles.chartLabel, { width: barWidth + 4 }]}>{i + 1}</Text>
                  ))}
                </View>
              </View>
            )}

            {/* Energy trend chart */}
            {sortedCheckins.length >= 2 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Energy Trend</Text>
                <Svg width={chartWidth} height={chartHeight + 20}>
                  {Array.from({ length: PROGRAM_DAYS }, (_, i) => {
                    const ci = sortedCheckins.find(c => c.day_number === i + 1)
                    const val = ci ? ci.energy : 0
                    const h = val > 0 ? (val / 5) * chartHeight : 0
                    const x = i * (barWidth + 4)
                    return (
                      <Rect
                        key={i}
                        x={x}
                        y={chartHeight - h}
                        width={barWidth}
                        height={h || 2}
                        rx={4}
                        fill={val > 0 ? colors.amber : '#e5e7eb'}
                        opacity={val > 0 ? 0.8 : 0.3}
                      />
                    )
                  })}
                </Svg>
                <View style={styles.chartLabels}>
                  {Array.from({ length: PROGRAM_DAYS }, (_, i) => (
                    <Text key={i} style={[styles.chartLabel, { width: barWidth + 4 }]}>{i + 1}</Text>
                  ))}
                </View>
              </View>
            )}

            {/* Day-by-day log */}
            <Text style={styles.sectionTitle}>Day-by-Day Log</Text>
            {[...checkins].sort((a, b) => b.day_number - a.day_number).map(c => (
              <View key={c.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={styles.logDayBadge}>
                    <Text style={styles.logDayText}>Day {c.day_number}</Text>
                  </View>
                  {viewedDays.includes(c.day_number) && (
                    <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  )}
                </View>
                <View style={styles.logMetrics}>
                  <Text style={styles.logMetric}>{MOOD_EMOJIS[c.mood - 1]} {MOOD_LABELS[c.mood - 1]}</Text>
                  <Text style={styles.logMetric}>Energy: {c.energy}/5</Text>
                  <Text style={styles.logMetric}>
                    Diet: {c.diet_compliance === 'yes' ? '✅' : c.diet_compliance === 'partially' ? '🟡' : '❌'}
                  </Text>
                </View>
                {c.notes && <Text style={styles.logNotes}>{c.notes}</Text>}
              </View>
            ))}

            {checkins.length === 0 && (
              <View style={styles.emptyCard}>
                <Ionicons name="bar-chart-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>No check-ins yet. Complete your daily check-in from the dashboard.</Text>
              </View>
            )}

            <View style={{ height: spacing['2xl'] }} />
          </>
        )}
        </ContentContainer>
      </ScrollView>
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
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  statSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  miniProgressBar: {
    height: spacing.sm * 0.75,
    backgroundColor: '#e5e7eb',
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  miniProgressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.full },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  avgRow: { flexDirection: 'row', justifyContent: 'space-around' },
  avgItem: { alignItems: 'center', gap: spacing.xs },
  avgEmoji: { fontSize: ms(24) },
  avgValue: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  avgLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  chartLabels: { flexDirection: 'row', marginTop: spacing.xs },
  chartLabel: { textAlign: 'center', fontSize: ms(8), color: colors.textMuted },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginTop: spacing.sm },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  logDayBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  logDayText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primary },
  logMetrics: { flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' },
  logMetric: { fontSize: fontSize.sm, color: colors.textSecondary },
  logNotes: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing['3xl'],
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
})
