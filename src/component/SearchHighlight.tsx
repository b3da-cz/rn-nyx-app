import React, { useEffect, useRef } from 'react'
import { Text, TextStyle } from 'react-native'
import { searchMatchRanges, useTheme, withAlpha } from '../lib'
import { activeMatchLine } from '../lib/fileSearchScroll'

type Props = {
  text: string
  query?: string
  style?: TextStyle | TextStyle[]
  numberOfLines?: number
  selectable?: boolean
  matchOffset?: number
  activeIndex?: number | null
  emphasized?: boolean
  onActiveLine?: (line: number) => void
}

export const SearchHighlight = ({
  text,
  query,
  style,
  numberOfLines,
  selectable,
  matchOffset = 0,
  activeIndex = null,
  emphasized = false,
  onActiveLine,
}: Props) => {
  const { colors } = useTheme()
  const ranges = searchMatchRanges(text, query || '')
  const onActiveLineRef = useRef(onActiveLine)
  onActiveLineRef.current = onActiveLine
  useEffect(() => {
    const report = onActiveLineRef.current
    if (!report) {
      return
    }
    const line = activeMatchLine(text, query || '', matchOffset, activeIndex)
    if (line < 0) {
      return
    }
    report(line)
  }, [activeIndex, matchOffset, query, text])
  if (ranges.length === 0) {
    return (
      <Text numberOfLines={numberOfLines} selectable={selectable} style={style}>
        {text}
      </Text>
    )
  }
  const parts: React.ReactNode[] = []
  let from = 0
  ranges.forEach(([start, end], key) => {
    if (start > from) {
      parts.push(text.slice(from, start))
    }
    const active = activeIndex != null && matchOffset + key === activeIndex
    parts.push(
      <Text
        key={key}
        style={{ backgroundColor: withAlpha(active || emphasized ? colors.primary : colors.tertiary, 0.75) }}>
        {text.slice(start, end)}
      </Text>,
    )
    from = end
  })
  if (from < text.length) {
    parts.push(text.slice(from))
  }
  return (
    <Text numberOfLines={numberOfLines} selectable={selectable} style={style}>
      {parts}
    </Text>
  )
}
