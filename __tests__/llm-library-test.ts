import { LlmHistoryItem } from '../src/lib'
import { ScopeFilter, SortOrder } from '../src/component/llm'

// Pure filter and sort helper function mirroring LlmLibraryTab's logic
export function filterAndSortHistory(
  history: LlmHistoryItem[],
  scope: ScopeFilter,
  activeDiscussionId?: number | string,
  search = '',
  sort: SortOrder = 'newest',
): LlmHistoryItem[] {
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
}

describe('LlmLibrary filtering and sorting', () => {
  const mockHistory: LlmHistoryItem[] = [
    {
      id: '1',
      createdAt: '2026-10-04 10:00:00',
      discussionId: 100,
      discussionTitle: 'Klub A - TypeScript',
      modelId: 'anthropic/claude-3.5-sonnet',
      modelName: 'Claude 3.5 Sonnet',
      postCount: 15,
      prompt: 'Shrň novinky v TS',
      response: 'Nové featury v TypeScriptu 5...',
      durationMs: 3500,
    },
    {
      id: '2',
      createdAt: '2026-10-04 12:00:00',
      discussionId: 200,
      discussionTitle: 'Klub B - React Native',
      modelId: 'google/gemini-2.5-flash',
      modelName: 'Gemini 2.5 Flash',
      postCount: 30,
      prompt: 'Jak fungují animace?',
      response: 'Použijte Reanimated 3...',
      durationMs: 1200,
    },
    {
      id: '3',
      createdAt: '2026-10-04 14:00:00',
      discussionId: 100,
      discussionTitle: 'Klub A - TypeScript',
      modelId: 'openai/gpt-4o',
      modelName: 'GPT-4o',
      postCount: 5,
      prompt: 'Kdo co psal včera?',
      response: 'Uživatel @foo napsal...',
      durationMs: 4800,
    },
  ]

  it('filters by active discussion in discussion scope', () => {
    const result = filterAndSortHistory(mockHistory, 'discussion', 100)
    expect(result.length).toBe(2)
    expect(result.every(item => item.discussionId === 100)).toBe(true)
  })

  it('returns all items in all scope even when activeDiscussionId is provided', () => {
    const result = filterAndSortHistory(mockHistory, 'all', 100)
    expect(result.length).toBe(3)
  })

  it('filters by search term in prompt, response, title, model', () => {
    // Search in prompt
    let res = filterAndSortHistory(mockHistory, 'all', undefined, 'animace')
    expect(res.length).toBe(1)
    expect(res[0].id).toBe('2')

    // Search in response
    res = filterAndSortHistory(mockHistory, 'all', undefined, 'Reanimated')
    expect(res.length).toBe(1)
    expect(res[0].id).toBe('2')

    // Search in title
    res = filterAndSortHistory(mockHistory, 'all', undefined, 'TypeScript')
    expect(res.length).toBe(2)

    // Search in modelName
    res = filterAndSortHistory(mockHistory, 'all', undefined, 'Gemini')
    expect(res.length).toBe(1)
    expect(res[0].id).toBe('2')
  })

  it('sorts correctly: newest, oldest, discussion, duration', () => {
    // Newest first (descending by createdAt)
    let res = filterAndSortHistory(mockHistory, 'all', undefined, '', 'newest')
    expect(res.map(i => i.id)).toEqual(['3', '2', '1'])

    // Oldest first (ascending by createdAt)
    res = filterAndSortHistory(mockHistory, 'all', undefined, '', 'oldest')
    expect(res.map(i => i.id)).toEqual(['1', '2', '3'])

    // By discussion title
    res = filterAndSortHistory(mockHistory, 'all', undefined, '', 'discussion')
    expect(res[0].discussionTitle).toBe('Klub A - TypeScript')
    expect(res[2].discussionTitle).toBe('Klub B - React Native')

    // By duration (descending)
    res = filterAndSortHistory(mockHistory, 'all', undefined, '', 'duration')
    expect(res.map(i => i.id)).toEqual(['3', '1', '2'])
  })
})
