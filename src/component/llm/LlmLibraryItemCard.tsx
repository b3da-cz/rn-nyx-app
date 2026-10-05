import React, { useState } from 'react'
import { LayoutAnimation, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Clipboard from '@react-native-clipboard/clipboard'
import Icon from 'react-native-vector-icons/Feather'
import { formatDuration, LayoutAnimConf, LlmHistoryItem, Styling, t, useTheme } from '../../lib'
import { ButtonComponent } from '../ButtonComponent'
import { DoubleTapDeleteButton } from '../DoubleTapDeleteButton'
import { LlmAnswerBody } from './LlmAnswerBody'
import { formatLlmDate, joinMeta } from './llmFormat'

type Props = {
  item: LlmHistoryItem
  onDelete: (id: string) => void
  onUsePrompt: (prompt: string) => void
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
}

export const LlmLibraryItemCard: React.FC<Props> = ({ item, onDelete, onUsePrompt, onNavigateToPost }) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRaw, setIsRaw] = useState(false)
  const [copied, setCopied] = useState(false)

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    setIsExpanded(!isExpanded)
  }
  const handleCopy = () => {
    Clipboard.setString(item.response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const meta = joinMeta([
    formatLlmDate(item.createdAt),
    item.modelName,
    formatDuration(item.durationMs),
    item.usage?.total_tokens ? `${item.usage.total_tokens} ${t('llm.tokens')}` : null,
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
            <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={fontSizes.p} color={colors.faded} />
          </View>
          <Text numberOfLines={1} style={{ color: colors.faded, fontSize: fontSizes.small, marginTop: 2 }}>
            {meta}
          </Text>
          <Text
            numberOfLines={isExpanded ? undefined : 2}
            style={{ color: colors.text, fontSize: fontSizes.small, marginTop: blocks.small }}>
            {item.prompt}
          </Text>
        </View>
      </TouchableRipple>
      {isExpanded && (
        <>
          <LlmAnswerBody content={item.response} isRaw={isRaw} onNavigateToPost={onNavigateToPost} />
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
                color={copied ? colors.accent : colors.faded}
                fontSize={fontSizes.p}
                width={'33%'}
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
