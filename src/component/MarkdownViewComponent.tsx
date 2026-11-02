import React, { useContext, useMemo, useRef } from 'react'
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import { searchMatchRanges } from '../lib/discussionRights'
import { isTextSelectionEnabled, MainContext } from '../lib/MainContext'
import { promptTextFile } from '../lib/textFilePrompt'
import { useTheme } from '../lib/Theme'
import { SearchHighlight } from './SearchHighlight'

type Props = {
  content: string
  selectable?: boolean
  alwaysSelectable?: boolean
  style?: StyleProp<ViewStyle>
  showUserAvatars?: boolean
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
  onLinkPress?: (url: string) => void
  onPlainPress?: () => void
  query?: string
  activeIndex?: number | null
  onMatchLayout?: (y: number) => void
}

import {
  InlineToken,
  MarkdownBlock,
  parseMarkdownBlocks,
  tokenizeInlineMarkdown,
} from '../lib/MarkdownParser'

export type { InlineToken, MarkdownBlock }
export { parseMarkdownBlocks, tokenizeInlineMarkdown }

// Same strings, in the same order, as the rendered search highlights.
export function countMarkdownSearchHits(markdown: string, query: string, avatars: boolean): number {
  if (!query.trim()) {
    return 0
  }
  let count = 0
  const add = (value: string) => {
    count += searchMatchRanges(value, query).length
  }
  const addInlines = (raw: string) => {
    tokenizeInlineMarkdown(raw).forEach(token => {
      if (token.type === 'link') {
        const uname = token.username || (token.text.startsWith('@') ? token.text.substring(1) : undefined)
        const cleanUname = uname ? uname.replace(/[.,;:!?]+$/, '').trim().toUpperCase() : ''
        const avatar = avatars && cleanUname.length > 0 && /^[A-Z0-9_.-]+$/.test(cleanUname)
        add(avatar && uname ? ` ${uname}` : token.text)
        return
      }
      if (token.type === 'code') {
        add(` ${token.text} `)
        return
      }
      if (token.type === 'text') {
        add(token.content)
        return
      }
      add(token.text)
    })
  }
  parseMarkdownBlocks(markdown).forEach(block => {
    if (block.type === 'hr') {
      return
    }
    if (block.type === 'table') {
      block.header.forEach(addInlines)
      block.rows.forEach(row => row.forEach(addInlines))
      return
    }
    if (block.type === 'code_block') {
      add(block.content)
      return
    }
    addInlines(block.content)
  })
  return count
}


