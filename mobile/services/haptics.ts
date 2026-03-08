import * as Haptics from 'expo-haptics'

/** Light haptic for selections (mood, energy, diet, toggles). */
export function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
}

/** Medium haptic for button presses (save, submit, login). */
export function hapticMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
}

/** Success notification haptic. */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
}

/** Selection changed haptic (tab switches, picker changes). */
export function hapticSelection() {
  Haptics.selectionAsync()
}
