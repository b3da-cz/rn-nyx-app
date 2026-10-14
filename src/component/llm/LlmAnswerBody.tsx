import React, { useContext } from 'react'
import { View } from 'react-native'
import { isTextSelectionEnabled, MainContext, useTheme } from '../../lib'
import { MarkdownViewComponent } from '../MarkdownViewComponent'
import { SearchHighlight } from '../SearchHighlight'

type Props = {
  content: string
  isRaw?: boolean
  query?: string
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
}

// Answer text laid out like post content (plain background, side padding).
export const LlmAnswerBody = ({ content, isRaw, query, onNavigateToPost }: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const { config } = useContext(MainContext)
  const selectable = isTextSelectionEnabled(config)
  const showUserAvatars = config?.isLlmUserAvatarsEnabled !== false
  return (
    <View style={{ paddingHorizontal: blocks.medium, paddingTop: blocks.small }}>
      {isRaw ? (
        <SearchHighlight
          selectable={selectable}
          text={content}
          query={query}
          style={{ color: colors.text, fontSize: fontSizes.p }}
        />
      ) : (
        <MarkdownViewComponent
          content={content}
          query={query}
          selectable={selectable}
          showUserAvatars={showUserAvatars}
          onNavigateToPost={onNavigateToPost}
        />
      )}
    </View>
  )
}
