import React from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { Styling } from '../lib'

export const DiscussionRowComponent = ({ discussion, isDarkMode, onPress }) => {
  const isBookmarksResultType = discussion.discussion_id
  const id = isBookmarksResultType ? discussion.discussion_id : discussion.id
  const unreadRowColor = (unreads, replies) =>
    replies > 0
      ? Styling.colors.secondary
      : unreads > 0
      ? Styling.colors.primary
      : isDarkMode
      ? Styling.colors.light
      : Styling.colors.dark;
  return (
    <TouchableRipple
      key={id}
      rippleColor={'rgba(18,146,180, 0.3)'}
      style={{
        backgroundColor: isDarkMode ? Styling.colors.darker : Styling.colors.lighter,
        paddingVertical: Styling.metrics.block.medium,
        paddingHorizontal: Styling.metrics.block.small,
        marginBottom: Styling.metrics.block.small,
      }}
      onPress={() => onPress(id)}>
      <View style={{ flexDirection: 'row' }}>
        <Text
          numberOfLines={1}
          style={[
            {
              width: isBookmarksResultType ? '75%' : '100%',
              fontSize: 14,
              color: unreadRowColor(discussion.new_posts_count, discussion.new_replies_count),
            },
          ]}>
          {isBookmarksResultType ? discussion.full_name : discussion.discussion_name}
        </Text>
        {isBookmarksResultType && (
          <Text
            style={[
              {
                width: '25%',
                textAlign: 'right',
                fontSize: 14,
                color: unreadRowColor(discussion.new_posts_count, discussion.new_replies_count),
              },
            ]}>
            {discussion.new_posts_count}
            {`${discussion.new_replies_count > 0 ? `+${discussion.new_replies_count}` : ''}  `}
            {discussion.new_images_count > 0 ? (
              <Icon name="image" size={14} color={unreadRowColor(discussion.new_posts_count)} />
            ) : (
              ''
            )}
            {discussion.new_images_count > 0 ? `${discussion.new_images_count}` : ''}
            {discussion.new_links_count > 0 ? (
              <Icon name="link" size={14} color={unreadRowColor(discussion.new_posts_count)} />
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
