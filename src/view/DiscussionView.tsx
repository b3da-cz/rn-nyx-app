import React, { Component } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native'
import { ProgressBar } from 'react-native-paper'
import {
  AdvertisementComponent,
  BookmarkCategoriesDialog,
  DiscussionFilterBarComponent,
  DiscussionStatsComponent,
  FabComponent,
  MessageBoxDialog,
  PostComponent,
} from '../component'
import {
  filterPostsByAuthor,
  filterPostsByContent,
  formatDate,
  getDistinctPosts,
  isDiscussionPermitted,
  MainContext,
  Nyx,
  parsePostsContent,
  preparePosts,
  t,
  Theme,
  wait,
} from '../lib'

type Props = {
  navigation: any
  id: number
  postId?: number
  showBoard?: boolean
  showHeader?: boolean
  showReplies?: boolean
  showStats?: boolean
  jumpToLastSeen?: boolean
  onDiscussionFetched: Function
  onImages: Function
  // onHeaderSwipe: Function,
}
type State = {
  title: string
  discussionId?: string | number
  advertisementOP: any
  posts: any[]
  images: any[]
  header: any[]
  board: any[]
  bookmarkCategories: any[]
  lastSeenPostId?: number
  filterText: string
  filterRating: number
  filterUser: string
  hasBoard: boolean
  hasHeader: boolean
  imgPrefetchProgress: { length: number; done: number }
  isBooked: boolean
  isCategoryPickerVisible: boolean
  isBoardVisible: boolean
  isHeaderVisible: boolean
  isSubmenuVisible: boolean
  isMsgBoxVisible: boolean
  isFetching: boolean
  theme?: Theme
}
// todo refactor
export class DiscussionView extends Component<Props> {
  static contextType = MainContext
  state: Readonly<State>
  config: any
  nyx?: Nyx
  filters: any[] = []
  blockedUsers: any[] = []
  refScroll: any
  refMsgBoxDialog: any
  navFocusListener?: Function
  navBlurListener?: Function
  constructor(props) {
    super(props)
    this.state = {
      title: '',
      discussionId: undefined,
      advertisementOP: null,
      posts: [],
      images: [],
      header: [],
      board: [],
      bookmarkCategories: [],
      lastSeenPostId: undefined,
      filterText: '',
      filterRating: 0,
      filterUser: '',
      hasBoard: false,
      hasHeader: false,
      imgPrefetchProgress: { length: 0, done: 0 },
      isBooked: false,
      isCategoryPickerVisible: false,
      isBoardVisible: false,
      isHeaderVisible: false,
      isSubmenuVisible: false,
      isMsgBoxVisible: false,
      isFetching: false,
      theme: undefined,
    }
  }

