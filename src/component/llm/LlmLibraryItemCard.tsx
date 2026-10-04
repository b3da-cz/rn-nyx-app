import React, { useRef, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import Icon from 'react-native-vector-icons/Feather'
import { formatDuration, LlmHistoryItem, t, useTheme } from '../../lib'
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleDelete = () => {
    if (confirmDelete) {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
      }
      setConfirmDelete(false)
      onDelete(item.id)
    } else {
      setConfirmDelete(true)
      deleteTimerRef.current = setTimeout(() => {
        setConfirmDelete(false)
      }, 3000)
    }
  }

  const handleCopy = () => {
    Clipboard.setString(item.response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const durationStr = formatDuration(item.durationMs)
  const tokensStr = item.usage?.total_tokens ? `${item.usage.total_tokens} t` : null

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text numberOfLines={1} style={{ color: colors.text, fontSize: metrics.fontSizes.small, fontWeight: 'bold' }}>
            {item.discussionTitle || `Diskuze #${item.discussionId}`}
          </Text>
          <Text style={{ color: colors.faded, fontSize: 10, marginTop: 2 }}>{item.createdAt}</Text>
        </View>

        <View style={styles.badgesRow}>
          {!!item.modelName && (
            <View style={[styles.badge, { backgroundColor: colors.background, borderColor: colors.disabled }]}>
              <Text numberOfLines={1} style={{ color: colors.faded, fontSize: 10, maxWidth: 90 }}>
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
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={[styles.promptBox, { backgroundColor: colors.background, borderColor: colors.disabled }]}>
        <Text style={{ color: colors.primary, fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>PROMPT:</Text>
        <Text
          numberOfLines={isExpanded ? undefined : 2}
          style={{ color: colors.text, fontSize: metrics.fontSizes.small - 1 }}>
          {item.prompt}
        </Text>
      </TouchableOpacity>

      <View style={[styles.responseBox, { backgroundColor: colors.background, borderColor: colors.disabled }]}>
        <View style={styles.responseTop}>
          <Text style={{ color: colors.faded, fontSize: 10, fontWeight: 'bold' }}>ODPOVĚĎ:</Text>
          <TouchableOpacity onPress={() => setIsRawMode(!isRawMode)}>
            <Text style={{ color: colors.primary, fontSize: 10 }}>
              {isRawMode ? t('llm.viewFormatted') || 'Formát' : t('llm.viewRaw') || 'Zdroj'}
            </Text>
          </TouchableOpacity>
        </View>
        {isRawMode ? (
          <Text selectable style={{ color: colors.text, fontSize: metrics.fontSizes.small - 1 }}>
            {item.response}
          </Text>
        ) : (
          <MarkdownViewComponent content={item.response} selectable={true} onNavigateToPost={onNavigateToPost} />
        )}
      </View>

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

        <TouchableOpacity
          onPress={handleDelete}
          style={[
            styles.btn,
            {
              backgroundColor: confirmDelete ? colors.accent : colors.background,
              borderColor: confirmDelete ? colors.accent : colors.disabled,
            },
          ]}>
          <Icon name="trash-2" size={13} color={confirmDelete ? '#FFFFFF' : colors.faded} />
          <Text style={{ color: confirmDelete ? '#FFFFFF' : colors.faded, fontSize: 11, marginLeft: 4 }}>
            {confirmDelete ? t('llm.deleteItemConfirm') || 'Smazat?' : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  promptBox: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
  },
  responseBox: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
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
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
})
