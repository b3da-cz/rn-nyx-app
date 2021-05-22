import React, { Component } from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'
import { ProgressBar } from 'react-native-paper'
import Bugfender from '@bugfender/rn-bugfender'
import {
  AdvertisementComponent,
  BookmarkCategoriesDialog,
  DiscussionStatsComponent,
  FabComponent,
  MessageBoxDialog,
  PostComponent,
} from '../component'
import {
  MainContext,
  fetchImageSizes,
  formatDate,
  getBlockSizes,
  getDistinctPosts,
  parsePostsContent,
  Styling,
  t,
  wait,
} from '../lib'

type Props = {
  navigation: any,
  id: number,
  postId?: number,
  showBoard?: boolean,
  showHeader?: boolean,
  showReplies?: boolean,
  showStats?: boolean,
  jumpToLastSeen?: boolean,
  onDiscussionFetched: Function,
  onImages: Function,
  onHeaderSwipe: Function,
}
// todo refactor
export class DiscussionView extends Component<Props> {
  static contextType = MainContext
  constructor(props) {
    super(props)
    this.state = {
      title: '',
      discussionId: null,
      advertisementOP: null,
      posts: [],
      images: [],
      header: [],
      board: [],
      bookmarkCategories: [],
      lastSeenPostId: null,
      hasBoard: false,
      hasHeader: false,
      imgPrefetchProgress: { length: 0, done: 0 },
      isBooked: null,
      isCategoryPickerVisible: false,
      isBoardVisible: false,
      isHeaderVisible: false,
      isSubmenuVisible: false,
      isMsgBoxVisible: false,
      isFetching: false,
    }
    this.refScroll = null
    this.refMsgBoxDialog = null
    this.navFocusListener = null
    this.navBlurListener = null
  }

