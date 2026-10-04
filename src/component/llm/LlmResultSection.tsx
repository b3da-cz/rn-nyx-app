import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import Icon from 'react-native-vector-icons/Feather'
import { formatDuration, t, useTheme } from '../../lib'
import { MarkdownViewComponent } from '../MarkdownViewComponent'

type Props = {
  result: string
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null
  durationMs?: number | null
  onNewQuery: () => void
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
}

export const LlmResultSection: React.FC<Props> = ({
  result,
  usage,
  durationMs,
  onNewQuery,
  onNavigateToPost,
}) => {
  const { colors, metrics } = useTheme()
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    Clipboard.setString(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const durationStr = formatDuration(durationMs ?? undefined)
  const tokenStr = usage?.total_tokens ? `${usage.total_tokens} tokenů` : null

  return (
    <View style={[styles.container, { borderTopColor: colors.disabled }]}>
      <View style={styles.topBar}>
        <View style={styles.metaRow}>
          {!!durationStr && (
            <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
              <Icon name="clock" size={11} color={colors.faded} style={{ marginRight: 4 }} />
              <Text style={{ color: colors.faded, fontSize: 11 }}>{durationStr}</Text>
            </View>
          )}
          {!!tokenStr && (
            <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
              <Icon name="cpu" size={11} color={colors.faded} style={{ marginRight: 4 }} />
              <Text style={{ color: colors.faded, fontSize: 11 }}>{tokenStr}</Text>
            </View>
          )}
        </View>

        <View style={styles.modeRow}>
          <TouchableOpacity
            onPress={() => setViewMode('formatted')}
            style={[
              styles.modeBtn,
              { backgroundColor: viewMode === 'formatted' ? colors.primary : colors.surface },
            ]}>
            <Text style={{ color: viewMode === 'formatted' ? '#FFFFFF' : colors.faded, fontSize: 11 }}>
              {t('llm.viewFormatted') || 'Formát'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('raw')}
            style={[styles.modeBtn, { backgroundColor: viewMode === 'raw' ? colors.primary : colors.surface }]}>
            <Text style={{ color: viewMode === 'raw' ? '#FFFFFF' : colors.faded, fontSize: 11 }}>
              {t('llm.viewRaw') || 'Text'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.contentWrap, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
        {viewMode === 'formatted' ? (
          <MarkdownViewComponent content={result} selectable={true} onNavigateToPost={onNavigateToPost} />
        ) : (
          <Text selectable style={{ color: colors.text, fontSize: metrics.fontSizes.p, lineHeight: 20 }}>
            {result}
          </Text>
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={handleCopy}
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
          <Icon name={copied ? 'check' : 'copy'} size={14} color={copied ? colors.primary : colors.text} />
          <Text style={{ color: copied ? colors.primary : colors.text, fontSize: metrics.fontSizes.small, marginLeft: 6 }}>
            {copied ? t('llm.copied') || 'Zkopírováno' : t('llm.copyAnswer') || 'Kopírovat'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNewQuery}
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
          <Icon name="plus-circle" size={14} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: metrics.fontSizes.small, marginLeft: 6 }}>
            {t('llm.newQuery') || 'Nový dotaz'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    borderTopWidth: 1,
    marginTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  modeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  contentWrap: {
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
})