export const MarkdownViewComponent: React.FC<Props> = ({
  content,
  selectable = true,
  alwaysSelectable = false,
  style,
  showUserAvatars,
  onNavigateToPost,
  onLinkPress,
  onPlainPress,
  query = '',
  activeIndex = null,
  onMatchLayout,
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
    const api = mainContext?.nyx?.api
    if (api && promptTextFile(cleanUrl, cleanUrl, api)) {
      return
    }
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

  const isSelectable = alwaysSelectable
    ? true
    : Platform.OS === 'ios'
      ? selectable && isTextSelectionEnabled(mainContext?.config)
      : !isAvatarsEnabled && selectable && isTextSelectionEnabled(mainContext?.config)

  const avatarHeight = Math.min(18, Math.max(14, Math.round(metrics.fontSizes.p * 1.15)))
  const avatarWidth = Math.round(avatarHeight * 0.8)

  const hosts = useRef<Record<string, View | null>>({})
  const wideRefs = useRef<Record<string, ScrollView | null>>({})
  const onMatchLayoutRef = useRef(onMatchLayout)
  const revealGeneration = useRef(0)
  onMatchLayoutRef.current = onMatchLayout
  const revealHostLine = (hostId: string, line: number, lineHeight: number) => {
    const generation = ++revealGeneration.current
    const measure = () => {
      if (generation !== revealGeneration.current) {
        return
      }
      const node = hosts.current[hostId]
      if (!node || typeof node.measureInWindow !== 'function') {
        return
      }
      node.measureInWindow((_x, y, _w, h) => {
        if (generation !== revealGeneration.current || h <= 0) {
          return
        }
        onMatchLayoutRef.current?.(y + line * lineHeight)
      })
    }
    measure()
    requestAnimationFrame(measure)
  }
  let seenMatches = 0
  const showText = (
    value: string,
    extraStyle?: any,
    key?: React.Key,
    hostId?: string,
    onLine?: (line: number) => void,
  ) => {
    const offset = seenMatches
    seenMatches += searchMatchRanges(value, query).length
    const lineHeight = styleLineHeight(extraStyle)
    return (
      <SearchHighlight
        key={key}
        text={value}
        query={query}
        matchOffset={offset}
        activeIndex={activeIndex}
        style={extraStyle}
        onActiveLine={
          onLine || (hostId ? line => revealHostLine(hostId, line, lineHeight) : undefined)
        }
      />
    )
  }
  const renderInlines = (
    rawText: string,
    extraStyle?: any,
    hostId?: string,
    onLine?: (line: number) => void,
  ) => {
    const tokens = tokenizeInlineMarkdown(rawText)
    return tokens.map((token, idx) => {
      switch (token.type) {
        case 'link': {
          const uname = token.username || (token.text.startsWith('@') ? token.text.substring(1) : undefined)
          const cleanUname = uname ? uname.replace(/[.,;:!?]+$/, '').trim().toUpperCase() : ''
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
                {showText(
                  ` ${uname}`,
                  [
                    styles.link,
                    { color: colors.link || colors.secondary },
                    token.bold && styles.bold,
                    token.italic && styles.italic,
                    extraStyle,
                  ],
                  undefined,
                  hostId,
                  onLine,
                )}
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
              {showText(token.text, undefined, undefined, hostId, onLine)}
            </Text>
          )
        }
        case 'bold':
          return showText(token.text, [styles.bold, extraStyle], idx, hostId, onLine)
        case 'italic':
          return showText(token.text, [styles.italic, extraStyle], idx, hostId, onLine)
        case 'code':
          return showText(` ${token.text} `, [
            styles.inlineCode,
            {
              backgroundColor: colors.background,
              color: colors.primary,
              borderColor: colors.disabled,
            },
            extraStyle,
          ], idx, hostId, onLine)
        case 'text':
        default:
          return showText(token.content, [token.bold && styles.bold, token.italic && styles.italic, extraStyle], idx, hostId, onLine)
      }
    })
  }

  return (
    <View style={[styles.container, style]}>
      {blocks.map((block, idx) => {
        const inner = (() => {
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
                onPress={onPlainPress}
                style={[
                  styles.header,
                  { color: colors.text, fontSize, marginTop: idx === 0 ? 0 : 10 },
                ]}>
                {renderInlines(block.content, { fontWeight: 'bold' }, `b${idx}`)}
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
                  onPress={onPlainPress}
                  style={[
                    styles.listItemText,
                    { color: colors.text, fontSize: metrics.fontSizes.p },
                  ]}>
                  {renderInlines(block.content, undefined, `b${idx}`)}
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
                  onPress={onPlainPress}
                  style={[
                    styles.blockquoteText,
                    { color: colors.text, fontSize: metrics.fontSizes.p },
                  ]}>
                  {renderInlines(block.content, { fontStyle: 'italic' }, `b${idx}`)}
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
                <View
                  ref={node => {
                    hosts.current[`code-${idx}`] = node
                  }}
                  collapsable={false}>
                  {showText(block.content, [styles.codeBlockText, { color: colors.text }], undefined, `code-${idx}`)}
                </View>
              </View>
            )
          }

          case 'table': {
            const cols = Math.max(block.header.length, ...block.rows.map(row => row.length), 1)
            const width = Math.max(96, Math.floor((metrics.screen.width - 24) / Math.min(cols, 3)))
            const renderRow = (cells: string[], headerRow: boolean, rowKey: string) => (
              <View style={{ flexDirection: 'row' }}>
                {Array.from({ length: cols }, (_, col) => {
                  const hostId = `cell-${idx}-${rowKey}-${col}`
                  const cellStyle = {
                    color: colors.text,
                    fontSize: metrics.fontSizes.p,
                    fontWeight: headerRow ? ('bold' as const) : ('normal' as const),
                  }
                  return (
                    <View
                      key={col}
                      ref={node => {
                        hosts.current[hostId] = node
                      }}
                      collapsable={false}
                      style={{
                        width,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: colors.border,
                        borderRadius: 0,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        backgroundColor: headerRow ? colors.row : 'transparent',
                      }}>
                      <Text selectable={isSelectable} onPress={onPlainPress} style={cellStyle}>
                        {renderInlines(cells[col] || '', undefined, hostId, line => {
                          wideRefs.current[String(idx)]?.scrollTo({
                            x: Math.max(0, col * width - 8),
                            animated: true,
                          })
                          revealHostLine(hostId, line, styleLineHeight(cellStyle))
                        })}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )
            const tableKey = `md_table_${idx}`
            return (
              <ScrollView
                horizontal
                nestedScrollEnabled={true}
                onTouchStart={() => mainContext?.refs?.setNavSwipeEnabled?.(false, tableKey)}
                onTouchEnd={() => mainContext?.refs?.setNavSwipeEnabled?.(true, tableKey)}
                onTouchCancel={() => mainContext?.refs?.setNavSwipeEnabled?.(true, tableKey)}
                onScrollBeginDrag={() => mainContext?.refs?.setNavSwipeEnabled?.(false, tableKey)}
                onScrollEndDrag={() => mainContext?.refs?.setNavSwipeEnabled?.(true, tableKey)}
                onMomentumScrollEnd={() => mainContext?.refs?.setNavSwipeEnabled?.(true, tableKey)}
                ref={node => {
                  wideRefs.current[String(idx)] = node
                }}
                style={{ marginBottom: 8 }}
                contentContainerStyle={{ flexGrow: 1 }}>
                <View style={{ borderLeftWidth: 3, borderLeftColor: colors.primary, borderRadius: 0 }}>
                  {renderRow(block.header, true, 'h')}
                  {block.rows.map((row, rowIndex) => (
                    <View key={rowIndex}>{renderRow(row, false, String(rowIndex))}</View>
                  ))}
                </View>
              </ScrollView>
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
                onPress={onPlainPress}
                style={[
                  styles.paragraph,
                  { color: colors.text, fontSize: metrics.fontSizes.p },
                ]}>
                {renderInlines(block.content, undefined, `b${idx}`)}
              </Text>
            )
          }
        }
        })()
        return (
          <View
            key={idx}
            ref={node => {
              hosts.current[`b${idx}`] = node
            }}
            collapsable={false}>
            {inner}
          </View>
        )
      })}
    </View>
  )
}

function styleLineHeight(style: any): number {
  const flat = StyleSheet.flatten(style) || {}
  if (typeof flat.lineHeight === 'number') {
    return flat.lineHeight
  }
  if (typeof flat.fontSize === 'number') {
    return Math.round(flat.fontSize * 1.45)
  }
  return 22
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
