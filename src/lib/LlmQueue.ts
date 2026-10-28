import { addLlmHistoryEntry } from './LlmHistory'
import { LlmProviderId, normalizeLlmProvider, sendOpenRouterChat } from './OpenRouter'
import { Storage } from './Storage'
import { t } from './Strings'
import { showNotificationBanner } from './Util'

export type LlmPendingTask = {
  id: string
  startedAt: number
  discussionId: number | string
  discussionTitle: string
  modelId: string
  modelName?: string
  dateFrom?: string
  dateTo?: string
  postCount: number
  prompt: string
  status: 'pending' | 'error'
  error?: string
  apiKey: string
  provider?: LlmProviderId
  baseUrl?: string
  systemPrompt?: string
  posts?: any[]
  ttlMs?: number
  stream?: { content: string; reasoning: string }
}

type LlmQueueListener = (tasks: LlmPendingTask[]) => void

class LlmQueueService {
  private tasks: LlmPendingTask[] = []
  private listeners: Set<LlmQueueListener> = new Set()
  private completionListeners: Set<(task: LlmPendingTask) => void> = new Set()
  private isInitialized = false
  private streamNotifiedAt = 0

  async init(): Promise<void> {
    if (this.isInitialized) return
    this.isInitialized = true

    try {
      const persisted = await Storage.getLlmPendingTasks()
      if (Array.isArray(persisted) && persisted.length > 0) {
        // Any task that was 'pending' when app was terminated is marked as interrupted
        this.tasks = persisted.map(task => {
          if (task.status === 'pending') {
            return {
              ...task,
              status: 'error',
              error: t('llm.errorInterrupted') || 'Dotaz byl přerušen ukončením aplikace.',
            }
          }
          return task
        })
        await Storage.setLlmPendingTasks(this.tasks)
        this.notify()
      }
    } catch (e) {
      console.warn('Failed to init LlmQueue', e)
    }
  }

  getPendingTasks(): LlmPendingTask[] {
    return this.tasks
  }

  getPendingTaskForDiscussion(discussionId: number | string): LlmPendingTask | undefined {
    return this.tasks.find(
      t => `${t.discussionId}` === `${discussionId}` && t.status === 'pending',
    )
  }

  subscribe(listener: LlmQueueListener): () => void {
    this.listeners.add(listener)
    listener(this.tasks)
    return () => {
      this.listeners.delete(listener)
    }
  }

