export type KeyboardFrame = {
  screenY?: number
  height?: number
}

// How far a bottom-anchored dialog must move (positive = up) so its bottom
// meets the keyboard. `screenY` is the keyboard top in screen coordinates.
// Android reports `height` from IME insets, which on some phones is the whole
// screen until a rotation, and `adjustResize` may already have shrunk the
// window — using that height as a bottom offset pushes the dialog off screen
// or leaves it floating above the keys.
export const keyboardLift = ({
  containerY,
  containerHeight,
  windowHeight,
  screenHeight,
  frame,
}: {
  containerY: number
  containerHeight: number
  windowHeight: number
  screenHeight: number
  frame?: KeyboardFrame | null
}): number => {
  const reported = Math.max(0, frame?.height ?? 0)
  const screenY = frame?.screenY
  const cap = Math.max(0, (containerHeight > 0 ? containerHeight : windowHeight) - 120)
  const shrunkBy = Math.max(0, screenHeight - windowHeight)
  if (typeof screenY === 'number' && screenY > 0 && containerHeight > 0) {
    const containerBottom = containerY + containerHeight
    const overlap = containerBottom - screenY
    if (overlap > 1) {
      // Never lift by the whole container: a bad screenY must not park the dialog off screen.
      return Math.round(Math.min(overlap, cap))
    }
    // Modal stays full-screen while the activity window shrinks, and screenY
    // still sits on the container bottom. The dialog then stays under the
    // keyboard with only a strip visible. Shift it up by the covered amount.
    if (containerBottom > windowHeight + 40 && (reported > 80 || shrunkBy > 80)) {
      return Math.round(Math.min(Math.max(reported, shrunkBy), cap))
    }
    // Container already ends on the keyboard. Do not pull the dialog down:
    // a negative offset tucks the action-icon row behind the keys.
    if (overlap >= -72) {
      return 0
    }
  }
  if (shrunkBy > 80) {
    return 0
  }
  return Math.round(Math.min(reported, cap || windowHeight * 0.55))
}
