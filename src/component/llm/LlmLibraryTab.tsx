import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, View } from 'react-native'
import { Text } from 'react-native-paper'
import {
  clearLlmHistory,
  deleteLlmHistoryEntry,
  getLlmHistory,
  LlmHistoryItem,
  LlmPendingTask,
  LlmQueue,
  t,
  useTheme,
} from '../../lib'
import { DoubleTapDeleteButton } from '../DoubleTapDeleteButton'
import { LlmLibraryFilterBar, ScopeFilter, SortOrder } from './LlmLibraryFilterBar'
import { LlmLibraryItemCard } from './LlmLibraryItemCard'
import { LlmPendingItemCard } from './LlmPendingItemCard'

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
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const [history, setHistory] = useState<LlmHistoryItem[]>([])
  const [pendingTasks, setPendingTasks] = useState<LlmPendingTask[]>([])
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
    LlmQueue.init()
    const unsubscribe = LlmQueue.subscribe(tasks => {
      setPendingTasks(tasks)
      loadHistory()
    })
    return unsubscribe
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

  const filteredPendingTasks = useMemo(() => {
    let result = pendingTasks
    if (scope === 'discussion' && activeDiscussionId) {
      result = result.filter(item => `${item.discussionId}` === `${activeDiscussionId}`)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        item =>
          item.discussionTitle?.toLowerCase().includes(q) ||
          item.prompt?.toLowerCase().includes(q) ||
          item.modelName?.toLowerCase().includes(q) ||
          item.modelId?.toLowerCase().includes(q),
      )
    }
    return result
  }, [pendingTasks, scope, activeDiscussionId, search])

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
    <View style={{ flex: 1 }}>
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
        ListHeaderComponent={
          filteredPendingTasks.length > 0 ? (
            <View>
              {filteredPendingTasks.map(task => (
                <LlmPendingItemCard
                  key={task.id}
                  task={task}
                  onRetry={taskId => LlmQueue.retryTask(taskId)}
                  onDismiss={taskId => LlmQueue.dismissTask(taskId)}
                />
              ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <LlmLibraryItemCard
            item={item}
            onDelete={handleDeleteItem}
            onUsePrompt={onUsePrompt}
            onNavigateToPost={onNavigateToPost}
          />
        )}
        ListEmptyComponent={
          filteredPendingTasks.length === 0 ? (
            <Text style={{ color: colors.faded, fontSize: fontSizes.p, padding: blocks.large, textAlign: 'center' }}>
              {search.trim() ? t('llm.noFilteredHistory') : t('llm.noHistory')}
            </Text>
          ) : null
        }
        ListFooterComponent={
          history.length > 0 ? (
            <View style={{ alignItems: 'center', marginVertical: blocks.large }}>
              <DoubleTapDeleteButton
                onDelete={handleClearAll}
                label={t('llm.clearAll')}
                iconSize={fontSizes.p}
                textStyle={{ fontSize: fontSizes.p, fontWeight: '400' }}
                flat
                style={{ padding: blocks.medium }}
              />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  )
}
