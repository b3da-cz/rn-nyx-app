import React, { useEffect, useState } from 'react'
import { TextInput, TouchableOpacity, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import {
  createLlmPromptTemplate,
  deleteLlmPromptTemplate,
  LlmPromptTemplate,
  LlmPromptTemplateStore,
  normalizeLlmPromptTemplateStore,
  overwriteLlmPromptTemplate,
  resolveLlmPromptTemplates,
  Storage,
  t,
  useTheme,
} from '../../lib'
import { LlmFormRow } from './LlmFormRow'
import { LlmPromptTemplatesDialog } from './LlmPromptTemplatesDialog'

const builtinTemplates = (): LlmPromptTemplate[] => [
  {
    id: 'builtin-summary',
    name: t('llm.presetSummary'),
    text: t('llm.presetSummaryText') || 'Udělej mi stručné shrnutí této diskuze a vypiš hlavní body.',
    builtin: true,
  },
  {
    id: 'builtin-topics',
    name: t('llm.presetTopics'),
    text: t('llm.presetTopicsText') || 'Jaká klíčová témata a závěry se v této diskuzi objevily?',
    builtin: true,
  },
  {
    id: 'builtin-debate',
    name: t('llm.presetDebate'),
    text: t('llm.presetDebateText') || 'Jaké různé názory a argumenty zde diskutující zastávají?',
    builtin: true,
  },
]

const emptyStore = (): LlmPromptTemplateStore => ({ templates: [], hiddenIds: [] })

type Props = {
  prompt: string
  onChangePrompt: (val: string) => void
  onFocus?: () => void
  disabled?: boolean
}

type Mode = 'save' | 'pick'

const SAVE_SIZE = 28

export const LlmPromptInput: React.FC<Props> = ({ prompt, onChangePrompt, onFocus, disabled }) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const [store, setStore] = useState<LlmPromptTemplateStore>(emptyStore)
  const [mode, setMode] = useState<Mode | null>(null)

  useEffect(() => {
    Storage.getLlmPromptTemplates().then(raw => {
      setStore(normalizeLlmPromptTemplateStore(raw))
    })
  }, [])

  const persist = async (next: LlmPromptTemplateStore | null) => {
    if (!next) {
      return
    }
    setStore(next)
    await Storage.setLlmPromptTemplates(next)
  }

  const shown = resolveLlmPromptTemplates(store, builtinTemplates())
  const canSave = !disabled && prompt.trim().length > 0

  return (
    <>
      <LlmFormRow label={t('llm.template')} value={t('llm.templatePick')} onPress={() => setMode('pick')} />
      <View style={{ marginHorizontal: blocks.medium }}>
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
            minHeight: 80,
            maxHeight: 200,
            paddingRight: canSave ? SAVE_SIZE + blocks.small : 0,
            fontSize: fontSizes.p,
            color: colors.text,
            textAlignVertical: 'top',
          }}
        />
        {canSave && (
          <TouchableOpacity
            onPress={() => setMode('save')}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: SAVE_SIZE,
              height: SAVE_SIZE,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <Icon name="save" size={14} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
      <LlmPromptTemplatesDialog
        visible={mode !== null}
        mode={mode || 'pick'}
        prompt={prompt}
        templates={shown}
        onDismiss={() => setMode(null)}
        onCreate={name => persist(createLlmPromptTemplate(store, name, prompt))}
        onOverwrite={template => {
          persist(overwriteLlmPromptTemplate(store, template, prompt))
          setMode(null)
        }}
        onPick={template => {
          onChangePrompt(template.text)
          setMode(null)
        }}
        onDelete={template => persist(deleteLlmPromptTemplate(store, template))}
      />
    </>
  )
}
