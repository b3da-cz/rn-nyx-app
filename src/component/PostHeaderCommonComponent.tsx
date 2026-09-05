import React from 'react'
import { Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import {
  ButtonRepliesComponent,
  ButtonSquareComponent,
  RatingDetailDialogComponent,
  UserIconComponent,
} from '../component'
import { formatDate, Theme } from '../lib'

type Props = {
  post: any
  theme: Theme
  ratings: any
  isReply: boolean
  isUnread: boolean
  isInteractive: boolean
  getRating: Function
  showReplies: Function
  setReminder: Function
  reportPost: Function
}
export const PostHeaderCommonComponent: React.FC<Props> = ({
  post,
  theme,
  ratings,
  isReply,
  isUnread,
  isInteractive,
  getRating,
  showReplies,
  setReminder,
  reportPost,
}) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = theme
  if (post.location === 'header' || post.location === 'home') {
    return null
  }
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 3,
        paddingVertical: 3,
        borderTopColor: colors.disabled,
        // borderTopWidth: 1,
        borderLeftColor: isUnread ? colors.primary : colors.card,
        borderLeftWidth: 3,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          width: post.replies?.length > 0 && isInteractive ? '70%' : '80%',
        }}>
        {isReply && <Icon name={'corner-down-right'} size={20} style={{ marginRight: blocks.medium }} />}
        {post.username?.length > 0 && <UserIconComponent username={post.username} marginRight={10} />}
        <View>
          <Text
            style={{
              color: isUnread ? colors.text : colors.faded,
              fontSize: fontSizes.h3,
            }}
            numberOfLines={1}>
            {post.username?.length > 0 ? post.username : ''}
            {post.replies?.length > 0 && isInteractive ? (
              <ButtonRepliesComponent count={post.replies.length} onPress={() => showReplies(post)} />
            ) : (
              ' '
            )}

            {post.discussion_name?.length > 0 && (
              <Text style={{ color: colors.text, fontSize: fontSizes.p }}>- {post.discussion_name}</Text>
            )}
            {post.activity && (
              <Text style={{ color: colors.faded, fontSize: fontSizes.small }}>
                {`[${post.activity.last_activity.substr(11)} `}
                {post.activity.last_access_method === 'Web' ? (
                  <Icon name={'globe'} size={fontSizes.small} style={{ marginRight: blocks.medium }} />
                ) : (
                  <Icon name={'smartphone'} size={fontSizes.small} style={{ marginRight: blocks.medium }} />
                )}
                {` ${post.activity.location}]`}
              </Text>
            )}
          </Text>
          <Text
            style={{
              color: colors.faded,
              fontSize: fontSizes.small,
            }}>
            {post?.inserted_at?.length > 0 && formatDate(post.inserted_at)}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {post.rating !== undefined && (
          <RatingDetailDialogComponent
            isDisabled={!isInteractive}
            onPress={() => getRating(post)}
            postKey={post.id}
            rating={post.rating === 0 ? `±${post.rating}` : post.rating > 0 ? `+${post.rating}` : post.rating}
            myRating={post.my_rating}
            ratingsPositive={ratings?.positive || []}
            ratingsNegative={ratings?.negative || []}
          />
        )}
        {post.reminder && (
          <ButtonSquareComponent
            icon={'bell'}
            width={20}
            height={40}
            color={post.reminder ? colors.primary : undefined}
            onPress={() => setReminder(post)}
          />
        )}
        {!isInteractive && post.id > 0 && (
          <ButtonSquareComponent
            icon={'alert-triangle'}
            width={20}
            height={40}
            color={'red'}
            onPress={() => reportPost(post)}
          />
        )}
      </View>
    </View>
  )
}
