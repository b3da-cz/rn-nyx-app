import React, { useState } from 'react'
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
}) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const [isRaw, setIsRaw] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reasoningOpen, setReasoningOpen] = useState(false)
  const secure = useHoldScreenSecure(!!copyLocked && shown)

  const handleCopy = () => {
    if (copyLocked) {
      return
    }
    Clipboard.setString(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
      {!!reasoning && (
        <ButtonComponent
          label={t('llm.reasoning')}
          color={colors.faded}
          fontSize={fontSizes.p}
          width={'100%'}
          onPress={() => setReasoningOpen(true)}
        />
      )}
      <LlmReasoningSheet
        visible={reasoningOpen && !!reasoning}
        text={reasoning || ''}
        streaming={streaming}
        copyLocked={copyLocked}
        onClose={() => setReasoningOpen(false)}
        onNavigateToPost={onNavigateToPost}
      />
      <View style={{ flexDirection: 'row' }}>
        <ButtonComponent
          label={isRaw ? t('llm.viewFormatted') : t('llm.viewRaw')}
          color={colors.faded}
          fontSize={fontSizes.p}
          width={'33.3%'}
          onPress={() => setIsRaw(!isRaw)}
        />
        <ButtonComponent
          label={copied ? t('llm.copiedShort') : t('llm.copy')}
          color={copyLocked ? colors.disabled : copied ? colors.accent : colors.faded}
          fontSize={fontSizes.p}
          width={'33.3%'}
          isDisabled={!!copyLocked}
          onPress={handleCopy}
        />
        <ButtonComponent
          label={t('llm.newQuery')}
          color={colors.accent}
          fontSize={fontSizes.p}
          width={'33.4%'}
          onPress={onNewQuery}
        />
      </View>
    </View>
  )
}
