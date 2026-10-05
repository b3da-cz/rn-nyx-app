import React from 'react'
import { TextInput } from 'react-native'
import { t, useTheme } from '../../lib'
import { FormRowSelectComponent } from '../FormRowSelectComponent'
import { LlmFormRow } from './LlmFormRow'

type Props = {
  prompt: string
  onChangePrompt: (val: string) => void
  onFocus?: () => void
  disabled?: boolean
}

export const LlmPromptInput: React.FC<Props> = ({ prompt, onChangePrompt, onFocus, disabled }) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()

  const templates = [
    {
      value: 'summary',
      label: t('llm.presetSummary'),
      text: t('llm.presetSummaryText') || 'Udělej mi stručné shrnutí této diskuze a vypiš hlavní body.',
    },
    {
      value: 'topics',
      label: t('llm.presetTopics'),
      text: t('llm.presetTopicsText') || 'Jaká klíčová témata a závěry se v této diskuzi objevily?',
    },
    {
      value: 'debate',
      label: t('llm.presetDebate'),
      text: t('llm.presetDebateText') || 'Jaké různé názory a argumenty zde diskutující zastávají?',
    },
  ]

  return (
    <>
      <LlmFormRow label={t('llm.template')}>
        <FormRowSelectComponent
          value={t('llm.templatePick')}
          selectionColor={colors.faded}
          options={templates.map(({ value, label }) => ({ value, label }))}
          onSelect={(value: string) => {
            const template = templates.find(item => item.value === value)
            if (template) {
              onChangePrompt(template.text)
            }
          }}
        />
      </LlmFormRow>
      <TextInput
        value={prompt}
        onChangeText={onChangePrompt}
        onFocus={onFocus}
        placeholder={t('llm.promptPlaceholder')}
        placeholderTextColor={colors.faded}
        selectionColor={colors.primary}
        multiline
        editable={!disabled}
        style={{
          marginHorizontal: blocks.medium,
          minHeight: 80,
          maxHeight: 200,
          fontSize: fontSizes.p,
          color: colors.text,
          textAlignVertical: 'top',
        }}
      />
    </>
  )
}
