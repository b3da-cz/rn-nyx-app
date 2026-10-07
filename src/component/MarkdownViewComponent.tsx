import React, { useContext, useMemo } from 'react'
import {
  Image,
  Linking,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import { isTextSelectionEnabled, MainContext } from '../lib/MainContext'
import { useTheme } from '../lib/Theme'

type Props = {
  content: string
  selectable?: boolean
  style?: StyleProp<ViewStyle>
  showUserAvatars?: boolean
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
  onLinkPress?: (url: string) => void
}

import {
  InlineToken,
  MarkdownBlock,
  parseMarkdownBlocks,
  tokenizeInlineMarkdown,
} from '../lib/MarkdownParser'

export type { InlineToken, MarkdownBlock }
export { parseMarkdownBlocks, tokenizeInlineMarkdown }


export const MarkdownViewComponent: React.FC<Props> = ({
  content,
  selectable = true,
  style,
  showUserAvatars,
  onNavigateToPost,
  onLinkPress,
}) => {
  const theme = useTheme()
  const { colors, metrics } = theme
  const mainContext = useContext(MainContext)
  const isAvatarsEnabled = showUserAvatars ?? mainContext?.config?.isLlmUserAvatarsEnabled ?? true

  const blocks = useMemo(() => parseMarkdownBlocks(content), [content])

  const handleLink = (url: string) => {
    if (onLinkPress) {
      onLinkPress(url)
      return
    }
    const cleanUrl = url.trim().replace(/[.,;:!?]+$/, '')
    const match = cleanUrl.match(/(?:https?:\/\/nyx\.cz)?\/discussion\/(\d+)(?:\/id\/(\d+))?/)
    if (match && onNavigateToPost) {
      const discussionId = match[1]
      const postId = match[2]
      onNavigateToPost(discussionId, postId)
      return
    }
    Linking.openURL(cleanUrl).catch(e => {
      console.warn('Failed to open url:', cleanUrl, e)
    })
  }

  const isSelectable = selectable && isTextSelectionEnabled(mainContext?.config)

  const avatarHeight = Math.min(18, Math.max(14, Math.round(metrics.fontSizes.p * 1.15)))
  const avatarWidth = Math.round(avatarHeight * 0.8)

  const renderInlines = (rawText: string, extraStyle?: any) => {
    const tokens = tokenizeInlineMarkdown(rawText)
    return tokens.map((token, idx) => {
      switch (token.type) {
        case 'link': {
          const uname = token.username || (token.text.startsWith('@') ? token.text.substring(1) : undefined)
          const cleanUname = uname ? uname.trim().toUpperCase() : ''
          const isValidUsername = cleanUname.length > 0 && /^[A-Z0-9_.-]+$/.test(cleanUname)
          const shouldRenderAvatar = isAvatarsEnabled && isValidUsername
          const avatarUri = shouldRenderAvatar
            ? `https://nyx.cz/${encodeURIComponent(cleanUname[0])}/${encodeURIComponent(cleanUname)}.gif`
            : null

          if (shouldRenderAvatar && avatarUri) {
            return (
              <Text key={idx} onPress={() => handleLink(token.url)}>
                <Image
                  source={{ uri: avatarUri }}
                  style={{
                    width: avatarWidth,
                    height: avatarHeight,
                    backgroundColor: 'transparent',
                  }}
                  resizeMethod={'scale'}
                  resizeMode={'contain'}
                />
                <Text
                  style={[
                    styles.link,
                    { color: colors.link || colors.secondary },
                    token.bold && styles.bold,
                    token.italic && styles.italic,
                    extraStyle,
                  ]}>
                  {` ${uname}`}
                </Text>
              </Text>
            )
          }

          return (
            <Text
              key={idx}
              onPress={() => handleLink(token.url)}
              style={[
                styles.link,
                { color: colors.link || colors.secondary },
                token.bold && styles.bold,
                token.italic && styles.italic,
                extraStyle,
              ]}>
              {token.text}
            </Text>
          )
        }
        case 'bold':
          return (
            <Text key={idx} style={[styles.bold, extraStyle]}>
              {token.text}
            </Text>
          )
        case 'italic':
          return (
            <Text key={idx} style={[styles.italic, extraStyle]}>
              {token.text}
            </Text>
          )
        case 'code':
          return (
            <Text
              key={idx}
              style={[
                styles.inlineCode,
                {
                  backgroundColor: colors.background,
                  color: colors.primary,
                  borderColor: colors.disabled,
                },
                extraStyle,
              ]}>
              {` ${token.text} `}
            </Text>
          )
        case 'text':
        default:
          return (
            <Text
              key={idx}
              style={[
                token.bold && styles.bold,
                token.italic && styles.italic,
                extraStyle,
              ]}>
              {token.content}
            </Text>
          )
      }
    })
  }

  return (
    <View style={[styles.container, style]}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'header': {
            const fontSize =
              block.level === 1
                ? metrics.fontSizes.h1
                : block.level === 2
                ? metrics.fontSizes.h2
                : metrics.fontSizes.h3
            return (
              <Text
                key={idx}
                selectable={isSelectable}
                style={[
                  styles.header,
                  { color: colors.text, fontSize, marginTop: idx === 0 ? 0 : 10 },
                ]}>
                {renderInlines(block.content, { fontWeight: 'bold' })}
              </Text>
            )
          }

          case 'list_item': {
            const bullet = block.ordered ? `${block.number || '1'}. ` : '• '
            return (
              <View
                key={idx}
                style={[
                  styles.listItemRow,
                  { marginLeft: block.indent * 14 },
                ]}>
                <Text style={[styles.bullet, { color: colors.primary }]}>{bullet}</Text>
                <Text
                  selectable={isSelectable}
                  style={[
                    styles.listItemText,
                    { color: colors.text, fontSize: metrics.fontSizes.p },
                  ]}>
                  {renderInlines(block.content)}
                </Text>
              </View>
            )
          }

          case 'blockquote': {
            return (
              <View
                key={idx}
                style={[
                  styles.blockquote,
                  {
                    borderLeftColor: colors.primary,
                    backgroundColor: colors.background,
                  },
                ]}>
                <Text
                  selectable={isSelectable}
                  style={[
                    styles.blockquoteText,
                    { color: colors.text, fontSize: metrics.fontSizes.p },
                  ]}>
                  {renderInlines(block.content, { fontStyle: 'italic' })}
                </Text>
              </View>
            )
          }

          case 'code_block': {
            return (
              <View
                key={idx}
                style={[
                  styles.codeBlock,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.disabled,
                  },
                ]}>
                {block.lang ? (
                  <Text style={[styles.codeBlockLang, { color: colors.faded }]}>
                    {block.lang}
                  </Text>
                ) : null}
                <Text
                  selectable={isSelectable}
                  style={[styles.codeBlockText, { color: colors.text }]}>
                  {block.content}
                </Text>
              </View>
            )
          }

          case 'hr': {
            return (
              <View
                key={idx}
                style={[styles.hr, { borderBottomColor: colors.disabled }]}
              />
            )
          }

          case 'paragraph':
          default: {
            return (
              <Text
                key={idx}
                selectable={isSelectable}
                style={[
                  styles.paragraph,
                  { color: colors.text, fontSize: metrics.fontSizes.p },
                ]}>
                {renderInlines(block.content)}
              </Text>
            )
          }
        }
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  paragraph: {
    lineHeight: 22,
    marginBottom: 8,
  },
  header: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    fontWeight: 'bold',
    marginRight: 6,
    lineHeight: 22,
  },
  listItemText: {
    flex: 1,
    lineHeight: 22,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  blockquoteText: {
    lineHeight: 21,
  },
  codeBlock: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  codeBlockLang: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  codeBlockText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  hr: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 3,
  },
})
