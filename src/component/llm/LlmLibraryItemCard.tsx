import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import Icon from 'react-native-vector-icons/Feather'
import { formatDuration, LlmHistoryItem, t, useTheme } from '../../lib'
import { DoubleTapDeleteButton } from '../DoubleTapDeleteButton'
import { MarkdownViewComponent } from '../MarkdownViewComponent'

type Props = {
  item: LlmHistoryItem
  onDelete: (id: string) => void
  onUsePrompt: (prompt: string) => void
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
}

export const LlmLibraryItemCard: React.FC<Props> = ({ item, onDelete, onUsePrompt, onNavigateToPost }) => {
  const { colors, metrics } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRawMode, setIsRawMode] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    Clipboard.setString(item.response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const durationStr = formatDuration(item.durationMs)
  const tokensStr = item.usage?.total_tokens ? `${item.usage.total_tokens} t` : null

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
      {/* Header with Title, Badges & Expand Chevron */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
        style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 6 }}>
          <Text numberOfLines={1} style={{ color: colors.text, fontSize: metrics.fontSizes.small, fontWeight: 'bold' }}>
            {item.discussionTitle || `Diskuze #${item.discussionId}`}
          </Text>
          <Text style={{ color: colors.faded, fontSize: 10, marginTop: 1 }}>{item.createdAt}</Text>
        </View>

        <View style={styles.badgesRow}>
          {!!item.modelName && (
            <View style={[styles.badge, { backgroundColor: colors.background, borderColor: colors.disabled }]}>
              <Text numberOfLines={1} style={{ color: colors.faded, fontSize: 10, maxWidth: 85 }}>
                {item.modelName}
              </Text>
            </View>
          )}
          {!!durationStr && (
            <View style={[styles.badge, { backgroundColor: colors.background, borderColor: colors.disabled }]}>
              <Text style={{ color: colors.faded, fontSize: 10 }}>{durationStr}</Text>
            </View>
          )}
          {!!tokensStr && (
            <View style={[styles.badge, { backgroundColor: colors.background, borderColor: colors.disabled }]}>
              <Text style={{ color: colors.faded, fontSize: 10 }}>{tokensStr}</Text>
            </View>
          )}
          <Icon
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.faded}
            style={{ marginLeft: 2 }}
          />
        </View>
      </TouchableOpacity>

      {/* Prompt preview */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
        style={styles.promptBox}>
        <Text style={{ color: colors.primary, fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>PROMPT:</Text>
        <Text
          numberOfLines={isExpanded ? undefined : 2}
          style={{ color: colors.text, fontSize: metrics.fontSizes.small - 1 }}>
          {item.prompt}
        </Text>
      </TouchableOpacity>

      {/* Expanded Response */}
      {isExpanded && (
        <View style={[styles.responseBox, { borderTopColor: colors.disabled }]}>
          <View style={styles.responseTop}>
            <Text style={{ color: colors.faded, fontSize: 10, fontWeight: 'bold' }}>ODPOVĚĎ:</Text>
            <TouchableOpacity onPress={() => setIsRawMode(!isRawMode)}>
              <Text style={{ color: colors.primary, fontSize: 10 }}>
                {isRawMode ? t('llm.viewFormatted') || 'Formát' : t('llm.viewRaw') || 'Zdroj'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.responseContent, { borderLeftColor: colors.primary }]}>
            {isRawMode ? (
              <Text selectable style={{ color: colors.text, fontSize: metrics.fontSizes.small - 1 }}>
                {item.response}
              </Text>
            ) : (
              <MarkdownViewComponent content={item.response} selectable={true} onNavigateToPost={onNavigateToPost} />
            )}
          </View>
        </View>
      )}

      {/* Actions Row */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => onUsePrompt(item.prompt)}
          style={[styles.btn, { backgroundColor: colors.background, borderColor: colors.disabled }]}>
          <Icon name="arrow-up-right" size={13} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 11, marginLeft: 4 }}>
            {t('llm.usePrompt') || 'Použít prompt'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCopy}
          style={[styles.btn, { backgroundColor: colors.background, borderColor: colors.disabled }]}>
          <Icon name={copied ? 'check' : 'copy'} size={13} color={copied ? colors.primary : colors.text} />
          <Text style={{ color: copied ? colors.primary : colors.text, fontSize: 11, marginLeft: 4 }}>
            {copied ? t('llm.copied') || 'Zkopírováno' : t('llm.copyAnswer') || 'Kopírovat'}
          </Text>
        </TouchableOpacity>

        <DoubleTapDeleteButton
          onDelete={() => onDelete(item.id)}
          iconSize={13}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  promptBox: {
    paddingVertical: 4,
    marginBottom: 6,
  },
  responseBox: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  responseContent: {
    borderLeftWidth: 2,
    paddingLeft: 8,
    marginTop: 4,
  },
  responseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
})
