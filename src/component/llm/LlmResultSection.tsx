import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { formatDuration, splitStreamMarkdown, t, useTheme } from '../../lib'
import { ButtonComponent } from '../ButtonComponent'
import { SectionHeaderComponent } from '../SectionHeaderComponent'
import { LlmAnswerBody } from './LlmAnswerBody'
import { LlmTtlBadge } from './LlmTtlBadge'
import { joinMeta } from './llmFormat'
import { LlmReasoningSheet } from './LlmReasoningSheet'
import { useHoldScreenSecure } from './useHoldScreenSecure'

const ACTION_ROW_HEIGHT = 50

export type LlmAnswerDock = {
  height: number
  node: React.ReactNode
}

type ActionBarProps = {
  hasReasoning: boolean
  isRaw: boolean
  copied: boolean
  copyLocked?: boolean
  onReasoning: () => void
  onToggleRaw: () => void
  onCopy: () => void
  onNewQuery: () => void
}

const LlmAnswerActionBar = ({
  hasReasoning,
  isRaw,
  copied,
  copyLocked,
  onReasoning,
  onToggleRaw,
  onCopy,
  onNewQuery,
}: ActionBarProps) => {
  const {
    colors,
    metrics: { fontSizes },
  } = useTheme()
  return (
    <View>
      {hasReasoning && (
        <ButtonComponent
          label={t('llm.reasoning')}
          color={colors.faded}
          fontSize={fontSizes.p}
          width={'100%'}
          lineHeight={ACTION_ROW_HEIGHT}
          onPress={onReasoning}
        />
      )}
      <View style={{ flexDirection: 'row' }}>
        <ButtonComponent
          label={isRaw ? t('llm.viewFormatted') : t('llm.viewRaw')}
          color={colors.faded}
          fontSize={fontSizes.p}
          width={'33.3%'}
          lineHeight={ACTION_ROW_HEIGHT}
          onPress={onToggleRaw}
        />
        <ButtonComponent
          label={copied ? t('llm.copiedShort') : t('llm.copy')}
          color={copyLocked ? colors.disabled : copied ? colors.accent : colors.faded}
          fontSize={fontSizes.p}
          width={'33.3%'}
          lineHeight={ACTION_ROW_HEIGHT}
          isDisabled={!!copyLocked}
          onPress={onCopy}
        />
        <ButtonComponent
          label={t('llm.newQuery')}
          color={colors.accent}
          fontSize={fontSizes.p}
          width={'33.4%'}
          lineHeight={ACTION_ROW_HEIGHT}
          onPress={onNewQuery}
        />
      </View>
    </View>
  )
}

type Props = {
  result: string
  reasoning?: string
  streaming?: boolean
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null
  durationMs?: number | null
  onNewQuery: () => void
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
  expiresAt?: string | null
  onExpired?: () => void
  copyLocked?: boolean
  shown?: boolean
  stickActions?: boolean
  onStickActions?: (dock: LlmAnswerDock | null) => void
}

export const LlmResultSection: React.FC<Props> = ({
  result,
  reasoning,
  streaming,
  usage,
  durationMs,
  onNewQuery,
  onNavigateToPost,
  expiresAt,
  onExpired,
  copyLocked,
  shown = true,
  stickActions = false,
  onStickActions,
}) => {
  const {
    colors,
    metrics: { blocks },
  } = useTheme()
  const [isRaw, setIsRaw] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reasoningOpen, setReasoningOpen] = useState(false)
  const secure = useHoldScreenSecure(!!copyLocked && shown)

  const resultRef = useRef(result)
  resultRef.current = result
  const onNewQueryRef = useRef(onNewQuery)
  onNewQueryRef.current = onNewQuery
  const onStickActionsRef = useRef(onStickActions)
  onStickActionsRef.current = onStickActions
  const hasReasoning = !!reasoning

  const handleCopy = useCallback(() => {
    if (copyLocked) {
      return
    }
    Clipboard.setString(resultRef.current)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [copyLocked])

  useLayoutEffect(() => {
    const publish = onStickActionsRef.current
    if (!publish) {
      return
    }
    if (!stickActions) {
      publish(null)
      return
    }
    publish({
      height: (hasReasoning ? ACTION_ROW_HEIGHT : 0) + ACTION_ROW_HEIGHT,
      node: (
        <LlmAnswerActionBar
          hasReasoning={hasReasoning}
          isRaw={isRaw}
          copied={copied}
          copyLocked={copyLocked}
          onReasoning={() => setReasoningOpen(true)}
          onToggleRaw={() => setIsRaw(value => !value)}
          onCopy={handleCopy}
          onNewQuery={() => onNewQueryRef.current()}
        />
      ),
    })
  }, [stickActions, hasReasoning, isRaw, copied, copyLocked, handleCopy])

  useLayoutEffect(() => {
    return () => onStickActionsRef.current?.(null)
  }, [])

  const parts = streaming && !isRaw ? splitStreamMarkdown(result) : { stable: result, pending: '' }
  const title = joinMeta([
    t('llm.answer'),
    formatDuration(durationMs ?? undefined),
    usage?.total_tokens ? `${usage.total_tokens} ${t('llm.tokens')}` : null,
  ])

  return (
    <View style={{ marginTop: blocks.medium }}>
      <SectionHeaderComponent
        title={title}
        backgroundColor={colors.surface}
        trailing={expiresAt ? <LlmTtlBadge expiresAt={expiresAt} onExpired={onExpired} /> : null}
      />
      <View ref={secure.ref} onLayout={secure.onLayout} collapsable={false}>
        <LlmAnswerBody
          content={parts.stable}
          pending={parts.pending}
          isRaw={isRaw}
          copyLocked={copyLocked}
          onNavigateToPost={onNavigateToPost}
        />
      </View>
      {!stickActions && (
        <LlmAnswerActionBar
          hasReasoning={hasReasoning}
          isRaw={isRaw}
          copied={copied}
          copyLocked={copyLocked}
          onReasoning={() => setReasoningOpen(true)}
          onToggleRaw={() => setIsRaw(value => !value)}
          onCopy={handleCopy}
          onNewQuery={() => onNewQueryRef.current()}
        />
      )}
      <LlmReasoningSheet
        visible={reasoningOpen && hasReasoning}
        text={reasoning || ''}
        streaming={streaming}
        copyLocked={copyLocked}
        onClose={() => setReasoningOpen(false)}
        onNavigateToPost={onNavigateToPost}
      />
    </View>
  )
}
