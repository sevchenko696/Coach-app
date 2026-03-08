import { useState, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  type ListRenderItem,
  type ViewToken,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { hapticLight } from '../services/haptics'
import { colors, spacing, fontSize, borderRadius } from '../constants/theme'

interface OnboardingPage {
  id: string
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  iconBg: string
  title: string
  description: string
}

const PAGES: OnboardingPage[] = [
  {
    id: '1',
    icon: 'leaf-outline',
    iconColor: colors.primary,
    iconBg: colors.successLight,
    title: 'Welcome to HealEasy',
    description: 'Your personal companion for the L1 10+2 Detox Program. Track your progress, access daily content, and stay connected with your cohort.',
  },
  {
    id: '2',
    icon: 'calendar-outline',
    iconColor: colors.info,
    iconBg: colors.infoLight,
    title: 'Your 12-Day Journey',
    description: '10 core days plus 2 bonus days of guided content. Each day includes session notes, recordings, and a space to share your experience.',
  },
  {
    id: '3',
    icon: 'pulse-outline',
    iconColor: colors.amber,
    iconBg: colors.amberLight,
    title: 'Daily Check-ins',
    description: 'Track your mood, energy, and diet compliance each day. Watch your progress unfold with visual charts and earn your completion certificate.',
  },
]

const ONBOARDED_KEY = 'healeasy_onboarded'

export async function hasOnboarded(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(ONBOARDED_KEY)
  return val === 'true'
}

export async function markOnboarded(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDED_KEY, 'true')
}

export default function OnboardingScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index)
    }
  }).current

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current

  function handleNext() {
    hapticLight()
    if (currentIndex < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 })
    } else {
      handleFinish()
    }
  }

  async function handleFinish() {
    await markOnboarded()
    router.replace('/(tabs)')
  }

  async function handleSkip() {
    await markOnboarded()
    router.replace('/(tabs)')
  }

  const renderPage: ListRenderItem<OnboardingPage> = ({ item }) => (
    <View style={[styles.page, { width }]}>
      <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={48} color={item.iconColor} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  )

  const isLast = currentIndex === PAGES.length - 1

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      <View style={styles.skipRow}>
        {!isLast ? (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      {/* Pages */}
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Dots + Button */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>{isLast ? 'Get Started' : 'Next'}</Text>
          {!isLast && <Ionicons name="arrow-forward" size={16} color="#fff" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  skipText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.base * 1.6,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
})
