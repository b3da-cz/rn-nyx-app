import React, { Component } from 'react'
import { LayoutAnimation, ToastAndroid, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import Clipboard from '@react-native-clipboard/clipboard'
import Share from 'react-native-share'
import { ButtonSquareComponent, confirm, RatingDetailComponent } from '../component'
import { LayoutAnimConf, MainContext, Nyx, isLocalLastReadEnabled, rgbToHex, showNotificationBanner, t, Theme } from '../lib'
import { PostHeaderCommonComponent } from './PostHeaderCommonComponent'

type Props = {
  post: any
  nyx: Nyx
  theme: Theme
  isReply: boolean
  isUnread: boolean
  isInteractive: boolean
  isLocalLastRead?: boolean
  onReply?: Function
  onRepliesShow?: Function
  onDelete: Function
  onReminder?: Function
  onSetLastRead?: Function
  onPostRated?: Function
}
type State = {
  areButtonsVisible: boolean
  isFetching: boolean
  isRatingRowVisible: boolean
  ratings: {
    positive: any[]
    negative: any[]
  }
  ratingWidth: number
  ratingHeight: number
  headerHeight: number
}
export class PostHeaderComponent extends Component<Props> {
  static contextType = MainContext
  state: Readonly<State>

  constructor(props) {
    super(props)
    this.state = {
      areButtonsVisible: false,
      isFetching: false,
      isRatingRowVisible: false,
      ratings: {
        positive: [],
        negative: [],
      },
      ratingWidth: 20,
      ratingHeight: 25,
      headerHeight: 0,
    }
  }

  componentDidMount() {
    this.getRatingByFriends()
  }

  onReply() {
    if (typeof this.props.onReply === 'function') {
      this.props.onReply(this.props.post.discussion_id, this.props.post.id, this.props.post.username)
    }
    setTimeout(() => this.toggleButtons(false), 300)
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
      setTimeout(() => this.toggleButtons(false), 300)
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

  async getRating(post) {
    if (this.state.ratings?.positive?.length > 0 || this.state.ratings?.negative?.length > 0) {
      LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
      this.setState({
        ratings: {
          positive: [],
          negative: [],
        },
      })
      return
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
    this.toggleButtons(false)
    typeof this.props.onPostRated === 'function' ? this.props.onPostRated(res) : null
  }

  async setReminder(post) {
    await this.props.nyx.api.setReminder(post.discussion_id, post.id, !post.reminder)
    this.toggleButtons(false)
    typeof this.props.onReminder === 'function' ? this.props.onReminder(post, !post.reminder) : null
  }

  setLocalLastRead(post) {
    this.toggleButtons(false)
    if (typeof this.props.onSetLastRead === 'function') {
      this.props.onSetLastRead(post)
    }
  }

  async deletePost(post) {
    const res = await confirm(t('confirm'), `${t('delete.post')}?`)
    if (res) {
      await this.props.nyx.api.deletePost(post.discussion_id, post.id)
      this.toggleButtons(false)
      this.props.onDelete(post.id)
    }
  }

  async reportPost(post) {
    const res = await confirm(t('confirm'), `${t('reportPost')}?`)
    if (res) {
      await this.props.nyx.api.reportPost(post.id)
      this.toggleButtons(false)
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

  toggleButtons(show: boolean) {
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({ areButtonsVisible: show })
  }

  onHeaderLayout(height: number) {
    if (height > 0 && Math.abs(height - this.state.headerHeight) > 0.5) {
      this.setState({ headerHeight: height })
    }
  }

  render() {
    const {
      post,
      theme: { colors },
    } = this.props
    if (post.location === 'header' || post.location === 'home') {
      return null
    }
    let visibleBtns = 4
    const config = this.context?.config
    const showLocalLastRead =
      isLocalLastReadEnabled(config) &&
      this.props.isInteractive &&
      !post.parsed?.advertisement &&
      Boolean(post.discussion_id && post.discussion_id > 0)
    if (!post.parsed?.advertisement) {
      visibleBtns++
    }
    if (post.can_be_reminded) {
      visibleBtns++
    }
    if (showLocalLastRead) {
      visibleBtns++
    }
    if (post.can_be_deleted) {
      visibleBtns++
    }
    if (post.can_be_rated) {
      visibleBtns += 2
    }
    const btnWidth = `${100 / visibleBtns}%`
    const buttonHeight = this.state.headerHeight > 0 ? this.state.headerHeight : undefined
    return (
      <View>
        <View>
          <View
            collapsable={false}
            pointerEvents={this.state.areButtonsVisible ? 'none' : 'auto'}
            importantForAccessibility={this.state.areButtonsVisible ? 'no-hide-descendants' : 'auto'}
            style={{ opacity: this.state.areButtonsVisible ? 0 : 1 }}
            onLayout={event => this.onHeaderLayout(event.nativeEvent.layout.height)}>
            <TouchableRipple
              style={{ backgroundColor: this.props.isUnread ? colors.tertiary : colors.card }}
              onPress={() => this.toggleButtons(!this.state.areButtonsVisible)}
              rippleColor={colors.ripple}>
              <PostHeaderCommonComponent
                post={post}
                theme={this.props.theme}
                ratings={this.state.ratings}
                isReply={this.props.isReply}
                isUnread={this.props.isUnread}
                isInteractive={this.props.isInteractive}
                isLocalLastRead={this.props.isLocalLastRead}
                getRating={p => this.getRating(p)}
                showReplies={p => this.showReplies(p)}
                setReminder={p => this.setReminder(p)}
                setLastRead={p => this.setLocalLastRead(p)}
                reportPost={p => this.reportPost(p)}
              />
            </TouchableRipple>
          </View>
          {this.state.areButtonsVisible && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                flexDirection: 'row',
                overflow: 'hidden',
              }}>
              <ButtonSquareComponent
                key={`${post.id}_btn_report`}
                width={btnWidth}
                height={buttonHeight}
                icon={'alert-triangle'}
                color={'red'}
                onPress={() => this.reportPost(post)}
              />
              {post.can_be_deleted && (
                <ButtonSquareComponent
                  key={`${post.id}_btn_delete`}
                  width={btnWidth}
                  height={buttonHeight}
                  icon={'trash-2'}
                  color={'red'}
                  onPress={() => this.deletePost(post)}
                />
              )}
              <ButtonSquareComponent
                key={`${post.id}_btn_share_content`}
                width={btnWidth}
                height={buttonHeight}
                icon={'copy'}
                onPress={() => this.onShare(true)}
              />
              <ButtonSquareComponent
                key={`${post.id}_btn_share`}
                width={btnWidth}
                height={buttonHeight}
                icon={'share'}
                onPress={() => this.onShare()}
              />
              {post.can_be_reminded && (
                <ButtonSquareComponent
                  key={`${post.id}_btn_remind`}
                  width={btnWidth}
                  height={buttonHeight}
                  icon={'bell'}
                  color={post.reminder ? colors.primary : undefined}
                  onPress={() => this.setReminder(post)}
                />
              )}
              {showLocalLastRead && (
                <ButtonSquareComponent
                  key={`${post.id}_btn_last_read`}
                  width={btnWidth}
                  height={buttonHeight}
                  icon={'bookmark'}
                  color={this.props.isLocalLastRead ? colors.primary : undefined}
                  onPress={() => this.setLocalLastRead(post)}
                />
              )}
              {!post.parsed?.advertisement && (
                <ButtonSquareComponent
                  key={`${post.id}_btn_reply`}
                  width={btnWidth}
                  height={buttonHeight}
                  icon={'corner-down-right'}
                  onPress={() => this.onReply()}
                />
              )}
              {post.can_be_rated && (
                <ButtonSquareComponent
                  key={`${post.id}_btn_thumbs_up`}
                  width={btnWidth}
                  height={buttonHeight}
                  icon={'thumbs-up'}
                  color={'green'}
                  onPress={() => this.ratePost(post, 'positive')}
                />
              )}
              {post.can_be_rated && (
                <ButtonSquareComponent
                  key={`${post.id}_btn_thumbs_down`}
                  width={btnWidth}
                  height={buttonHeight}
                  icon={'thumbs-down'}
                  color={'red'}
                  onPress={() => this.ratePost(post, 'negative')}
                />
              )}
              <ButtonSquareComponent
                key={`${post.id}_btn_hide_btns`}
                width={btnWidth}
                height={buttonHeight}
                icon={'x'}
                color={colors.primary}
                onPress={() => this.setState({ areButtonsVisible: false })}
              />
            </View>
          )}
        </View>
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
