import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useVideoPlayer, VideoView } from 'expo-video'
import { apiFetch } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { PROGRAM_DAYS } from '../../shared'
import type { DailyContent, Review } from '../../shared'
import { colors, spacing, fontSize, borderRadius, elementSize } from '../../constants/theme'
import ContentContainer from '../../components/ContentContainer'
import { contentPadding } from '../../constants/responsive'

export default function DayDetailScreen() {
  const { day } = useLocalSearchParams<{ day: string }>()
  const dayNumber = parseInt(day, 10)
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [content, setContent] = useState<DailyContent | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  const isBonus = dayNumber > 10

  const player = useVideoPlayer(content?.recording_url || '', (p) => {
    p.loop = false
  })

  const fetchData = useCallback(async () => {
    try {
      const [contentRes, reviewsRes] = await Promise.all([
        apiFetch<{ content: DailyContent }>(`/api/content/${dayNumber}`),
        apiFetch<{ reviews: Review[] }>(`/api/reviews?day=${dayNumber}`),
      ])
      setContent(contentRes.content)
      setReviews(reviewsRes.reviews || [])
      const mine = (reviewsRes.reviews || []).find(r => r.user_id === user?.id)
      setMyReview(mine || null)
      setReviewText(mine?.content || '')

      // Track the view
      apiFetch('/api/content-views', {
        method: 'POST',
        body: JSON.stringify({ day_number: dayNumber }),
      }).catch(() => {})
    } catch (err) {
      Alert.alert('Error', 'Failed to load day content')
    } finally {
      setLoading(false)
    }
  }, [dayNumber, user?.id])

  useEffect(() => { fetchData() }, [fetchData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  async function handleReviewSubmit() {
    if (!reviewText.trim()) return
    setSubmitting(true)
    try {
      const data = await apiFetch<{ review: Review }>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ day_number: dayNumber, content: reviewText.trim() }),
      })
      setMyReview(data.review)
      setReviews(prev => {
        const without = prev.filter(r => r.user_id !== user?.id)
        return [data.review, ...without]
      })
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: content?.title || `Day ${dayNumber}`,
          headerBackTitle: 'Back',
          headerTintColor: colors.primary,
        }}
      />
      <ScrollView
        style={styles.container}
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
            {/* Day header */}
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{content?.title || `Day ${dayNumber}`}</Text>
              {isBonus && <Text style={styles.bonusBadge}>Bonus Day</Text>}
            </View>

            {/* Notes section */}
            {content?.notes_url && (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                  <View style={styles.cardRowInfo}>
                    <Text style={styles.cardRowTitle}>Session Notes</Text>
                    <Text style={styles.cardRowSub}>{content.notes_filename || 'PDF Document'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.openBtn}
                    onPress={() => Linking.openURL(content.notes_url!)}
                  >
                    <Text style={styles.openBtnText}>Open</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Recording section */}
            {content?.recording_url && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="play-circle-outline" size={20} color={colors.primary} />
                  <Text style={styles.cardTitle}>Session Recording</Text>
                </View>
                <View style={styles.videoContainer}>
                  <VideoView
                    player={player}
                    style={styles.video}
                  />
                </View>
              </View>
            )}

            {/* No content message */}
            {!content?.notes_url && !content?.recording_url && (
              <View style={styles.emptyCard}>
                <Ionicons name="document-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>No content uploaded for this day yet.</Text>
              </View>
            )}

            {/* Review form */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Experiences & Reviews</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience for this day..."
                placeholderTextColor={colors.textMuted}
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[styles.submitBtn, (submitting || !reviewText.trim()) && styles.submitBtnDisabled]}
                onPress={handleReviewSubmit}
                disabled={submitting || !reviewText.trim()}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Submitting...' : myReview ? 'Update Review' : 'Share Review'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Reviews list */}
            {displayedReviews.length > 0 && (
              <View style={styles.reviewsList}>
                {displayedReviews.map(r => (
                  <View key={r.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>{r.user_name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.reviewMeta}>
                        <View style={styles.reviewNameRow}>
                          <Text style={styles.reviewName}>{r.user_name}</Text>
                          {r.user_id === user?.id && <Text style={styles.youBadge}>You</Text>}
                        </View>
                        <Text style={styles.reviewDate}>
                          {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.reviewContent}>{r.content}</Text>
                  </View>
                ))}
                {reviews.length > 3 && !showAllReviews && (
                  <TouchableOpacity onPress={() => setShowAllReviews(true)}>
                    <Text style={styles.showMore}>Show all {reviews.length} reviews</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={{ height: spacing['3xl'] }} />
          </>
        )}
        </ContentContainer>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: contentPadding(), gap: spacing.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  loadingText: { color: colors.textMuted },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  bonusBadge: {
    fontSize: fontSize.xs,
    backgroundColor: colors.amberLight,
    color: colors.amber,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    fontWeight: '600',
    overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardRowInfo: { flex: 1 },
  cardRowTitle: { fontSize: fontSize.base, fontWeight: '500', color: colors.text },
  cardRowSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  openBtn: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  openBtnText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  videoContainer: { borderRadius: borderRadius.md, overflow: 'hidden', backgroundColor: '#000' },
  video: { width: '100%', height: elementSize.videoHeight },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing['3xl'],
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted },
  reviewInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: elementSize.inputHeight * 1.9,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: fontSize.base, fontWeight: '600' },
  reviewsList: { gap: spacing.sm },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  reviewAvatar: {
    width: elementSize.avatarSmall,
    height: elementSize.avatarSmall,
    borderRadius: borderRadius.full,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
  reviewMeta: { flex: 1 },
  reviewNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  reviewName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  youBadge: {
    fontSize: fontSize.xs,
    color: colors.primary,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  reviewDate: { fontSize: fontSize.xs, color: colors.textMuted },
  reviewContent: { fontSize: fontSize.base, color: colors.text, lineHeight: fontSize.base * 1.5 },
  showMore: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '500', textAlign: 'center', paddingVertical: spacing.sm },
})
