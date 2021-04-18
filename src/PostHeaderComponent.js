import React, { Component } from 'react'
import { Text, TouchableOpacity, Image, View } from 'react-native'
import Swipeable from 'react-native-swipeable-row'
import { confirm, Nyx, Styling } from './'
import Icon from 'react-native-vector-icons/Feather'

type Props = {
  post: Object,
  isDarkMode: boolean,
  nyx: Nyx,
  onDelete: Function,
}
export class PostHeaderComponent extends Component<Props> {
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      ratings: {},
    }
    this.refSwipeable = null
  }

  async getRating(post) {
    if (this.state.ratings[post.id]) {
      return
    }
    const res = await this.props.nyx.getRating(post)
    const ratings = { ...this.state.ratings }
    ratings[post.id] = res
    this.setState({ ratings })
  }

  async castVote(post, vote) {
    await this.props.nyx.castVote(post, vote > 0 ? 'positive' : 'negative')
    if (this.refSwipeable) {
      this.refSwipeable.recenter()
    }
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
    let ratingH = 24 // 8*14 | 14*21 for 2 rows
    let ratingW = 16
    if (
      this.state.ratings[post.id] &&
      this.state.ratings[post.id].length > 0 &&
      this.state.ratings[post.id].length <= 10
    ) {
      // ratingH = 40
      // ratingW = 30
    } else if (
      this.state.ratings[post.id] &&
      this.state.ratings[post.id].length > 10 &&
      this.state.ratings[post.id].length <= 36
    ) {
      ratingH = 24
      ratingW = 16
    } else if (this.state.ratings[post.id] && this.state.ratings[post.id].length > 36) {
      ratingH = 16
      ratingW = 9
    }
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
        rightButtonWidth={300}
        rightButtons={
          this.state.ratings[post.id] && this.state.ratings[post.id].length > 0
            ? [
                <View
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    flexWrap: 'wrap',
                  }}>
                  {this.state.ratings[post.id].map(r => (
                    <View
                      style={{
                        maxWidth: ratingW,
                        maxHeight: ratingH,
                        marginRight: 3,
                        borderColor: 'red',
                        borderWidth: 0,
                      }}>
                      <Image
                        style={{ width: ratingW, height: ratingH }}
                        resizeMethod={'scale'}
                        resizeMode={'center'}
                        source={{ uri: `https://nyx.cz/${r.username[0]}/${r.username}.gif` }}
                      />
                    </View>
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
        onRef={r => (this.refSwipeable = r)}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 5,
            paddingBottom: 5,
            paddingTop: 5,
            borderColor: Styling.colors.primary,
            borderBottomWidth: post.new ? 1 : 0,
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: '80%' }}>
            <Image
              style={{ width: 30, height: 40, marginRight: 10, borderWidth: 1, borderColor: Styling.colors.lighter }}
              resizeMethod={'scale'}
              resizeMode={'center'}
              source={{ uri: `https://nyx.cz/${post.username[0]}/${post.username}.gif` }}
            />
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
                    : post.my_rating === 'negative'
                    ? 'red'
                    : Styling.colors.lighter,
                textAlign: 'right',
              },
            ]}>
            {post.rating}
          </Text>
        </View>
      </Swipeable>
    )
  }
}
