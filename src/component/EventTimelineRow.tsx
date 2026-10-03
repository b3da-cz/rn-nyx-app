import React, { useContext, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import type { EventFriendInput, TimelineDay } from '../lib'
import {
  eventFriends,
  eventIconRow,
  MainContext,
  TIMELINE_DATE_WIDTH,
  TIMELINE_ICON_HEIGHT,
  TIMELINE_ICON_WIDTH,
  timelineIconCount,
  useTheme,
} from '../lib'
import { UserIconComponent } from './UserIconComponent'

export type TimelineBlockModel = {
  discussionId: number
  title: string
  summary: string
  clock: string | null
  attendance: 'going' | 'interested'
  column: number
  columns: number
  friends: EventFriendInput[]
  startMs: number
  endMs: number
}

type DayProps = {
  day: TimelineDay
  height: number
  isToday: boolean
  dividerInset: number
}

export const EventTimelineDay = ({ day, height, isToday, dividerInset }: DayProps) => {
  const {
    colors,
    metrics: { fontSizes },
  } = useTheme()
  const dateColor = isToday ? colors.accent : colors.text
  return (
    <View
      style={{
        height,
        backgroundColor: day.isWeekend ? colors.card : colors.background,
        justifyContent: 'center',
      }}
    >
      <View
        pointerEvents={'none'}
        style={{
          position: 'absolute',
          left: 0,
          right: dividerInset,
          bottom: 0,
          height: 1,
          backgroundColor: colors.border,
        }}
      />
      <View style={{ width: TIMELINE_DATE_WIDTH, paddingLeft: 8 }}>
        <Text style={{ color: dateColor, fontSize: fontSizes.small, fontWeight: '700' }}>{day.weekday}</Text>
        <Text style={{ color: dateColor, fontSize: fontSizes.small }}>{day.label}</Text>
        {!!day.yearLabel && (
          <Text style={{ color: isToday ? colors.accent : colors.faded, fontSize: fontSizes.small }}>
            {day.yearLabel}
          </Text>
        )}
      </View>
    </View>
  )
}

type BlockProps = {
  block: TimelineBlockModel
  top: number
  height: number
  left: number
  width: number
  onPress: (discussionId: number) => void
}

export const EventTimelineBlock = ({ block, top, height, left, width, onPress }: BlockProps) => {
  const {
    colors,
    metrics: { fontSizes },
  } = useTheme()
  const context = useContext(MainContext)
  const username = context.nyx?.username || context.nyx?.api.getAuth()?.username || ''
  const showSelf = context.config?.isEventSelfIconEnabled !== false
  const icons = eventIconRow(eventFriends(block.friends), { username, attendance: block.attendance }, showSelf).icons
  const [frame, setFrame] = useState({ width: 0, height: 0 })
  const [textHeight, setTextHeight] = useState(0)
  const visibleIcons = icons.slice(
    0,
    timelineIconCount(icons.length, frame.width - 8, frame.height - 4, textHeight),
  )
  if (height <= 0 || width <= 0) {
    return null
  }
  return (
    <TouchableRipple
      rippleColor={colors.ripple}
      onPress={() => onPress(block.discussionId)}
      style={{
        position: 'absolute',
        top,
        left,
        width,
        height,
        overflow: 'hidden',
        backgroundColor: colors.background,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        borderLeftWidth: 3,
        borderLeftColor: block.attendance === 'going' ? colors.primary : colors.secondary,
        zIndex: 2,
      }}
    >
      <View
        style={{ flex: 1, overflow: 'hidden', paddingHorizontal: 4, paddingVertical: 2 }}
        onLayout={event => {
          const nextWidth = event.nativeEvent.layout.width
          const nextHeight = event.nativeEvent.layout.height
          setFrame(prev => (prev.width === nextWidth && prev.height === nextHeight ? prev : { width: nextWidth, height: nextHeight }))
        }}
      >
        <View
          onLayout={event => {
            const nextHeight = event.nativeEvent.layout.height
            setTextHeight(prev => (prev === nextHeight ? prev : nextHeight))
          }}
        >
          <Text numberOfLines={1} style={{ color: colors.accent, fontSize: fontSizes.small, fontWeight: '700' }}>
            {block.title}
          </Text>
          {!!block.clock && (
            <Text numberOfLines={1} style={{ color: colors.faded, fontSize: fontSizes.small }}>
              {block.clock}
            </Text>
          )}
          {!!block.summary && (
            <Text numberOfLines={2} style={{ color: colors.text, fontSize: fontSizes.small }}>
              {block.summary}
            </Text>
          )}
        </View>
        {visibleIcons.length > 0 && (
          <View style={{ marginTop: 'auto', height: TIMELINE_ICON_HEIGHT, flexDirection: 'row', overflow: 'hidden' }}>
            {visibleIcons.map(icon => (
              <UserIconComponent
                key={`${icon.isSelf ? 'me' : 'friend'}-${icon.username}`}
                username={icon.username}
                width={TIMELINE_ICON_WIDTH}
                height={TIMELINE_ICON_HEIGHT}
                marginRight={2}
              />
            ))}
          </View>
        )}
      </View>
    </TouchableRipple>
  )
}
