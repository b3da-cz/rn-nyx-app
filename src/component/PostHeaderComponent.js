import React, { Component } from 'react'
import { Text, TouchableOpacity, Image, View } from 'react-native'
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
  onDelete: Function,
  onVoteCast?: Function,
}
export class PostHeaderComponent extends Component<Props> {
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      ratings: [],
      ratingWidth: 16,
      ratingHeight: 24,
      ratingSwiperWidth: 50,
    }
    this.refSwipeable = null
  }

  async getRating(post) {
    if (this.state.ratings && this.state.ratings.length > 0) {
      return
    }
    const ratings = await this.props.nyx.getRating(post)
    // next is 144 on op6 screen width.. (~280 on landscape)
    if (ratings && ratings.length > 84) {
      this.setState({
        ratings,
        ratingWidth: 10,
        ratingHeight: 12.5,
        ratingSwiperWidth: ((ratings.length + 1) / 4) * 11 + 5,
      })
    } else if (ratings && ratings.length > 36) {
      this.setState({
        ratings,
        ratingWidth: 13.3,
        ratingHeight: 16.6,
        ratingSwiperWidth: ((ratings.length + 1) / 3) * 14.3 + 5,
      })
    } else if (ratings && ratings.length > 9) {
      this.setState({
        ratings,
        ratingWidth: 20,
        ratingHeight: 25,
        ratingSwiperWidth: ((ratings.length + 1) / 2) * 21 + 5,
      })
    } else {
      this.setState({ ratings, ratingWidth: 40, ratingHeight: 50, ratingSwiperWidth: ratings.length * 41 + 5 })
    }
  }

  async castVote(post, vote) {
    const res = await this.props.nyx.castVote(post, vote > 0 ? 'positive' : 'negative')
    if (this.refSwipeable) {
      this.refSwipeable.recenter()
    }
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
      <Swipeable
        leftButtons={[
          !post.can_be_deleted ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => this.castVote(post, 1)}
              style={[Styling.groups.squareBtn, { backgroundColor: 'green' }]}>
              <Icon name="plus" size={24} color="#ccc" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => this.deletePost(post)}
              style={[Styling.groups.squareBtn]}>
              <Icon name="trash-2" size={24} color="#ccc" />
            </TouchableOpacity>
          ),
          !post.can_be_deleted ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => this.castVote(post, -1)}
              style={[Styling.groups.squareBtn]}>
              <Icon name="minus" size={24} color="#ccc" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 5, height: 50 }} />
          ),
        ]}
        leftButtonContainerStyle={{ alignItems: 'flex-end' }}
        leftButtonWidth={post.can_be_deleted ? 25 : 50}
        rightButtonWidth={this.state.ratingSwiperWidth}
        rightButtons={
          this.state.ratings && this.state.ratings.length > 0
            ? [
                <View
                  style={{
                    flexDirection: 'column',
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
                </View>,
              ]
            : [<Text style={{ lineHeight: 38, color: Styling.colors.lighter }}>pull to get ratings</Text>]
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
                <Text style={{ color: Styling.colors.lighter, fontSize: 10 }}>{this.formatDate(post.inserted_at)}</Text>
              </View>
            </View>
            <Text
              style={[
                {
                  width: '10%',
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
          </View>
        </TouchableRipple>
      </Swipeable>
    )
  }
}
