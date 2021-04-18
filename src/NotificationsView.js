import React, { Component } from 'react'
import {FlatList, Image, Text, TouchableOpacity, View} from 'react-native';
import { Nyx, PostComponent, Styling } from './'

type Props = {
  isDarkMode: boolean,
  nyx: Nyx,
  onImages: Function,
  onNavigation: Function,
}
export class NotificationsView extends Component<Props> {
  constructor(props) {
    super(props)
    this.state = {
      unreadCount: 0,
      posts: [],
      isFetching: false,
    }
    this.refScroll = null
    setTimeout(() => this.getNotifications(), 1000)
  }

  async getNotifications() {
    this.setState({ isFetching: true })
    const res = await this.props.nyx.getNotifications()
    this.setState({
      unreadCount: res.context.user.notifications_unread,
      posts: res.notifications,
      isFetching: false,
    })
  }

  showImages(images, imgIndex) {
    this.props.onImages(images, imgIndex)
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
          Styling.groups.themeView(this.props.isDarkMode),
          { borderBottomWidth: 2, borderColor: Styling.colors.primary },
        ]}
      >
      {/*// <TouchableOpacity*/}
      {/*//   style={[*/}
      {/*//     Styling.groups.themeView(this.props.isDarkMode),*/}
      {/*//     { borderBottomWidth: 2, borderColor: Styling.colors.primary },*/}
      {/*//   ]}*/}
      {/*//   accessibilityRole="button"*/}
      {/*//   onPress={() => this.showPost(item.data.discussionId, item.data.id)}>*/}
        <PostComponent
          key={item.data.id}
          post={item.data}
          nyx={this.props.nyx}
          isDarkMode={this.props.isDarkMode}
          onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
          onImages={(images, i) => this.showImages(images, i)}
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
            backgroundColor: this.props.isDarkMode ? Styling.colors.black : Styling.colors.white,
            zIndex: 1,
          }}
        />
        <View style={{ flex: 5 }}>
          <PostComponent
            key={post.id}
            post={post}
            nyx={this.props.nyx}
            isDarkMode={this.props.isDarkMode}
            onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
            onImages={(images, i) => this.showImages(images, i)}
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
        style={{ backgroundColor: this.props.isDarkMode ? Styling.colors.black : Styling.colors.white }}
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
