import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, TextInput, View } from 'react-native'
import { IconButton, Text } from 'react-native-paper'
import { ButtonComponent } from './ButtonComponent'
import { FormRowToggleComponent } from './FormRowToggleComponent'
import { DEFAULT_LLM_SYSTEM_PROMPT, Styling, t, useTheme } from '../lib'

type Props = {
  isVisible: boolean
  initialPrompt?: string
  isGlobal?: boolean
  onToggleGlobal?: (val: boolean) => void
  onSave: (prompt: string) => void
  onCancel: () => void
}

export const LlmSystemPromptDialog: React.FC<Props> = ({
  isVisible,
  initialPrompt,
  isGlobal,
  onToggleGlobal,
  onSave,
  onCancel,
}) => {
  const theme = useTheme()
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = theme

  const [prompt, setPrompt] = useState(initialPrompt || DEFAULT_LLM_SYSTEM_PROMPT)

  useEffect(() => {
    if (isVisible) {
      setPrompt(initialPrompt?.trim() ? initialPrompt : DEFAULT_LLM_SYSTEM_PROMPT)
    }
  }, [isVisible, initialPrompt])

  if (!isVisible) {
    return null
  }

  const handleReset = () => {
    setPrompt(DEFAULT_LLM_SYSTEM_PROMPT)
  }

  const handleSave = () => {
    onSave(prompt.trim())
  }

  return (
    <Modal visible={isVisible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[Styling.groups.flexRowCentered, { height: 50 }]}>
          <IconButton
            icon={'arrow-left'}
            size={25}
            style={{ marginLeft: 10 }}
            color={colors.primary}
            rippleColor={colors.ripple}
            onPress={onCancel}
          />
          <Text numberOfLines={1} style={{ flex: 1, fontSize: fontSizes.p + 2, marginHorizontal: blocks.large }}>
            {t('llm.systemPrompt') || 'Systémový prompt'}
          </Text>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
            {onToggleGlobal !== undefined && (
              <FormRowToggleComponent
                label={t('llm.globalModelToggle') || 'Uložit jako výchozí'}
                value={!!isGlobal}
                onChange={onToggleGlobal}
              />
            )}

            <View style={{ paddingHorizontal: blocks.medium, paddingVertical: blocks.small }}>
              <Text style={{ color: colors.faded, fontSize: fontSizes.small, lineHeight: 18 }}>
                Určuje chování modelu. Pro funkční odkazy na příspěvky zachovej formát:
              </Text>
              <Text style={{ color: colors.primary, fontSize: fontSizes.small, marginTop: 2 }}>
                {'[@autor](https://nyx.cz/discussion/{discussion_id}/id/{post_id})'}
              </Text>
            </View>

            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={10}
              placeholder="Zadej systémový prompt..."
              placeholderTextColor={colors.faded}
              selectionColor={colors.primary}
              style={{
                marginHorizontal: blocks.medium,
                minHeight: 180,
                fontSize: fontSizes.p,
                color: colors.text,
                textAlignVertical: 'top',
              }}
            />

            <View style={{ flexDirection: 'row', marginTop: blocks.large }}>
              <ButtonComponent
                label={t('search.clear') || 'Výchozí'}
                color={colors.faded}
                fontSize={fontSizes.p}
                width={'33%'}
                onPress={handleReset}
              />
              <ButtonComponent
                label={t('cancel')}
                color={colors.faded}
                fontSize={fontSizes.p}
                width={'33%'}
                onPress={onCancel}
              />
              <ButtonComponent
                label={t('confirm')}
                color={colors.accent}
                fontSize={fontSizes.p}
                width={'34%'}
                onPress={handleSave}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}
