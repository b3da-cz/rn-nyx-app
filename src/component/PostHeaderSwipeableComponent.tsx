import React, { Component } from 'react'
import { LayoutAnimation, ToastAndroid, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import { Swipeable } from 'react-native-gesture-handler'
import Clipboard from '@react-native-clipboard/clipboard'
import Share from 'react-native-share'
import { RNNotificationBanner } from 'react-native-notification-banner'
import { ButtonSquareComponent, confirm, RatingDetailComponent, ReminderTargetDialog } from '../component'
import {
  addPostToCustomList,
  isLocalLastReadEnabled,
  LayoutAnimConf,
  MainContext,
  Nyx,
  removePostFromAllCustomLists,
  rgbToHex,
  showNotificationBanner,
  t,
  Theme,
} from '../lib'
import { PostHeaderCommonComponent } from './PostHeaderCommonComponent'

type Props = {
  post: any
  nyx: Nyx
  theme: Theme
  isReply: boolean
  isUnread: boolean
  isInteractive: boolean
  isPressable: boolean
  isLocalLastRead?: boolean
  isCustomReminded?: boolean
  onPress?: Function
  onReply?: Function
  onRepliesShow?: Function
  onDelete: Function
  onReminder?: Function
  onSetLastRead?: Function
  onPostRated?: Function
  onSwipe?: Function
  mailMode?: boolean
}
type State = {
  isFetching: boolean
  isRatingRowVisible: boolean
  isReminderDialogOpen: boolean
  ratings: {
    positive: any[]
    negative: any[]
  }
  ratingWidth: number
  ratingHeight: number
}
export class PostHeaderSwipeableComponent extends Component<Props> {
  static contextType = MainContext
  get mainContext(): any {
    return this.context
  }
  state: Readonly<State>
  refSwipeable: any
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      isRatingRowVisible: false,
      isReminderDialogOpen: false,
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

  componentWillUnmount() {
    this.mainContext?.refs?.setNavSwipeEnabled?.(true, `post_${this.props.post?.id}`)
  }

  handleTouchStart = () => {
    if (!this.props.isInteractive) {
      return
    }
    this.mainContext?.refs?.setNavSwipeEnabled?.(false, `post_${this.props.post?.id}`)
  }

  handleTouchEnd = () => {
    if (!this.props.isInteractive) {
      return
    }
    this.mainContext?.refs?.setNavSwipeEnabled?.(true, `post_${this.props.post?.id}`)
  }

  onSwipeEnd = () => {
    this.mainContext?.refs?.setNavSwipeEnabled?.(true, `post_${this.props.post?.id}`)
  }

  onReply() {
    if (typeof this.props.onReply === 'function') {
      if (this.props.mailMode) {
        this.props.onReply(this.props.post.username)
      } else {
        this.props.onReply(this.props.post.discussion_id, this.props.post.id, this.props.post.username)
      }
    }
    setTimeout(() => this.refSwipeable?.close(), 300)
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
      setTimeout(() => this.refSwipeable?.close(), 300)
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
      // gesture-handler has no bounce; briefly reveal the rate actions instead
      this.refSwipeable?.openRight()
      setTimeout(() => this.refSwipeable?.close(), 400)
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
    this.refSwipeable?.close()
    typeof this.props.onPostRated === 'function' ? this.props.onPostRated(res) : null
  }

  async setReminder(post) {
    const isCustom = Boolean(this.props.isCustomReminded)
    if (post.reminder || isCustom) {
      if (post.reminder) {
        if (this.props.mailMode || post.location === 'mail' || !post.discussion_id) {
          await this.props.nyx.api.setReminder(0, post.id, false)
        } else {
          await this.props.nyx.api.setReminder(post.discussion_id, post.id, false)
        }
        post.reminder = false
      }
      if (isCustom) {
        await removePostFromAllCustomLists(post.id)
      }
      this.refSwipeable?.close()
      typeof this.props.onReminder === 'function' ? this.props.onReminder(post, false) : null
      this.forceUpdate()
    } else {
      this.refSwipeable?.close()
      this.setState({ isReminderDialogOpen: true })
    }
  }

  async onSaveNyxReminder(post) {
    if (this.props.mailMode || post.location === 'mail' || !post.discussion_id) {
      await this.props.nyx.api.setReminder(0, post.id, true)
    } else {
      await this.props.nyx.api.setReminder(post.discussion_id, post.id, true)
    }
    post.reminder = true
    this.setState({ isReminderDialogOpen: false })
    typeof this.props.onReminder === 'function' ? this.props.onReminder(post, true) : null
    this.forceUpdate()
  }

  async onSaveCustomReminder(listId: string, post) {
    await addPostToCustomList(listId, post)
    this.setState({ isReminderDialogOpen: false })
    typeof this.props.onReminder === 'function' ? this.props.onReminder(post, true) : null
    this.forceUpdate()
  }

  setLocalLastRead(post) {
    this.refSwipeable?.close()
    if (typeof this.props.onSetLastRead === 'function') {
      this.props.onSetLastRead(post)
    }
  }

  async deletePost(post) {
    const res = await confirm(t('confirm'), `${t('delete.post')}?`)
    if (res) {
      if (this.props.mailMode) {
        await this.props.nyx.api.deleteMail(post.id)
      } else {
        await this.props.nyx.api.deletePost(post.discussion_id, post.id)
      }
      if (this.refSwipeable) {
        this.refSwipeable.close()
      }
      this.props.onDelete(post.id)
    }
  }

  async reportPost(post) {
    const res = await confirm(t('confirm'), `${t('reportPost')}?`)
    if (res) {
      await this.props.nyx.api.reportPost(post.id)
      if (this.refSwipeable) {
        this.refSwipeable.close()
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

  renderMailLeftActions() {
    const { post, theme: { colors }, isReply } = this.props
    return (
      <View style={{ flexDirection: 'row' }} collapsable={false}>
        {[
          isReply && (
            <ButtonSquareComponent
              key={`${post.id}_btn_reply`}
              icon={'corner-down-right'}
              rectButton
              onPress={() => this.onReply()}
            />
          ),
          <ButtonSquareComponent
            key={`${post.id}_btn_remind`}
            icon={'bell'}
            rectButton
            color={post.reminder ? colors.primary : this.props.isCustomReminded ? colors.secondary : undefined}
            onPress={() => this.setReminder(post)}
          />,
          <ButtonSquareComponent
            key={`${post.id}_btn_delete`}
            icon={'trash-2'}
            rectButton
            color={'red'}
            onPress={() => this.deletePost(post)}
          />,
          isReply && (
            <ButtonSquareComponent
              key={`${post.id}_btn_report`}
              icon={'alert-triangle'}
              rectButton
              color={'red'}
              onPress={() => this.reportPost(post)}
            />
          ),
        ].filter(b => !!b)}
      </View>
    )
  }

  renderMailRightActions() {
    return null
  }

  render() {
    const {
      post,
      theme: { colors },
    } = this.props
    if (post.location === 'header' || post.location === 'home') {
      return null
    }
    const config = this.context?.config
    const showLocalLastRead =
      isLocalLastReadEnabled(config) &&
      !this.props.mailMode &&
      !post.parsed?.advertisement &&
      Boolean(post.discussion_id && post.discussion_id > 0)
    return (
      <View
        onTouchStart={this.handleTouchStart}
        onTouchEnd={this.handleTouchEnd}
        onTouchCancel={this.handleTouchEnd}>
        <Swipeable
          ref={r => {
            this.refSwipeable = r
          }}
          enabled={this.props.isInteractive}
          friction={2}
          overshootFriction={8}
          leftThreshold={40}
          rightThreshold={40}
          dragOffsetFromLeftEdge={10}
          dragOffsetFromRightEdge={10}
          activeOffsetX={[-10, 10]}
          disallowInterruption={true}
          onSwipeableWillOpen={this.onSwipeEnd}
          onSwipeableWillClose={this.onSwipeEnd}
          onSwipeableClose={this.onSwipeEnd}
          renderLeftActions={
            this.props.mailMode
              ? () => this.renderMailLeftActions()
              : () => (
                  <View style={{ flexDirection: 'row' }} collapsable={false}>
                    {[
                      !post.parsed?.advertisement && (
                        <ButtonSquareComponent
                          key={`${post.id}_btn_reply`}
                          icon={'corner-down-right'}
                          rectButton
                          onPress={() => this.onReply()}
                        />
                      ),
                      <ButtonSquareComponent
                        key={`${post.id}_btn_share_content`}
                        icon={'copy'}
                        rectButton
                        onPress={() => this.onShare(true)}
                      />,
                      <ButtonSquareComponent
                        key={`${post.id}_btn_share`}
                        icon={'share'}
                        rectButton
                        onPress={() => this.onShare()}
                      />,
                      (post.can_be_reminded || this.props.isCustomReminded || post.reminder) && (
                        <ButtonSquareComponent
                          key={`${post.id}_btn_remind`}
                          icon={'bell'}
                          rectButton
                          color={post.reminder ? colors.primary : this.props.isCustomReminded ? colors.secondary : undefined}
                          onPress={() => this.setReminder(post)}
                        />
                      ),
                      showLocalLastRead && (
                        <ButtonSquareComponent
                          key={`${post.id}_btn_last_read`}
                          icon={'bookmark'}
                          rectButton
                          color={this.props.isLocalLastRead ? colors.primary : undefined}
                          onPress={() => this.setLocalLastRead(post)}
                        />
                      ),
                      post.can_be_deleted && (
                        <ButtonSquareComponent
                          key={`${post.id}_btn_delete`}
                          icon={'trash-2'}
                          rectButton
                          color={'red'}
                          onPress={() => this.deletePost(post)}
                        />
                      ),
                      <ButtonSquareComponent
                        key={`${post.id}_btn_report`}
                        icon={'alert-triangle'}
                        rectButton
                        color={'red'}
                        onPress={() => this.reportPost(post)}
                      />,
                    ].filter(b => !!b)}
                  </View>
                )
          }
          renderRightActions={
            this.props.mailMode
              ? undefined
              : post.can_be_rated
              ? () => (
                  <View style={{ flexDirection: 'row' }} collapsable={false}>
                    <ButtonSquareComponent
                      key={`${post.id}_btn_thumbs_up`}
                      icon={'thumbs-up'}
                      rectButton
                      color={'green'}
                      onPress={() => this.ratePost(post, 'positive')}
                    />
                    <ButtonSquareComponent
                      key={`${post.id}_btn_thumbs_down`}
                      icon={'thumbs-down'}
                      rectButton
                      color={'red'}
                      onPress={() => this.ratePost(post, 'negative')}
                    />
                  </View>
                )
              : undefined
          }>
          <TouchableRipple
            style={{ backgroundColor: this.props.isUnread ? colors.tertiary : colors.card }}
            onPress={() =>
              this.props.isPressable && typeof this.props.onPress === 'function'
                ? this.props.onPress(post.discussion_id, post.id)
                : null
            }
            rippleColor={colors.ripple}>
            <PostHeaderCommonComponent
              post={post}
              theme={this.props.theme}
              ratings={this.state.ratings}
              isReply={this.props.isReply}
              isUnread={this.props.isUnread}
              isInteractive={this.props.isInteractive}
              isLocalLastRead={this.props.isLocalLastRead}
              isCustomReminded={this.props.isCustomReminded}
              getRating={p => this.getRating(p)}
              showReplies={p => this.showReplies(p)}
              setReminder={p => this.setReminder(p)}
              setLastRead={p => this.setLocalLastRead(p)}
              reportPost={p => this.reportPost(p)}
            />
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
        {this.state.isReminderDialogOpen && (
          <ReminderTargetDialog
            visible={this.state.isReminderDialogOpen}
            post={post}
            mailMode={this.props.mailMode || post.location === 'mail'}
            theme={this.props.theme}
            onDismiss={() => this.setState({ isReminderDialogOpen: false })}
            onSaveToNyx={() => this.onSaveNyxReminder(post)}
            onSaveToCustomList={listId => this.onSaveCustomReminder(listId, post)}
          />
        )}
      </View>
    )
  }
}
