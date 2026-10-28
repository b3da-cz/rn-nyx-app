import {
  initialLlmRangeSelection,
  llmPostDay,
  pressLlmRange,
  syncLlmSelection,
  toggleLlmRangePost,
} from '../src/lib/llmPostSelection'

const order = ['a', 'b', 'c', 'd', 'e', 'f']

describe('llm post selection', () => {
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
})
