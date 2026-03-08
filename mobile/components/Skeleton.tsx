import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, type ViewStyle } from 'react-native'
import { colors, spacing, borderRadius } from '../constants/theme'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

/** Animated shimmer placeholder for loading states. */
export function SkeletonBlock({ width = '100%', height = 16, borderRadius: br = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius: br, backgroundColor: '#e5e7eb', opacity },
        style,
      ]}
    />
  )
}

/** Circular skeleton for avatars. */
export function SkeletonCircle({ size = 40, style }: { size?: number; style?: ViewStyle }) {
  return <SkeletonBlock width={size} height={size} borderRadius={size / 2} style={style} />
}

/** Dashboard skeleton matching the real layout. */
export function DashboardSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {/* Status card */}
      <SkeletonBlock height={120} borderRadius={borderRadius.lg} />
      {/* Zoom card */}
      <SkeletonBlock height={80} borderRadius={borderRadius.lg} />
      {/* Checkin card */}
      <SkeletonBlock height={160} borderRadius={borderRadius.lg} />
      {/* Section title */}
      <SkeletonBlock width={140} height={18} />
      {/* Day cards */}
      {Array.from({ length: 4 }, (_, i) => (
        <View key={i} style={skeletonStyles.dayRow}>
          <SkeletonBlock width={40} height={40} borderRadius={borderRadius.md} />
          <View style={skeletonStyles.dayInfo}>
            <SkeletonBlock width="70%" height={14} />
            <SkeletonBlock width="40%" height={10} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  )
}

/** Progress screen skeleton. */
export function ProgressSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {/* Stats row */}
      <View style={skeletonStyles.row}>
        <SkeletonBlock height={90} borderRadius={borderRadius.lg} style={{ flex: 1 }} />
        <SkeletonBlock height={90} borderRadius={borderRadius.lg} style={{ flex: 1 }} />
      </View>
      {/* Averages card */}
      <SkeletonBlock height={100} borderRadius={borderRadius.lg} />
      {/* Chart card */}
      <SkeletonBlock height={160} borderRadius={borderRadius.lg} />
      {/* Log entries */}
      <SkeletonBlock width={140} height={18} />
      {Array.from({ length: 3 }, (_, i) => (
        <SkeletonBlock key={i} height={70} borderRadius={borderRadius.md} />
      ))}
    </View>
  )
}

/** Support screen skeleton. */
export function SupportSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {/* Search bar */}
      <SkeletonBlock height={44} borderRadius={borderRadius.md} />
      {/* FAQ items */}
      <SkeletonBlock height={200} borderRadius={borderRadius.lg} />
      {/* Query form */}
      <SkeletonBlock height={180} borderRadius={borderRadius.lg} />
    </View>
  )
}

/** Profile screen skeleton. */
export function ProfileSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {/* Avatar card */}
      <View style={[skeletonStyles.centered, { paddingVertical: spacing.xl }]}>
        <SkeletonCircle size={64} />
        <SkeletonBlock width={120} height={18} style={{ marginTop: 12 }} />
        <SkeletonBlock width={80} height={12} style={{ marginTop: 6 }} />
      </View>
      {/* Account details */}
      <SkeletonBlock height={130} borderRadius={borderRadius.lg} />
      {/* Edit form */}
      <SkeletonBlock height={200} borderRadius={borderRadius.lg} />
      {/* Logout button */}
      <SkeletonBlock height={48} borderRadius={borderRadius.lg} />
    </View>
  )
}

/** Day detail screen skeleton. */
export function DayDetailSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {/* Day header */}
      <SkeletonBlock width={200} height={24} />
      {/* Notes card */}
      <SkeletonBlock height={60} borderRadius={borderRadius.lg} />
      {/* Video card */}
      <SkeletonBlock height={220} borderRadius={borderRadius.lg} />
      {/* Review form */}
      <SkeletonBlock height={160} borderRadius={borderRadius.lg} />
      {/* Reviews */}
      {Array.from({ length: 2 }, (_, i) => (
        <SkeletonBlock key={i} height={80} borderRadius={borderRadius.md} />
      ))}
    </View>
  )
}

const skeletonStyles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayInfo: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
})
