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
  const resized = screenHeight - windowHeight > Math.max(80, reported * 0.45)
  if (typeof screenY === 'number' && screenY > 0 && containerHeight > 0) {
    const overlap = containerY + containerHeight - screenY
    if (overlap > 1) {
      // Never lift by the whole container: a bad screenY must not park the dialog off screen.
      return Math.round(Math.min(overlap, Math.max(0, containerHeight - 120)))
    }
    // Container already ends on the keyboard, or only a nav/tab inset remains.
    // A small negative value pulls the dialog down onto the keys.
    if (overlap >= -72) {
      return Math.round(Math.min(0, overlap))
    }
    if (resized) {
      return 0
    }
    return Math.round(Math.min(reported, Math.max(0, containerHeight - 120)))
  }
  if (resized) {
    return 0
  }
  return Math.round(Math.min(reported, Math.max(0, windowHeight * 0.55)))
}
