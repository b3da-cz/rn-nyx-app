import React from 'react'
import { Text, TextStyle } from 'react-native'
import { searchMatchRanges, useTheme, withAlpha } from '../lib'

type Props = {
  text: string
  query?: string
  style?: TextStyle | TextStyle[]
  numberOfLines?: number
  selectable?: boolean
  matchOffset?: number
  activeIndex?: number | null
  onActiveLayout?: (y: number) => void
}

export const SearchHighlight = ({
  text,
  query,
  style,
  numberOfLines,
  selectable,
  matchOffset = 0,
  activeIndex = null,
  onActiveLayout,
}: Props) => {
  const { colors } = useTheme()
  const ranges = searchMatchRanges(text, query || '')
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
        onLayout={
          active && onActiveLayout
            ? event => onActiveLayout(event.nativeEvent.layout.y)
            : undefined
        }
        style={{ backgroundColor: withAlpha(active ? colors.primary : colors.tertiary, 0.75) }}>
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
