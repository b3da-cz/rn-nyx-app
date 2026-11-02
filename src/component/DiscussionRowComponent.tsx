import React from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { Styling, useTheme } from '../lib'

type Props = {
  discussion: any
  isAccented?: boolean
  onPress?: Function
  onLongPress?: Function
}
export const DiscussionRowComponent = React.memo(
  ({ discussion, isAccented, onPress, onLongPress }: Props) => {
    const {
      colors,
      metrics: { blocks, fontSizes },
    } = useTheme()
    const isBookmarksResultType = discussion.discussion_id
    const id = isBookmarksResultType ? discussion.discussion_id : discussion.id
    const unreadPostCount = discussion.unreadPostCount ?? 0
    const textColor = unreadPostCount > 0 || isAccented ? colors.text : colors.disabled
    return (
      <TouchableRipple
        key={id}
        rippleColor={colors.ripple}
        style={{
          backgroundColor: colors.row,
          // paddingVertical: 6,
          paddingLeft: blocks.small,
          paddingRight: blocks.medium,
          marginBottom: blocks.small,
          borderColor: unreadPostCount > 0 ? colors.primary : colors.row,
          borderLeftWidth: 3,
        }}
        onPress={() => (typeof onPress === 'function' ? onPress(id) : null)}
        onLongPress={() => (typeof onLongPress === 'function' ? onLongPress(id) : null)}>
        <View style={[Styling.groups.flexRowSpbCentered, { minHeight: blocks.rowDiscussion }]}>
          <Text
            numberOfLines={1}
            style={[
              {
                maxWidth: !(isBookmarksResultType && unreadPostCount > 0)
                  ? '100%'
                  : unreadPostCount > 1000
                  ? '65%'
                  : '75%',
                fontSize: fontSizes.p - 1,
                color: textColor,
              },
            ]}>
            {isBookmarksResultType ? discussion.full_name : discussion.discussion_name}
          </Text>
          {isBookmarksResultType && unreadPostCount > 0 && (
            <View style={Styling.groups.flexRowSpbCentered}>
              <Text numberOfLines={1} style={{ color: textColor }}>
                {unreadPostCount}
                {`${discussion.new_replies_count > 0 ? `+${discussion.new_replies_count}` : ''}`}
              </Text>
              {discussion.new_images_count > 0 ? (
                <Icon name="image" size={14} style={{ paddingLeft: blocks.medium }} color={textColor} />
              ) : null}
              {discussion.new_images_count > 0 ? (
                <Text style={{ color: textColor }}>{discussion.new_images_count}</Text>
              ) : null}
              {discussion.new_links_count > 0 ? (
                <Icon name="link" size={14} style={{ paddingLeft: blocks.medium }} color={textColor} />
              ) : null}
              {discussion.new_links_count > 0 ? (
                <Text style={{ color: textColor }}>{discussion.new_links_count}</Text>
              ) : null}
            </View>
          )}
        </View>
      </TouchableRipple>
    )
  },
  (prev, next) =>
    prev.isAccented === next.isAccented &&
    prev.onPress === next.onPress &&
    prev.onLongPress === next.onLongPress &&
    (prev.discussion === next.discussion ||
      (prev.discussion?.discussion_id === next.discussion?.discussion_id &&
        prev.discussion?.id === next.discussion?.id &&
        prev.discussion?.unreadPostCount === next.discussion?.unreadPostCount &&
        prev.discussion?.new_replies_count === next.discussion?.new_replies_count &&
        prev.discussion?.new_images_count === next.discussion?.new_images_count &&
        prev.discussion?.new_links_count === next.discussion?.new_links_count &&
        prev.discussion?.last_seen_post_id === next.discussion?.last_seen_post_id &&
        prev.discussion?.full_name === next.discussion?.full_name &&
        prev.discussion?.discussion_name === next.discussion?.discussion_name)),
)