  componentDidMount() {
    this.config = this.context.config
    this.nyx = this.context.nyx
    this.filters = [...this.context.filters]
    this.blockedUsers = [...this.context.blockedUsers]
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      if (!this.state.isMsgBoxVisible) {
        this.setState({ isSubmenuVisible: true })
      }
    })
    this.navBlurListener = this.props.navigation.addListener('blur', () => {
      this.setState({ isSubmenuVisible: false })
    })
    this.setFocusOnStart()
    this.setTheme()
    if (this.props.postId && this.props.postId > 0 && this.props.showReplies) {
      this.fetchReplies(this.props.id, this.props.postId)
    } else if (this.props.postId && this.props.postId > 0) {
      this.jumpToPost(this.props.id, this.props.postId)
    } else if (this.props.showBoard) {
      this.setBoardVisible(true)
      this.fetchDiscussionBoard()
    } else if (this.props.showStats) {
      this.fetchDiscussionBoard()
    } else {
      this.reloadDiscussionLatest().then(async () => {
        if (this.props.showHeader) {
          this.setHeaderVisible(true)
        }
        if (this.props.jumpToLastSeen) {
          this.jumpToLastSeen()
        }
      })
    }
  }

  componentWillUnmount() {
    if (this.navFocusListener) {
      this.navFocusListener()
    }
    if (this.navBlurListener) {
      this.navBlurListener()
    }
  }

  setFocusOnStart() {
    const isFocused = this.props.navigation.isFocused()
    this.setState({ isSubmenuVisible: isFocused })
  }

  setTheme() {
    this.setState({ theme: this.context.theme })
  }

  async reloadDiscussionLatest(andScrollToTop = false) {
    await this.fetchDiscussion(this.state.discussionId ? this.state.discussionId : this.props.id)
    if (andScrollToTop) {
      this.scrollToTop(true)
    }
  }

  async loadDiscussionTop() {
    const discussionId = this.state.discussionId ? this.state.discussionId : this.props.id
    const topPostId = this.state.posts.length > 0 && this.state.posts[0].id
    const queryString = `${discussionId}?order=newer_than&from_id=${topPostId}`
    const addedLen = await this.fetchDiscussion(queryString)
    if (addedLen > 0 && addedLen !== this.state.posts.length) {
      this.scrollToPost(addedLen)
    }
  }

  async loadDiscussionBottom() {
    if (this.state.posts.length < 20 || this.state.isHeaderVisible) {
      return // prevent reloading of new discussion, todo variable min len
    }
    const discussionId = this.state.discussionId ? this.state.discussionId : this.props.id
    const bottomPostId = this.state.posts.length > 0 && this.state.posts[this.state.posts.length - 1].id
    const queryString = `${discussionId}?order=older_than&from_id=${bottomPostId}`
    await this.fetchDiscussion(queryString)
  }

  async jumpToPost(discussionId, postId) {
    let postIndex = this.getPostIndexById(this.state.lastSeenPostId)
    if (postIndex === undefined) {
      if (this.state.discussionId !== discussionId) {
        this.setState({ discussionId })
      }
      const queryString = `${discussionId}?order=older_than&from_id=${Number(postId) + 1}`
      await this.fetchDiscussion(queryString)
      await wait(200)
      postIndex = this.getPostIndexById(postId)
    }
    this.scrollToPost(postIndex)
  }

  async jumpToLastSeen() {
    await wait(20)
    // const postIndex = this.getPostIndexById(this.state.lastSeenPostId) // lastSeen doesn't have to be there, so:
    const postIndex = Math.min(this.state.posts?.filter(p => p.new).length, this.state.posts?.length - 5)
    this.scrollToPost(postIndex !== undefined ? postIndex : 0, false)
  }

  async fetchDiscussion(idOrQueryString, clearPosts = false) {
    const { isFetching, filterText, filterRating, filterUser } = this.state
    if (isFetching) {
      return 0
    }
    // console.warn('fetch ', idOrQueryString) // TODO: remove
    this.setState({ isFetching: true })
    // this.measureMs()
    if (filterUser?.length) {
      idOrQueryString = `${idOrQueryString}${`${idOrQueryString}`.includes('?') ? '&' : '?'}user=${filterUser}`
    }
    if (filterText?.length) {
      idOrQueryString = `${idOrQueryString}${`${idOrQueryString}`.includes('?') ? '&' : '?'}text=${filterText}`
    }
    if (filterRating !== 0) {
      idOrQueryString = `${idOrQueryString}${`${idOrQueryString}`.includes('?') ? '&' : '?'}rating=${filterRating}`
    }
    const res = await this.nyx?.api.getDiscussion(idOrQueryString)
    if (!res?.posts) {
      return 0
    }
    this.getAdvertisementOP(
      res?.discussion_common?.advertisement_specific_data?.advertisement,
      res?.discussion_common?.advertisement_specific_data?.attachments,
    )
    const filteredPosts =
      this.blockedUsers?.length > 0
        ? filterPostsByContent(filterPostsByAuthor(res.posts, this.blockedUsers), this.filters)
        : filterPostsByContent(res.posts, this.filters)
    const themeBaseFontSize = this.state.theme!.metrics.fontSizes.p
    const nextPosts = await preparePosts(filteredPosts, clearPosts ? [] : this.state.posts, true, themeBaseFontSize)
    const title = `${res?.discussion_common?.discussion.name_static}${
      res?.discussion_common?.discussion.name_dynamic ? ' ' + res.discussion_common.discussion.name_dynamic : ''
    }`
    if (!isDiscussionPermitted(title, this.filters)) {
      alert('Blocked content')
      return this.props.navigation.goBack()
    }
    let header = res?.discussion_common?.discussion_specific_data?.header
    if (header && header.length > 0) {
      header = await preparePosts(header, [], true, themeBaseFontSize)
    }
    const lastSeenPostId = res?.discussion_common?.bookmark?.last_seen_post_id
    const uploadedFiles = res?.discussion_common?.waiting_files || []
    const isBooked = res?.discussion_common?.bookmark?.bookmark
    const images = nextPosts.flatMap(p => p.parsed.images)
    this.setState({
      title,
      images,
      isBooked,
      header,
      lastSeenPostId,
      posts: nextPosts,
      isFetching: false,
      imgPrefetchProgress: { length: 0, done: 0 },
      hasBoard: res.discussion_common?.discussion?.has_home,
      hasHeader: res.discussion_common?.discussion?.has_header,
    })
    this.onDiscussionFetched(title, uploadedFiles)
    return res?.posts?.length || 0
  }

  async fetchDiscussionBoard() {
    this.setState({ isFetching: true })
    const res = await this.nyx?.api.getDiscussionBoard(this.props.id)
    if (!res || res?.error || !res.items || !res.discussion_common) {
      console.warn(res)
      return
    }
    const themeBaseFontSize = this.state.theme!.metrics.fontSizes.p
    const board = await preparePosts(res.items, [], true, themeBaseFontSize)
    const title = `${res.discussion_common.discussion.name_static}${
      res.discussion_common.discussion.name_dynamic ? ' ' + res.discussion_common.discussion.name_dynamic : ''
    }`
    const isBooked = res?.discussion_common?.bookmark?.bookmark
    const images = board.flatMap(p => p.parsed.images)
    this.setState({
      title,
      images,
      isBooked,
      posts: board,
      isFetching: false,
    })
    this.onDiscussionFetched(title)
  }

  getAdvertisementOP(ad, images) {
    if (!ad) {
      return
    }
    this.setState({
      advertisementOP: {
        action: ad.ad_type === 'offer' ? 'Nabízím' : 'Sháním',
        summary: ad.summary,
        shipping: ad.shipping,
        images: images.map(img => ({ url: `https://nyx.cz${img.url}` })),
        location: ad.location,
        price: `${ad.price}${ad.currency}`,
        updated: formatDate(ad.refreshed_at),
      },
    })
  }

  async setFilters({ user, text, rating }) {
    this.setState({ filterUser: user, filterText: text, filterRating: rating })
    await wait()
    await this.fetchDiscussion(this.state.discussionId ? this.state.discussionId : this.props.id, true)
  }

  getStoredPostById(postId) {
    return this.state?.posts?.filter(p => p.id == postId)[0]
  }

  getPostIndexById(postId) {
    let index = 0
    for (const p of this.state.posts) {
      if (p.id == postId) {
        return index
      }
      index++
    }
  }

  scrollToPost(postIndex, animated = false) {
    try {
      if (postIndex > 1) {
        setTimeout(() => {
          this.refScroll.scrollToIndex({ index: postIndex - 1, viewPosition: 0, animated })
        }, 20)
      }
    } catch (e) {
      console.warn(e)
    }
  }

  scrollToTop(animated = false) {
    this.refScroll.scrollToOffset({
      index: 0,
      animated,
    })
  }

  onScrollToIndexFailed(error) {
    const offset = error.averageItemLength * error.highestMeasuredFrameIndex
    this.refScroll.scrollToOffset({ offset })
    setTimeout(() => this.refScroll.scrollToIndex({ index: error.index }), 200)
  }

  showPost(discussionId, postId) {
    this.props.navigation.push('discussion', { discussionId, postId })
  }

  showImages(image, imageList?) {
    const imgIndex = imageList?.length > 0 ? imageList.indexOf(image) : this.state.images.indexOf(image)
    const images = imageList?.length > 0 ? imageList : this.state.images.map(img => ({ url: img?.src }))
    this.props.onImages(images, imgIndex)
  }

  onPostDelete(postId) {
    const posts = this.state.posts.filter(p => p.id != postId)
    this.setState({ posts })
  }

  showMsgBox() {
    this.refMsgBoxDialog?.showDialog(true)
    this.setState({ isSubmenuVisible: false, isMsgBoxVisible: true })
  }

  onReply(discussionId, postId, username) {
    const msg = this.refMsgBoxDialog?.state?.message || ''
    this.refMsgBoxDialog?.addText(`${msg.length > 0 ? '\n' : ''}{reply ${username}|${postId}}: `)
    this.refMsgBoxDialog?.showDialog()
    this.setState({ isSubmenuVisible: false, isMsgBoxVisible: true })
  }

  onPostRated(updatedPost) {
    if (updatedPost?.error) {
      return
    }
    if (updatedPost?.location === 'home') {
      this.fetchDiscussionBoard()
    } else if (updatedPost?.location === 'header') {
      this.reloadDiscussionLatest()
    } else {
      const post = { ...this.state.posts.filter(p => p.id === updatedPost.id)[0] }
      post.my_rating = updatedPost.my_rating
      post.rating = updatedPost.rating
      const posts = getDistinctPosts([post], this.state.posts)
      this.setState({ posts })
    }
  }

  onDiceRollOrPollVote(updatedPost) {
    if (!updatedPost || updatedPost?.error) {
      return
    }
    if (updatedPost?.location === 'home') {
      this.fetchDiscussionBoard()
    } else if (updatedPost?.location === 'header') {
      // const parsedHeader = parsePostsContent([updatedPost])
      // const header = getDistinctPosts(parsedHeader, this.state.header)
      // this.setState({ header }) // todo proper model
      this.reloadDiscussionLatest()
    } else {
      const parsedPosts = parsePostsContent([updatedPost])
      const posts = getDistinctPosts(parsedPosts, this.state.posts)
      this.setState({ posts })
    }
  }

  onReminder(post, isReminder) {
    const p = { ...post, reminder: isReminder }
    const posts = getDistinctPosts([p], this.state.posts)
    this.setState({ posts })
  }

  async bookmarkDiscussion(categoryId?) {
    const newIsBooked = !this.state.isBooked
    if (newIsBooked && categoryId === undefined) {
      if (!this.state.bookmarkCategories?.length) {
        const bookmarksRes = await this.nyx?.api.getBookmarks(false)
        const categories = bookmarksRes?.bookmarks?.filter(c => c.category?.id > -2).map(c => c.category) || []
        this.setState({ bookmarkCategories: categories })
      }
      this.setState({ isCategoryPickerVisible: true })
      return
    }
    this.setState({ isBooked: newIsBooked, isFetching: true })
    await this.nyx?.api.bookmarkDiscussion(this.props.id, newIsBooked, categoryId)
    this.setState({ isFetching: false, isCategoryPickerVisible: false })
  }

  setBoardVisible(isBoardVisible) {
    this.setState({ isBoardVisible })
    this.onDiscussionFetched(this.state.title)
  }

  showBoard() {
    this.props.navigation.push('discussion', { discussionId: this.props.id, showBoard: true })
  }

  setHeaderVisible(isHeaderVisible) {
    this.setState({ isHeaderVisible })
    this.onDiscussionFetched(this.state.title)
  }

  showHeader() {
    this.props.navigation.push('discussion', { discussionId: this.props.id, showHeader: true })
  }

  showStats() {
    this.props.navigation.push('discussion', { discussionId: this.props.id, showStats: true })
  }

  async fetchReplies(discussionId, postId) {
    this.setState({ isFetching: true })
    const res = await this.nyx?.api.getDiscussion(`${discussionId}/id/${postId}/replies`) // todo replies endpoint for proper type check
    const replies = getDistinctPosts(Array.isArray(res) ? res : [], [])
    const posts = parsePostsContent(replies)
    this.setState({ posts, isFetching: false })
  }

  showReplies(discussionId, postId) {
    this.props.navigation.push('discussion', { discussionId, postId, showReplies: true })
  }

  onDiscussionFetched(title: string, uploadedFiles: any[] = []) {
    this.props.onDiscussionFetched({
      title: this.state.isBoardVisible
        ? `${t('board')} - ${title}`
        : this.state.isHeaderVisible
        ? `${t('header')} - ${title}`
        : this.props.showStats
        ? `${t('stats.title')} - ${title}`
        : title,
      uploadedFiles,
    })
  }

  getFabActions() {
    const { isBooked, hasBoard, isBoardVisible, hasHeader, isHeaderVisible } = this.state
    const { navigation } = this.props
    const actions = [
      {
        key: 'bookmark',
        icon: isBooked ? 'bookmark-remove' : 'bookmark',
        label: isBooked ? t('unbook') : t('book'),
        onPress: () => this.bookmarkDiscussion(),
      },
      {
        key: 'stats',
        icon: 'view-list',
        label: `${t('show')} ${t('stats.title')}`,
        onPress: () => this.showStats(),
      },
    ]
    if (hasBoard) {
      actions.push({
        key: 'board',
        icon: 'home',
        label: `${isBoardVisible ? t('hide') : t('show')} ${t('board')}`,
        onPress: () => (isBoardVisible ? navigation.goBack() : this.showBoard()),
      })
    }
    if (hasHeader) {
      actions.push({
        key: 'header',
        icon: 'file-table-box',
        label: `${isHeaderVisible ? t('hide') : t('show')} ${t('header')}`,
        onPress: () => (isHeaderVisible ? navigation.goBack() : this.showHeader()),
      })
    }
    return actions
  }

  render() {
    if (this.props.showStats) {
      return <DiscussionStatsComponent id={this.props.id} />
    }
    const { theme } = this.state
    if (!theme) {
      return null
    }
    const isMarket = this.state?.title?.length && this.state.title.includes('tržiště')
    return (
      <View style={{ backgroundColor: theme.colors.background }}>
        {this.state.imgPrefetchProgress?.length > 0 && (
          <ProgressBar
            progress={this.state.imgPrefetchProgress.done / (this.state.imgPrefetchProgress.length / 100) / 100}
            color={theme.colors.primary}
            style={{ height: 3 }}
          />
        )}
        <BookmarkCategoriesDialog
          isVisible={this.state.isCategoryPickerVisible}
          categories={this.state.bookmarkCategories || []}
          onCancel={() => this.setState({ isCategoryPickerVisible: false })}
          onCategoryId={id => this.bookmarkDiscussion(id)}
        />
        <FabComponent
          isVisible={this.state.isSubmenuVisible}
          iconOpen={isMarket ? 'close' : 'message'}
          paddingBottom={this.config?.isBottomTabs ? 45 : 0}
          actions={this.getFabActions()}
          backgroundColor={theme.colors.primary}
          onPress={isOpen => {
            if (isOpen && !isMarket) {
              this.showMsgBox()
            }
          }}
        />
        <DiscussionFilterBarComponent
          nyx={this.nyx!}
          discussionTitle={this.state.title}
          onFilter={({ user, text, rating }) => this.setFilters({ user, text, rating })}
          onBack={() => this.props.navigation.goBack()}
        />
        {this.state.advertisementOP && (
          <AdvertisementComponent
            action={this.state.advertisementOP.action}
            summary={this.state.advertisementOP.summary}
            shipping={this.state.advertisementOP.shipping}
            images={this.state.advertisementOP.images}
            location={this.state.advertisementOP.location}
            price={this.state.advertisementOP.price}
            updated={this.state.advertisementOP.updated}
            isActive={false}
            isDetail={true}
            onImage={img => this.showImages(img, this.state.advertisementOP.images)}
          />
        )}
        <FlatList
          ref={r => (this.refScroll = r)}
          data={this.state.isHeaderVisible ? this.state.header : this.state.posts}
          extraData={this.state}
          keyExtractor={item => `${item.uuid}`}
          onEndReached={() => this.loadDiscussionBottom()}
          onEndReachedThreshold={0.01}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isFetching}
              onRefresh={() => this.loadDiscussionTop()}
              colors={[theme.colors.primary, theme.colors.secondary, theme.colors.tertiary]}
            />
          }
          style={{
            height: '100%',
            marginTop: 50,
            backgroundColor: theme.colors.background,
          }}
          ListFooterComponent={() =>
            this.state.isFetching && this.state.posts.length > 0 ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : null
          }
          getItemLayout={(data, index) => {
            const length = (data && data[index].parsed.height) || 300
            return {
              length,
              offset: ((data && data[index].parsed.offset) || index * 300) - length,
              index,
            }
          }}
          initialNumToRender={30}
          onScrollToIndexFailed={error => this.onScrollToIndexFailed(error)}
          renderItem={({ item }) => (
            <PostComponent
              key={item.id}
              post={item}
              nyx={this.nyx!}
              isHeaderInteractive={true}
              isReply={false}
              isUnread={item.new}
              onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
              onImage={(image, images) => this.showImages(image, images)}
              onDelete={postId => this.onPostDelete(postId)}
              onReply={(discussionId, postId, username) => this.onReply(discussionId, postId, username)}
              onRepliesShow={(discussionId, postId) => this.showReplies(discussionId, postId)}
              onPostRated={updatedPost => this.onPostRated(updatedPost)}
              onDiceRoll={updatedPost => this.onDiceRollOrPollVote(updatedPost)}
              onPollVote={updatedPost => this.onDiceRollOrPollVote(updatedPost)}
              onReminder={(post, isReminder) => this.onReminder(post, isReminder)}
            />
          )}
        />
        {/*(todo avoid Portal if possible, esp. with TextInput child)*/}
        {/*<Portal>*/}
        <MessageBoxDialog
          ref={r => (this.refMsgBoxDialog = r)}
          nyx={this.nyx!}
          params={{ discussionId: this.props.id }}
          isVisible={false}
          onDismiss={() => this.setState({ isSubmenuVisible: true, isMsgBoxVisible: false })}
          onSend={() => {
            this.setState({ isSubmenuVisible: true, isMsgBoxVisible: false })
            this.reloadDiscussionLatest(true)
          }}
        />
        {/*</Portal>*/}
      </View>
    )
  }
}
