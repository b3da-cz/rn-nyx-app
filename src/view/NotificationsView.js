import React, { Component } from 'react'
import { FlatList, Image, View } from 'react-native'
import { PostComponent } from '../component'
import { Context, parseNotificationsContent, Styling } from '../lib'

type Props = {
  onImages: Function,
  onNavigation: Function,
}
export class NotificationsView extends Component<Props> {
  static contextType = Context
  constructor(props) {
    super(props)
    this.state = {
      unreadCount: 0,
      posts: [],
      isFetching: false,
    }
    this.refScroll = null
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.getNotifications()
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
    this.props.onNavigation({ discussionId, postId })
  }

  onPostDelete() {
    console.warn('nope, todo'); // TODO: remove
  }

  renderItem(item) {
    const { replies, thumbs_up } = item.details
    return (
      <View
        style={[
          Styling.groups.themeView(this.isDarkMode),
          { borderBottomWidth: 2, borderColor: Styling.colors.primary },
        ]}>
        {/*// <TouchableOpacity*/}
        {/*//   style={[*/}
        {/*//     Styling.groups.themeView(this.isDarkMode),*/}
        {/*//     { borderBottomWidth: 2, borderColor: Styling.colors.primary },*/}
        {/*//   ]}*/}
        {/*//   accessibilityRole="button"*/}
        {/*//   onPress={() => this.showPost(item.data.discussion_id, item.data.id)}>*/}
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
          onDelete={postId => this.onPostDelete(postId)}
        />
        {thumbs_up && thumbs_up.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              flexWrap: 'wrap',
              minHeight: 25,
              // maxHeight: 75,
            }}>
            {thumbs_up.map(r => this.renderRating(r))}
          </View>
        )}
        {replies && replies.length > 0 && replies.map(r => this.renderReply(r))}
      </View>
      // </TouchableOpacity>
    )
  }

  renderReply(post) {
    return (
      <View style={{ flexDirection: 'row' }} key={`${post.id}${post.discussionId}`}>
        <View
          style={{
            flex: 1,
            backgroundColor: this.isDarkMode ? Styling.colors.black : Styling.colors.white,
            zIndex: 1,
          }}
        />
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
            onDelete={postId => this.onPostDelete(postId)}
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
    // todo undefined keys in list ?
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
