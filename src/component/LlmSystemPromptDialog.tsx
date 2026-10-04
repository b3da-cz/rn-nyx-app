import React, { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { DEFAULT_LLM_SYSTEM_PROMPT, useTheme } from '../lib'

type Props = {
  isVisible: boolean
  initialPrompt?: string
  onSave: (prompt: string) => void
  onCancel: () => void
}

export const LlmSystemPromptDialog: React.FC<Props> = ({
  isVisible,
  initialPrompt,
  onSave,
  onCancel,
}) => {
  const theme = useTheme()
  const { colors, metrics } = theme

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.disabled }]}>
          <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
            <Icon name="x" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.text, fontSize: metrics.fontSizes.h2 }]}>
              Systémový prompt
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.faded, fontSize: metrics.fontSizes.small }]}>
              Instrukce pro chování modelu a formátování odkazů
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {/* Info notice */}
            <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
              <Icon name="info" size={18} color={colors.primary} style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: metrics.fontSizes.small, lineHeight: 18 }}>
                  Tento prompt určuje chování a styl odpovědí LLM modelu.
                </Text>
                <Text style={{ color: colors.faded, fontSize: metrics.fontSizes.small, lineHeight: 18, marginTop: 4 }}>
                  Pro správné proklikávání na příspěvky zachovej pravidlo s odkazem ve tvaru{' '}
                  <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                    [@autor](https://nyx.cz/discussion/{'{discussion_id}'}/id/{'{post_id}'})
                  </Text>
                  .
                </Text>
              </View>
            </View>

            {/* Prompt Textarea */}
            <Text style={[styles.label, { color: colors.text, fontSize: metrics.fontSizes.p }]}>
              Text systémového promptu:
            </Text>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={10}
              placeholder="Zadej systémový prompt..."
              placeholderTextColor={colors.faded}
              style={[
                styles.textarea,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.disabled,
                  fontSize: metrics.fontSizes.p,
                },
              ]}
            />

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={handleReset}
                style={[styles.resetBtn, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
                <Icon name="rotate-ccw" size={14} color={colors.faded} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.text, fontSize: metrics.fontSizes.small }}>
                  Obnovit výchozí
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={onCancel}
                  style={[styles.cancelBtn, { borderColor: colors.disabled }]}>
                  <Text style={{ color: colors.faded, fontSize: metrics.fontSizes.p }}>
                    Zrušit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                  <Icon name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>
                    Uložit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSubtitle: {
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 180,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
})
