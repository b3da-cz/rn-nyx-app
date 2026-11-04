import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyModelChoice,
  applySystemPromptChoice,
  deleteLlmHistoryEntry,
  filterAndFormatPostsForLlm,
  fitPostsToContext,
  getLlmHistory,
  getModelMaxContext,
  initialLlmRangeSelection,
  isContextLengthError,
  isoDate,
  llmPostKey,
  llmPostOrder,
  LlmPendingTask,
  LlmProviderId,
  LlmQueue,
  LlmRangeSelection,
  MainContext,
  normalizeLlmProvider,
  Storage,
  syncLlmSelection,
  t,
  trimPostsToContext,
} from '../../lib'
import type { MainContextConfig } from '../../lib'
import { useLlmDateFilter } from './useLlmDateFilter'

type Params = {
  discussionId: number | string
  discussionTitle: string
  posts: any[]
  apiKey: string
  provider?: LlmProviderId
  baseUrl?: string
  defaultModelId: string
  defaultModelName?: string
  systemPrompt?: string
  prompt: string
  onChangePrompt: (val: string) => void
  onLoadMorePosts?: () => Promise<number>
  onHistoryEntryAdded?: () => void
  agentAllowed?: boolean
  ttlMs?: number
}

export function useLlmAssistant(p: Params) {
  const context = useContext(MainContext)
  const dateFilter = useLlmDateFilter(p.discussionId)
  const { dateFrom, dateTo } = dateFilter
  const [modelId, setModelId] = useState(p.defaultModelId)
  const [modelName, setModelName] = useState(p.defaultModelName || p.defaultModelId)
  const [isGlobalModel, setIsGlobalModel] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState(p.systemPrompt)
  const [isGlobalSystemPrompt, setIsGlobalSystemPrompt] = useState(false)
  const [cachedModels, setCachedModels] = useState<any[]>([])
  const modelRef = useRef({ id: p.defaultModelId, name: p.defaultModelName || p.defaultModelId })
  const systemPromptRef = useRef(p.systemPrompt)
  const modelTouched = useRef(false)
  const promptTouched = useRef(false)
  const persistQueue = useRef(Promise.resolve())
  const [pendingTasks, setPendingTasks] = useState<LlmPendingTask[]>([])
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [result, setResult] = useState<{
    id: string
    text: string
    reasoning?: string
    usage: any
    durationMs: number | null
    expiresAt: string | null
  } | null>(null)
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
            setResult({
              id: latest.id,
              text: latest.response,
              reasoning: latest.reasoning,
              usage: latest.usage,
              durationMs: latest.durationMs ?? null,
              expiresAt: latest.expiresAt ?? null,
            })
            onHistoryEntryAdded?.()
          }
        })
      }
    })
  }, [discussionId, onHistoryEntryAdded])

  useEffect(() => {
    if (modelTouched.current) {
      return
    }
    const name = p.defaultModelName || p.defaultModelId
    modelRef.current = { id: p.defaultModelId, name }
    setModelId(p.defaultModelId)
    setModelName(name)
  }, [p.defaultModelId, p.defaultModelName])

  useEffect(() => {
    if (promptTouched.current) {
      return
    }
    systemPromptRef.current = p.systemPrompt
    setSystemPrompt(p.systemPrompt)
  }, [p.systemPrompt])

  const persistLlmConfig = (patch: Partial<MainContextConfig>) => {
    persistQueue.current = persistQueue.current
      .catch(() => undefined)
      .then(async () => {
        try {
          const stored = (await Storage.getConfig()) || {}
          await Storage.setConfig({ ...stored, ...patch })
          if (context?.config) {
            Object.assign(context.config, patch)
          }
        } catch (e) {
          console.warn('Failed to save LLM default', e)
        }
      })
    return persistQueue.current
  }

  const chooseModel = (id: string, name: string | undefined, saveAsGlobal: boolean) => {
    const applied = applyModelChoice({ id, name: name || id }, saveAsGlobal)
    modelTouched.current = true
    modelRef.current = applied.model
    setModelId(applied.model.id)
    setModelName(applied.model.name)
    setIsGlobalModel(saveAsGlobal)
    if (applied.globalModel) {
      const provider = normalizeLlmProvider(p.provider)
      return persistLlmConfig({
        selectedLlmModel: applied.globalModel.id,
        selectedLlmModelName: applied.globalModel.name,
        llmModels: {
          ...(context?.config?.llmModels || {}),
          [provider]: applied.globalModel,
        },
      })
    }
    return Promise.resolve()
  }

  const saveSystemPrompt = (prompt: string, saveAsDefault: boolean) => {
    const applied = applySystemPromptChoice(prompt, saveAsDefault)
    promptTouched.current = true
    systemPromptRef.current = applied.prompt
    setSystemPrompt(applied.prompt)
    setIsGlobalSystemPrompt(saveAsDefault)
    if (applied.globalPrompt !== null) {
      return persistLlmConfig({ llmSystemPrompt: applied.globalPrompt })
    }
    return Promise.resolve()
  }

  useEffect(() => {
    let cancelled = false
    Storage.getCachedLlmModels(p.provider)
      .then(models => {
        if (!cancelled && Array.isArray(models)) {
          setCachedModels(models)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [p.provider])

  const activeTask = useMemo(
    () => pendingTasks.find(task => `${task.discussionId}` === `${discussionId}`),
    [pendingTasks, discussionId],
  )
  const isSending = activeTask?.status === 'pending'

  const maxContext = useMemo(
    () => getModelMaxContext(modelId, cachedModels),
    [modelId, cachedModels],
  )

  const contextFit = useMemo(() => {
    if (dateFilter.datePreset !== 'fill_context') {
      return null
    }
    return fitPostsToContext(p.posts, {
      maxContext,
      prompt: p.prompt,
      systemPrompt: systemPromptRef.current,
      discussionTitle: p.discussionTitle,
    })
  }, [dateFilter.datePreset, p.posts, maxContext, p.prompt, p.discussionTitle])

  useEffect(() => {
    if (dateFilter.datePreset === 'fill_context') {
      dateFilter.setInternalDateFrom(contextFit?.dateFrom || '')
      dateFilter.setInternalDateTo(contextFit?.dateTo || isoDate(new Date()))
    }
  }, [dateFilter.datePreset, contextFit?.dateFrom, contextFit?.dateTo])

  const postsToFormat = useMemo(() => {
    if (dateFilter.datePreset === 'fill_context') {
      return contextFit?.posts || []
    }
    return p.posts
  }, [dateFilter.datePreset, contextFit?.posts, p.posts])

  const formatted = useMemo(
    () =>
      filterAndFormatPostsForLlm(
        postsToFormat,
        dateFilter.datePreset === 'fill_context' ? undefined : dateFrom || undefined,
        dateFilter.datePreset === 'fill_context' ? undefined : dateTo || undefined,
        p.discussionTitle,
      ),
    [postsToFormat, dateFilter.datePreset, dateFrom, dateTo, p.discussionTitle],
  )
  const order = useMemo(() => llmPostOrder(formatted.matchedPosts), [formatted.matchedPosts])
  const orderKey = order.join('\n')
  const [trackedKey, setTrackedKey] = useState('')
  const [selection, setSelection] = useState<LlmRangeSelection>(() => initialLlmRangeSelection([]))
  const activeSelection = trackedKey === orderKey ? selection : syncLlmSelection(selection, order)
  if (trackedKey !== orderKey) {
    setTrackedKey(orderKey)
    setSelection(activeSelection)
  }
  const picked = useMemo(() => new Set(activeSelection.picked), [activeSelection])
  const selectedPosts = useMemo(
    () => formatted.matchedPosts.filter(post => picked.has(llmPostKey(post))),
    [formatted.matchedPosts, picked],
  )
  const { count: postCount, wordCount } = useMemo(
    () =>
      filterAndFormatPostsForLlm(
        selectedPosts,
        dateFilter.datePreset === 'fill_context' ? undefined : dateFrom || undefined,
        dateFilter.datePreset === 'fill_context' ? undefined : dateTo || undefined,
        p.discussionTitle,
      ),
    [selectedPosts, dateFilter.datePreset, dateFrom, dateTo, p.discussionTitle],
  )
  const ignoredCount = formatted.ignoredCount

  const canLoadOlder = useMemo(() => {
    if (!p.onLoadMorePosts) {
      return false
    }
    if (dateFilter.datePreset === 'fill_context') {
      return !!contextFit?.canFitMore && p.posts.length > 0
    }
    if (!dateFrom) {
      return false
    }
    const valid = p.posts.filter(post => post && post.inserted_at && post.location !== 'header')
    return valid.length > 0 && valid[valid.length - 1].inserted_at.substring(0, 10) > dateFrom
  }, [p.posts, dateFilter.datePreset, contextFit?.canFitMore, dateFrom, p.onLoadMorePosts])

  const reachedEndRef = useRef(false)
  const autoLoadCountRef = useRef(0)
  const autoLoadingActiveRef = useRef(false)

  useEffect(() => {
    reachedEndRef.current = false
    autoLoadCountRef.current = 0
  }, [discussionId, dateFilter.datePreset])

  useEffect(() => {
    if (!dateFilter.isLoaded || !p.onLoadMorePosts || isSending || !!activeTask) {
      return
    }
    if (!canLoadOlder || reachedEndRef.current || autoLoadCountRef.current >= 25) {
      return
    }
    if (autoLoadingActiveRef.current) {
      return
    }

    let cancelled = false
    autoLoadingActiveRef.current = true
    setIsLoadingOlder(true)

    p.onLoadMorePosts()
      .then(added => {
        if (cancelled) {
          return
        }
        autoLoadCountRef.current++
        if (added <= 0) {
          reachedEndRef.current = true
        }
      })
      .catch(e => {
        console.warn('Auto load older posts error', e)
        if (!cancelled) {
          reachedEndRef.current = true
        }
      })
      .finally(() => {
        autoLoadingActiveRef.current = false
        if (!cancelled) {
          setIsLoadingOlder(false)
        }
      })

    return () => {
      cancelled = true
      autoLoadingActiveRef.current = false
    }
  }, [
    dateFilter.isLoaded,
    canLoadOlder,
    p.onLoadMorePosts,
    isSending,
    activeTask,
    p.posts.length,
  ])

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

  const agentAllowed = p.agentAllowed !== false
  const canSend = agentAllowed && !isSending && !!p.prompt.trim() && postCount > 0 && !!modelRef.current.id

  const effectiveDateFrom = dateFilter.datePreset === 'fill_context' ? contextFit?.dateFrom : dateFrom
  const effectiveDateTo = dateFilter.datePreset === 'fill_context' ? contextFit?.dateTo : dateTo
  const taskPosts = () => ({
    posts: selectedPosts,
    dateFrom: effectiveDateFrom || undefined,
    dateTo: effectiveDateTo || undefined,
    postCount,
  })

  const send = async () => {
    if (!canSend || p.agentAllowed === false) {
      return
    }
    setErrorMessage(null)
    setResult(null)
    try {
      const model = modelRef.current
      lastSentTaskIdRef.current = await LlmQueue.enqueueTask({
        apiKey: p.apiKey,
        provider: normalizeLlmProvider(p.provider),
        baseUrl: p.baseUrl,
        modelId: model.id,
        modelName: model.name,
        userPrompt: p.prompt,
        discussionId,
        discussionTitle: p.discussionTitle,
        systemPrompt: systemPromptRef.current,
        ttlMs: p.ttlMs,
        ...taskPosts(),
      })
    } catch (e: any) {
      setErrorMessage(e?.message || t('llm.errorStartingQuery') || 'Chyba při zahájení dotazu.')
    }
  }

  const retryPart = async (taskId: string) => {
    setErrorMessage(null)
    setResult(null)
    try {
      const task = pendingTasks.find(t => t.id === taskId)
      const postsToTrim = task?.posts && task.posts.length > 0 ? task.posts : selectedPosts
      const trimmed = trimPostsToContext({
        posts: postsToTrim,
        error: task?.error,
        prompt: task?.prompt || p.prompt,
        systemPrompt: task?.systemPrompt || systemPromptRef.current,
        discussionTitle: p.discussionTitle,
        modelId: task?.modelId || modelRef.current.id,
      })
      if (trimmed.posts.length === 0) {
        setErrorMessage(t('llm.noPosts'))
        return
      }
      const trimmedKeys = new Set(trimmed.posts.map(post => llmPostKey(post)))
      setSelection(prev => ({
        ...prev,
        picked: prev.order.filter(key => trimmedKeys.has(key)),
      }))
      await LlmQueue.retryTask(taskId, {
        posts: trimmed.posts,
        postCount: trimmed.posts.length,
        dateFrom: trimmed.dateFrom || task?.dateFrom,
        dateTo: trimmed.dateTo || task?.dateTo,
      })
    } catch (e: any) {
      setErrorMessage(e?.message || t('llm.errorStartingQuery') || 'Chyba při zahájení dotazu.')
    }
  }

  const retry = async (taskId: string) => {
    const task = pendingTasks.find(t => t.id === taskId)
    if (task && isContextLengthError(task.error)) {
      return retryPart(taskId)
    }
    if (selectedPosts.length === 0) {
      setErrorMessage(t('llm.noPosts'))
      return
    }
    setErrorMessage(null)
    setResult(null)
    try {
      await LlmQueue.retryTask(taskId, taskPosts())
    } catch (e: any) {
      setErrorMessage(e?.message || t('llm.errorStartingQuery') || 'Chyba při zahájení dotazu.')
    }
  }

  return {
    dateFilter,
    model: { modelId, modelName, isGlobalModel, chooseModel },
    system: { systemPrompt, isGlobalSystemPrompt, saveSystemPrompt },
    activeTask,
    isSending,
    matchedPosts: formatted.matchedPosts,
    selection: activeSelection,
    setSelection,
    postCount,
    wordCount,
    ignoredCount,
    canLoadOlder,
    isLoadingOlder,
    loadOlder,
    canSend,
    send,
    retry,
    retryPart,
    result,
    clearResult: () => setResult(null),
    expireResult: async () => {
      const id = result?.id
      setResult(null)
      if (!id) {
        return
      }
      try {
        await deleteLlmHistoryEntry(id)
        onHistoryEntryAdded?.()
      } catch (e) {
        console.warn('Failed to delete expired LLM result', e)
      }
    },
    errorMessage,
  }
}
