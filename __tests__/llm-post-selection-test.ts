import {
  initialLlmRangeSelection,
  isContextLengthError,
  llmPostDay,
  llmPostOrder,
  parseContextErrorLimits,
  pressLlmRange,
  syncLlmSelection,
  toggleLlmRangePost,
  trimPostsToContext,
} from '../src/lib/llmPostSelection'

const order = ['a', 'b', 'c', 'd', 'e', 'f']

describe('llm post selection', () => {
  it('orders posts newest first', () => {
    const posts = [
      { id: 10, inserted_at: '2026-10-28 10:00:00' },
      { id: 12, inserted_at: '2026-10-29 09:00:00' },
      { id: 11, inserted_at: '2026-10-28 11:00:00' },
    ]
    expect(llmPostOrder(posts)).toEqual(['12', '11', '10'])
  })

  it('orders posts newest first by timestamp when IDs are not numeric', () => {
    const posts = [
      { id: 'a', inserted_at: '2026-10-27 10:00:00' },
      { id: 'b', inserted_at: '2026-10-29 10:00:00' },
      { id: 'c', inserted_at: '2026-10-28 10:00:00' },
    ]
    expect(llmPostOrder(posts)).toEqual(['b', 'c', 'a'])
  })

  it('deduplicates and skips posts without valid IDs', () => {
    const posts = [
      { id: 1, inserted_at: '2026-10-28 10:00:00' },
      { id: null },
      { id: 2, inserted_at: '2026-10-28 11:00:00' },
      { id: 2, inserted_at: '2026-10-28 11:00:00' },
    ]
    expect(llmPostOrder(posts)).toEqual(['2', '1'])
  })

  it('reads the calendar day from loaded post timestamps', () => {
    expect(llmPostDay({ inserted_at: '2026-10-04T22:15:00.000Z' })).toBe('2026-10-04')
    expect(llmPostDay({ inserted_at: '2026-10-01 08:00:00' })).toBe('2026-10-01')
    expect(llmPostDay({ content: 'bez data' })).toBe('')
  })

  it('moves the start in the upper half and the end in the lower half', () => {
    const all = initialLlmRangeSelection(order)
    const endMoved = pressLlmRange(all, 4)
    expect(endMoved.start).toBe(0)
    expect(endMoved.end).toBe(4)
    expect(endMoved.picked).toEqual(['a', 'b', 'c', 'd', 'e'])

    const startMoved = pressLlmRange(endMoved, 2)
    expect(startMoved.start).toBe(2)
    expect(startMoved.end).toBe(4)
    expect(startMoved.picked).toEqual(['c', 'd', 'e'])
  })

  it('keeps holes inside the range and includes every post that enters from outside', () => {
    let selection = pressLlmRange(initialLlmRangeSelection(order), 4)
    selection = pressLlmRange(selection, 2)
    selection = toggleLlmRangePost(selection, 3)
    expect(selection.picked).toEqual(['c', 'e'])

    const expanded = pressLlmRange(selection, 5)
    expect(expanded.start).toBe(2)
    expect(expanded.end).toBe(5)
    expect(expanded.picked).toEqual(['c', 'e', 'f'])

    const widened = pressLlmRange(expanded, 0)
    expect(widened.start).toBe(0)
    expect(widened.end).toBe(5)
    expect(widened.picked).toEqual(['a', 'b', 'c', 'e', 'f'])
  })

  it('checkbox outside the range selects only that post', () => {
    let selection = pressLlmRange(initialLlmRangeSelection(order), 4)
    selection = pressLlmRange(selection, 2)
    const checked = toggleLlmRangePost(selection, 0)
    expect(checked.start).toBe(2)
    expect(checked.end).toBe(4)
    expect(checked.picked).toEqual(['a', 'c', 'd', 'e'])
    const expanded = pressLlmRange(checked, 5)
    expect(expanded.end).toBe(5)
    expect(expanded.picked).toEqual(['a', 'c', 'd', 'e', 'f'])
    expect(toggleLlmRangePost(checked, 0).picked).toEqual(['c', 'd', 'e'])
  })

  it('drops posts that leave the date range and keeps a full selection on the rest', () => {
    const all = initialLlmRangeSelection(order)
    const narrowed = syncLlmSelection(all, ['e', 'f'])
    expect(narrowed).toEqual({ order: ['e', 'f'], start: 0, end: 1, picked: ['e', 'f'] })
  })

  it('keeps an unchecked post when the range still covers it after posts outside it disappear', () => {
    let selection = pressLlmRange(initialLlmRangeSelection(order), 4)
    selection = pressLlmRange(selection, 1)
    selection = toggleLlmRangePost(selection, 2)
    const next = syncLlmSelection(selection, ['b', 'c', 'd', 'e'])
    expect(next.start).toBe(0)
    expect(next.end).toBe(3)
    expect(next.picked).toEqual(['b', 'd', 'e'])
  })

  it('detects context length errors accurately', () => {
    const errorFromScreenshot =
      "This model's maximum context length is 131072 tokens. However, you requested 16384 output tokens and your prompt contains at least 114689 input tokens, for a total of at least 131073 tokens. Please reduce the length of the input prompt or the number of requested output tokens. (parameter=input_tokens, value=114689)"
    expect(isContextLengthError(errorFromScreenshot)).toBe(true)
    expect(isContextLengthError('context_length_exceeded')).toBe(true)
    expect(isContextLengthError('Rate limit exceeded: 20 rpm')).toBe(false)
    expect(isContextLengthError('Chyba při komunikaci s modelem (500).')).toBe(false)
    expect(isContextLengthError('')).toBe(false)
    expect(isContextLengthError(undefined)).toBe(false)
  })

  it('parses context error limits from error message', () => {
    const errorFromScreenshot =
      "This model's maximum context length is 131072 tokens. However, you requested 16384 output tokens and your prompt contains at least 114689 input tokens, for a total of at least 131073 tokens. Please reduce the length of the input prompt or the number of requested output tokens. (parameter=input_tokens, value=114689)"
    const limits = parseContextErrorLimits(errorFromScreenshot)
    expect(limits.maxContext).toBe(131072)
    expect(limits.outputTokens).toBe(16384)
    expect(limits.inputTokens).toBe(114689)
    expect(limits.totalTokens).toBe(131073)
  })

  it('trims older posts so that request fits into context, keeping newest posts', () => {
    const posts = [
      { id: 1, inserted_at: '2026-10-22 10:00:00', content: 'A'.repeat(500) },
      { id: 2, inserted_at: '2026-10-23 10:00:00', content: 'B'.repeat(500) },
      { id: 3, inserted_at: '2026-10-24 10:00:00', content: 'C'.repeat(500) },
      { id: 4, inserted_at: '2026-10-25 10:00:00', content: 'D'.repeat(500) },
    ]
    const error =
      "This model's maximum context length is 1000 tokens. However, you requested 200 output tokens and your prompt contains at least 1200 input tokens."
    const res = trimPostsToContext({ posts, error, prompt: 'Shrnutí diskuze' })

    expect(res.trimmedCount).toBeGreaterThan(0)
    expect(res.posts.length).toBeLessThan(posts.length)
    expect(res.posts.some(p => p.id === 4)).toBe(true)
    expect(res.posts[res.posts.length - 1].id).toBe(4)
    expect(res.dateFrom).toBe(llmPostDay(res.posts[0]))
    expect(res.dateTo).toBe('2026-10-25')
  })
})
