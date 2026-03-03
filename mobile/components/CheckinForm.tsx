import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { apiFetch } from '../services/api'
import { MOOD_EMOJIS, MOOD_LABELS, ENERGY_LABELS, DIET_OPTIONS } from '../shared'
import type { DailyCheckin } from '../shared'
import { colors, spacing, fontSize, borderRadius, elementSize } from '../constants/theme'
import { ms } from '../constants/responsive'

interface Props {
  currentDay: number
  existing: DailyCheckin | null
  onSaved: (checkin: DailyCheckin) => void
}

export default function CheckinForm({ currentDay, existing, onSaved }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>(existing ? 'view' : 'edit')
  const [mood, setMood] = useState(existing?.mood || 0)
  const [energy, setEnergy] = useState(existing?.energy || 0)
  const [diet, setDiet] = useState(existing?.diet_compliance || '')
  const [notes, setNotes] = useState(existing?.notes || '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!mood || !energy || !diet) {
      Alert.alert('Incomplete', 'Please fill in mood, energy, and diet compliance.')
      return
    }
    setSaving(true)
    try {
      const data = await apiFetch<{ checkin: DailyCheckin }>('/api/checkins', {
        method: 'POST',
        body: JSON.stringify({
          day_number: currentDay,
          mood,
          energy,
          diet_compliance: diet,
          notes: notes || null,
        }),
      })
      onSaved(data.checkin)
      setMode('view')
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save check-in')
    } finally {
      setSaving(false)
    }
  }

  if (mode === 'view' && existing) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Daily Check-in</Text>
          <TouchableOpacity onPress={() => setMode('edit')}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.viewRow}>
          <Text style={styles.viewEmoji}>{MOOD_EMOJIS[existing.mood - 1]}</Text>
          <View style={styles.viewInfo}>
            <Text style={styles.viewDone}>Checked in for Day {currentDay}!</Text>
            <Text style={styles.viewDetails}>
              Mood: {MOOD_LABELS[existing.mood - 1]} · Energy: {existing.energy}/5 · Diet: {existing.diet_compliance === 'yes' ? 'Yes' : existing.diet_compliance === 'partially' ? 'Partial' : 'No'}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Daily Check-in</Text>

      {/* Mood */}
      <Text style={styles.label}>How are you feeling?</Text>
      <View style={styles.optionRow}>
        {MOOD_EMOJIS.map((emoji, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.emojiBtn, mood === i + 1 && styles.emojiBtnActive]}
            onPress={() => setMood(i + 1)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={styles.emojiLabel}>{MOOD_LABELS[i]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Energy */}
      <Text style={styles.label}>Energy Level</Text>
      <View style={styles.optionRow}>
        {ENERGY_LABELS.map((label, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.energyBtn, energy === i + 1 && styles.energyBtnActive]}
            onPress={() => setEnergy(i + 1)}
          >
            <Text style={styles.energyNum}>{i + 1}</Text>
            <Text style={styles.energyLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Diet */}
      <Text style={styles.label}>Followed the diet plan?</Text>
      <View style={styles.dietRow}>
        {DIET_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.dietBtn, diet === opt.value && styles.dietBtnActive]}
            onPress={() => setDiet(opt.value)}
          >
            <Text>{opt.emoji}</Text>
            <Text style={styles.dietLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes */}
      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="How was your day?"
        placeholderTextColor={colors.textMuted}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={2}
      />

      <TouchableOpacity
        style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={saving || !mood || !energy || !diet}
      >
        <Text style={styles.submitText}>{saving ? 'Saving...' : existing ? 'Update Check-in' : 'Save Check-in'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  editLink: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  viewEmoji: {
    fontSize: ms(28),
    marginRight: spacing.md,
  },
  viewInfo: {
    flex: 1,
  },
  viewDone: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.primaryDark,
  },
  viewDetails: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  emojiBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  emojiBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.successLight,
  },
  emoji: {
    fontSize: ms(20),
  },
  emojiLabel: {
    fontSize: ms(8),
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  energyBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  energyBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.successLight,
  },
  energyNum: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.text,
  },
  energyLabel: {
    fontSize: ms(7),
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  dietRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dietBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dietBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.successLight,
  },
  dietLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: elementSize.inputHeight * 1.4,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '600',
  },
})
