import React, { useState } from 'react'
import { LayoutAnimation, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Clipboard from '@react-native-clipboard/clipboard'
import Icon from 'react-native-vector-icons/Feather'
import { formatDuration, isSummaryCopyLocked, LayoutAnimConf, LlmHistoryItem, Styling, t, useTheme } from '../../lib'
import { ButtonComponent } from '../ButtonComponent'
import { DoubleTapDeleteButton } from '../DoubleTapDeleteButton'
import { SearchHighlight } from '../SearchHighlight'
import { LlmAnswerBody } from './LlmAnswerBody'
import { LlmReasoningSheet } from './LlmReasoningSheet'
import { LlmTtlBadge } from './LlmTtlBadge'
import { formatLlmDate, formatLlmDateRange, formatPostCount, joinMeta } from './llmFormat'
import { useHoldScreenSecure } from './useHoldScreenSecure'

type Props = {
  item: LlmHistoryItem
  onDelete: (id: string) => void
  onUsePrompt: (prompt: string) => void
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
  query?: string
  clubTtlMs?: number
  activeDiscussionId?: number | string
}

export const LlmLibraryItemCard: React.FC<Props> = ({
  item,
  onDelete,
  onUsePrompt,
  onNavigateToPost,
  query,
  clubTtlMs,
  activeDiscussionId,
}) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRaw, setIsRaw] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reasoningOpen, setReasoningOpen] = useState(false)
  const copyLocked = isSummaryCopyLocked({
    clubTtlMs,
    sameClub: activeDiscussionId != null && `${item.discussionId}` === `${activeDiscussionId}`,
    expiresAt: item.expiresAt,
  })
  const secure = useHoldScreenSecure(copyLocked && isExpanded)

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    setIsExpanded(!isExpanded)
  }
  const handleCopy = () => {
    if (copyLocked) {
      return
    }
    Clipboard.setString(item.response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const metaExecution = joinMeta([
    formatLlmDate(item.createdAt),
    item.modelName || item.modelId,
    formatDuration(item.durationMs),
    item.usage?.total_tokens ? `${item.usage.total_tokens} ${t('llm.tokens') || 'tokenů'}` : null,
  ])

  const metaContext = joinMeta([
    formatLlmDateRange(item.dateFrom, item.dateTo) || (item.postCount != null ? t('llm.entirePeriod') || 'celé období' : null),
    formatPostCount(item.postCount),
  ])

  return (
    <View style={{ marginBottom: blocks.small }}>
      <TouchableRipple
        rippleColor={colors.ripple}
        onPress={toggle}
        style={{
          backgroundColor: colors.row,
          borderLeftWidth: 3,
          borderColor: isExpanded ? colors.primary : colors.row || colors.transparent,
          paddingHorizontal: blocks.medium,
          paddingVertical: blocks.medium,
        }}>
        <View>
          <View style={Styling.groups.flexRowSpbCentered}>
            <Text numberOfLines={1} style={{ flex: 1, fontSize: fontSizes.p - 1, color: colors.text }}>
              {item.discussionTitle || `#${item.discussionId}`}
            </Text>
            <LlmTtlBadge expiresAt={item.expiresAt} onExpired={() => onDelete(item.id)} />
            <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={fontSizes.p} color={colors.faded} />
          </View>
          <Text numberOfLines={1} style={{ color: colors.faded, fontSize: fontSizes.small, marginTop: 2 }}>
            {metaExecution}
          </Text>
          {metaContext ? (
            <Text numberOfLines={1} style={{ color: colors.faded, fontSize: fontSizes.small, marginTop: 2 }}>
              {metaContext}
            </Text>
          ) : null}
          <SearchHighlight
            numberOfLines={isExpanded ? undefined : 2}
            text={item.prompt}
            query={query}
            style={{ color: colors.text, fontSize: fontSizes.small, marginTop: blocks.small }}
          />
        </View>
      </TouchableRipple>
      {isExpanded && (
        <>
          <View ref={secure.ref} onLayout={secure.onLayout} collapsable={false}>
            <LlmAnswerBody
              content={item.response}
              isRaw={isRaw}
              query={query}
              copyLocked={copyLocked}
              onNavigateToPost={onNavigateToPost}
            />
          </View>
          {!!item.reasoning && (
            <ButtonComponent
              label={t('llm.reasoning')}
              color={colors.faded}
              fontSize={fontSizes.p}
              width={'100%'}
              onPress={() => setReasoningOpen(true)}
            />
          )}
          <LlmReasoningSheet
            visible={reasoningOpen && !!item.reasoning}
            text={item.reasoning || ''}
            copyLocked={copyLocked}
            onClose={() => setReasoningOpen(false)}
            onNavigateToPost={onNavigateToPost}
          />
          <View style={[Styling.groups.flexRowCentered, { paddingRight: blocks.medium }]}>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <ButtonComponent
                label={t('llm.usePrompt')}
                color={colors.accent}
                fontSize={fontSizes.p}
                width={'34%'}
                onPress={() => onUsePrompt(item.prompt)}
              />
              <ButtonComponent
                label={copied ? t('llm.copiedShort') : t('llm.copy')}
                color={copyLocked ? colors.disabled : copied ? colors.accent : colors.faded}
                fontSize={fontSizes.p}
                width={'33%'}
                isDisabled={copyLocked}
                onPress={handleCopy}
              />
              <ButtonComponent
                label={isRaw ? t('llm.viewFormatted') : t('llm.viewRaw')}
                color={colors.faded}
                fontSize={fontSizes.p}
                width={'33%'}
                onPress={() => setIsRaw(!isRaw)}
              />
            </View>
            <DoubleTapDeleteButton
              onDelete={() => onDelete(item.id)}
              iconSize={fontSizes.p}
              flat
                style={{ padding: blocks.medium }}
            />
          </View>
        </>
      )}
    </View>
  )
}
