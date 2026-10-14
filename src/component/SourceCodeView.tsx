import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, FlatList, PanResponder, Platform, Text, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import {
  highlightSourceLine,
  searchMatchRanges,
  SourceLang,
  SourceToken,
  splitByRanges,
  useTheme,
  withAlpha,
} from '../lib'

type Props = {
  text: string
  lang: SourceLang
  query: string
  activeIndex?: number | null
}

const tokenColor = (kind: SourceToken, colors: { text: string; primary: string; secondary: string; tertiary: string; faded: string; error: string; accent: string }) => {
  if (kind === 'keyword' || kind === 'level') return colors.primary
  if (kind === 'string' || kind === 'key') return colors.secondary
  if (kind === 'number') return colors.tertiary
  if (kind === 'comment') return colors.faded
  if (kind === 'punct') return colors.accent
  return colors.text
}

export const SourceCodeView = ({ text, lang, query, activeIndex = null }: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes, screen },
  } = useTheme()
  const listRef = useRef<FlatList<string>>(null)
  const shift = useRef(new Animated.Value(0)).current
  const shiftValue = useRef(0)
  const grantShift = useRef(0)
  const minShift = useRef(0)
  const [selected, setSelected] = useState<number | null>(null)
  const lines = useMemo(() => text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n'), [text])
  const lineMatches = useMemo(() => {
    let offset = 0
    return lines.map(line => {
      const ranges = searchMatchRanges(line, query)
      const start = offset
      offset += ranges.length
      return { ranges, start }
    })
  }, [lines, query])
  const fontSize = Math.max(12, fontSizes.small)
  const lineHeight = Math.round(fontSize * 1.45)
  const charWidth = fontSize * 0.62
  const gutterChars = Math.max(2, String(lines.length).length)
  const gutterWidth = gutterChars * charWidth + blocks.small
  const gap = 16
  const maxLen = lines.reduce((max, line) => Math.max(max, line.length), 1)
  const codeWidth = Math.max(32, maxLen * charWidth + blocks.medium)
  const viewport = Math.max(32, screen.width - gutterWidth - gap - blocks.small)
  minShift.current = Math.min(0, viewport - codeWidth)

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: () => {
        grantShift.current = shiftValue.current
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(0, Math.max(minShift.current, grantShift.current + gesture.dx))
        shift.setValue(next)
      },
      onPanResponderRelease: (_, gesture) => {
        shiftValue.current = Math.min(0, Math.max(minShift.current, grantShift.current + gesture.dx))
        shift.setValue(shiftValue.current)
      },
      onPanResponderTerminate: (_, gesture) => {
        shiftValue.current = Math.min(0, Math.max(minShift.current, grantShift.current + gesture.dx))
        shift.setValue(shiftValue.current)
      },
    }),
  ).current

  useEffect(() => {
    if (activeIndex == null) {
      return
    }
    const line = lineMatches.findIndex(
      item => activeIndex >= item.start && activeIndex < item.start + item.ranges.length,
    )
    if (line >= 0) {
      listRef.current?.scrollToIndex({ index: line, viewPosition: 0.3 })
    }
  }, [activeIndex, lineMatches])

  const rowStyle = (on: boolean) => ({
    height: lineHeight,
    borderRadius: 0,
    backgroundColor: on ? colors.row : 'transparent',
  })

  return (
    <View style={{ flex: 1 }} {...pan.panHandlers}>
      <FlatList
        ref={listRef}
        data={lines}
        keyExtractor={(_, index) => String(index)}
        style={{ flex: 1 }}
        initialNumToRender={40}
        windowSize={12}
        getItemLayout={(_, index) => ({ length: lineHeight, offset: lineHeight * index, index })}
        onScrollToIndexFailed={info => {
          listRef.current?.scrollToOffset({ offset: lineHeight * info.index, animated: true })
        }}
        renderItem={({ item, index }) => {
            const on = selected === index
            const spans = highlightSourceLine(item, lang)
            const ranges = lineMatches[index]?.ranges || []
            const matchOffset = lineMatches[index]?.start || 0
            let cursor = 0
            return (
              <TouchableRipple
                rippleColor={colors.ripple}
                onPress={() => setSelected(on ? null : index)}
                style={rowStyle(on)}>
                <View style={{ flexDirection: 'row', height: lineHeight, overflow: 'hidden' }}>
                  <View
                    style={{
                      width: gutterWidth,
                      borderLeftWidth: blocks.small,
                      borderLeftColor: on ? colors.primary : 'transparent',
                      backgroundColor: on ? colors.row : colors.background,
                    }}>
                    <Text
                      style={{
                        width: gutterWidth - blocks.small,
                        textAlign: 'right',
                        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                        fontSize,
                        lineHeight,
                        color: on ? colors.primary : colors.faded,
                      }}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={{ width: gap, backgroundColor: on ? colors.row : colors.background }} />
                  <View style={{ flex: 1, overflow: 'hidden' }}>
                    <Animated.View style={{ width: codeWidth, transform: [{ translateX: shift }] }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                      fontSize,
                      lineHeight,
                      color: colors.text,
                    }}>
                    {spans.length === 0
                      ? ' '
                      : spans.map((span, spanIndex) => {
                          const start = cursor
                          cursor += span.text.length
                          const parts = splitByRanges(
                            span.text,
                            ranges
                              .map(([from, to]) => [from - start, to - start] as [number, number])
                              .filter(([from, to]) => to > 0 && from < span.text.length),
                          )
                          let partAt = start
                          return parts.map((part, partIndex) => {
                            const partStart = partAt
                            partAt += part.text.length
                            const at = ranges.findIndex(([from, to]) => partStart >= from && partStart < to)
                            const active = part.hit && at >= 0 && activeIndex != null && matchOffset + at === activeIndex
                            return (
                              <Text
                                key={`${spanIndex}-${partIndex}`}
                                style={[
                                  { color: tokenColor(span.kind, colors) },
                                  part.hit
                                    ? { backgroundColor: withAlpha(active ? colors.primary : colors.tertiary, 0.75) }
                                    : null,
                                ]}>
                                {part.text}
                              </Text>
                            )
                          })
                        })}
                  </Text>
                    </Animated.View>
                  </View>
                </View>
              </TouchableRipple>
            )
          }}
        />
    </View>
  )
}
