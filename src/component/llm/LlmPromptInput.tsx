import React from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { t, useTheme } from '../../lib'

type Props = {
  prompt: string
  onChangePrompt: (val: string) => void
  disabled?: boolean
}

export const LlmPromptInput: React.FC<Props> = ({ prompt, onChangePrompt, disabled }) => {
  const { colors, metrics } = useTheme()

  const quickPresets = [
    { label: t('llm.presetSummary') || 'Shrnutí diskuze', text: 'Udělej mi stručné shrnutí této diskuze a vypiš hlavní body.' },
    { label: t('llm.presetTopics') || 'Klíčová témata', text: 'Jaká klíčová témata a závěry se v této diskuzi objevily?' },
    { label: t('llm.presetDebate') || 'Názory a argumenty', text: 'Jaké různé názory a argumenty zde diskutující zastávají?' },
  ]

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
      <Text style={[styles.label, { color: colors.faded, fontSize: metrics.fontSizes.small }]}>
        {t('llm.promptLabel') || 'Co chceš s příspěvky udělat?'}
      </Text>

      <View style={styles.presetsRow}>
        {quickPresets.map((qp, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => onChangePrompt(qp.text)}
            style={[styles.presetChip, { backgroundColor: colors.background, borderColor: colors.disabled }]}>
            <Text style={{ color: colors.faded, fontSize: 11 }}>{qp.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        value={prompt}
        onChangeText={onChangePrompt}
        placeholder={t('llm.promptPlaceholder') || 'Zadej instrukci pro model...'}
        placeholderTextColor={colors.faded}
        multiline
        numberOfLines={3}
        editable={!disabled}
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            borderColor: colors.disabled,
            color: colors.text,
            fontSize: metrics.fontSizes.p,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    minHeight: 70,
    maxHeight: 140,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
})
