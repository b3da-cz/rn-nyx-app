import React from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { Styling } from '../lib'

export const DiscussionRowComponent = ({ discussion, isDarkMode, isAccented, onPress }) => {
  const isBookmarksResultType = discussion.discussion_id
  const id = isBookmarksResultType ? discussion.discussion_id : discussion.id
  const unreadRowColor = (unreads, replies) =>
    replies > 0
      ? Styling.colors.accent
      : (unreads > 0 || isAccented) && isDarkMode
      ? Styling.colors.white
      : (unreads > 0 || isAccented) && !isDarkMode
      ? Styling.colors.black
      : isDarkMode
      ? Styling.colors.medium
      : Styling.colors.mediumlight
  const unreadPostCount = Math.max(
    discussion.new_posts_count || 0,
    discussion.new_replies_count || 0,
    discussion.new_images_count || 0,
    discussion.new_links_count || 0,
  ) // new_posts_count is weird sometimes
  return (
    <TouchableRipple
      key={id}
      rippleColor={'rgba(18,146,180, 0.3)'}
      style={{
        backgroundColor: isDarkMode ? Styling.colors.darker : Styling.colors.lighter,
        paddingVertical: 6,
        paddingHorizontal: Styling.metrics.block.small,
        marginBottom: Styling.metrics.block.xsmall,
      }}
      onPress={() => onPress(id)}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text
          numberOfLines={1}
          style={[
            {
              maxWidth: !(isBookmarksResultType && unreadPostCount > 0)
                ? '100%'
                : unreadPostCount > 1000
                ? '65%'
                : '75%',
              fontSize: 14,
              color: unreadRowColor(unreadPostCount, discussion.new_replies_count),
            },
          ]}>
          {isBookmarksResultType ? discussion.full_name : discussion.discussion_name}
        </Text>
        {isBookmarksResultType && unreadPostCount > 0 && (
          <Text
            numberOfLines={1}
            style={[
              {
                // width: '25%',
                textAlign: 'right',
                fontSize: 14,
                color: unreadRowColor(unreadPostCount, discussion.new_replies_count),
              },
            ]}>
            {unreadPostCount}
            {`${discussion.new_replies_count > 0 ? `+${discussion.new_replies_count}` : ''}  `}
            {discussion.new_images_count > 0 ? (
              <Icon name="image" size={14} color={unreadRowColor(unreadPostCount)} />
            ) : (
              ''
            )}
            {discussion.new_images_count > 0 ? `${discussion.new_images_count} ` : ''}
            {discussion.new_links_count > 0 ? (
              <Icon name="link" size={14} color={unreadRowColor(unreadPostCount)} />
            ) : (
              ''
            )}
            {discussion.new_links_count > 0 ? `${discussion.new_links_count}` : ''}
          </Text>
        )}
      </View>
    </TouchableRipple>
  )
}
