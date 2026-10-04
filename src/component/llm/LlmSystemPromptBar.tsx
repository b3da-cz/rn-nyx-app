import React, { useState } from 'react'
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { DEFAULT_LLM_SYSTEM_PROMPT, Storage, useTheme } from '../../lib'
import { LlmSystemPromptDialog } from '../LlmSystemPromptDialog'

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
  const { colors, metrics } = useTheme()
  const [isDialogVisible, setIsDialogVisible] = useState(false)

  const isCustomized =
    systemPrompt?.trim() && systemPrompt.trim() !== DEFAULT_LLM_SYSTEM_PROMPT.trim()

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
    <View style={[styles.container, { borderBottomColor: colors.disabled }]}>
      <TouchableOpacity onPress={() => setIsDialogVisible(true)} style={styles.promptRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={styles.labelRow}>
            <Text style={{ color: colors.faded, fontSize: 11 }}>
              Systémový prompt
            </Text>
            <Text
              style={{
                color: isCustomized ? colors.primary : colors.faded,
                fontSize: 10,
                marginLeft: 6,
                fontWeight: isCustomized ? 'bold' : 'normal',
              }}>
              {isCustomized ? '(upravený)' : '(výchozí)'}
            </Text>
          </View>
          <Text numberOfLines={1} style={{ color: colors.text, fontSize: metrics.fontSizes.small, marginTop: 2 }}>
            {systemPrompt?.trim() || 'Výchozí instrukce pro model'}
          </Text>
        </View>
        <Icon name="sliders" size={16} color={isCustomized ? colors.primary : colors.faded} />
      </TouchableOpacity>

      <View style={styles.globalRow}>
        <Text style={{ color: colors.faded, fontSize: metrics.fontSizes.small, flex: 1 }}>
          {isGlobalSystemPrompt ? 'Ukládat globálně' : 'Pouze jednorázově pro tuto diskuzi'}
        </Text>
        <Switch
          value={isGlobalSystemPrompt}
          onValueChange={handleToggleGlobal}
          trackColor={{ false: colors.disabled, true: colors.primary }}
        />
      </View>

      <LlmSystemPromptDialog
        isVisible={isDialogVisible}
        initialPrompt={systemPrompt}
        onSave={handleSave}
        onCancel={() => setIsDialogVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  globalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
})
