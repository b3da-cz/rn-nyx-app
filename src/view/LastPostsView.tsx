import React, { Component } from 'react'
import { FlatList, View } from 'react-native'
import { FetchProgressComponent, PostComponent, RatingFilterBarComponent } from '../component'
import {
  MainContext,
  wait,
  exclusiveLastPostsFilter,
  emptyFetchProgress,
  FetchProgressEvent,
  FetchProgressState,
  filterDiscussions,
  filterPostsByAuthor,
  galleryImagesFromPosts,
  toGalleryImages,
  Nyx,
  Theme,
  preparePosts,
  reduceFetchProgress,
  resolveFetchProgressMode,
  revealImageInPosts,
  t,
} from '../lib'

type Props = {
  navigation: any
  onImages: Function
}
type State = {
  posts: any[]
  images: any[]
  isRatedByFriends: boolean
  isRatedByMe: boolean
  isFetching: boolean
  fetchProgress: FetchProgressState
  minRating: number
  theme?: Theme
}
export class LastPostsView extends Component<Props> {
  static contextType = MainContext
  state: Readonly<State>
  nyx?: Nyx
  filters: string[] = []
  blockedUsers: string[] = []
  navTabPressListener?: Function
  _revealQueue: Promise<any> = Promise.resolve()
  constructor(props) {
    super(props)
    this.state = {
      posts: [],
      images: [],
      isRatedByFriends: false,
      isRatedByMe: false,
      isFetching: false,
      fetchProgress: emptyFetchProgress(),
      minRating: 0,
    }
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.filters = [...this.context.filters]
    this.blockedUsers = [...this.context.blockedUsers]
    this.navTabPressListener = this.props.navigation.getParent()?.addListener('tabPress', () => {
      const isFocused = this.props.navigation.isFocused()
      if (isFocused && !this.state.isFetching) {
        this.getLastPosts()
      }
    })
    this.setTheme()
    this.getLastPosts()
  }

  componentWillUnmount() {
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

  async getLastPosts() {
    const request = { id: 'request', label: t('last'), done: 0, total: 1 }
    this.setState({
      isFetching: true,
      posts: [],
      fetchProgress: reduceFetchProgress(emptyFetchProgress(), request),
    })
    const res = await this.nyx?.api.getLastPosts(
      this.state.minRating,
      this.state.isRatedByFriends,
      this.state.isRatedByMe,
    )
    this.trackLoad({ ...request, done: 1 })
    const filteredPosts = filterDiscussions(res?.posts || [], this.filters) // last posts have discussion_name prop
    const filteredByAuthor =
      this.blockedUsers?.length > 0 ? filterPostsByAuthor(filteredPosts, this.blockedUsers) : filteredPosts
    const parsedPosts = await preparePosts(
      filteredByAuthor,
      [],
      true,
      this.context?.theme?.metrics?.fontSizes?.p,
      this.context?.config?.imageDownloadMaxKb,
      this.trackLoad,
    )
    const images = galleryImagesFromPosts(parsedPosts)
    this.setState({
      posts: parsedPosts,
      images,
      isFetching: false,
    })
    return parsedPosts
  }

  async setFilter(minRating, isRatedByFriends, isRatedByMe = false) {
    const next = exclusiveLastPostsFilter(minRating, isRatedByFriends, isRatedByMe)
    this.setState({
      isRatedByFriends: next.isRatedByFriends,
      isRatedByMe: next.isRatedByMe,
      minRating: next.minRating,
    })
    await wait()
    this.getLastPosts()
  }

  showImages(image) {
    this.revealPostImage(image)
    const { images, imgIndex } = toGalleryImages(image, galleryImagesFromPosts(this.state.posts))
    this.props.onImages(images, imgIndex)
  }

  revealPostImage(image) {
    this._revealQueue = this._revealQueue.then(() => this.revealPostImageNow(image)).catch(e => console.warn(e))
    return this._revealQueue
  }

  async revealPostImageNow(image) {
    const nextPosts = await revealImageInPosts(
      this.state.posts.slice(),
      image,
      this.context?.theme?.metrics?.fontSizes?.p,
    )
    this.setState({
      posts: nextPosts.slice(),
      images: galleryImagesFromPosts(nextPosts),
    })
  }

  render() {
    const listEmpty = !this.state.posts.length
    const loadSteps = this.state.fetchProgress?.steps || []
    const progressMode = resolveFetchProgressMode(this.context?.config, 'lists')
    const showProgress = progressMode !== 'off' && this.state.isFetching
    const loadActive = showProgress && loadSteps.length > 0
    return (
      <View style={{ flex: 1, backgroundColor: this.state.theme?.colors?.background }}>
        <RatingFilterBarComponent
          onFilter={(minRating, isRatedByFriends, isRatedByMe) =>
            this.setFilter(minRating, isRatedByFriends, isRatedByMe)
          }
        />
        {loadActive && !listEmpty && (
          <FetchProgressComponent
            progress={this.state.fetchProgress}
            fill={false}
            detailed={progressMode === 'detailed'}
          />
        )}
        <FlatList
          data={this.state.posts}
          extraData={this.state}
          keyExtractor={item => `${item.uuid}`}
          refreshing={this.state.isFetching && !showProgress}
          onRefresh={() => this.getLastPosts()}
          style={{ flex: 1, backgroundColor: this.state.theme?.colors?.background }}
          contentContainerStyle={listEmpty ? { flexGrow: 1 } : undefined}
          ListEmptyComponent={
            showProgress ? (
              <FetchProgressComponent progress={this.state.fetchProgress} fill detailed={progressMode === 'detailed'} />
            ) : null
          }
          renderItem={({ item }) => (
            <PostComponent
              key={item.id}
              post={item}
              nyx={this.nyx!}
              isHeaderInteractive={false}
              isHeaderPressable={true}
              onHeaderPress={(discussionId, postId) =>
                this.props.navigation.push('discussion', { discussionId, postId })
              }
              onDiscussionDetailShow={(discussionId, postId) =>
                this.props.navigation.push('discussion', { discussionId, postId })
              }
              onImage={image => this.showImages(image)}
              onDelete={() => null}
            />
          )}
        />
      </View>
    )
  }
}
