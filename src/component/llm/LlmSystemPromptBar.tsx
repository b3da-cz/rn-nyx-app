import React, { useState } from 'react'
import { DEFAULT_LLM_SYSTEM_PROMPT, Storage, t, useTheme } from '../../lib'
import { LlmSystemPromptDialog } from '../LlmSystemPromptDialog'
import { LlmFormRow } from './LlmFormRow'

type Props = {
  systemPrompt?: string
  isGlobalSystemPrompt: boolean
  onToggleGlobal: (val: boolean) => void
  onSystemPromptChange: (val: string) => void
}

export const LlmSystemPromptBar: React.FC<Props> = ({
  systemPrompt,
  isGlobalSystemPrompt,
  onToggleGlobal,
  onSystemPromptChange,
}) => {
  const { colors } = useTheme()
  const [isDialogVisible, setIsDialogVisible] = useState(false)

  const isCustomized = !!systemPrompt?.trim() && systemPrompt.trim() !== DEFAULT_LLM_SYSTEM_PROMPT.trim()

  const handleSave = async (newPrompt: string) => {
    setIsDialogVisible(false)
    onSystemPromptChange(newPrompt)
    if (isGlobalSystemPrompt) {
      try {
        const conf = (await Storage.getConfig()) || {}
        conf.llmSystemPrompt = newPrompt
        await Storage.setConfig(conf)
      } catch (e) {
        console.warn('Failed to save global system prompt', e)
      }
    }
  }

  const handleToggleGlobal = async (nextVal: boolean) => {
    onToggleGlobal(nextVal)
    if (nextVal && systemPrompt) {
      try {
        const conf = (await Storage.getConfig()) || {}
        conf.llmSystemPrompt = systemPrompt
        await Storage.setConfig(conf)
      } catch (e) {
        console.warn('Failed to persist global system prompt toggle', e)
      }
    }
  }

  return (
    <>
      <LlmFormRow
        label={t('llm.systemPrompt')}
        value={isCustomized ? t('llm.systemPromptCustom') : t('llm.systemPromptDefault')}
        valueColor={isCustomized ? colors.accent : colors.text}
        onPress={() => setIsDialogVisible(true)}
      />
      <LlmSystemPromptDialog
        isVisible={isDialogVisible}
        initialPrompt={systemPrompt}
        isGlobal={isGlobalSystemPrompt}
        onToggleGlobal={handleToggleGlobal}
        onSave={handleSave}
        onCancel={() => setIsDialogVisible(false)}
      />
    </>
  )
}
