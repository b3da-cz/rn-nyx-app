import React, { Component } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import Swipeable from 'react-native-swipeable-row'
import Icon from 'react-native-vector-icons/Feather'
import { confirm, UserIconComponent } from '../component'
import { Nyx, Styling } from '../lib'

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
  onVoteCast?: Function,
}
export class PostHeaderComponent extends Component<Props> {
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      ratings: [],
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

  async getRating(post, bounceRight = false) {
    if (bounceRight) {
      this.refSwipeable?.bounceRight()
    }
    if (this.state.ratings && this.state.ratings.length > 0) {
      return;
    }
    const ratings = await this.props.nyx.getRating(post)
    this.setState({ ratings })
  }

  async castVote(post, vote) {
    const res = await this.props.nyx.castVote(post, vote > 0 ? 'positive' : 'negative')
    this.refSwipeable?.recenter()
    this.props.onVoteCast(res)
  }

  async deletePost(post) {
    const res = await confirm('Warning', 'Delete post?')
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
    return (
      <View>
        <Swipeable
          leftButtons={[
            post.can_be_deleted ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => this.deletePost(post)}
                style={[Styling.groups.squareBtn]}>
                <Icon name="trash-2" size={24} color={Styling.colors.lighter} />
              </TouchableOpacity>
            ) : (
              <View style={[Styling.groups.squareBtn, { backgroundColor: Styling.colors.darker }]}>
                <Icon name="corner-down-right" size={24} color={Styling.colors.lighter} />
              </View>
            ),
          ]}
          leftButtonContainerStyle={{ alignItems: 'flex-end' }}
          leftButtonWidth={50}
          onLeftButtonsOpenRelease={() => !post.can_be_deleted && this.onReply()}
          rightButtonWidth={50}
          rightButtons={
            post.can_be_deleted
              ? [<View />]
              : [
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => this.castVote(post, 1)}
                    style={[Styling.groups.squareBtn, { backgroundColor: 'green' }]}>
                    <Icon name="thumbs-up" size={24} color={Styling.colors.lighter} />
                  </TouchableOpacity>,
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => this.castVote(post, -1)}
                    style={[Styling.groups.squareBtn]}>
                    <Icon name="thumbs-down" size={24} color={Styling.colors.lighter} />
                  </TouchableOpacity>,
                ]
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
                paddingBottom: 5,
                paddingTop: 5,
                borderTopColor: Styling.colors.dark,
                borderTopWidth: 1,
                // backgroundColor: this.props.isDarkMode ? Styling.colors.darker : Styling.colors.lighter,
                borderColor: Styling.colors.primary,
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
                <UserIconComponent username={post.username} marginRight={10} />
                <View>
                  <Text style={Styling.groups.link()} numberOfLines={1}>
                    {post.username}{' '}
                    <Text style={{ color: Styling.colors.dark, fontSize: 12 }}>
                      {post.activity &&
                        `[${post.activity.last_activity.substr(11)}|${post.activity.last_access_method[0]}] ${
                          post.activity.location
                        }`}
                    </Text>
                  </Text>
                  <Text style={{ color: Styling.colors.lighter, fontSize: 10 }}>
                    {this.formatDate(post.inserted_at)}
                  </Text>
                </View>
              </View>
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
                  {post.rating}
                </Text>
              </TouchableRipple>
            </View>
          </TouchableRipple>
        </Swipeable>
        {this.state.ratings && this.state.ratings.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              flexWrap: 'wrap',
            }}>
            {this.state.ratings.map(r => (
              <UserIconComponent
                key={`${r.username}${r.tag}`}
                username={r.username}
                width={this.state.ratingWidth}
                height={this.state.ratingHeight}
                borderWidth={1}
                marginRight={1}
              />
            ))}
          </View>
        )}
      </View>
    )
  }
}
