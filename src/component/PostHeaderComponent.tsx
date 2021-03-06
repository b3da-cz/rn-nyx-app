import React, { Component } from 'react'
import { LayoutAnimation, Text, ToastAndroid, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import Swipeable from 'react-native-swipeable-row'
import Icon from 'react-native-vector-icons/Feather'
import Clipboard from '@react-native-clipboard/clipboard'
import Share from 'react-native-share'
import { RNNotificationBanner } from 'react-native-notification-banner'
import {
  ButtonRepliesComponent,
  ButtonSquareComponent,
  confirm,
  RatingDetailComponent,
  RatingDetailDialogComponent,
  UserIconComponent,
} from '../component'
import { formatDate, LayoutAnimConf, Nyx, rgbToHex, showNotificationBanner, t, Theme } from '../lib'

type Props = {
  post: any
  nyx: Nyx
  theme: Theme
  isReply: boolean
  isUnread: boolean
  isInteractive: boolean
  isPressable: boolean
  onPress?: Function
  onReply?: Function
  onRepliesShow?: Function
  onDelete: Function
  onReminder?: Function
  onPostRated?: Function
  onSwipe?: Function
}
type State = {
  isFetching: boolean
  isRatingRowVisible: boolean
  ratings: {
    positive: any[]
    negative: any[]
  }
  ratingWidth: number
  ratingHeight: number
}
export class PostHeaderComponent extends Component<Props> {
  state: Readonly<State>
  refSwipeable: any
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      isRatingRowVisible: false,
      ratings: {
        positive: [],
        negative: [],
      },
      ratingWidth: 20,
      ratingHeight: 25,
    }
    this.refSwipeable = null
  }

  componentDidMount() {
    this.getRatingByFriends()
  }

  onReply() {
    if (typeof this.props.onReply === 'function') {
      this.props.onReply(this.props.post.discussion_id, this.props.post.id, this.props.post.username)
    }
    setTimeout(() => this.refSwipeable.recenter(), 300)
  }

  onShare(isContent = false) {
    try {
      if (isContent) {
        Clipboard.setString(this.props.post.parsed.clearTextWithUrls)
        ToastAndroid.showWithGravity(t('coppied'), ToastAndroid.LONG, ToastAndroid.BOTTOM)
      } else {
        Share.open({
          title: 'Link',
          message: `https://nyx.cz/discussion/${this.props.post.discussion_id}/id/${this.props.post.id}`,
        })
      }
      setTimeout(() => this.refSwipeable.recenter(), 300)
    } catch (e) {
      console.warn(e)
    }
  }

  getRatingByFriends() {
    if (this.props.post?.rating_friends?.length > 0) {
      this.setState({
        isRatingRowVisible: true,
        ratings: {
          positive: this.props.post.rating_friends.map(username => ({ username })),
          negative: [],
        },
      })
    }
  }

  async getRating(post, bounceRight = false) {
    if (bounceRight && (this.state.ratings?.positive?.length > 0 || this.state.ratings?.negative?.length > 0)) {
      LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
      this.setState({
        ratings: {
          positive: [],
          negative: [],
        },
      })
      return
    }
    if (bounceRight) {
      this.refSwipeable?.bounceRight()
    }
    const ratingsMixed = await this.props.nyx.api.getRating(post)
    if (!ratingsMixed || !Array.isArray(ratingsMixed)) {
      return
    }
    const ratings = {
      positive: ratingsMixed.filter(r => r.tag === 'positive'),
      negative: ratingsMixed.filter(r => r.tag !== 'positive'),
    }
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({ ratings })
  }

  async ratePost(post, vote) {
    const res = await this.props.nyx.ratePost(post, post.my_rating?.includes(vote) ? 'remove' : vote)
    this.refSwipeable?.recenter()
    typeof this.props.onPostRated === 'function' ? this.props.onPostRated(res) : null
  }

  async setReminder(post) {
    await this.props.nyx.api.setReminder(post.discussion_id, post.id, !post.reminder)
    this.refSwipeable?.recenter()
    typeof this.props.onReminder === 'function' ? this.props.onReminder(post, !post.reminder) : null
  }

  async deletePost(post) {
    const res = await confirm(t('confirm'), `${t('delete.post')}?`)
    if (res) {
      await this.props.nyx.api.deletePost(post.discussion_id, post.id)
      if (this.refSwipeable) {
        this.refSwipeable.recenter()
      }
      this.props.onDelete(post.id)
    }
  }

  async reportPost(post) {
    const res = await confirm(t('confirm'), `${t('reportPost')}?`)
    if (res) {
      await this.props.nyx.api.reportPost(post.id)
      if (this.refSwipeable) {
        this.refSwipeable.recenter()
      }
      showNotificationBanner({
        title: 'Thank you!',
        body: 'Possible violation reported',
        tintColor: rgbToHex(this.props.theme.colors.tertiary),
        textColor: rgbToHex(this.props.theme.colors.text),
        icon: 'heart',
        onClick: async () => {
          RNNotificationBanner.Dismiss()
        },
      })
    }
  }

  showReplies(post) {
    typeof this.props.onRepliesShow === 'function' ? this.props.onRepliesShow(post.discussion_id, post.id) : null
  }

  render() {
    const {
      post,
      theme: {
        colors,
        metrics: { blocks, fontSizes },
      },
    } = this.props
    if (post.location === 'header' || post.location === 'home') {
      return null
    }
    return (
      <View>
        <Swipeable
          onSwipeStart={e => {
            e.preventDefault()
            e.stopPropagation()
            return false
          }}
          // onSwipeStart={() => this.props.onSwipe(true)}
          // onSwipeRelease={() => this.props.onSwipe(false)}
          leftButtons={[
            !post.parsed?.advertisement && (
              <ButtonSquareComponent
                key={`${post.id}_btn_reply`}
                icon={'corner-down-right'}
                onPress={() => this.onReply()}
              />
            ),
            <ButtonSquareComponent
              key={`${post.id}_btn_share_content`}
              icon={'copy'}
              onPress={() => this.onShare(true)}
            />,
            <ButtonSquareComponent key={`${post.id}_btn_share`} icon={'share'} onPress={() => this.onShare()} />,
            post.can_be_reminded && (
              <ButtonSquareComponent
                key={`${post.id}_btn_remind`}
                icon={'bell'}
                color={post.reminder ? colors.primary : undefined}
                onPress={() => this.setReminder(post)}
              />
            ),
            post.can_be_deleted && (
              <ButtonSquareComponent
                key={`${post.id}_btn_delete`}
                icon={'trash-2'}
                color={'red'}
                onPress={() => this.deletePost(post)}
              />
            ),
            <ButtonSquareComponent
              key={`${post.id}_btn_report`}
              icon={'alert-triangle'}
              color={'red'}
              onPress={() => this.reportPost(post)}
            />,
          ].filter(b => !!b)}
          leftButtonContainerStyle={{ alignItems: 'flex-end' }}
          leftButtonWidth={50}
          rightButtonWidth={50}
          rightButtons={
            post.can_be_rated
              ? [
                  <ButtonSquareComponent
                    key={`${post.id}_btn_thumbs_up`}
                    icon={'thumbs-up'}
                    color={'green'}
                    onPress={() => this.ratePost(post, 'positive')}
                  />,
                  <ButtonSquareComponent
                    key={`${post.id}_btn_thumbs_down`}
                    icon={'thumbs-down'}
                    color={'red'}
                    onPress={() => this.ratePost(post, 'negative')}
                  />,
                ]
              : [<View />]
          }
          // onRightButtonsActivate={() => this.getRating(post)}
          rightButtonContainerStyle={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
          }}
          disable={!this.props.isInteractive}
          onRef={r => (this.refSwipeable = r)}>
          <TouchableRipple
            disabled={!this.props.isPressable}
            style={{ backgroundColor: this.props.isUnread ? colors.tertiary : colors.card }}
            onPress={() =>
              typeof this.props.onPress === 'function' ? this.props.onPress(post.discussion_id, post.id) : null
            }
            rippleColor={colors.ripple}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 3,
                paddingVertical: 3,
                borderTopColor: colors.disabled,
                // borderTopWidth: 1,
                borderLeftColor: this.props.isUnread ? colors.primary : colors.card,
                borderLeftWidth: 3,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: post.replies?.length > 0 && this.props.isInteractive ? '70%' : '80%',
                }}>
                {this.props.isReply && (
                  <Icon name={'corner-down-right'} size={20} style={{ marginRight: blocks.medium }} />
                )}
                {post.username?.length > 0 && <UserIconComponent username={post.username} marginRight={10} />}
                <View>
                  <Text
                    style={{
                      color: this.props.isUnread ? colors.text : colors.faded,
                      fontSize: fontSizes.h3,
                    }}
                    numberOfLines={1}>
                    {post.username?.length > 0 ? post.username : ''}
                    {post.replies?.length > 0 && this.props.isInteractive ? (
                      <ButtonRepliesComponent count={post.replies.length} onPress={() => this.showReplies(post)} />
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
                    isDisabled={!this.props.isInteractive}
                    onPress={() => this.getRating(post)}
                    postKey={post.id}
                    rating={post.rating === 0 ? `??${post.rating}` : post.rating > 0 ? `+${post.rating}` : post.rating}
                    myRating={post.my_rating}
                    ratingsPositive={this.state.ratings?.positive || []}
                    ratingsNegative={this.state.ratings?.negative || []}
                  />
                )}
                {post.reminder && (
                  <ButtonSquareComponent
                    icon={'bell'}
                    width={20}
                    height={40}
                    color={post.reminder ? colors.primary : undefined}
                    onPress={() => this.setReminder(post)}
                  />
                )}
                {!this.props.isInteractive && post.id > 0 && (
                  <ButtonSquareComponent
                    icon={'alert-triangle'}
                    width={20}
                    height={40}
                    color={'red'}
                    onPress={() => this.reportPost(post)}
                  />
                )}
              </View>
            </View>
          </TouchableRipple>
        </Swipeable>
        {this.state.isRatingRowVisible && this.state.ratings?.positive?.length > 0 && (
          <RatingDetailComponent
            ratings={this.state.ratings.positive}
            ratingWidth={this.state.ratingWidth}
            ratingHeight={this.state.ratingHeight}
            isPositive={true}
          />
        )}
        {this.state.isRatingRowVisible && this.state.ratings?.negative?.length > 0 && (
          <RatingDetailComponent
            ratings={this.state.ratings.negative}
            ratingWidth={this.state.ratingWidth}
            ratingHeight={this.state.ratingHeight}
            isPositive={false}
          />
        )}
      </View>
    )
  }
}
