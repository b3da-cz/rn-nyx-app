import { LlmQueue } from '../src/lib/LlmQueue'
import { Storage } from '../src/lib/Storage'

jest.mock('../src/lib/Storage', () => {
  let mockHistory: any[] = []
  let mockPendingTasks: any[] = []
  return {
    Storage: {
      getLlmHistory: jest.fn(async () => [...mockHistory]),
      setLlmHistory: jest.fn(async (history: any[]) => {
        mockHistory = [...history]
      }),
      getLlmPendingTasks: jest.fn(async () => [...mockPendingTasks]),
      setLlmPendingTasks: jest.fn(async (tasks: any[]) => {
        mockPendingTasks = [...tasks]
      }),
    },
  }
})

jest.mock('../src/lib/Util', () => ({
  showNotificationBanner: jest.fn(),
}))

jest.mock('../src/lib/OpenRouter', () => {
  const actual = jest.requireActual('../src/lib/OpenRouter')
  return {
    ...actual,
    sendOpenRouterChat: jest.fn(async () => {
      return {
        content: 'Mock odpověď z backgroundu',
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        model: 'google/gemini-2.5-flash',
      }
    }),
  }
})

describe('LlmQueue tests', () => {
  it('enqueues task and updates listeners', async () => {
    let capturedTasks: any[] = []
    const unsubscribe = LlmQueue.subscribe(tasks => {
      capturedTasks = tasks
    })

    const taskId = await LlmQueue.enqueueTask({
      apiKey: 'test-key',
      modelId: 'google/gemini-2.5-flash',
      modelName: 'Gemini 2.5 Flash',
      userPrompt: 'Ahoj, jak se máš?',
      discussionId: 123,
      discussionTitle: 'Test diskuze',
      posts: [
        { id: 1, inserted_at: '2026-10-04 12:00:00', text: 'Prispevek 1', username: 'pepa' },
      ],
      postCount: 1,
    })

    expect(taskId).toBeDefined()
    expect(taskId.startsWith('llm-task-')).toBe(true)

    // Wait for background execution to complete
    await new Promise(resolve => setTimeout(resolve, 50))

    // After completion, task is removed from queue
    expect(LlmQueue.getPendingTasks().find(t => t.id === taskId)).toBeUndefined()

    // History should have been called
    expect(Storage.setLlmHistory).toHaveBeenCalled()

    unsubscribe()
  })

  it('handles error in execution gracefully', async () => {
    const { sendOpenRouterChat } = require('../src/lib/OpenRouter')
    sendOpenRouterChat.mockImplementationOnce(async () => {
      throw new Error('Chyba spojení s API')
    })

    const taskId = await LlmQueue.enqueueTask({
      apiKey: 'test-key',
      modelId: 'google/gemini-2.5-flash',
      userPrompt: 'Dotaz k chybě',
      discussionId: 456,
      discussionTitle: 'Chybová diskuze',
      posts: [{ id: 2, inserted_at: '2026-10-04 12:00:00', text: 'Text', username: 'karel' }],
      postCount: 1,
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const erroredTask = LlmQueue.getPendingTasks().find(t => t.id === taskId)
    expect(erroredTask).toBeDefined()
    expect(erroredTask?.status).toBe('error')
    expect(erroredTask?.error).toBe('Chyba spojení s API')

    // Can dismiss task
    await LlmQueue.dismissTask(taskId)
    expect(LlmQueue.getPendingTasks().find(t => t.id === taskId)).toBeUndefined()
  })

  it('marks pending tasks as interrupted on init if left in storage', async () => {
    (Storage.getLlmPendingTasks as jest.Mock).mockResolvedValueOnce([
      {
        id: 'old-task-1',
        startedAt: Date.now() - 60000,
        discussionId: 999,
        discussionTitle: 'Nedokončená',
        modelId: 'test-model',
        prompt: 'Nějaký prompt',
        status: 'pending',
      },
    ])

    // Force re-init by calling private init
    // @ts-ignore
    LlmQueue.isInitialized = false
    await LlmQueue.init()

    const restored = LlmQueue.getPendingTasks().find(t => t.id === 'old-task-1')
    expect(restored).toBeDefined()
    expect(restored?.status).toBe('error')
    expect(restored?.error).toContain('ukončením aplikace')

    // Cleanup
    await LlmQueue.dismissTask('old-task-1')
  })
})
