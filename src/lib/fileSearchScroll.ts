import { searchMatchRanges } from './discussionRights'

// Line of the active hit inside one rendered string. -1 when this string does not contain it.
export function activeMatchLine(
  text: string,
  query: string,
  matchOffset: number,
  activeIndex: number | null,
): number {
  if (activeIndex == null) {
    return -1
  }
  const range = searchMatchRanges(text, query)[activeIndex - matchOffset]
  if (!range) {
    return -1
  }
  return text.slice(0, range[0]).split('\n').length - 1
}

// screen Y of the hit → content offset that places it `margin` px under the top of the scroll view.
export function scrollOffsetForWindowTarget(
  scrollOffset: number,
  viewportTop: number,
  targetTop: number,
  margin: number,
): number {
  return Math.max(0, scrollOffset + targetTop - viewportTop - margin)
}

export function lineScrollOffset(line: number, lineHeight: number): number {
  return Math.max(0, Math.round(line * lineHeight - lineHeight * 2))
}

export function matchLineIndex(lines: Array<{ start: number; count: number }>, activeIndex: number): number {
  return lines.findIndex(item => item.count > 0 && activeIndex >= item.start && activeIndex < item.start + item.count)
}

// translateX that brings a monospace column in from the left edge. Clamped to the pannable range.
export function horizontalShiftForColumn(column: number, charWidth: number, minShift: number): number {
  return Math.min(0, Math.max(minShift, Math.round(24 - column * charWidth)))
}