  onTaskCompleted(listener: (task: LlmPendingTask) => void): () => void {
    this.completionListeners.add(listener)
    return () => {
      this.completionListeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn([...this.tasks])
      } catch (e) {
        console.warn('LlmQueue listener error', e)
      }
    })
  }

  private async persist() {
    try {
      const stored = this.tasks.map(({ stream, ...task }) => task)
      await Storage.setLlmPendingTasks(stored)
    } catch (e) {
      console.warn('Failed to persist LlmQueue', e)
    }
  }

  private publishStream(taskId: string, content: string, reasoning: string, force = false) {
    this.tasks = this.tasks.map(task => (task.id === taskId ? { ...task, stream: { content, reasoning } } : task))
    const now = Date.now()
    if (!force && now - this.streamNotifiedAt < 80) {
      return
    }
    this.streamNotifiedAt = now
    this.notify()
  }

  private generateId(): string {
    return 'llm-task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7)
  }

  async enqueueTask(params: {
    apiKey: string
    modelId: string
    modelName?: string
    userPrompt: string
    discussionId: number | string
    discussionTitle: string
    posts: any[]
    dateFrom?: string
    dateTo?: string
    postCount: number
    systemPrompt?: string
    ttlMs?: number
    provider?: LlmProviderId
    baseUrl?: string
  }): Promise<string> {
    await this.init()

    const task: LlmPendingTask = {
      id: this.generateId(),
      startedAt: Date.now(),
      discussionId: params.discussionId,
      discussionTitle: params.discussionTitle,
      modelId: params.modelId,
      modelName: params.modelName || params.modelId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      postCount: params.postCount,
      prompt: params.userPrompt.trim(),
      apiKey: params.apiKey,
      provider: params.provider ? normalizeLlmProvider(params.provider) : 'openrouter',
      baseUrl: params.baseUrl,
      systemPrompt: params.systemPrompt,
      posts: params.posts,
      ttlMs: params.ttlMs && params.ttlMs > 0 ? params.ttlMs : undefined,
      status: 'pending',
    }

    const discussionId = `${params.discussionId}`
    this.tasks = [task, ...this.tasks.filter(item => `${item.discussionId}` !== discussionId || item.status !== 'error')]
    await this.persist()
    this.notify()

    // Execute in background
    this.executeTask(task)

    return task.id
  }

  private async executeTask(task: LlmPendingTask) {
    try {
      const res = await sendOpenRouterChat({
        apiKey: task.apiKey,
        model: task.modelId,
        userPrompt: task.prompt,
        discussionId: task.discussionId,
        discussionTitle: task.discussionTitle,
        posts: task.posts || [],
        dateFrom: task.dateFrom,
        dateTo: task.dateTo,
        systemPrompt: task.systemPrompt,
        provider: task.provider,
        baseUrl: task.baseUrl,
        onDelta: snapshot => this.publishStream(task.id, snapshot.content, snapshot.reasoning),
      })
      this.publishStream(task.id, res.content, res.reasoning || '', true)

      const durationMs = Date.now() - task.startedAt

      await addLlmHistoryEntry({
        discussionId: task.discussionId,
        discussionTitle: task.discussionTitle,
        modelId: task.modelId,
        modelName: task.modelName,
        dateFrom: task.dateFrom,
        dateTo: task.dateTo,
        postCount: task.postCount,
        prompt: task.prompt,
        response: res.content,
        reasoning: res.reasoning || undefined,
        durationMs,
        usage: res.usage,
        expiresAt: task.ttlMs && task.ttlMs > 0 ? new Date(Date.now() + task.ttlMs).toISOString() : undefined,
      })

      // Remove completed task from queue
      this.tasks = this.tasks.filter(t => t.id !== task.id)
      await this.persist()
      this.notify()

      if (this.completionListeners.size > 0) {
        this.completionListeners.forEach(fn => {
          try {
            fn(task)
          } catch (e) {
            console.warn('LlmQueue completion listener error', e)
          }
        })
      } else {
        try {
          showNotificationBanner({
            title: t('llm.notificationAnsweredTitle') || 'LLM Asistent odpověděl',
            body: `${task.discussionTitle}: ${t('llm.notificationAnsweredBody') || 'odpověď je připravena v Knihovně'}`,
            tintColor: '#1E293B',
            icon: 'check-circle',
            onClick: () => {},
          })
        } catch (bannerErr) {
          // Notification banner optional
        }
      }
    } catch (err: any) {
      const errorMsg = err?.message || t('llm.errorModelCommunication') || 'Chyba při komunikaci s modelem.'
      this.tasks = this.tasks.map(t =>
        t.id === task.id ? { ...t, status: 'error', error: errorMsg } : t,
      )
      await this.persist()
      this.notify()
    }
  }

  async retryTask(
    taskId: string,
    patch?: { posts?: any[]; dateFrom?: string; dateTo?: string; postCount?: number },
  ): Promise<void> {
    const current = this.tasks.find(t => t.id === taskId)
    if (!current) return

    const task: LlmPendingTask = {
      ...current,
      ...(patch || {}),
      status: 'pending',
      error: undefined,
      stream: undefined,
      startedAt: Date.now(),
    }
    this.tasks = this.tasks.map(item => (item.id === taskId ? task : item))
    await this.persist()
    this.notify()

    this.executeTask(task)
  }

  async dismissTask(taskId: string): Promise<void> {
    this.tasks = this.tasks.filter(t => t.id !== taskId)
    await this.persist()
    this.notify()
  }
}

export const LlmQueue = new LlmQueueService()
