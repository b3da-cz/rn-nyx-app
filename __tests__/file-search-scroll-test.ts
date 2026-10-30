import {
  activeMatchLine,
  horizontalShiftForColumn,
  lineScrollOffset,
  matchLineIndex,
  scrollOffsetForWindowTarget,
} from '../src/lib/fileSearchScroll'

describe('formatted search scroll', () => {
  it('finds the line of the active hit inside a block', () => {
    const text = 'alpha\nbeta alpha\nalpha'
    expect(activeMatchLine(text, 'alpha', 0, 0)).toBe(0)
    expect(activeMatchLine(text, 'alpha', 0, 1)).toBe(1)
    expect(activeMatchLine(text, 'alpha', 0, 2)).toBe(2)
    expect(activeMatchLine(text, 'alpha', 4, 5)).toBe(1)
    expect(activeMatchLine(text, 'alpha', 0, 9)).toBe(-1)
    expect(activeMatchLine(text, 'alpha', 0, null)).toBe(-1)
  })

  it('turns a window position into a scroll offset', () => {
    expect(scrollOffsetForWindowTarget(1000, 200, 500, 24)).toBe(1276)
    expect(scrollOffsetForWindowTarget(10, 200, 200, 24)).toBe(0)
  })

  it('keeps a code line two rows under the top', () => {
    expect(lineScrollOffset(0, 18)).toBe(0)
    expect(lineScrollOffset(1, 18)).toBe(0)
    expect(lineScrollOffset(10, 18)).toBe(144)
  })

  it('maps a global hit index onto a source line', () => {
    const lines = [
      { start: 0, count: 0 },
      { start: 0, count: 2 },
      { start: 2, count: 1 },
    ]
    expect(matchLineIndex(lines, 0)).toBe(1)
    expect(matchLineIndex(lines, 2)).toBe(2)
    expect(matchLineIndex(lines, 3)).toBe(-1)
  })

  it('pans a code column into the visible strip', () => {
    expect(horizontalShiftForColumn(2, 8, -400)).toBe(0)
    expect(horizontalShiftForColumn(40, 8, -400)).toBe(-296)
    expect(horizontalShiftForColumn(80, 8, -400)).toBe(-400)
  })
})