import React, { Component } from 'react'
import { FlatList, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { PostComponent, RatingDetailComponent } from '../component'
import { MainContext, Nyx, Theme, parseNotificationsContent } from '../lib'

type Props = {
  navigation: any
  onImages: Function
}
type State = {
  unreadCount: number
  posts: any[]
  isFetching: boolean
  theme?: Theme
}
export class NotificationsView extends Component<Props> {
  static contextType = MainContext
  state: Readonly<State>
  nyx?: Nyx
  refScroll: any
  navFocusListener?: Function
  navTabPressListener?: Function
  constructor(props) {
    super(props)
    this.state = {
      unreadCount: 0,
      posts: [],
      isFetching: false,
    }
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      setTimeout(() => this.getNotifications(), 100)
    })
    this.navTabPressListener = this.props.navigation.dangerouslyGetParent().addListener('tabPress', () => {
      const isFocused = this.props.navigation.isFocused()
      if (isFocused && !this.state.isFetching) {
        this.getNotifications()
      }
    })
    this.setTheme()
    this.getNotifications()
  }

  componentWillUnmount() {
    if (this.navFocusListener) {
      this.navFocusListener()
    }
    if (this.navTabPressListener) {
      this.navTabPressListener()
    }
  }

  setTheme() {
    this.setState({ theme: this.context.theme })
  }

  async getNotifications() {
    this.setState({ isFetching: true })
    const res = await this.nyx?.api.getNotifications()
    const parsedNotifications = parseNotificationsContent(res?.notifications || [])
    this.setState({
      unreadCount: res?.context?.user?.notifications_unread,
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

  renderItem(item, theme: Theme) {
    const { replies, thumbs_up } = item.details
    const {
      colors,
      metrics: { blocks },
    } = theme
    return (
      <View
        key={`${item.data.id}_container`}
        style={{
          borderBottomWidth: blocks.medium,
          borderColor: colors.background,
        }}>
        <PostComponent
          key={item.data.id}
          post={item.data}
          nyx={this.nyx!}
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
            ratingWidth={(blocks.large * 3) / 1.25}
            ratingHeight={blocks.large * 3}
            isPositive={true}
          />
        )}
        {replies && replies.length > 0 && replies.map(r => this.renderReply(r, theme))}
      </View>
    )
  }

  renderReply(post, theme: Theme) {
    const {
      colors,
      metrics: { fontSizes },
    } = theme
    return (
      <View style={{ flexDirection: 'row' }} key={`${post.id}${post.discussionId}`}>
        <TouchableRipple
          key={post.id}
          disabled={false}
          onPress={() => this.showPost(post.discussion_id, post.id)}
          rippleColor={colors.ripple}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
            zIndex: 1,
          }}>
          <Icon name={'corner-down-right'} size={fontSizes.h2} color={colors.disabled} />
        </TouchableRipple>
        <View style={{ flex: 5 }}>
          <PostComponent
            key={post.id}
            post={post}
            nyx={this.nyx!}
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

  render() {
    if (!this.state.theme) {
      return null
    }
    return (
      <FlatList
        style={{ backgroundColor: this.state.theme.colors.background }}
        ref={r => (this.refScroll = r)}
        data={this.state.posts}
        extraData={this.state}
        keyExtractor={item => `${item.data.id}`}
        refreshing={this.state.isFetching}
        onRefresh={() => this.getNotifications()}
        renderItem={({ item }) => this.renderItem(item, this.state.theme!)}
      />
    )
  }
}
