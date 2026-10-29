import {
  buildSectionListLayoutMap,
  calculatePopulatedCount,
  groupPostsByDay,
  textReachesEnd,
} from '../src/lib/llmSectionLayout'

describe('llmSectionLayout', () => {
  it('returns an empty array for empty sections', () => {
    const layout = buildSectionListLayoutMap([], 28, 32)
    expect(layout).toEqual([])
  })

  it('builds exact layout for a single section with items', () => {
    const sections = [{ data: [{ id: 1 }, { id: 2 }] }]
    const layout = buildSectionListLayoutMap(sections, 28, 32)

    // Flat structure in VirtualizedSectionList:
    // 0: Header (28)
    // 1: Item 0 (32)
    // 2: Item 1 (32)
    // 3: Footer (0)
    expect(layout).toHaveLength(4)
    expect(layout[0]).toEqual({ length: 28, offset: 0, index: 0 })
    expect(layout[1]).toEqual({ length: 32, offset: 28, index: 1 })
    expect(layout[2]).toEqual({ length: 32, offset: 60, index: 2 })
    expect(layout[3]).toEqual({ length: 0, offset: 92, index: 3 })
  })

  it('builds exact layout for multiple sections with variable item counts', () => {
    const sections = [
      { data: ['a', 'b', 'c'] },
      { data: [] },
      { data: ['d'] },
    ]
    const layout = buildSectionListLayoutMap(sections, 28, 32)

    expect(layout[0]).toEqual({ length: 28, offset: 0, index: 0 })
    expect(layout[1]).toEqual({ length: 32, offset: 28, index: 1 })
    expect(layout[2]).toEqual({ length: 32, offset: 60, index: 2 })
    expect(layout[3]).toEqual({ length: 32, offset: 92, index: 3 })
    expect(layout[4]).toEqual({ length: 0, offset: 124, index: 4 })

    expect(layout[5]).toEqual({ length: 28, offset: 124, index: 5 })
    expect(layout[6]).toEqual({ length: 0, offset: 152, index: 6 })

    expect(layout[7]).toEqual({ length: 28, offset: 152, index: 7 })
    expect(layout[8]).toEqual({ length: 32, offset: 180, index: 8 })
    expect(layout[9]).toEqual({ length: 0, offset: 212, index: 9 })

    expect(layout).toHaveLength(10)
  })

  it('respects custom footerHeight if provided', () => {
    const sections = [{ data: ['x'] }]
    const layout = buildSectionListLayoutMap(sections, 30, 40, 10)

    expect(layout[0]).toEqual({ length: 30, offset: 0, index: 0 })
    expect(layout[1]).toEqual({ length: 40, offset: 30, index: 1 })
    expect(layout[2]).toEqual({ length: 10, offset: 70, index: 2 })
  })

  it('groups posts by day in chronological/given order', () => {
    const byKey = new Map<string, any>([
      ['10', { id: 10, inserted_at: '2026-10-29 14:00' }],
      ['9', { id: 9, inserted_at: '2026-10-29 13:00' }],
      ['8', { id: 8, inserted_at: '2026-10-28 22:00' }],
    ])
    const order = ['10', '9', '8']
    const groups = groupPostsByDay(order, byKey, d => `Date: ${d}`)

    expect(groups).toHaveLength(2)
    expect(groups[0].day).toBe('2026-10-29')
    expect(groups[0].title).toBe('Date: 2026-10-29')
    expect(groups[0].data).toEqual([
      { key: '10', index: 0 },
      { key: '9', index: 1 },
    ])
    expect(groups[1].day).toBe('2026-10-28')
    expect(groups[1].data).toEqual([{ key: '8', index: 2 }])
  })

  it('calculates populated count with chunks as user scrolls down', () => {
    // Initial 100 rows, scroll is at top (offset 0, viewport 800) -> approx row 25 -> needed 85 <= 100 -> stays 100
    expect(calculatePopulatedCount(0, 800, 100)).toBe(100)

    // User scrolls to offset 1600 (approx row 75) -> needed 135 > 100 -> chunks up to 150
    expect(calculatePopulatedCount(1600, 800, 100)).toBe(150)

    // While needed is 145 <= 150 -> stays 150
    expect(calculatePopulatedCount(1900, 800, 150)).toBe(150)

    // When needed reaches 155 > 150 -> chunks up to 200
    expect(calculatePopulatedCount(2250, 800, 150)).toBe(200)
  })

  it('detects when text reaches the end of container', () => {
    expect(textReachesEnd('', '', 0, 100)).toBe(false)
    expect(textReachesEnd('hello world', 'hello...', 60, 100)).toBe(true)
    expect(textReachesEnd('hello world', 'hello world', 99, 100)).toBe(true)
    expect(textReachesEnd('hello world', 'hello world', 50, 100)).toBe(false)
  })
})
