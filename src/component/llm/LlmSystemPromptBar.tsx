import React, { useState } from 'react'
import { DEFAULT_LLM_SYSTEM_PROMPT, t, useTheme } from '../../lib'
import { LlmSystemPromptDialog } from '../LlmSystemPromptDialog'
import { LlmFormRow } from './LlmFormRow'

type Props = {
  systemPrompt?: string
  isGlobalSystemPrompt: boolean
  onSystemPromptSave: (prompt: string, saveAsDefault: boolean) => void
}

export const LlmSystemPromptBar: React.FC<Props> = ({
  systemPrompt,
  isGlobalSystemPrompt,
  onSystemPromptSave,
}) => {
  const { colors } = useTheme()
  const [isDialogVisible, setIsDialogVisible] = useState(false)

  const isCustomized = !!systemPrompt?.trim() && systemPrompt.trim() !== DEFAULT_LLM_SYSTEM_PROMPT.trim()

  const handleSave = (newPrompt: string, saveAsDefault?: boolean) => {
    setIsDialogVisible(false)
    onSystemPromptSave(newPrompt, !!saveAsDefault)
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
        showGlobalToggle
        onSave={handleSave}
        onCancel={() => setIsDialogVisible(false)}
      />
    </>
  )
}
