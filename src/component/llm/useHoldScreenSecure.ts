import { useEffect, useRef } from 'react'
import { Dimensions, View } from 'react-native'
import { acquireScreenSecure, subscribeSecureLayout } from '../../lib/screenSecure'

function intersectsScreen(x: number, y: number, width: number, height: number) {
  if (width <= 1 || height <= 1) {
    return false
  }
  const window = Dimensions.get('window')
  return y < window.height && y + height > 0 && x < window.width && x + width > 0
}

// Holds FLAG_SECURE while `enabled` and the attached view is actually on screen.
export function useHoldScreenSecure(enabled: boolean) {
  const ref = useRef<View>(null)
  const releaseRef = useRef<(() => void) | null>(null)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const syncRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!enabled) {
      releaseRef.current?.()
      releaseRef.current = null
      syncRef.current = () => {}
      return
    }
    let alive = true
    const sync = () => {
      const node = ref.current
      if (!alive || !enabledRef.current || !node) {
        return
      }
      node.measureInWindow((x, y, width, height) => {
        if (!alive || !enabledRef.current) {
          return
        }
        const visible = intersectsScreen(x, y, width, height)
        if (visible && !releaseRef.current) {
          releaseRef.current = acquireScreenSecure()
        } else if (!visible && releaseRef.current) {
          releaseRef.current()
          releaseRef.current = null
        }
      })
    }
    syncRef.current = sync
    sync()
    // Expand animates for 150ms. Measure again after it settles, in case the
    // first pass still saw the body off the screen.
    const later = setTimeout(sync, 180)
    const unsub = subscribeSecureLayout(sync)
    return () => {
      alive = false
      clearTimeout(later)
      syncRef.current = () => {}
      unsub()
      releaseRef.current?.()
      releaseRef.current = null
    }
  }, [enabled])

  return {
    ref,
    onLayout: () => syncRef.current(),
  }
}
