import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyModelChoice,
  applySystemPromptChoice,
  filterAndFormatPostsForLlm,
  getLlmHistory,
  LlmPendingTask,
  LlmQueue,
  MainContext,
  Storage,
  t,
} from '../../lib'
import type { MainContextConfig } from '../../lib'
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
  const context = useContext(MainContext)
  const dateFilter = useLlmDateFilter()
  const { dateFrom, dateTo } = dateFilter
  const [modelId, setModelId] = useState(p.defaultModelId)
  const [modelName, setModelName] = useState(p.defaultModelName || p.defaultModelId)
  const [isGlobalModel, setIsGlobalModel] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState(p.systemPrompt)
  const [isGlobalSystemPrompt, setIsGlobalSystemPrompt] = useState(false)
  const modelRef = useRef({ id: p.defaultModelId, name: p.defaultModelName || p.defaultModelId })
  const systemPromptRef = useRef(p.systemPrompt)
  const modelTouched = useRef(false)
  const promptTouched = useRef(false)
  const persistQueue = useRef(Promise.resolve())
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
      return persistLlmConfig({
        selectedLlmModel: applied.globalModel.id,
        selectedLlmModelName: applied.globalModel.name,
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

  const canSend = !isSending && !!p.prompt.trim() && postCount > 0 && !!modelRef.current.id

  const send = async () => {
    if (!canSend) {
      return
    }
    setErrorMessage(null)
    setResult(null)
    try {
      const model = modelRef.current
      lastSentTaskIdRef.current = await LlmQueue.enqueueTask({
        apiKey: p.apiKey,
        modelId: model.id,
        modelName: model.name,
        userPrompt: p.prompt,
        discussionId,
        discussionTitle: p.discussionTitle,
        posts: p.posts,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        postCount,
        systemPrompt: systemPromptRef.current,
      })
      p.onChangePrompt('')
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
