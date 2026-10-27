/** How far from the bottom still counts as watching the end of the answer. */
export const ANSWER_BOTTOM_SLACK = 64

export type LlmAnswerPhase = 'idle' | 'streaming' | 'holding'

export function distanceFromAnswerEnd(offsetY: number, viewport: number, contentHeight: number) {
  return contentHeight - (offsetY + viewport)
}

export function isNearAnswerEnd(offsetY: number, viewport: number, contentHeight: number) {
  if (viewport <= 0) {
    return true
  }
  return distanceFromAnswerEnd(offsetY, viewport, contentHeight) <= ANSWER_BOTTOM_SLACK
}

/**
 * Follow stays on while the reader is at the end. A small scroll upward, past
 * the slack, turns it off. Scrolling back to the end turns it on. Offset
 * changes that are not a finger or a fling leave the flag as it was.
 */
export function followAfterUserScroll(
  offsetY: number,
  viewport: number,
  contentHeight: number,
  userGesture: boolean,
  follow: boolean,
) {
  if (!userGesture) {
    return follow
  }
  return isNearAnswerEnd(offsetY, viewport, contentHeight)
}

/**
 * A completion banner, or a collapsing answer, can clamp the list to the top
 * without a gesture. A real scroll to the top passes through the offsets above.
 */
export function isUnwantedTopJump(
  offsetY: number,
  previousOffsetY: number,
  viewport: number,
  contentHeight: number,
  userGesture: boolean,
) {
  if (userGesture || offsetY > 1 || previousOffsetY < 80) {
    return false
  }
  return contentHeight > viewport + 80
}
