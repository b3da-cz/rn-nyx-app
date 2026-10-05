import { useEffect, useMemo, useRef, useState } from 'react'
import { filterAndFormatPostsForLlm, getLlmHistory, LlmPendingTask, LlmQueue, Storage, t } from '../../lib'
import { useLlmDateFilter } from './useLlmDateFilter'

type Params = {
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
  onHistoryEntryAdded?: () => void
}

export function useLlmAssistant(p: Params) {
  const dateFilter = useLlmDateFilter()
  const { dateFrom, dateTo } = dateFilter
  const [modelId, setModelId] = useState(p.defaultModelId)
  const [modelName, setModelName] = useState(p.defaultModelName || p.defaultModelId)
  const [isGlobalModel, setIsGlobalModel] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState(p.systemPrompt)
  const [isGlobalSystemPrompt, setIsGlobalSystemPrompt] = useState(false)
  const [pendingTasks, setPendingTasks] = useState<LlmPendingTask[]>([])
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [result, setResult] = useState<{ text: string; usage: any; durationMs: number | null } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const lastSentTaskIdRef = useRef<string | null>(null)
  const { discussionId, onHistoryEntryAdded } = p

  useEffect(() => {
    LlmQueue.init()
    return LlmQueue.subscribe(tasks => {
      setPendingTasks(tasks)
      // If we recently sent a task and it completed, load the result
      if (lastSentTaskIdRef.current && !tasks.some(task => task.id === lastSentTaskIdRef.current)) {
        lastSentTaskIdRef.current = null
        getLlmHistory().then(history => {
          const latest = history.find(it => `${it.discussionId}` === `${discussionId}`)
          if (latest) {
            setResult({ text: latest.response, usage: latest.usage, durationMs: latest.durationMs ?? null })
            onHistoryEntryAdded?.()
          }
        })
      }
    })
  }, [discussionId, onHistoryEntryAdded])

  const activeTask = useMemo(
    () => pendingTasks.find(task => `${task.discussionId}` === `${discussionId}`),
    [pendingTasks, discussionId],
  )
  const isSending = activeTask?.status === 'pending'

  const { count: postCount, wordCount } = useMemo(
    () => filterAndFormatPostsForLlm(p.posts, dateFrom, dateTo, p.discussionTitle),
    [p.posts, dateFrom, dateTo, p.discussionTitle],
  )

  const canLoadOlder = useMemo(() => {
    if (!p.onLoadMorePosts || !dateFrom) {
      return false
    }
    const valid = p.posts.filter(post => post && post.inserted_at && post.location !== 'header')
    return valid.length > 0 && valid[valid.length - 1].inserted_at.substring(0, 10) > dateFrom
  }, [p.posts, dateFrom, p.onLoadMorePosts])

  const loadOlder = async () => {
    if (!p.onLoadMorePosts || isLoadingOlder) {
      return
    }
    setIsLoadingOlder(true)
    try {
      await p.onLoadMorePosts()
    } catch (e: any) {
      setErrorMessage(e?.message || t('llm.errorLoadingOlder') || 'Chyba při načítání starších příspěvků.')
    } finally {
      setIsLoadingOlder(false)
    }
  }

  const canSend = !isSending && !!p.prompt.trim() && postCount > 0 && !!modelId

  const send = async () => {
    if (!canSend) {
      return
    }
    setErrorMessage(null)
    setResult(null)
    try {
      if (isGlobalModel || (isGlobalSystemPrompt && systemPrompt)) {
        const conf = (await Storage.getConfig()) || {}
        if (isGlobalModel) {
          conf.selectedLlmModel = modelId
          conf.selectedLlmModelName = modelName
        }
        if (isGlobalSystemPrompt && systemPrompt) {
          conf.llmSystemPrompt = systemPrompt
        }
        await Storage.setConfig(conf)
      }
      lastSentTaskIdRef.current = await LlmQueue.enqueueTask({
        apiKey: p.apiKey,
        modelId,
        modelName,
        userPrompt: p.prompt,
        discussionId,
        discussionTitle: p.discussionTitle,
        posts: p.posts,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        postCount,
        systemPrompt,
      })
      p.onChangePrompt('')
    } catch (e: any) {
      setErrorMessage(e?.message || t('llm.errorStartingQuery') || 'Chyba při zahájení dotazu.')
    }
  }

  return {
    dateFilter,
    model: { modelId, modelName, setModelId, setModelName, isGlobalModel, setIsGlobalModel },
    system: { systemPrompt, setSystemPrompt, isGlobalSystemPrompt, setIsGlobalSystemPrompt },
    activeTask,
    isSending,
    postCount,
    wordCount,
    canLoadOlder,
    isLoadingOlder,
    loadOlder,
    canSend,
    send,
    result,
    clearResult: () => setResult(null),
    errorMessage,
  }
}
