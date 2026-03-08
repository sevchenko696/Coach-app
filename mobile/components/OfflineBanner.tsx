import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, fontSize } from '../constants/theme'

/** Small banner shown when the device is offline. */
export default function OfflineBanner() {
  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={14} color="#fff" />
      <Text style={styles.text}>You're offline. Showing cached data.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#6b7280',
    paddingVertical: spacing.xs,
  },
  text: {
    fontSize: fontSize.xs,
    color: '#fff',
    fontWeight: '500',
  },
})
