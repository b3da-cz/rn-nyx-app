import React from 'react'
import { Image, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import type { EventListItem } from 'nyx-api'
import { attendancePhrase, eventThumbUrl, formatEventMeta, useTheme } from '../lib'

type Props = {
  event: EventListItem
  onPress?: () => void
}

export const EventRowComponent = ({ event, onPress }: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const thumb = eventThumbUrl(event.thumbnail_id)
  const phrase = attendancePhrase(event.going_people || 0, event.duration?.end)
  const summary = (event.summary || '').replace(/<[^>]+>/g, '').trim()

  return (
    <TouchableRipple
      rippleColor={colors.ripple}
      onPress={() => (typeof onPress === 'function' ? onPress() : null)}
      style={{
        backgroundColor: colors.row,
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
            <Text numberOfLines={2} style={{ color: colors.faded, fontSize: fontSizes.small, marginTop: 2 }}>
              {formatEventMeta(event)}
            </Text>
          </View>
          {thumb ? <Image source={{ uri: thumb }} style={{ width: 72, height: 72 }} /> : null}
        </View>
        {summary.length > 0 && (
          <Text style={{ color: colors.text, fontSize: fontSizes.small, marginTop: blocks.medium }}>{summary}</Text>
        )}
        {phrase && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: blocks.medium, flexWrap: 'wrap' }}>
            <Text style={{ color: colors.text, fontSize: fontSizes.small }}>{phrase.lead} </Text>
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 4,
                paddingHorizontal: 7,
                paddingVertical: 1,
              }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSizes.small }}>
                {event.going_people}
              </Text>
            </View>
            <Text style={{ color: colors.text, fontSize: fontSizes.small }}> {phrase.noun}</Text>
          </View>
        )}
      </View>
    </TouchableRipple>
  )
}
