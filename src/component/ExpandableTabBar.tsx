import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  BackHandler,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { overlay, Portal, Text, TouchableRipple } from 'react-native-paper'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { MaterialTopTabBar } from '@react-navigation/material-top-tabs'
import type { Theme } from '../lib'

const ANIM_DURATION = 220
const OPEN_VELOCITY = 650
const OPEN_RATIO = 0.5

type Props = {
  config: any
  theme: Theme
  // Remaining props (state, navigation, descriptors, position, jumpTo, layout, ..)
  // are forwarded to the stock MaterialTopTabBar.
  [key: string]: any
}

/**
 * Only rendered when the "expandable navigation bar" option is enabled.
 *
 * The stock tab bar is drawn as a passive indicator (its own touches are
 * disabled), so tapping or dragging it never switches tabs. Dragging the bar
 * towards the center of the screen makes it follow the finger; the bar content
 * fades out while a card anchored to the same screen edge fades in and slides
 * out of that edge. The gesture can be stopped, pulled back or completed, and
 * the opened card can be pulled back towards its edge to dismiss it.
 * Only the card navigates: tapping a row switches the tab (including the
 * refresh when it is already focused), tapping outside or a row closes the card.
 */
export const ExpandableTabBar = (props: Props) => {
  const { config, theme, ...tabBarProps } = props as any
  const { state, navigation, descriptors, jumpTo } = tabBarProps
  const isBottom = config?.isBottomTabs !== false
  const { height: windowHeight } = useWindowDimensions()
  const anim = useRef(new Animated.Value(0)).current
  const [cardHeight, setCardHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  // px the finger has to travel to fully reveal the card
  const openDistance = Math.max(1, cardHeight || Math.round(windowHeight * 0.4))
  // px the card has to move to be hidden behind its screen edge
  const hideOffset = cardHeight || windowHeight
  // when the content fits there is nothing to scroll, so the whole card can be dragged
  const isScrollable = cardHeight > 0 && contentHeight > cardHeight - 28

  const getToward = (v: number) => (isBottom ? -v : v)

  const progress = anim.interpolate({
    inputRange: [0, openDistance],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  const animateTo = useCallback(
    (toOpen: boolean) => {
      anim.stopAnimation()
      Animated.timing(anim, {
        toValue: toOpen ? openDistance : 0,
        duration: ANIM_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setIsOpen(toOpen)
        }
      })
    },
    [anim, openDistance],
  )

  const close = useCallback(() => {
    setIsOpen(false)
    anim.stopAnimation()
    Animated.timing(anim, {
      toValue: 0,
      duration: ANIM_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [anim])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close()
      return true
    })
    return () => sub.remove()
  }, [isOpen, close])

  // bar gesture: tap opens, drag follows the finger and snaps open / closed
  const barGesture = Gesture.Race(
    Gesture.Tap()
      .runOnJS(true)
      .onEnd((_event, success) => {
        if (success) {
          anim.setValue(0)
          setIsOpen(false)
          animateTo(true)
        }
      }),
    Gesture.Pan()
      .runOnJS(true)
      .onStart(() => {
        anim.stopAnimation()
        anim.setValue(0)
        setIsOpen(false)
      })
      .onUpdate(e => {
        const d = Math.max(0, Math.min(getToward(e.translationY), openDistance))
        anim.setValue(d)
      })
      .onEnd(e => {
        const d = Math.max(0, Math.min(getToward(e.translationY), openDistance))
        const v = getToward(e.velocityY)
        animateTo(d >= openDistance * OPEN_RATIO || v > OPEN_VELOCITY)
      }),
  )

  // card gesture: pull the opened card back towards its edge to dismiss it
  const cardGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => anim.stopAnimation())
    .onUpdate(e => {
      const edge = -getToward(e.translationY)
      anim.setValue(Math.min(openDistance, Math.max(0, openDistance - edge)))
    })
    .onEnd(e => {
      const edge = -getToward(e.translationY)
      const v = -getToward(e.velocityY)
      if (edge > openDistance * 0.4 || v > OPEN_VELOCITY) {
        close()
      } else {
        animateTo(true)
      }
    })

  const onPressRow = route => {
    close()
    // Emit tabPress so the existing per-view listeners refresh the target when
    // it is already focused (mirrors a normal tab press).
    navigation.emit({ type: 'tabPress', target: route.key })
    if (typeof jumpTo === 'function') {
      jumpTo(route.key)
    } else {
      navigation.navigate(route.name)
    }
  }

  const navOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
  const navTranslateY = isBottom ? Animated.multiply(anim, -1) : anim
  const backdropOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] })
  const cardOpacity = progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0, 1] })
  const cardTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [isBottom ? hideOffset : -hideOffset, 0],
  })
  const cardBackground = overlay(8, theme.colors.surface)

  return (
    <>
      <GestureDetector gesture={barGesture}>
        <Animated.View style={{ opacity: navOpacity, transform: [{ translateY: navTranslateY }] }}>
          {/* The bar is display-only: its own touches are disabled so it never switches tabs. */}
          <View pointerEvents={'none'}>
            <MaterialTopTabBar {...tabBarProps} />
          </View>
        </Animated.View>
      </GestureDetector>
      <Portal>
        <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
          <Animated.View
            pointerEvents={'none'}
            style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}
          />
          <Pressable
            style={[styles.pressArea, isBottom ? styles.alignBottom : styles.alignTop]}
            onPress={close}>
              <Animated.View
                onLayout={e => setCardHeight(e.nativeEvent.layout.height)}
                style={[
                  styles.card,
                  isBottom ? styles.cardBottom : styles.cardTop,
                  { backgroundColor: cardBackground, opacity: cardOpacity },
                  { transform: [{ translateY: cardTranslateY }] },
                ]}>
                <View
                  onStartShouldSetResponder={() => true}
                  style={[
                    styles.cardInner,
                    isBottom ? styles.cardInnerBottom : styles.cardInnerTop,
                    { backgroundColor: cardBackground },
                  ]}>
                  {isBottom && (
                    <GestureDetector gesture={cardGesture}>
                      <View style={styles.handleArea}>
                        <View style={styles.grabber} />
                      </View>
                    </GestureDetector>
                  )}
                  <ScrollView
                    bounces={false}
                    nestedScrollEnabled
                    scrollEnabled={isScrollable}
                    onContentSizeChange={(_w, h) => setContentHeight(h)}
                    style={styles.cardScroll}
                    contentContainerStyle={styles.cardContent}>
                    {state.routes.map((route, index) => {
                      const options = descriptors[route.key]?.options || {}
                      const focused = state.index === index
                      const icon =
                        typeof options.tabBarLabel === 'function'
                          ? options.tabBarLabel({ focused, color: theme.colors.text })
                          : null
                      const title = options.title || route.name
                      return (
                        <TouchableRipple
                          key={route.key}
                          rippleColor={theme.colors.ripple}
                          onPress={() => onPressRow(route)}
                          style={[
                            styles.row,
                            {
                              backgroundColor: focused ? theme.colors.row : theme.colors.transparent,
                              borderColor: focused ? theme.colors.primary : theme.colors.transparent,
                            },
                          ]}>
                          <View style={styles.rowInner}>
                            <View style={styles.rowIcon}>{icon}</View>
                            <Text numberOfLines={1} style={[styles.rowLabel, { color: theme.colors.text }]}>
                              {title}
                            </Text>
                          </View>
                        </TouchableRipple>
                      )
                    })}
                  </ScrollView>
                  {!isBottom && (
                    <GestureDetector gesture={cardGesture}>
                      <View style={styles.handleArea}>
                        <View style={styles.grabber} />
                      </View>
                    </GestureDetector>
                  )}
                </View>
              </Animated.View>
          </Pressable>
        </View>
      </Portal>
    </>
  )
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: '#000' },
  pressArea: { flex: 1, width: '100%' },
  alignBottom: { justifyContent: 'flex-end' },
  alignTop: { justifyContent: 'flex-start' },
  card: {
    width: '100%',
    maxHeight: '82%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  cardBottom: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  cardTop: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  cardInner: {
    overflow: 'hidden',
    flexShrink: 1,
  },
  cardInnerBottom: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  cardInnerTop: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  handleArea: { height: 28, alignItems: 'center', justifyContent: 'center' },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#888',
    opacity: 0.6,
  },
  cardScroll: { flexGrow: 0, flexShrink: 1 },
  cardContent: { paddingVertical: 6 },
  row: {
    height: 52,
    justifyContent: 'center',
    borderLeftWidth: 3,
  },
  rowInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  rowIcon: { width: 34, alignItems: 'flex-start', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, marginLeft: 2 },
})
