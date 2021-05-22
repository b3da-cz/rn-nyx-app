import React, { Component } from 'react'
import { FlatList, Image, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { PostComponent, RatingDetailComponent } from '../component'
import { MainContext, parseNotificationsContent, Styling } from '../lib'

type Props = {
  navigation: any,
  onImages: Function,
}
export class NotificationsView extends Component<Props> {
  static contextType = MainContext
  constructor(props) {
    super(props)
    this.state = {
      unreadCount: 0,
      posts: [],
      isFetching: false,
    }
    this.refScroll = null
    this.navTabPressListener = null
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.navTabPressListener = this.props.navigation.dangerouslyGetParent().addListener('tabPress', () => {
      const isFocused = this.props.navigation.isFocused()
      if (isFocused && !this.state.isFetching) {
        this.getNotifications()
      }
    })
    this.getNotifications()
  }

  componentWillUnmount() {
    if (this.navTabPressListener) {
      this.navTabPressListener()
    }
  }

  async getNotifications() {
    this.setState({ isFetching: true })
    const res = await this.nyx.getNotifications()
    const parsedNotifications = parseNotificationsContent(res.notifications)
    this.setState({
      unreadCount: res.context.user.notifications_unread,
      posts: parsedNotifications,
      isFetching: false,
    })
  }

  showImages(image) {
    this.props.onImages([{ url: image.src }], 0)
  }

  showPost(discussionId, postId) {
    this.props.navigation.push('discussion', { discussionId, postId })
  }

  renderItem(item) {
    const { replies, thumbs_up } = item.details
    return (
      <View
        key={`${item.data.id}_container`}
        style={[
          Styling.groups.themeView(this.isDarkMode),
          { borderBottomWidth: 2, borderColor: Styling.colors.primary },
        ]}>
        <PostComponent
          key={item.data.id}
          post={item.data}
          nyx={this.nyx}
          isDarkMode={this.isDarkMode}
          isHeaderInteractive={false}
          isHeaderPressable={true}
          onHeaderPress={(discussionId, postId) => this.showPost(discussionId, postId)}
          onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
          onImage={image => this.showImages(image)}
        />
        {thumbs_up?.length > 0 && (
          <RatingDetailComponent
            postKey={item.data.id}
            ratings={thumbs_up}
            ratingWidth={32}
            ratingHeight={40}
            isDarkMode={this.isDarkMode}
            isPositive={true}
          />
        )}
        {replies && replies.length > 0 && replies.map(r => this.renderReply(r))}
      </View>
    )
  }

  renderReply(post) {
    return (
      <View style={{ flexDirection: 'row' }} key={`${post.id}${post.discussionId}`}>
        <TouchableRipple
          key={post.id}
          disabled={false}
          onPress={() => this.showPost(post.discussion_id, post.id)}
          rippleColor={'rgba(18,146,180, 0.73)'}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: this.isDarkMode ? Styling.colors.black : Styling.colors.white,
            zIndex: 1,
          }}>
          <Icon
            name={'corner-down-right'}
            size={20}
            color={this.isDarkMode ? Styling.colors.lighter : Styling.colors.darker}
          />
        </TouchableRipple>
        <View style={{ flex: 5 }}>
          <PostComponent
            key={post.id}
            post={post}
            nyx={this.nyx}
            isDarkMode={this.isDarkMode}
            isHeaderInteractive={false}
            isHeaderPressable={true}
            onHeaderPress={(discussionId, postId) => this.showPost(discussionId, postId)}
            onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
            onImage={image => this.showImages(image)}
          />
        </View>
      </View>
    )
  }

  renderRating(rating) {
    return (
      <View
        key={rating.inserted_at}
        style={{
          maxWidth: 16,
          maxHeight: 24,
          marginRight: 3,
          marginBottom: 3,
          borderColor: 'red',
          // borderWidth: 1,
        }}>
        <Image
          style={{ width: 16, height: 24 }}
          resizeMethod={'scale'}
          resizeMode={'center'}
          source={{ uri: `https://nyx.cz/${rating.username[0]}/${rating.username}.gif` }}
        />
      </View>
    )
  }

  render() {
    return (
      <FlatList
        style={{ backgroundColor: this.isDarkMode ? Styling.colors.black : Styling.colors.white }}
        ref={r => (this.refScroll = r)}
        data={this.state.posts}
        extraData={this.state}
        keyExtractor={(item, index) => `${item.id}`}
        refreshing={this.state.isFetching}
        onRefresh={() => this.getNotifications()}
        renderItem={({ item }) => this.renderItem(item)}
      />
    )
  }
}
