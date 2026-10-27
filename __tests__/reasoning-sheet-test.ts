import {
  nextReasoningDot,
  reasoningActivityLabel,
  reasoningSheetDrag,
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
  it('follows the handle up and down and stays within the screen', () => {
    expect(reasoningSheetDrag(rest, -120, max)).toBe(600)
    expect(reasoningSheetDrag(rest, 200, max)).toBe(280)
    expect(reasoningSheetDrag(rest, -999, max)).toBe(max)
    expect(reasoningSheetDrag(100, 400, max)).toBe(0)
  })

  it('keeps a mid height, closes when pulled down, and reopens on an upward flick', () => {
    expect(reasoningSheetRelease(500, 0, screen, max, rest)).toEqual({ height: 500, dismiss: false })
    expect(reasoningSheetRelease(80, 0, screen, max, rest)).toEqual({ height: 0, dismiss: true })
    expect(reasoningSheetRelease(500, REASONING_SHEET_DISMISS_VELOCITY + 1, screen, max, rest)).toEqual({
      height: 0,
      dismiss: true,
    })
    expect(reasoningSheetRelease(80, -400, screen, max, rest)).toEqual({ height: rest, dismiss: false })
  })
})
