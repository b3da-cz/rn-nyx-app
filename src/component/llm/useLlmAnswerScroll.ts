import { useCallback, useEffect, useRef } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native'
import { followAfterUserScroll, isUnwantedTopJump, LlmAnswerPhase } from './llmAnswerScroll'

type Metrics = { offsetY: number; viewport: number; contentHeight: number }

const SETTLE_DELAYS = [0, 80, 250, 700]

export function useLlmAnswerScroll(scrollRef: { current: ScrollView | null }) {
  const followRef = useRef(false)
  const phaseRef = useRef<LlmAnswerPhase>('idle')
  const gestureRef = useRef(false)
  const pinnedOffset = useRef(0)
  const metrics = useRef<Metrics>({ offsetY: 0, viewport: 0, contentHeight: 0 })
  const suppressRestore = useRef(false)
  const settleTimers = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const gestureTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSettle = useCallback(() => {
    settleTimers.current.forEach(clearTimeout)
    settleTimers.current = []
  }, [])

  useEffect(() => {
    return () => {
      clearSettle()
      if (gestureTimer.current) {
        clearTimeout(gestureTimer.current)
      }
      if (suppressTimer.current) {
        clearTimeout(suppressTimer.current)
      }
    }
  }, [clearSettle])

  const scrollToEnd = useCallback(() => {
    if (!followRef.current || gestureRef.current) {
      return
    }
    scrollRef.current?.scrollToEnd({ animated: false })
  }, [scrollRef])

  const restoreReadingOffset = useCallback(() => {
    if (gestureRef.current || suppressRestore.current) {
      return
    }
    const { viewport, contentHeight } = metrics.current
    const y = followRef.current ? Math.max(0, contentHeight - viewport) : pinnedOffset.current
    if (y <= 1) {
      return
    }
    scrollRef.current?.scrollTo({ y, animated: false })
  }, [scrollRef])

  const scheduleSettle = useCallback(() => {
    clearSettle()
    SETTLE_DELAYS.forEach(delay => {
      const timer = setTimeout(() => {
        if (gestureRef.current || suppressRestore.current) {
          return
        }
        if (followRef.current) {
          scrollRef.current?.scrollToEnd({ animated: false })
          return
        }
        const { offsetY, viewport, contentHeight } = metrics.current
        if (offsetY <= 1 && pinnedOffset.current > 80 && contentHeight > viewport + 80) {
          scrollRef.current?.scrollTo({ y: pinnedOffset.current, animated: false })
        }
      }, delay)
      settleTimers.current.push(timer)
    })
  }, [clearSettle, scrollRef])

  const onAnswerPhase = useCallback(
    (phase: LlmAnswerPhase) => {
      const prev = phaseRef.current
      phaseRef.current = phase
      if (phase === 'streaming' && prev !== 'streaming') {
        followRef.current = true
        clearSettle()
        requestAnimationFrame(() => scrollToEnd())
      }
      if (phase === 'idle' && prev !== 'idle') {
        scheduleSettle()
      }
    },
    [clearSettle, scheduleSettle, scrollToEnd],
  )

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      metrics.current.contentHeight = height
      if (gestureRef.current) {
        return
      }
      const phase = phaseRef.current
      if (followRef.current && (phase === 'streaming' || phase === 'holding')) {
        scrollRef.current?.scrollToEnd({ animated: false })
        return
      }
      if (
        !suppressRestore.current &&
        !followRef.current &&
        metrics.current.offsetY <= 1 &&
        pinnedOffset.current > 80 &&
        height > metrics.current.viewport + 80
      ) {
        scrollRef.current?.scrollTo({ y: pinnedOffset.current, animated: false })
      }
    },
    [scrollRef],
  )

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent
      const offsetY = contentOffset.y
      const viewport = layoutMeasurement.height
      const contentHeight = contentSize.height
      const previousOffsetY = metrics.current.offsetY
      const userGesture = gestureRef.current

      if (
        !suppressRestore.current &&
        isUnwantedTopJump(offsetY, previousOffsetY, viewport, contentHeight, userGesture)
      ) {
        metrics.current = { offsetY: previousOffsetY, viewport, contentHeight }
        restoreReadingOffset()
        return
      }

      metrics.current = { offsetY, viewport, contentHeight }
      followRef.current = followAfterUserScroll(offsetY, viewport, contentHeight, userGesture, followRef.current)
      if (userGesture) {
        pinnedOffset.current = offsetY
        if (!followRef.current) {
          clearSettle()
        }
      }
    },
    [clearSettle, restoreReadingOffset],
  )

  const beginGesture = useCallback(() => {
    if (gestureTimer.current) {
      clearTimeout(gestureTimer.current)
      gestureTimer.current = null
    }
    gestureRef.current = true
  }, [])

  const catchUpAfterGesture = useCallback(() => {
    const phase = phaseRef.current
    if (!followRef.current || (phase !== 'streaming' && phase !== 'holding')) {
      return
    }
    scrollRef.current?.scrollToEnd({ animated: false })
  }, [scrollRef])

  const endGestureSoon = useCallback(() => {
    if (gestureTimer.current) {
      clearTimeout(gestureTimer.current)
    }
    gestureTimer.current = setTimeout(() => {
      gestureTimer.current = null
      gestureRef.current = false
      catchUpAfterGesture()
    }, 80)
  }, [catchUpAfterGesture])

  const markIntentionalScroll = useCallback(() => {
    suppressRestore.current = true
    if (suppressTimer.current) {
      clearTimeout(suppressTimer.current)
    }
    suppressTimer.current = setTimeout(() => {
      suppressTimer.current = null
      suppressRestore.current = false
    }, 500)
  }, [])

  return {
    onAnswerPhase,
    onScroll,
    onContentSizeChange,
    onScrollBeginDrag: beginGesture,
    onMomentumScrollBegin: beginGesture,
    onMomentumScrollEnd: () => {
      if (gestureTimer.current) {
        clearTimeout(gestureTimer.current)
        gestureTimer.current = null
      }
      gestureRef.current = false
      catchUpAfterGesture()
    },
    onScrollEndDrag: endGestureSoon,
    markIntentionalScroll,
  }
}
