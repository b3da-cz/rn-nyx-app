import React, { useContext } from 'react'
import { Text, View } from 'react-native'
import { isTextSelectionEnabled, MainContext, useTheme } from '../../lib'
import { MarkdownViewComponent } from '../MarkdownViewComponent'
import { SearchHighlight } from '../SearchHighlight'

type Props = {
  content: string
  pending?: string
  isRaw?: boolean
  query?: string
  copyLocked?: boolean
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
}

// Answer text laid out like post content (plain background, side padding).
export const LlmAnswerBody = ({ content, pending, isRaw, query, copyLocked, onNavigateToPost }: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const { config } = useContext(MainContext)
  const selectable = !copyLocked && isTextSelectionEnabled(config)
  const showUserAvatars = config?.isLlmUserAvatarsEnabled !== false
  return (
    <View style={{ paddingHorizontal: blocks.medium, paddingTop: blocks.small }}>
      {isRaw ? (
        <SearchHighlight
          selectable={selectable}
          text={`${content}${pending || ''}`}
          query={query}
          style={{ color: colors.text, fontSize: fontSizes.p }}
        />
      ) : (
        <>
          {!!content && (
            <MarkdownViewComponent
              content={content}
              query={query}
              selectable={selectable}
              showUserAvatars={showUserAvatars}
              onNavigateToPost={onNavigateToPost}
            />
          )}
          {!!pending && (
            <Text selectable={selectable} style={{ color: colors.text, fontSize: fontSizes.p }}>
              {pending}
            </Text>
          )}
        </>
      )}
    </View>
  )
}