  componentDidMount() {
    this.config = this.context.config
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      if (!this.state.isMsgBoxVisible) {
        this.setState({ isSubmenuVisible: true })
      }
    })
    this.navBlurListener = this.props.navigation.addListener('blur', () => {
      this.setState({ isSubmenuVisible: false })
    })
    this.setFocusOnStart()
    if (this.props.postId > 0 && this.props.showReplies) {
      this.fetchReplies(this.props.id, this.props.postId)
    } else if (this.props.postId > 0) {
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
    const postIndex = this.getPostIndexById(this.state.lastSeenPostId)
    const isPostInFetchedRange = this.state.posts[this.state.posts.length - 1].id > this.state.lastSeenPostId // if true && postIndex == undefined ? DI or deleted
    this.scrollToPost(
      postIndex !== undefined ? postIndex : isPostInFetchedRange ? 0 : this.state.posts.length - 5,
      false,
    )
  }

  async fetchDiscussion(idOrQueryString) {
    if (this.state.isFetching) {
      return 0
    }
    // console.warn('fetch ', idOrQueryString) // TODO: remove
    this.setState({ isFetching: true })
    this.measureMs()
    const res = await this.nyx.getDiscussion(idOrQueryString)
    this.getAdvertisementOP(
      res?.discussion_common?.advertisement_specific_data?.advertisement,
      res?.discussion_common?.advertisement_specific_data?.attachments,
    )
    const newPosts = getDistinctPosts(res.posts, this.state.posts)
    const parsedPosts = parsePostsContent(newPosts)
    this.measureMs('parsed')
    const parsedPostsWImageSizes = await fetchImageSizes(parsedPosts, false, ({ length, done }) => {
      // this.setState({ imgPrefetchProgress: { length, done } })
    })
    this.measureMs('images fetched')
    const finalizedPosts = await getBlockSizes(parsedPostsWImageSizes)
    this.measureMs('layout calculated')
    const title = `${res.discussion_common.discussion.name_static}${
      res.discussion_common.discussion.name_dynamic ? ' ' + res.discussion_common.discussion.name_dynamic : ''
    }`
    this.measureMs(`end [${finalizedPosts.length}] ${idOrQueryString} - ${title.substr(0, 40)}`, true)
    let header = res?.discussion_common?.discussion_specific_data?.header
    if (header?.length > 0) {
      header = parsePostsContent(header)
    }
    const lastSeenPostId = res?.discussion_common?.bookmark?.last_seen_post_id
    const uploadedFiles = res?.discussion_common?.waiting_files || []
    const isBooked = res?.discussion_common?.bookmark?.bookmark
    const images = finalizedPosts.flatMap(p => p.parsed.images)
    this.setState({
      title,
      images,
      isBooked,
      header,
      lastSeenPostId,
      posts: finalizedPosts,
      isFetching: false,
      imgPrefetchProgress: { length: 0, done: 0 },
      hasBoard: res.discussion_common?.discussion?.has_home,
      hasHeader: res.discussion_common?.discussion?.has_header,
    })
    this.onDiscussionFetched(title, uploadedFiles)
    this.nyx.store.activeDiscussionId = this.props.id
    return res?.posts?.length || 0
  }

  async fetchDiscussionBoard() {
    this.setState({ isFetching: true })
    const res = await this.nyx.getDiscussionBoard(this.props.id)
    if (!res || res?.error) {
      console.warn(res)
      return
    }
    const parsedBoard = parsePostsContent(res.items)
    const title = `${res.discussion_common.discussion.name_static}${
      res.discussion_common.discussion.name_dynamic ? ' ' + res.discussion_common.discussion.name_dynamic : ''
    }`
    const isBooked = res?.discussion_common?.bookmark?.bookmark
    const images = parsedBoard.flatMap(p => p.parsed.images)
    this.setState({
      title,
      images,
      isBooked,
      posts: parsedBoard,
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
    if (updatedPost?.error) {
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
        const bookmarksRes = await this.nyx.getBookmarks(false)
        const categories = bookmarksRes?.bookmarks?.filter(c => c.category?.id > -2).map(c => c.category) || []
        this.setState({ bookmarkCategories: categories })
      }
      this.setState({ isCategoryPickerVisible: true })
      return
    }
    this.setState({ isBooked: newIsBooked, isFetching: true })
    await this.nyx.bookmarkDiscussion(this.props.id, newIsBooked, categoryId)
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
    const res = await this.nyx.getDiscussion(`${discussionId}/id/${postId}/replies`)
    const replies = getDistinctPosts(res, [])
    const posts = parsePostsContent(replies)
    this.setState({ posts, isFetching: false })
  }

  showReplies(discussionId, postId) {
    this.props.navigation.push('discussion', { discussionId, postId, showReplies: true })
  }

  onDiscussionFetched(title, uploadedFiles = []) {
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

  measureMs(action: string, isEnd?: boolean): void {
    if (!this.timing) {
      this.timing = {}
      this.timerStart = +new Date()
    } else {
      this.timing[action] = +new Date() - this.timerStart
      this.timerStart = +new Date()
    }
    if (isEnd) {
      // console.warn(this.timing) // TODO: remove
      Bugfender.d('DISCUSSION_TIMING', JSON.stringify(this.timing))
      this.timing = null
      this.timerStart = null
    }
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
      return <DiscussionStatsComponent id={this.props.id} nyx={this.nyx} />
    }
    const isMarket = this.state?.title?.length && this.state.title.includes('tržiště')
    return (
      <View style={{ backgroundColor: this.isDarkMode ? Styling.colors.black : Styling.colors.white }}>
        {this.state.imgPrefetchProgress?.length > 0 && (
          <ProgressBar
            progress={this.state.imgPrefetchProgress.done / (this.state.imgPrefetchProgress.length / 100) / 100}
            color={Styling.colors.primary}
            style={{ height: 3 }}
          />
        )}
        <BookmarkCategoriesDialog
          isVisible={this.state.isCategoryPickerVisible}
          isDarkMode={this.isDarkMode}
          categories={this.state.bookmarkCategories || []}
          onCancel={() => this.setState({ isCategoryPickerVisible: false })}
          onCategoryId={id => this.bookmarkDiscussion(id)}
        />
        <FabComponent
          isVisible={this.state.isSubmenuVisible}
          iconOpen={isMarket ? 'close' : 'message'}
          paddingBottom={this.config?.isBottomTabs ? 45 : 0}
          actions={this.getFabActions()}
          onPress={isOpen => {
            if (isOpen && !isMarket) {
              this.showMsgBox()
            }
          }}
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
            isDarkMode={this.isDarkMode}
            onImage={img => this.showImages(img, this.state.advertisementOP.images)}
          />
        )}
        <FlatList
          ref={r => (this.refScroll = r)}
          data={this.state.isHeaderVisible ? this.state.header : this.state.posts}
          extraData={this.state}
          keyExtractor={(item, index) => `${item.uuid}`}
          refreshing={this.state.isFetching}
          onRefresh={() => this.loadDiscussionTop()}
          onEndReached={() => this.loadDiscussionBottom()}
          onEndReachedThreshold={0.01}
          // scrollEnabled={!this.state.isSwiping}
          style={{
            height: '100%',
            backgroundColor: this.isDarkMode ? Styling.colors.darker : Styling.colors.lighter,
          }}
          ListFooterComponent={() =>
            this.state.isFetching &&
            this.state.posts.length > 0 && <ActivityIndicator size="large" color={Styling.colors.primary} />
          }
          getItemLayout={(data, index) => ({
            length: data[index].parsed.height,
            offset: data[index].parsed.offset - data[index].parsed.height,
            index,
          })}
          initialNumToRender={30}
          onScrollToIndexFailed={error => this.onScrollToIndexFailed(error)}
          renderItem={({ item }) => (
            <PostComponent
              key={item.id}
              post={item}
              nyx={this.nyx}
              isDarkMode={this.isDarkMode}
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
              // onHeaderSwipe={isSwiping => this.setState({ isSwiping })}
              onHeaderSwipe={isSwiping => this.props.onHeaderSwipe(isSwiping)}
            />
          )}
        />
        {/*(todo avoid Portal if possible, esp. with TextInput child)*/}
        {/*<Portal>*/}
        <MessageBoxDialog
          ref={r => (this.refMsgBoxDialog = r)}
          nyx={this.nyx}
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
