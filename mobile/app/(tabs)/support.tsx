import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
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
import { useToast } from '../../contexts/ToastContext'
import { QUERY_CATEGORIES } from '../../shared'
import type { FAQ, Query } from '../../shared'
import { colors, spacing, fontSize, borderRadius, elementSize } from '../../constants/theme'
import ContentContainer from '../../components/ContentContainer'
import { useAppResume } from '../../hooks/useAppResume'
import { contentPadding } from '../../constants/responsive'

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Link: { bg: '#dbeafe', text: '#1d4ed8' },
  Diet: { bg: '#dcfce7', text: '#16a34a' },
  Technical: { bg: '#f3e8ff', text: '#7c3aed' },
  Other: { bg: '#f3f4f6', text: '#4b5563' },
}

export default function SupportScreen() {
  const { showToast } = useToast()
  const [tab, setTab] = useState<'faqs' | 'queries'>('faqs')
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [queries, setQueries] = useState<Query[]>([])
  const [loadingQueries, setLoadingQueries] = useState(false)
  const [category, setCategory] = useState<string>('Link')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)

  useEffect(() => {
    apiFetch<{ faqs: FAQ[] }>('/api/faqs')
      .then(d => setFaqs(d.faqs || []))
      .catch(() => {})
  }, [])

  const fetchQueries = useCallback(async () => {
    setLoadingQueries(true)
    try {
      const data = await apiFetch<{ queries: Query[]; unreadCount: number }>('/api/queries/my')
      setQueries(data.queries || [])
      if (data.unreadCount > 0) {
        apiFetch('/api/queries/my', { method: 'PUT' }).catch(() => {})
      }
    } catch {
      // silent
    } finally {
      setLoadingQueries(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'queries') fetchQueries()
  }, [tab, fetchQueries])

  const handleResume = useCallback(() => {
    if (tab === 'queries') fetchQueries()
  }, [tab, fetchQueries])
  useAppResume(handleResume)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    if (tab === 'faqs') {
      const data = await apiFetch<{ faqs: FAQ[] }>('/api/faqs').catch(() => ({ faqs: [] }))
      setFaqs(data.faqs || [])
    } else {
      await fetchQueries()
    }
    setRefreshing(false)
  }, [tab, fetchQueries])

  async function handleSubmitQuery() {
    if (!message.trim()) return
    setSubmitting(true)
    try {
      await apiFetch('/api/queries', {
        method: 'POST',
        body: JSON.stringify({ category, message: message.trim() }),
      })
      setSubmitted(true)
      setMessage('')
      setQueries([])
      showToast('Query submitted!')
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit query')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = faqs.filter(f =>
    f.question.toLowerCase().includes(search.toLowerCase()) ||
    f.answer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FAQ & Support</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'faqs' && styles.tabBtnActive]}
          onPress={() => setTab('faqs')}
        >
          <Text style={[styles.tabText, tab === 'faqs' && styles.tabTextActive]}>FAQs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'queries' && styles.tabBtnActive]}
          onPress={() => setTab('queries')}
        >
          <Text style={[styles.tabText, tab === 'queries' && styles.tabTextActive]}>My Queries</Text>
        </TouchableOpacity>
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
        {tab === 'faqs' ? (
          <>
            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search questions..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* FAQ list */}
            {filtered.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No results found. Try a different search.</Text>
              </View>
            ) : (
              <View style={styles.faqList}>
                {filtered.map(faq => (
                  <TouchableOpacity
                    key={faq.id}
                    style={styles.faqItem}
                    onPress={() => setOpenId(openId === faq.id ? null : faq.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.faqQuestion}>
                      <Text style={styles.faqQuestionText}>{faq.question}</Text>
                      <Ionicons
                        name={openId === faq.id ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textMuted}
                      />
                    </View>
                    {openId === faq.id && (
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Query Form */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Didn't find your answer?</Text>
              <Text style={styles.cardSubtitle}>Submit a query and we'll get back to you.</Text>

              {submitted ? (
                <View style={styles.submittedContainer}>
                  <Ionicons name="send" size={24} color={colors.primary} />
                  <Text style={styles.submittedTitle}>Query Submitted!</Text>
                  <Text style={styles.submittedSub}>We'll respond as soon as possible.</Text>
                  <TouchableOpacity onPress={() => setSubmitted(false)}>
                    <Text style={styles.link}>Submit another query</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.label}>Category</Text>
                  <TouchableOpacity
                    style={styles.pickerBtn}
                    onPress={() => setCategoryPickerOpen(!categoryPickerOpen)}
                  >
                    <Text style={styles.pickerText}>{category}</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                  {categoryPickerOpen && (
                    <View style={styles.pickerDropdown}>
                      {QUERY_CATEGORIES.map(cat => (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.pickerOption, category === cat && styles.pickerOptionActive]}
                          onPress={() => { setCategory(cat); setCategoryPickerOpen(false) }}
                        >
                          <Text style={styles.pickerOptionText}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Text style={styles.label}>Your Message</Text>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Describe your question or issue..."
                    placeholderTextColor={colors.textMuted}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={4}
                  />

                  <TouchableOpacity
                    style={[styles.submitBtn, (submitting || !message.trim()) && styles.submitBtnDisabled]}
                    onPress={handleSubmitQuery}
                    disabled={submitting || !message.trim()}
                  >
                    <Ionicons name="send" size={14} color="#fff" />
                    <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Query'}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        ) : (
          /* My Queries tab */
          <>
            {loadingQueries ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Loading your queries...</Text>
              </View>
            ) : queries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="chatbubble-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>No queries submitted yet.</Text>
                <TouchableOpacity onPress={() => setTab('faqs')}>
                  <Text style={styles.link}>Go to FAQs</Text>
                </TouchableOpacity>
              </View>
            ) : (
              queries.map(q => {
                const catColor = CATEGORY_COLORS[q.category] || CATEGORY_COLORS.Other
                const isUnread = !q.response_read && (q.admin_notes || q.is_resolved)
                return (
                  <View
                    key={q.id}
                    style={[styles.queryCard, isUnread && styles.queryCardUnread]}
                  >
                    <View style={styles.queryBadges}>
                      <View style={[styles.catBadge, { backgroundColor: catColor.bg }]}>
                        <Text style={[styles.catBadgeText, { color: catColor.text }]}>{q.category}</Text>
                      </View>
                      {q.is_resolved ? (
                        <View style={styles.statusResolved}>
                          <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                          <Text style={styles.statusResolvedText}>Resolved</Text>
                        </View>
                      ) : (
                        <View style={styles.statusOpen}>
                          <Ionicons name="time" size={12} color={colors.amber} />
                          <Text style={styles.statusOpenText}>Open</Text>
                        </View>
                      )}
                      {isUnread && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>New</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.queryMessage}>{q.message}</Text>
                    <Text style={styles.queryDate}>
                      {new Date(q.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                    {q.admin_notes && (
                      <View style={styles.adminResponse}>
                        <Text style={styles.adminResponseLabel}>Response from admin:</Text>
                        <Text style={styles.adminResponseText}>{q.admin_notes}</Text>
                      </View>
                    )}
                  </View>
                )
              })
            )}
          </>
        )}
        <View style={{ height: spacing['2xl'] }} />
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  tabBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.sm },
  tabBtnActive: { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: fontSize.sm, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: colors.text },
  scroll: { flex: 1 },
  scrollContent: { padding: contentPadding(), gap: spacing.md },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: fontSize.base, color: colors.text, paddingVertical: spacing.xs },
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
  link: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '500', marginTop: spacing.sm },
  faqList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  faqItem: { borderBottomWidth: 1, borderBottomColor: colors.border },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  faqQuestionText: { flex: 1, fontSize: fontSize.base, fontWeight: '500', color: colors.text, paddingRight: spacing.sm },
  faqAnswer: { fontSize: fontSize.base, color: colors.textSecondary, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, lineHeight: fontSize.base * 1.6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  cardSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: '500', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pickerText: { fontSize: fontSize.base, color: colors.text },
  pickerDropdown: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  pickerOption: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  pickerOptionActive: { backgroundColor: colors.successLight },
  pickerOptionText: { fontSize: fontSize.base, color: colors.text },
  messageInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: elementSize.inputHeight * 2.4,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: fontSize.base, fontWeight: '600' },
  submittedContainer: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  submittedTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  submittedSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  // Queries
  queryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  queryCardUnread: { borderColor: '#86efac', borderWidth: 2 },
  queryBadges: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  catBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  catBadgeText: { fontSize: fontSize.xs, fontWeight: '500' },
  statusResolved: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusResolvedText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '500' },
  statusOpen: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusOpenText: { fontSize: fontSize.xs, color: colors.amber, fontWeight: '500' },
  newBadge: { backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  newBadgeText: { fontSize: fontSize.xs, color: '#fff', fontWeight: '600' },
  queryMessage: { fontSize: fontSize.base, color: colors.text },
  queryDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
  adminResponse: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  adminResponseLabel: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primaryDark, marginBottom: spacing.xs },
  adminResponseText: { fontSize: fontSize.sm, color: colors.primary },
})
