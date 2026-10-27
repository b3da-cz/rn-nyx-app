import {
  nextReasoningDot,
  reasoningActivityLabel,
  reasoningSheetHeightFromFinger,
  reasoningSheetOpenRatio,
  reasoningSheetRelease,
  REASONING_SHEET_DISMISS_VELOCITY,
} from '../src/component/llm/reasoningSheet'

const screen = 800
const max = 740
const rest = 480

describe('reasoning button dots', () => {
  it('grows from one dot to three and keeps the word in place', () => {
    expect(nextReasoningDot(1)).toBe(2)
    expect(nextReasoningDot(2)).toBe(3)
    expect(nextReasoningDot(3)).toBe(1)
    expect(reasoningActivityLabel('Úvaha', 0)).toBe('Úvaha')
    const one = reasoningActivityLabel('Úvaha', 1)
    const three = reasoningActivityLabel('Úvaha', 3)
    expect(one.startsWith('Úvaha .')).toBe(true)
    expect(three.endsWith('...')).toBe(true)
    expect(one.length).toBe(three.length)
  })
})

describe('reasoning sheet drag', () => {
  it('opens a bit into the free space above the old height', () => {
    expect(reasoningSheetOpenRatio()).toBeCloseTo(0.68)
  })

  it('keeps the handle under the finger instead of jumping to the bottom edge', () => {
    const height = 544
    const grabOffset = 12
    const finger = screen - height + grabOffset
    expect(reasoningSheetHeightFromFinger(finger, grabOffset, screen, max)).toBe(height)
    expect(reasoningSheetHeightFromFinger(finger + 8, grabOffset, screen, max)).toBe(height - 8)
    expect(reasoningSheetHeightFromFinger(finger - 40, grabOffset, screen, max)).toBe(height + 40)
  })

  it('keeps a mid height, closes when pulled down, and ignores a tiny flick at the top', () => {
    expect(reasoningSheetRelease(500, 0, screen, max, rest)).toEqual({ height: 500, dismiss: false })
    expect(reasoningSheetRelease(500, REASONING_SHEET_DISMISS_VELOCITY + 1, screen, max, rest)).toEqual({
      height: 500,
      dismiss: false,
    })
    expect(reasoningSheetRelease(200, REASONING_SHEET_DISMISS_VELOCITY + 1, screen, max, rest)).toEqual({
      height: 0,
      dismiss: true,
    })
    expect(reasoningSheetRelease(80, 0, screen, max, rest)).toEqual({ height: 0, dismiss: true })
    expect(reasoningSheetRelease(80, -400, screen, max, rest)).toEqual({ height: rest, dismiss: false })
  })
})
