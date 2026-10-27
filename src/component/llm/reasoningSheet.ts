export function nextReasoningDot(step: number) {
  return step >= 3 ? 1 : step + 1
}

// Trailing spaces keep the word still while the dots grow from one to three.
export function reasoningActivityLabel(title: string, step: number) {
  if (step <= 0) {
    return title
  }
  const dots = Math.max(1, Math.min(3, step))
  return `${title} ${'.'.repeat(dots)}${'\u00a0'.repeat(3 - dots)}`
}

export const REASONING_SHEET_OPEN_RATIO = 0.6
export const REASONING_SHEET_DISMISS_RATIO = 0.18
export const REASONING_SHEET_DISMISS_VELOCITY = 900

export function reasoningSheetDrag(start: number, translationY: number, max: number) {
  return Math.max(0, Math.min(max, start - translationY))
}

// Pulling down shrinks the sheet. A low release or a downward flick closes it.
// An upward flick from a low height returns to the resting size.
export function reasoningSheetRelease(
  height: number,
  velocityY: number,
  screen: number,
  max: number,
  rest: number,
) {
  const dismissBelow = screen * REASONING_SHEET_DISMISS_RATIO
  if (velocityY > REASONING_SHEET_DISMISS_VELOCITY) {
    return { height: 0, dismiss: true }
  }
  if (height < dismissBelow) {
    if (velocityY < -200) {
      return { height: Math.min(max, rest), dismiss: false }
    }
    return { height: 0, dismiss: true }
  }
  return { height: Math.min(max, height), dismiss: false }
}
