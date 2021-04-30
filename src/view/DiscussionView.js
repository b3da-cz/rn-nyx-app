import React, { Component } from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'
import { FAB, Portal } from 'react-native-paper'
import { PostComponent } from '../component'
import { Context, Styling, getDistinctPosts, parsePostsContent } from '../lib'

type Props = {
  navigation: any,
  id: number,
  postId?: number,
  onDiscussionFetched: Function,
  onImages: Function,
}
export class DiscussionView extends Component<Props> {
  static contextType = Context
  constructor(props) {
    super(props)
    this.state = {
      title: '',
      discussionId: null,
      posts: [],
      images: [],
      header: [],
      isBooked: null,
      isHeaderVisible: false,
      isSubmenuVisible: false,
      isSubmenuOpen: false,
      isFetching: false,
    }
    this.refScroll = null
    this.navFocusListener = null
    this.navBlurListener = null
  }

  componentDidMount() {
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
    } else {
      this.reloadDiscussionLatest()
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
    this.setState({ isSubmenuVisible: this.props.navigation.isFocused() })
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
    let post = this.getStoredPostById(postId)
    if (!post) {
      if (this.state.discussionId !== discussionId) {
        this.setState({ discussionId })
      }
      const queryString = `${discussionId}?order=older_than&from_id=${Number(postId) + 1}`
      await this.fetchDiscussion(queryString)
      post = this.getStoredPostById(postId)
    }
    this.scrollToPost(post)
  }

  async fetchDiscussion(idOrQueryString) {
    // console.warn('fetch ', idOrQueryString) // TODO: remove
    this.setState({ isFetching: true })
    const res = await this.nyx.getDiscussion(idOrQueryString)
    const newPosts = getDistinctPosts(res.posts, this.state.posts)
    const parsedPosts = parsePostsContent(newPosts)
    const title = `${res.discussion_common.discussion.name_static}${
      res.discussion_common.discussion.name_dynamic ? ' ' + res.discussion_common.discussion.name_dynamic : ''
    }`
    let header = res?.discussion_common?.discussion_specific_data?.header
    if (header?.length > 0) {
      header = parsePostsContent(header)
    }
    const uploadedFiles = res?.discussion_common.waiting_files || []
    const isBooked = res?.discussion_common?.bookmark?.bookmark
    const images = parsedPosts.flatMap(p => p.parsed.images)
    this.setState({
      title,
      images,
      isBooked,
      header,
      posts: parsedPosts,
      isFetching: false,
    })
    this.props.onDiscussionFetched({ title, uploadedFiles })
    this.nyx.store.activeDiscussionId = this.props.id
    return newPosts
  }

  getStoredPostById(postId) {
    return this.state?.posts?.filter(p => p.id == postId)[0]
  }

  scrollToPost(post, animated = false) {
    try {
      if (post) {
        setTimeout(() => {
          this.refScroll.scrollToItem({
            item: post,
            animated,
          })
          this.setState({ isFetching: false })
        }, 300) // todo .. get onListUpdated
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

  showPost(discussionId, postId) {
    this.props.navigation.push('discussion', { discussionId, postId })
  }

  showImages(image) {
    const imgIndex = this.state.images.indexOf(image)
    const images = this.state.images.map(img => ({ url: img.src }))
    this.props.onImages(images, imgIndex)
  }

  onPostDelete(postId) {
    const posts = this.state.posts.filter(p => p.id != postId)
    this.setState({ posts })
  }

  onReply(discussionId, postId, username) {
    this.props.navigation.push('composePost', {
      discussionId,
      postId,
      replyTo: username,
    })
  }

  onVoteCast(updatedPost) {
    if (updatedPost?.error) {
      return
    }
    const posts = getDistinctPosts([updatedPost], this.state.posts)
    this.setState({ posts })
  }

  onDiceRollOrPollVote(updatedPost) {
    if (updatedPost?.error) {
      return
    }
    if (updatedPost?.location === 'header') {
      const header = parsePostsContent([updatedPost])
      this.setState({ header })
    } else {
      const parsedPosts = parsePostsContent([updatedPost])
      const posts = getDistinctPosts(parsedPosts, this.state.posts)
      this.setState({ posts })
    }
  }

  async bookmarkDiscussion() {
    const newIsBooked = !this.state.isBooked
    this.setState({ isBooked: newIsBooked, isFetching: true })
    await this.nyx.bookmarkDiscussion(this.props.id, newIsBooked)
    this.setState({ isFetching: false })
  }

  render() {
    return (
      <View style={{ backgroundColor: this.isDarkMode ? Styling.colors.black : Styling.colors.white }}>
        <Portal>
          <FAB.Group
            visible={this.state.isSubmenuVisible}
            open={this.state.isSubmenuOpen}
            icon={this.state.isSubmenuOpen ? 'email' : 'plus'}
            fabStyle={{ backgroundColor: Styling.colors.primary }}
            actions={[
              {
                icon: 'bookmark',
                label: this.state.isBooked ? 'unbook' : 'book',
                onPress: () => this.bookmarkDiscussion(),
              },
              {
                icon: 'book',
                label: this.state.isHeaderVisible ? 'hide header' : 'show header',
                onPress: () => this.setState({ isHeaderVisible: !this.state.isHeaderVisible }),
              },
            ]}
            onStateChange={({ open }) => this.setState({ isSubmenuOpen: open })}
            onPress={() => {
              if (this.state.isSubmenuOpen) {
                this.setState({ isSubmenuOpen: false })
                this.props.navigation.push('composePost', {
                  discussionId: this.props.id,
                })
              }
            }}
            style={{ marginBottom: 50 }}
          />
        </Portal>
        <FlatList
          ref={r => (this.refScroll = r)}
          data={this.state.isHeaderVisible ? this.state.header : this.state.posts}
          extraData={this.state}
          keyExtractor={(item, index) => `${item.uuid}`}
          refreshing={this.state.isFetching}
          onRefresh={() => this.loadDiscussionTop()}
          onEndReached={() => this.loadDiscussionBottom()}
          onEndReachedThreshold={0.01}
          style={{
            height: '100%',
            backgroundColor: this.isDarkMode ? Styling.colors.darker : Styling.colors.lighter,
          }}
          ListFooterComponent={() =>
            this.state.isFetching &&
            this.state.posts.length > 0 && <ActivityIndicator size="large" color={Styling.colors.primary} />
          }
          // getItemLayout={} // todo calc item height in Parser?
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
              onImage={image => this.showImages(image)}
              onDelete={postId => this.onPostDelete(postId)}
              onReply={(discussionId, postId, username) => this.onReply(discussionId, postId, username)}
              onVoteCast={updatedPost => this.onVoteCast(updatedPost)}
              onDiceRoll={updatedPost => this.onDiceRollOrPollVote(updatedPost)}
              onPollVote={updatedPost => this.onDiceRollOrPollVote(updatedPost)}
            />
          )}
        />
      </View>
    )
  }
}
