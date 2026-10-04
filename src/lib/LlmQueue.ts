import { addLlmHistoryEntry } from './LlmHistory'
import { sendOpenRouterChat } from './OpenRouter'
import { Storage } from './Storage'
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
  systemPrompt?: string
  posts?: any[]
}

type LlmQueueListener = (tasks: LlmPendingTask[]) => void

class LlmQueueService {
  private tasks: LlmPendingTask[] = []
  private listeners: Set<LlmQueueListener> = new Set()
  private completionListeners: Set<(task: LlmPendingTask) => void> = new Set()
  private isInitialized = false

  async init(): Promise<void> {
    if (this.isInitialized) return
    this.isInitialized = true

    try {
      const persisted = await Storage.getLlmPendingTasks()
      if (Array.isArray(persisted) && persisted.length > 0) {
        // Any task that was 'pending' when app was terminated is marked as interrupted
        this.tasks = persisted.map(t => {
          if (t.status === 'pending') {
            return {
              ...t,
              status: 'error',
              error: 'Dotaz byl přerušen ukončením aplikace.',
            }
          }
          return t
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
      await Storage.setLlmPendingTasks(this.tasks)
    } catch (e) {
      console.warn('Failed to persist LlmQueue', e)
    }
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
      systemPrompt: params.systemPrompt,
      posts: params.posts,
      status: 'pending',
    }

    this.tasks = [task, ...this.tasks]
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
      })

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
        durationMs,
        usage: res.usage,
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
            title: 'LLM Asistent odpověděl',
            body: `${task.discussionTitle}: odpověď je připravena v Knihovně`,
            tintColor: '#1E293B',
            icon: 'check-circle',
            onClick: () => {},
          })
        } catch (bannerErr) {
          // Notification banner optional
        }
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Chyba při komunikaci s modelem.'
      this.tasks = this.tasks.map(t =>
        t.id === task.id ? { ...t, status: 'error', error: errorMsg } : t,
      )
      await this.persist()
      this.notify()
    }
  }

  async retryTask(taskId: string): Promise<void> {
    const task = this.tasks.find(t => t.id === taskId)
    if (!task) return

    task.status = 'pending'
    task.error = undefined
    task.startedAt = Date.now()
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
