import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import {
  filterAndFormatPostsForLlm,
  getLlmHistory,
  LlmPendingTask,
  LlmQueue,
  Storage,
  t,
  useTheme,
} from '../../lib'
import { LlmDateFilterBar } from './LlmDateFilterBar'
import { LlmModelBar } from './LlmModelBar'
import { LlmPendingItemCard } from './LlmPendingItemCard'
import { LlmPromptInput } from './LlmPromptInput'
import { LlmResultSection } from './LlmResultSection'
import { LlmSystemPromptBar } from './LlmSystemPromptBar'
import { useLlmDateFilter } from './useLlmDateFilter'

type Props = {
  discussionId: number | string
  discussionTitle: string
  posts: any[]
  apiKey: string
  defaultModelId: string
  defaultModelName?: string
  systemPrompt?: string
  prompt: string
  onChangePrompt: (val: string) => void
  onLoadMorePosts?: () => Promise<number>
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
  onHistoryEntryAdded?: () => void
  onPromptFocus?: () => void
  onPromptLayout?: (y: number) => void
}

export const LlmAssistantTab: React.FC<Props> = ({
  discussionId,
  discussionTitle,
  posts,
  apiKey,
  defaultModelId,
  defaultModelName,
  systemPrompt,
  prompt,
  onChangePrompt,
  onLoadMorePosts,
  onNavigateToPost,
  onHistoryEntryAdded,
  onPromptFocus,
  onPromptLayout,
}) => {
  const { colors, metrics } = useTheme()
  const { datePreset, dateFrom, dateTo, setDateFrom, setDateTo, applyPreset } = useLlmDateFilter()
  const [currentModelId, setCurrentModelId] = useState(defaultModelId)
  const [currentModelName, setCurrentModelName] = useState(defaultModelName || defaultModelId)
  const [isGlobalModel, setIsGlobalModel] = useState(false)
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState(systemPrompt)
  const [isGlobalSystemPrompt, setIsGlobalSystemPrompt] = useState(false)
  const [pendingTasks, setPendingTasks] = useState<LlmPendingTask[]>([])
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [resultUsage, setResultUsage] = useState<any | null>(null)
  const [resultDuration, setResultDuration] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const lastSentTaskIdRef = useRef<string | null>(null)

  useEffect(() => {
    LlmQueue.init()
    const unsubscribe = LlmQueue.subscribe(tasks => {
      setPendingTasks(tasks)

      // If we recently sent a task and it completed, load the result
      if (lastSentTaskIdRef.current) {
        const stillPending = tasks.some(t => t.id === lastSentTaskIdRef.current)
        if (!stillPending) {
          lastSentTaskIdRef.current = null
          getLlmHistory().then(history => {
            const latest = history.find(it => `${it.discussionId}` === `${discussionId}`)
            if (latest) {
              setResult(latest.response)
              setResultUsage(latest.usage)
              setResultDuration(latest.durationMs ?? null)
              onHistoryEntryAdded?.()
            }
          })
        }
      }
    })
    return unsubscribe
  }, [discussionId, onHistoryEntryAdded])

  const activeTask = useMemo(() => {
    return pendingTasks.find(t => `${t.discussionId}` === `${discussionId}`)
  }, [pendingTasks, discussionId])

  const isSending = activeTask?.status === 'pending'

  const { count: postCount, wordCount } = useMemo(
    () => filterAndFormatPostsForLlm(posts, dateFrom, dateTo, discussionTitle),
    [posts, dateFrom, dateTo, discussionTitle],
  )

  const canLoadOlder = useMemo(() => {
    if (!onLoadMorePosts || !dateFrom) {
      return false
    }
    const valid = posts.filter(p => p && p.inserted_at && p.location !== 'header')
    return valid.length > 0 && valid[valid.length - 1].inserted_at.substring(0, 10) > dateFrom
  }, [posts, dateFrom, onLoadMorePosts])

  const handleLoadOlder = async () => {
    if (!onLoadMorePosts || isLoadingOlder) {
      return
    }
    setIsLoadingOlder(true)
    try {
      await onLoadMorePosts()
    } catch (e: any) {
      setErrorMessage(e?.message || 'Chyba při načítání starších příspěvků.')
    } finally {
      setIsLoadingOlder(false)
    }
  }

  const handleSend = async () => {
    if (!prompt.trim() || postCount === 0 || !currentModelId) {
      return
    }
    setErrorMessage(null)
    setResult(null)

    try {
      if (isGlobalModel) {
        const conf = (await Storage.getConfig()) || {}
        conf.selectedLlmModel = currentModelId
        conf.selectedLlmModelName = currentModelName
        await Storage.setConfig(conf)
      }
      if (isGlobalSystemPrompt && currentSystemPrompt) {
        const conf = (await Storage.getConfig()) || {}
        conf.llmSystemPrompt = currentSystemPrompt
        await Storage.setConfig(conf)
      }

      const taskId = await LlmQueue.enqueueTask({
        apiKey,
        modelId: currentModelId,
        modelName: currentModelName,
        userPrompt: prompt,
        discussionId,
        discussionTitle,
        posts,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        postCount,
        systemPrompt: currentSystemPrompt,
      })
      lastSentTaskIdRef.current = taskId
      onChangePrompt('')
    } catch (e: any) {
      setErrorMessage(e?.message || 'Chyba při zahájení dotazu.')
    }
  }

  return (
    <View style={styles.tabContent}>
      {!!discussionTitle && (
        <View style={[styles.discussionBar, { borderBottomColor: colors.disabled }]}>
          <Icon name="message-square" size={13} color={colors.primary} style={{ marginRight: 6 }} />
          <Text numberOfLines={1} style={{ color: colors.faded, fontSize: metrics.fontSizes.small, flex: 1 }}>
            {discussionTitle}
          </Text>
        </View>
      )}

      <LlmModelBar
        apiKey={apiKey}
        currentModelId={currentModelId}
        currentModelName={currentModelName}
        isGlobalModel={isGlobalModel}
        onModelSelected={m => {
          setCurrentModelId(m.id)
          setCurrentModelName(m.name)
        }}
        onToggleGlobal={setIsGlobalModel}
      />

      <LlmSystemPromptBar
        systemPrompt={currentSystemPrompt}
        isGlobalSystemPrompt={isGlobalSystemPrompt}
        onToggleGlobal={setIsGlobalSystemPrompt}
        onSystemPromptChange={setCurrentSystemPrompt}
      />

      <LlmDateFilterBar
        datePreset={datePreset}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onPresetChange={applyPreset}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      <View style={styles.statsRow}>
        <Text style={{ color: colors.faded, fontSize: metrics.fontSizes.small, flex: 1 }}>
          {postCount > 0 ? `${postCount} příspěvků (cca ${wordCount} slov)` : t('llm.noPosts') || 'Žádné příspěvky'}
        </Text>
        {canLoadOlder && (
          <TouchableOpacity onPress={handleLoadOlder} disabled={isLoadingOlder} style={styles.loadOlderBtn}>
            {isLoadingOlder ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={{ color: colors.primary, fontSize: metrics.fontSizes.small - 1, fontWeight: 'bold' }}>
                {t('llm.loadOlderPosts') || 'Načíst starší'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View onLayout={e => onPromptLayout?.(e.nativeEvent.layout.y)}>
        <LlmPromptInput
          prompt={prompt}
          onChangePrompt={onChangePrompt}
          onFocus={onPromptFocus}
          disabled={isSending}
        />
      </View>

      <TouchableOpacity
        onPress={handleSend}
        disabled={isSending || !prompt.trim() || postCount === 0}
        style={[
          styles.sendBtn,
          { backgroundColor: isSending || !prompt.trim() || postCount === 0 ? colors.disabled : colors.primary },
        ]}>
        {isSending ? (
          <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
        ) : (
          <Icon name="send" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
        )}
        <Text style={{ color: '#FFFFFF', fontSize: metrics.fontSizes.p, fontWeight: 'bold' }}>
          {isSending ? t('llm.sending') || 'Zpracovávám...' : t('llm.send') || 'Odeslat dotaz'}
        </Text>
      </TouchableOpacity>

      {/* Active or errored pending task for this discussion */}
      {!!activeTask && (
        <View style={{ marginTop: 10 }}>
          <LlmPendingItemCard
            task={activeTask}
            onRetry={taskId => LlmQueue.retryTask(taskId)}
            onDismiss={taskId => LlmQueue.dismissTask(taskId)}
          />
        </View>
      )}

      {!!errorMessage && (
        <View style={[styles.errorWrap, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
          <Icon name="alert-triangle" size={16} color={colors.accent} style={{ marginRight: 8 }} />
          <Text selectable style={{ color: colors.text, fontSize: metrics.fontSizes.small, flex: 1 }}>
            {errorMessage}
          </Text>
        </View>
      )}

      {!!result && (
        <LlmResultSection
          result={result}
          usage={resultUsage}
          durationMs={resultDuration}
          onNewQuery={() => setResult(null)}
          onNavigateToPost={onNavigateToPost}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  tabContent: { paddingBottom: 24 },
  discussionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  loadOlderBtn: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 4 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 4,
    marginTop: 6,
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 10,
  },
})
