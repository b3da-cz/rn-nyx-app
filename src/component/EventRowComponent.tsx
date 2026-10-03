import React, { useContext } from 'react'
import { Image, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import type { EventListItem } from 'nyx-api'
import {
  attendancePhrase,
  eventFriends,
  eventIconRow,
  eventMetaParts,
  eventThumbUrl,
  MainContext,
  otherAttendeesNoun,
  useTheme,
} from '../lib'
import { UserIconComponent } from './UserIconComponent'

type Props = {
  event: EventListItem
  onPress?: () => void
}

export const EventRowComponent = ({ event, onPress }: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const context = useContext(MainContext)
  const username = context.nyx?.username || context.nyx?.api.getAuth()?.username || ''
  const showSelf = context.config.isEventSelfIconEnabled !== false
  const showBadges = context.config.isEventFriendBadgesEnabled !== false
  const thumb = eventThumbUrl(event.thumbnail_id)
  const phrase = attendancePhrase(event.going_people || 0, event.duration?.end)
  const meta = eventMetaParts(event)
  const summary = (event.summary || '').replace(/<[^>]+>/g, '').trim()
  const { icons, others } = eventIconRow(
    eventFriends(event.friends),
    { username, attendance: event.my_attendance },
    showSelf,
    event.going_people || 0,
  )
  const rowIcons = phrase ? icons : icons.filter(icon => icon.isSelf)
  const shownIcons = rowIcons.slice(0, 4)
  const overflow = rowIcons.length - shownIcons.length
  const hasIcons = shownIcons.length > 0

  return (
    <TouchableRipple
      rippleColor={colors.ripple}
      onPress={() => (typeof onPress === 'function' ? onPress() : null)}
      style={{
        backgroundColor: colors.row,
        borderTopWidth: 2,
        borderTopColor: colors.card,
        marginBottom: blocks.small,
        paddingHorizontal: blocks.medium,
        paddingVertical: blocks.medium,
      }}>
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: thumb ? blocks.medium : 0 }}>
            <Text numberOfLines={2} style={{ color: colors.accent, fontSize: fontSizes.p, fontWeight: '700' }}>
              {event.full_name}
            </Text>
            {!!meta.schedule && (
              <Text numberOfLines={2} style={{ color: colors.faded, fontSize: fontSizes.small, marginTop: 2 }}>
                {meta.schedule}
              </Text>
            )}
            {!!meta.place && (
              <Text numberOfLines={2} style={{ color: colors.faded, fontSize: fontSizes.small, marginTop: 2 }}>
                {meta.place}
              </Text>
            )}
          </View>
          {thumb ? <Image source={{ uri: thumb }} style={{ width: 72, height: 72 }} /> : null}
        </View>
        {summary.length > 0 && (
          <Text style={{ color: colors.text, fontSize: fontSizes.small, marginTop: blocks.medium }}>{summary}</Text>
        )}
        {(phrase || hasIcons) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: blocks.medium, flexWrap: 'wrap' }}>
            {!!phrase && <Text style={{ color: colors.text, fontSize: fontSizes.small }}>{phrase.lead} </Text>}
            {shownIcons.map(icon => (
              <UserIconComponent
                key={`${icon.isSelf ? 'me' : 'friend'}-${icon.username}`}
                username={icon.username}
                width={22}
                height={28}
                marginRight={4}
                attendance={
                  showBadges && icon.isSelf && (icon.attendance === 'going' || icon.attendance === 'interested')
                    ? icon.attendance
                    : null
                }
              />
            ))}
            {overflow > 0 && (
              <Text style={{ color: colors.faded, fontSize: fontSizes.small, marginRight: 4 }}>+{overflow}</Text>
            )}
            {hasIcons && others > 0 && !!phrase && (
              <Text style={{ color: colors.text, fontSize: fontSizes.small }}>a </Text>
            )}
            {!!phrase && (!hasIcons || others > 0) && (
              <>
                <View
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 4,
                    paddingHorizontal: 7,
                    paddingVertical: 1,
                  }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSizes.small }}>
                    {hasIcons ? others : event.going_people}
                  </Text>
                </View>
                <Text style={{ color: colors.text, fontSize: fontSizes.small }}>
                  {' '}
                  {hasIcons ? otherAttendeesNoun(others) : phrase.noun}
                </Text>
              </>
            )}
          </View>
        )}
      </View>
    </TouchableRipple>
  )
}
