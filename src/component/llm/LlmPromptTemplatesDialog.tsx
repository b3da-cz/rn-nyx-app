import React, { useEffect, useState } from 'react'
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native'
import { Dialog, Portal, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { LlmPromptTemplate, Styling, t, useTheme } from '../../lib'
import { confirm } from '../ConfirmationDialog'
import { DoubleTapDeleteButton } from '../DoubleTapDeleteButton'

type Mode = 'save' | 'pick'

type Props = {
  visible: boolean
  mode: Mode
  prompt: string
  templates: LlmPromptTemplate[]
  onDismiss: () => void
  onCreate: (name: string) => void
  onOverwrite: (template: LlmPromptTemplate) => void
  onPick: (template: LlmPromptTemplate) => void
  onDelete: (template: LlmPromptTemplate) => void
}

const SQUARE = 36

export const LlmPromptTemplatesDialog: React.FC<Props> = ({
  visible,
  mode,
  prompt,
  templates,
  onDismiss,
  onCreate,
  onOverwrite,
  onPick,
  onDelete,
}) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const [name, setName] = useState('')

  useEffect(() => {
    if (visible) {
      setName('')
    }
  }, [visible])

  const square = {
    width: SQUARE,
    height: SQUARE,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    borderWidth: 0,
  }
  const buttonFill = colors.row || colors.surface

  const overwrite = async (template: LlmPromptTemplate) => {
    const ok = await confirm(
      t('llm.templateOverwrite'),
      `${t('llm.templateOverwriteBody')}`.replace('%s', template.name),
    )
    if (ok) {
      onOverwrite(template)
    }
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.ScrollArea style={{ paddingLeft: 5, paddingRight: 5 }}>
          <ScrollView style={{ marginVertical: 5 }} keyboardShouldPersistTaps="handled">
            <View
              style={[
                Styling.groups.flexRowSpbCentered,
                { paddingHorizontal: blocks.small, minHeight: fontSizes.h1 },
              ]}>
              <Text style={{ fontSize: fontSizes.p }}>
                {mode === 'save' ? t('llm.templateSave') : t('llm.template')}
              </Text>
              <Text style={{ fontSize: fontSizes.p }}>{templates.length}</Text>
            </View>
            {mode === 'save' && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: blocks.small,
                  paddingLeft: blocks.small,
                }}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('llm.templateName')}
                  placeholderTextColor={colors.faded}
                  selectionColor={colors.primary}
                  style={{
                    flex: 1,
                    height: SQUARE,
                    marginRight: blocks.small,
                    paddingHorizontal: blocks.medium,
                    fontSize: fontSizes.p,
                    color: colors.text,
                    backgroundColor: buttonFill,
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    const trimmed = name.trim()
                    if (!trimmed || !prompt.trim()) {
                      return
                    }
                    onCreate(trimmed)
                    setName('')
                  }}
                  style={{
                    ...square,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: buttonFill,
                  }}>
                  <Icon name="plus" size={fontSizes.p} color={colors.text} />
                </TouchableOpacity>
              </View>
            )}
            {templates.length === 0 && (
              <Text
                style={{
                  color: colors.faded,
                  fontSize: fontSizes.p,
                  marginTop: blocks.small,
                  paddingHorizontal: blocks.small,
                }}>
                {t('llm.templateEmpty')}
              </Text>
            )}
            {templates.map(template => (
              <View
                key={template.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: SQUARE,
                  backgroundColor: buttonFill,
                  borderLeftWidth: 3,
                  borderColor: colors.transparent,
                  marginTop: blocks.small,
                }}>
                <TouchableRipple
                  style={{ flex: 1, paddingVertical: blocks.medium, paddingHorizontal: blocks.medium }}
                  rippleColor={colors.ripple}
                  onPress={() => (mode === 'save' ? overwrite(template) : onPick(template))}>
                  <Text numberOfLines={1} style={{ fontSize: fontSizes.p, color: colors.text }}>
                    {template.name}
                  </Text>
                </TouchableRipple>
                <DoubleTapDeleteButton
                  onDelete={() => onDelete(template)}
                  iconSize={fontSizes.p}
                  idleBackgroundColor={buttonFill}
                  iconColor={colors.text}
                  style={square}
                />
              </View>
            ))}
          </ScrollView>
        </Dialog.ScrollArea>
      </Dialog>
    </Portal>
  )
}
