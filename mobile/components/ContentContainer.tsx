import { View, StyleSheet, type ViewStyle } from 'react-native'
import { MAX_CONTENT_WIDTH } from '../constants/responsive'

interface Props {
  children: React.ReactNode
  style?: ViewStyle
}

/** Constrains content to MAX_CONTENT_WIDTH and centers it on tablets. */
export default function ContentContainer({ children, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
})
