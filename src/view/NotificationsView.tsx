import React, { Component } from 'react'
import { FlatList, InteractionManager, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { FetchProgressComponent, PostComponent, RatingDetailComponent } from '../component'
import {
  MainContext,
  Nyx,
  Theme,
  emptyFetchProgress,
  FetchProgressEvent,
  FetchProgressState,
  prepareNotifications,
  notificationPosts,
  notificationNeedsPrepare,
  readFeedCache,
  reconcileNotifications,
  rememberNotifications,
  updateFeedCache,
  reduceFetchProgress,
  resolveFetchProgressMode,
  revealImageInPosts,
  galleryImagesFromPosts,
  toGalleryImages,
  t,
} from '../lib'

type Props = {
  navigation: any
  onImages: Function
}
type State = {
  unreadCount: number
  posts: any[]
  isFetching: boolean
  fetchProgress: FetchProgressState
  theme?: Theme
}
export class NotificationsView extends Component<Props> {
  static contextType = MainContext
  state: Readonly<State>
  nyx?: Nyx
  refScroll: any
  navFocusListener?: Function
  navTabPressListener?: Function
  isUnmounted = false
  _revealQueue: Promise<any> = Promise.resolve()
  constructor(props) {
    super(props)
    this.state = {
      unreadCount: 0,
      posts: [],
      isFetching: false,
      fetchProgress: emptyFetchProgress(),
    }
  }

  componentDidMount() {
    this.isUnmounted = false
    this.nyx = this.context.nyx
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      InteractionManager.runAfterInteractions(() => {
        if (this.isUnmounted) {
          return
        }
        const isFocused =
          typeof this.props.navigation?.isFocused === 'function' ? this.props.navigation.isFocused() : true
        if (isFocused && !this.state.isFetching) {
          this.getNotifications()
        }
      })
    })
    this.navTabPressListener = this.props.navigation.getParent()?.addListener('tabPress', () => {
      const isFocused =
        typeof this.props.navigation?.isFocused === 'function' ? this.props.navigation.isFocused() : true
      if (isFocused && !this.state.isFetching) {
        this.getNotifications()
      }
    })
    this.setTheme()
    InteractionManager.runAfterInteractions(() => {
      if (this.isUnmounted) {
        return
      }
      const isFocused =
        typeof this.props.navigation?.isFocused === 'function' ? this.props.navigation.isFocused() : true
      if (isFocused && !this.state.isFetching) {
        this.getNotifications()
      }
    })
  }

  componentWillUnmount() {
    this.isUnmounted = true
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

  trackLoad = (event: FetchProgressEvent) => {
    this.setState(state => ({ fetchProgress: reduceFetchProgress(state.fetchProgress, event) }))
  }

  cacheOn() {
    return this.context?.config?.isDiscussionCacheEnabled !== false
  }

  async getNotifications() {
    const request = { id: 'request', label: t('notifications'), done: 0, total: 1 }
    this.nyx?.holdErrors()
    let servedFromCache = false
    let visible = this.state.posts || []
    try {
      if (this.cacheOn() && !visible.length) {
        const store = await readFeedCache()
        if (store.notifications?.posts?.length) {
          visible = store.notifications.posts
          servedFromCache = true
          this.setState({
            unreadCount: store.notifications.unreadCount,
            posts: visible,
            isFetching: true,
            fetchProgress: reduceFetchProgress(emptyFetchProgress(), request),
          })
        }
      }
      this.setState({ isFetching: true, fetchProgress: reduceFetchProgress(emptyFetchProgress(), request) })
      const res = await this.nyx?.api.getNotifications()
      this.trackLoad({ ...request, done: 1 })
      if (!res || res.error || !Array.isArray(res.notifications)) {
        servedFromCache = servedFromCache || visible.length > 0
        this.setState({ isFetching: false })
        return
      }
      const merged = reconcileNotifications(visible, res.notifications || [])
      let posts = merged.items
      const pending = posts.filter(notificationNeedsPrepare)
      if (pending.length) {
        const prepared = await prepareNotifications(
          pending,
          this.context?.theme?.metrics?.fontSizes?.p,
          this.context?.config?.imageDownloadMaxKb,
          this.trackLoad,
        )
        const byId = new Map(prepared.map(item => [String(item?.data?.id), item]))
        posts = posts.map(item => byId.get(String(item?.data?.id)) || item)
      }
      servedFromCache = false
      const postsChanged = merged.changed || pending.length > 0
      this.setState({
        unreadCount: res?.context?.user?.notifications_unread,
        ...(postsChanged ? { posts } : {}),
        isFetching: false,
      })
      if (this.cacheOn()) {
        const unreadCount = res?.context?.user?.notifications_unread
        updateFeedCache(store => rememberNotifications(store, posts, unreadCount)).catch(e => console.warn(e))
      }
    } catch (e) {
      console.warn(e)
      servedFromCache = servedFromCache || visible.length > 0
      this.setState({ isFetching: false })
    } finally {
      this.nyx?.releaseErrors(servedFromCache)
    }
  }

  showImages(image) {
    this.revealPostImage(image)
    const { images, imgIndex } = toGalleryImages(image, galleryImagesFromPosts(notificationPosts(this.state.posts)))
    this.props.onImages(images, imgIndex)
  }

  revealPostImage(image) {
    this._revealQueue = this._revealQueue.then(() => this.revealPostImageNow(image)).catch(e => console.warn(e))
    return this._revealQueue
  }

  async revealPostImageNow(image) {
    const posts = notificationPosts(this.state.posts)
    await revealImageInPosts(posts, image, this.context?.theme?.metrics?.fontSizes?.p)
    this.setState({ posts: this.state.posts.slice() })
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
        }}
      >
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
          }}
        >
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
    const listEmpty = !this.state.posts.length
    const loadSteps = this.state.fetchProgress?.steps || []
    const progressMode = resolveFetchProgressMode(this.context?.config, 'lists')
    const showProgress = progressMode !== 'off' && this.state.isFetching
    const loadActive = showProgress && loadSteps.length > 0
    return (
      <View style={{ flex: 1, backgroundColor: this.state.theme.colors.background }}>
        {loadActive && !listEmpty && (
          <FetchProgressComponent
            progress={this.state.fetchProgress}
            fill={false}
            detailed={progressMode === 'detailed'}
          />
        )}
        <FlatList
          style={{ flex: 1, backgroundColor: this.state.theme.colors.background }}
          ref={r => (this.refScroll = r)}
          data={this.state.posts}
          extraData={this.state}
          keyExtractor={item => `${item.data.id}`}
          refreshing={this.state.isFetching && !showProgress}
          onRefresh={() => this.getNotifications()}
          contentContainerStyle={listEmpty ? { flexGrow: 1 } : undefined}
          ListEmptyComponent={
            showProgress ? (
              <FetchProgressComponent progress={this.state.fetchProgress} fill detailed={progressMode === 'detailed'} />
            ) : null
          }
          renderItem={({ item }) => this.renderItem(item, this.state.theme!)}
        />
      </View>
    )
  }
}
