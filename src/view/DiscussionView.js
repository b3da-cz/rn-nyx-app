import React, { Component } from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'
import { Portal } from 'react-native-paper'
import {
  AdvertisementComponent,
  BookmarkCategoriesDialog,
  FabComponent,
  MessageBoxDialog,
  PostComponent,
} from '../component'
import { Context, formatDate, Styling, getDistinctPosts, parsePostsContent, t, wait } from '../lib'

type Props = {
  navigation: any,
  id: number,
  postId?: number,
  showBoard?: boolean,
  showHeader?: boolean,
  jumpToLastSeen?: boolean,
  onDiscussionFetched: Function,
  onImages: Function,
  onHeaderSwipe: Function,
}
// todo refactor
export class DiscussionView extends Component<Props> {
  static contextType = Context
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
      isBooked: null,
      isCategoryPickerVisible: false,
      isBoardVisible: false,
      isHeaderVisible: false,
      isSubmenuVisible: false,
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
      this.setState({ isSubmenuVisible: true })
    })
    this.navBlurListener = this.props.navigation.addListener('blur', () => {
      this.setState({ isSubmenuVisible: false })
    })
    this.setFocusOnStart()
    if (this.props.postId > 0) {
      this.jumpToPost(this.props.id, this.props.postId)
    } else if (this.props.showBoard) {
      this.setBoardVisible(true)
      this.fetchDiscussionBoard()
    } else {
      this.reloadDiscussionLatest().then(() => {
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
    await this.fetchDiscussion(queryString)
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
    await wait(200)
    const postIndex = this.getPostIndexById(this.state.lastSeenPostId)
    this.scrollToPost(postIndex, true)
  }

  async fetchDiscussion(idOrQueryString) {
    // console.warn('fetch ', idOrQueryString) // TODO: remove
    this.setState({ isFetching: true })
    const res = await this.nyx.getDiscussion(idOrQueryString)
    this.getAdvertisementOP(
      res?.discussion_common?.advertisement_specific_data?.advertisement,
      res?.discussion_common?.advertisement_specific_data?.attachments,
    )
    const newPosts = getDistinctPosts(res.posts, this.state.posts)
    const parsedPosts = parsePostsContent(newPosts)
    const title = `${res.discussion_common.discussion.name_static}${
      res.discussion_common.discussion.name_dynamic ? ' ' + res.discussion_common.discussion.name_dynamic : ''
    }`
    let header = res?.discussion_common?.discussion_specific_data?.header
    if (header?.length > 0) {
      header = parsePostsContent(header)
    }
    const lastSeenPostId = res?.discussion_common?.bookmark?.last_seen_post_id
    const uploadedFiles = res?.discussion_common?.waiting_files || []
    const isBooked = res?.discussion_common?.bookmark?.bookmark
    const images = parsedPosts.flatMap(p => p.parsed.images)
    this.setState({
      title,
      images,
      isBooked,
      header,
      lastSeenPostId,
      posts: parsedPosts,
      isFetching: false,
      hasBoard: res.discussion_common?.discussion?.has_home,
      hasHeader: res.discussion_common?.discussion?.has_header,
    })
    this.onDiscussionFetched(title, uploadedFiles)
    this.nyx.store.activeDiscussionId = this.props.id
    return parsedPosts
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
          this.refScroll.scrollToIndex({ index: postIndex, viewPosition: 0.1, animated })
          this.setState({ isFetching: false })
        }, 200)
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
    this.setState({ isSubmenuVisible: false })
  }

  onReply(discussionId, postId, username) {
    const msg = this.refMsgBoxDialog?.state?.message || ''
    this.refMsgBoxDialog?.addText(`${msg.length > 0 ? '\n' : ''}{reply ${username}|${postId}}: `)
    this.refMsgBoxDialog?.showDialog()
    this.setState({ isSubmenuVisible: false })
  }

  onVoteCast(updatedPost) {
    if (updatedPost?.error) {
      return
    }
    if (updatedPost?.location === 'home') {
      this.fetchDiscussionBoard()
    } else if (updatedPost?.location === 'header') {
      this.reloadDiscussionLatest()
    } else {
      const post = {...this.state.posts.filter(p => p.id === updatedPost.id)[0]}
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

  onDiscussionFetched(title, uploadedFiles = []) {
    this.props.onDiscussionFetched({
      title: this.state.isBoardVisible
        ? `${t('board')} - ${title}`
        : this.state.isHeaderVisible
        ? `${t('header')} - ${title}`
        : title,
      uploadedFiles,
    })
  }

  getFabActions() {
    const actions = [
      {
        key: 'bookmark',
        icon: this.state.isBooked ? 'bookmark-remove' : 'bookmark',
        label: this.state.isBooked ? t('unbook') : t('book'),
        onPress: () => this.bookmarkDiscussion(),
      },
    ]
    if (this.state.hasBoard) {
      actions.push({
        key: 'board',
        icon: 'home',
        label: `${this.state.isBoardVisible ? t('hide') : t('show')} ${t('board')}`,
        onPress: () => (this.state.isBoardVisible ? this.props.navigation.goBack() : this.showBoard()),
      })
    }
    if (this.state.hasHeader) {
      actions.push({
        key: 'header',
        icon: 'file-table-box',
        label: `${this.state.isHeaderVisible ? t('hide') : t('show')} ${t('header')}`,
        onPress: () => (this.state.isHeaderVisible ? this.props.navigation.goBack() : this.showHeader()),
      })
    }
    return actions
  }

  render() {
    const isMarket = this.state?.title?.length && this.state.title.includes('tržiště')
    return (
      <View style={{ backgroundColor: this.isDarkMode ? Styling.colors.black : Styling.colors.white }}>
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
          // getItemLayout={} // todo calc item height in Parser?
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
              onVoteCast={updatedPost => this.onVoteCast(updatedPost)}
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
          onDismiss={() => this.setState({ isSubmenuVisible: true })}
          onSend={() => {
            this.setState({ isSubmenuVisible: true })
            this.reloadDiscussionLatest(true)
          }}
        />
        {/*</Portal>*/}
      </View>
    )
  }
}
