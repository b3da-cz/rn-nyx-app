import {
  getLlmHistory,
  addLlmHistoryEntry,
  deleteLlmHistoryEntry,
  clearLlmHistory,
} from '../src/lib/LlmHistory'

jest.mock('../src/lib/Storage', () => {
  let mockStore: any[] = []
  return {
    Storage: {
      getLlmHistory: jest.fn(async () => [...mockStore]),
      setLlmHistory: jest.fn(async (history: any[]) => {
        mockStore = [...history]
      }),
    },
  }
})

describe('LlmHistory tests', () => {
  beforeEach(async () => {
    await clearLlmHistory()
  })

  it('starts with empty history', async () => {
    const history = await getLlmHistory()
    expect(history).toEqual([])
  })

  it('adds an entry and sets id, createdAt, and newest first', async () => {
    const item1 = await addLlmHistoryEntry({
      discussionId: 10,
      discussionTitle: 'Klub 1',
      modelId: 'google/gemini-2.5-flash',
      modelName: 'Gemini 2.5 Flash',
      postCount: 5,
      prompt: 'Shrň diskuzi',
      response: 'Souhrn diskuze...',
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    })

    expect(item1.id).toBeDefined()
    expect(item1.createdAt).toBeDefined()
    expect(item1.prompt).toBe('Shrň diskuzi')
    expect(item1.usage?.total_tokens).toBe(150)

    const item2 = await addLlmHistoryEntry({
      discussionId: 20,
      discussionTitle: 'Klub 2',
      modelId: 'anthropic/claude-3.5-haiku',
      postCount: 2,
      prompt: 'Druhý dotaz',
      response: 'Druhá odpověď...',
    })

    const list = await getLlmHistory()
    expect(list.length).toBe(2)
    expect(list[0].id).toBe(item2.id)
    expect(list[1].id).toBe(item1.id)
  })

  it('deletes an entry by id', async () => {
    const item1 = await addLlmHistoryEntry({
      discussionId: 10,
      discussionTitle: 'Klub 1',
      modelId: 'm1',
      postCount: 1,
      prompt: 'p1',
      response: 'r1',
    })
    const item2 = await addLlmHistoryEntry({
      discussionId: 20,
      discussionTitle: 'Klub 2',
      modelId: 'm2',
      postCount: 2,
      prompt: 'p2',
      response: 'r2',
    })

    const remaining = await deleteLlmHistoryEntry(item1.id)
    expect(remaining.length).toBe(1)
    expect(remaining[0].id).toBe(item2.id)

    const list = await getLlmHistory()
    expect(list.length).toBe(1)
    expect(list[0].id).toBe(item2.id)
  })

  it('clears all history entries', async () => {
    await addLlmHistoryEntry({
      discussionId: 10,
      discussionTitle: 'Klub 1',
      modelId: 'm1',
      postCount: 1,
      prompt: 'p1',
      response: 'r1',
    })
    await clearLlmHistory()
    const list = await getLlmHistory()
    expect(list).toEqual([])
  })
})
