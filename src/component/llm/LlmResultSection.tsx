import React, { useState } from 'react'
import { View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { formatDuration, t, useTheme } from '../../lib'
import { ButtonComponent } from '../ButtonComponent'
import { SectionHeaderComponent } from '../SectionHeaderComponent'
import { LlmAnswerBody } from './LlmAnswerBody'
import { joinMeta } from './llmFormat'

type Props = {
  result: string
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null
  durationMs?: number | null
  onNewQuery: () => void
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
}

export const LlmResultSection: React.FC<Props> = ({ result, usage, durationMs, onNewQuery, onNavigateToPost }) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const [isRaw, setIsRaw] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    Clipboard.setString(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const title = joinMeta([
    t('llm.answer'),
    formatDuration(durationMs ?? undefined),
    usage?.total_tokens ? `${usage.total_tokens} ${t('llm.tokens')}` : null,
  ])

  return (
    <View style={{ marginTop: blocks.medium }}>
      <SectionHeaderComponent title={title} backgroundColor={colors.surface} />
      <LlmAnswerBody content={result} isRaw={isRaw} onNavigateToPost={onNavigateToPost} />
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
          color={copied ? colors.accent : colors.faded}
          fontSize={fontSizes.p}
          width={'33.3%'}
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
