import React from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { Text } from 'react-native-paper'
import { splitStreamMarkdown, t, useTheme } from '../../lib'
import { LlmAnswerBody } from './LlmAnswerBody'

type Props = {
  visible: boolean
  text: string
  streaming?: boolean
  copyLocked?: boolean
  onClose: () => void
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
}

export const LlmReasoningSheet = ({
  visible,
  text,
  streaming,
  copyLocked,
  onClose,
  onNavigateToPost,
}: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const parts = streaming ? splitStreamMarkdown(text) : { stable: text, pending: '' }
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' }}>
        <Pressable
          onPress={() => {}}
          style={{
            maxHeight: '75%',
            backgroundColor: colors.background,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingBottom: blocks.large,
          }}>
          <View
            style={{
              alignItems: 'center',
              paddingTop: blocks.small,
              paddingBottom: blocks.small,
            }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.disabled }} />
          </View>
          <Text
            style={{
              color: colors.text,
              fontSize: fontSizes.h2,
              paddingHorizontal: blocks.medium,
              paddingBottom: blocks.small,
            }}>
            {t('llm.reasoning')}
          </Text>
          <ScrollView>
            <LlmAnswerBody
              content={parts.stable}
              pending={parts.pending}
              copyLocked={copyLocked}
              onNavigateToPost={onNavigateToPost}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
