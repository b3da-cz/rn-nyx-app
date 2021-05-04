import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import Swipeable from 'react-native-swipeable-row'
import Icon from 'react-native-vector-icons/Feather'
import Share from 'react-native-share'
import { ButtonSquareComponent, confirm, RatingDetailComponent, UserIconComponent } from '../component'
import { Nyx, Styling, t } from '../lib'

type Props = {
  post: Object,
  nyx: Nyx,
  isDarkMode: boolean,
  isReply: boolean,
  isUnread: boolean,
  isInteractive: boolean,
  isPressable: boolean,
  onPress?: Function,
  onReply?: Function,
  onDelete: Function,
  onReminder?: Function,
  onVoteCast?: Function,
  onSwipe?: Function,
}
export class PostHeaderComponent extends Component<Props> {
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      ratings: {
        positive: [],
        negative: [],
      },
      ratingWidth: Styling.metrics.screen().width / 20,
      ratingHeight: (Styling.metrics.screen().width / 20) * 1.25,
    }
    this.refSwipeable = null
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
        Share.open({
          title: 'Content',
          message: this.props.post.parsed.clearText,
        })
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

  async getRating(post, bounceRight = false) {
    if (bounceRight && (this.state.ratings?.positive?.length > 0 || this.state.ratings?.negative?.length > 0)) {
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
    const ratingsMixed = await this.props.nyx.getRating(post)
    const ratings = {
      positive: ratingsMixed.filter(r => r.tag === 'positive'),
      negative: ratingsMixed.filter(r => r.tag !== 'positive'),
    }
    this.setState({ ratings })
  }

  async castVote(post, vote) {
    const res = await this.props.nyx.castVote(post, vote > 0 ? 'positive' : 'negative')
    this.refSwipeable?.recenter()
    this.props.onVoteCast(res)
  }

  async setReminder(post) {
    await this.props.nyx.setReminder(post.discussion_id, post.id, !post.reminder)
    this.refSwipeable?.recenter()
    this.props.onReminder(post, !post.reminder)
  }

  async deletePost(post) {
    const res = await confirm(t('confirm'), `${t('delete.post')}?`)
    if (res) {
      await this.props.nyx.deletePost(post.discussion_id, post.id)
      if (this.refSwipeable) {
        this.refSwipeable.recenter()
      }
      this.props.onDelete(post.id)
    }
  }

  formatDate(str) {
    const d = new Date(str)
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}  ${str.substring(11)}`
  }

  render() {
    const { post } = this.props
    if (post.location === 'header') {
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
            <ButtonSquareComponent
              key={`${post.id}_btn_reply`}
              icon={'corner-down-right'}
              onPress={() => this.onReply()}
            />,
            <ButtonSquareComponent
              key={`${post.id}_btn_share`}
              icon={'share'}
              onPress={() => this.onShare()}
              onLongPress={() => this.onShare(true)}
            />,
            post.can_be_reminded && (
              <ButtonSquareComponent
                key={`${post.id}_btn_remind`}
                icon={'bell'}
                color={post.reminder ? Styling.colors.primary : Styling.colors.lighter}
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
                    onPress={() => this.castVote(post, 1)}
                  />,
                  <ButtonSquareComponent
                    key={`${post.id}_btn_thumbs_down`}
                    icon={'thumbs-down'}
                    color={'red'}
                    onPress={() => this.castVote(post, -1)}
                  />,
                ]
              : [<View />]
          }
          onRightButtonsActivate={() => this.getRating(post)}
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
            onPress={() => this.props.onPress(post.discussion_id, post.id)}
            rippleColor={'rgba(18,146,180, 0.73)'}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 5,
                paddingVertical: 5,
                borderTopColor: Styling.colors.dark,
                // borderTopWidth: 1,
                // backgroundColor: this.props.isDarkMode ? Styling.colors.darker : Styling.colors.lighter,
                borderBottomColor: Styling.colors.accent,
                borderBottomWidth: this.props.isUnread ? 1 : 0,
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: '80%' }}>
                {this.props.isReply && (
                  <Icon
                    name={'corner-down-right'}
                    size={20}
                    color={this.props.isDarkMode ? Styling.colors.lighter : Styling.colors.darker}
                    style={{ marginRight: Styling.metrics.block.small }}
                  />
                )}
                {post.username?.length > 0 && <UserIconComponent username={post.username} marginRight={10} />}
                <View>
                  <Text
                    style={[
                      Styling.groups.link(),
                      { color: this.props.isUnread ? Styling.colors.accent : Styling.colors.primary },
                    ]}
                    numberOfLines={1}>
                    {post.username?.length > 0 ? post.username : ''}{' '}
                    {post.discussion_name?.length > 0 && (
                      <Text style={{ color: Styling.colors.primary, fontSize: 16 }}>- {post.discussion_name}</Text>
                    )}
                    {post.activity && (
                      <Text style={{ color: Styling.colors.dark, fontSize: 12 }}>
                        {`[${post.activity.last_activity.substr(11)}|${post.activity.last_access_method[0]}]`}
                        {post.activity.location}
                      </Text>
                    )}
                  </Text>
                  <Text
                    style={{
                      color: this.props.isUnread ? Styling.colors.accent : Styling.colors.lighter,
                      fontSize: 10,
                    }}>
                    {post?.inserted_at?.length > 0 && this.formatDate(post.inserted_at)}
                  </Text>
                </View>
              </View>
              {post.reminder && (
                <ButtonSquareComponent
                  icon={'bell'}
                  height={40}
                  color={post.reminder ? Styling.colors.primary : Styling.colors.lighter}
                  onPress={() => this.setReminder(post)}
                />
              )}
              {post.rating !== undefined && (
                <TouchableRipple
                  disabled={!this.props.isInteractive}
                  rippleColor={'rgba(18,146,180, 0.73)'}
                  onPress={() => this.getRating(post, true)}>
                  <Text
                    style={[
                      {
                        padding: 10,
                        color:
                          post.my_rating === 'positive'
                            ? 'green'
                            : post.my_rating === 'negative' || post.my_rating === 'negative_visible'
                            ? 'red'
                            : Styling.colors.lighter,
                        textAlign: 'right',
                      },
                    ]}>
                    {post.rating === 0 ? `±${post.rating}` : post.rating > 0 ? `+${post.rating}` : post.rating}
                  </Text>
                </TouchableRipple>
              )}
            </View>
          </TouchableRipple>
        </Swipeable>
        {this.state.ratings?.positive?.length > 0 && (
          <RatingDetailComponent
            ratings={this.state.ratings.positive}
            ratingWidth={this.state.ratingWidth}
            ratingHeight={this.state.ratingHeight}
            isDarkMode={this.props.isDarkMode}
            isPositive={true}
          />
        )}
        {this.state.ratings?.negative?.length > 0 && (
          <RatingDetailComponent
            ratings={this.state.ratings.negative}
            ratingWidth={this.state.ratingWidth}
            ratingHeight={this.state.ratingHeight}
            isDarkMode={this.props.isDarkMode}
            isPositive={false}
          />
        )}
      </View>
    )
  }
}
