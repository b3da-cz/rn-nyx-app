import React from 'react'
import { View } from 'react-native'
import { Text } from 'react-native-paper'
import { useTheme } from '../../lib'
import { MarkdownViewComponent } from '../MarkdownViewComponent'

type Props = {
  content: string
  isRaw?: boolean
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
}

// Answer text laid out like post content (plain background, side padding).
export const LlmAnswerBody = ({ content, isRaw, onNavigateToPost }: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <View style={{ paddingHorizontal: blocks.medium, paddingTop: blocks.small }}>
      {isRaw ? (
        <Text selectable style={{ color: colors.text, fontSize: fontSizes.p }}>
          {content}
        </Text>
      ) : (
        <MarkdownViewComponent content={content} selectable={true} onNavigateToPost={onNavigateToPost} />
      )}
    </View>
  )
}
