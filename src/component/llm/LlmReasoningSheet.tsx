import React, { useEffect, useMemo, useRef } from 'react'
import { Animated, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector, GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { splitStreamMarkdown, t, useTheme } from '../../lib'
import { androidStackBottomInset } from '../FabComponent'
import { LlmAnswerBody } from './LlmAnswerBody'
import { reasoningSheetHeightFromFinger, reasoningSheetOpenRatio, reasoningSheetRelease } from './reasoningSheet'

type Props = {
  visible: boolean
  text: string
  streaming?: boolean
  copyLocked?: boolean
  onClose: () => void
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
}

export const LlmReasoningSheet = ({
  visible,
  text,
  streaming,
  copyLocked,
  onClose,
  onNavigateToPost,
}: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const { height: windowHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const max = Math.max(240, windowHeight - insets.top - 8)
  const rest = Math.min(max, Math.round(windowHeight * reasoningSheetOpenRatio()))
  const height = useRef(new Animated.Value(0)).current
  const heightRef = useRef(0)
  const grabOffset = useRef<number | null>(null)
  const session = useRef(0)
  const onCloseRef = useRef(onClose)
  const metrics = useRef({ max, rest, windowHeight })
  onCloseRef.current = onClose
  metrics.current = { max, rest, windowHeight }
  const parts = streaming ? splitStreamMarkdown(text) : { stable: text, pending: '' }
  const bottomPad = Math.max(insets.bottom, androidStackBottomInset, blocks.medium)

  useEffect(() => {
    const id = height.addListener(({ value }) => {
      heightRef.current = value
    })
    return () => height.removeListener(id)
  }, [height])

  useEffect(() => {
    if (!visible) {
      return
    }
    session.current += 1
    height.stopAnimation()
    height.setValue(0)
    Animated.timing(height, {
      toValue: rest,
      duration: 220,
      useNativeDriver: false,
    }).start()
    return () => height.stopAnimation()
  }, [visible, rest, height])

  const requestClose = () => {
    const id = session.current
    height.stopAnimation()
    Animated.timing(height, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && id === session.current) {
        onCloseRef.current()
      }
    })
  }

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .onStart(event => {
          height.stopAnimation(value => {
            const current = value > 1 ? value : metrics.current.rest
            heightRef.current = current
            grabOffset.current = event.absoluteY - (metrics.current.windowHeight - current)
          })
        })
        .onUpdate(event => {
          if (grabOffset.current == null) {
            return
          }
          const next = reasoningSheetHeightFromFinger(
            event.absoluteY,
            grabOffset.current,
            metrics.current.windowHeight,
            metrics.current.max,
          )
          heightRef.current = next
          height.setValue(next)
        })
        .onEnd(event => {
          grabOffset.current = null
          const { max: cap, rest: open, windowHeight: screen } = metrics.current
          const next = heightRef.current
          const released = reasoningSheetRelease(next, event.velocityY, screen, cap, open)
          if (released.dismiss) {
            const id = session.current
            height.stopAnimation()
            Animated.timing(height, {
              toValue: 0,
              duration: 180,
              useNativeDriver: false,
            }).start(({ finished }) => {
              if (finished && id === session.current) {
                onCloseRef.current()
              }
            })
            return
          }
          Animated.timing(height, {
            toValue: released.height,
            duration: 140,
            useNativeDriver: false,
          }).start()
        })
        .onFinalize(() => {
          grabOffset.current = null
        }),
    [height],
  )

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={requestClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable onPress={requestClose} style={[StyleSheet.absoluteFill, { backgroundColor: '#00000066' }]} />
          <Animated.View
            style={{
              height,
              width: '100%',
              backgroundColor: colors.background,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              overflow: 'hidden',
              zIndex: 2,
              elevation: 8,
            }}>
            <GestureDetector gesture={pan}>
              <View>
                <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 8 }}>
                  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.disabled }} />
                </View>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: fontSizes.h2,
                    paddingHorizontal: blocks.medium,
                    paddingBottom: blocks.small,
                  }}>
                  {t('llm.reasoning')}
                </Text>
              </View>
            </GestureDetector>
            <ScrollView
              style={{ flex: 1, minHeight: 0 }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: bottomPad }}>
              <LlmAnswerBody
                content={parts.stable}
                pending={parts.pending}
                copyLocked={copyLocked}
                onNavigateToPost={onNavigateToPost}
              />
            </ScrollView>
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  )
}
