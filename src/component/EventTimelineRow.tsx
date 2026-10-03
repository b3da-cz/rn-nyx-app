import React, { useContext } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import type { EventFriendInput, TimelineDay } from '../lib'
import { eventFriends, eventIconRow, MainContext, t, TIMELINE_DATE_WIDTH, useTheme } from '../lib'
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
}

export const EventTimelineDay = ({ day, height, isToday }: DayProps) => {
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
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
        justifyContent: 'center',
      }}
    >
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
  const icons = eventIconRow(
    eventFriends(block.friends),
    { username, attendance: block.attendance },
    showSelf,
  ).icons.slice(0, 3)
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
        zIndex: 1,
      }}
    >
      <View style={{ flex: 1, overflow: 'hidden', paddingHorizontal: 4, paddingVertical: 2 }}>
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text numberOfLines={1} style={{ color: colors.text, fontSize: fontSizes.small, marginRight: 4 }}>
            {t(block.attendance === 'going' ? 'events.rsvp.going' : 'events.rsvp.interested')}
          </Text>
          {icons.map(icon => (
            <UserIconComponent
              key={`${icon.isSelf ? 'me' : 'friend'}-${icon.username}`}
              username={icon.username}
              width={16}
              height={20}
              marginRight={2}
            />
          ))}
        </View>
      </View>
    </TouchableRipple>
  )
}
