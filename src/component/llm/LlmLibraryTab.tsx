import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { clearLlmHistory, deleteLlmHistoryEntry, getLlmHistory, LlmHistoryItem, t, useTheme } from '../../lib'
import { DoubleTapDeleteButton } from '../DoubleTapDeleteButton'
import { LlmLibraryFilterBar, ScopeFilter, SortOrder } from './LlmLibraryFilterBar'
import { LlmLibraryItemCard } from './LlmLibraryItemCard'

type Props = {
  activeDiscussionId?: number | string
  onUsePrompt: (prompt: string) => void
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
  onCountChange?: (count: number) => void
}

export const LlmLibraryTab: React.FC<Props> = ({
  activeDiscussionId,
  onUsePrompt,
  onNavigateToPost,
  onCountChange,
}) => {
  const { colors, metrics } = useTheme()
  const [history, setHistory] = useState<LlmHistoryItem[]>([])
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<ScopeFilter>(activeDiscussionId ? 'discussion' : 'all')
  const [sort, setSort] = useState<SortOrder>('newest')

  const loadHistory = useCallback(async () => {
    const list = await getLlmHistory()
    setHistory(list)
    onCountChange?.(list.length)
  }, [onCountChange])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleDeleteItem = async (id: string) => {
    const updated = await deleteLlmHistoryEntry(id)
    setHistory(updated)
    onCountChange?.(updated.length)
  }

  const handleClearAll = async () => {
    await clearLlmHistory()
    setHistory([])
    onCountChange?.(0)
  }

  const filteredAndSortedHistory = useMemo(() => {
    let result = history
    if (scope === 'discussion' && activeDiscussionId) {
      result = result.filter(item => `${item.discussionId}` === `${activeDiscussionId}`)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        item =>
          item.discussionTitle?.toLowerCase().includes(q) ||
          item.prompt?.toLowerCase().includes(q) ||
          item.response?.toLowerCase().includes(q) ||
          item.modelName?.toLowerCase().includes(q) ||
          item.modelId?.toLowerCase().includes(q),
      )
    }
    return [...result].sort((a, b) => {
      if (sort === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '')
      if (sort === 'oldest') return (a.createdAt || '').localeCompare(b.createdAt || '')
      if (sort === 'discussion') return (a.discussionTitle || '').localeCompare(b.discussionTitle || '')
      if (sort === 'duration') return (b.durationMs || 0) - (a.durationMs || 0)
      return 0
    })
  }, [history, scope, activeDiscussionId, search, sort])

  return (
    <View style={styles.container}>
      <LlmLibraryFilterBar
        search={search}
        onSearchChange={setSearch}
        scope={scope}
        onScopeChange={setScope}
        sort={sort}
        onSortChange={setSort}
        hasActiveDiscussion={!!activeDiscussionId}
      />

      <FlatList
        data={filteredAndSortedHistory}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <LlmLibraryItemCard
            item={item}
            onDelete={handleDeleteItem}
            onUsePrompt={onUsePrompt}
            onNavigateToPost={onNavigateToPost}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="archive" size={32} color={colors.faded} style={{ marginBottom: 8 }} />
            <Text style={{ color: colors.faded, fontSize: metrics.fontSizes.small }}>
              {search.trim()
                ? t('llm.noFilteredHistory') || 'Nenalezeny žádné záznamy'
                : t('llm.noHistory') || 'Žádná historie dotazů'}
            </Text>
          </View>
        }
        ListFooterComponent={
          history.length > 0 ? (
            <View style={styles.footerWrap}>
              <DoubleTapDeleteButton
                onDelete={handleClearAll}
                label={t('llm.clearAll') || 'Smazat vše'}
                confirmLabel={t('llm.clearAllConfirm') || 'Opravdu smazat?'}
                iconSize={14}
              />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  footerWrap: { alignItems: 'center', marginVertical: 16 },
})
