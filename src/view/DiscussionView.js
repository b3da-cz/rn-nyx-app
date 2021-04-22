import React, { Component } from 'react'
import { ActivityIndicator, FlatList } from 'react-native'
import { PostComponent } from '../component'
import { Context, Styling, getDistinctPosts, parsePostsContent } from '../lib'

type Props = {
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
      isFetching: false,
    }
    this.refScroll = null
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    if (this.props.postId > 0) {
      this.jumpToPost(this.props.id, this.props.postId)
    } else {
      this.reloadDiscussionLatest()
    }
  }

  async reloadDiscussionLatest() {
    await this.fetchDiscussion(this.state.discussionId ? this.state.discussionId : this.props.id)
  }

  async loadDiscussionTop() {
    const discussionId = this.state.discussionId ? this.state.discussionId : this.props.id
    const topPostId = this.state.posts.length > 0 && this.state.posts[0].id
    const queryString = `${discussionId}?order=newer_than&from_id=${topPostId}`
    await this.fetchDiscussion(queryString)
  }

  async loadDiscussionBottom() {
    if (this.state.posts.length < 20) {
      return // prevent reloading of new discussion, todo variable min len
    }
    const discussionId = this.state.discussionId ? this.state.discussionId : this.props.id;
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
      const queryString = `${discussionId}?order=older_than&from_id=${Number(postId) + 1}`;
      await this.fetchDiscussion(queryString)
      post = this.getStoredPostById(postId)
    }
    this.scrollToPost(post)
  }

  async fetchDiscussion(idOrQueryString) {
    // console.warn('fetch ', idOrQueryString); // TODO: remove
    this.setState({ isFetching: true })
    const res = await this.nyx.getDiscussion(idOrQueryString)
    const newPosts = getDistinctPosts(res.posts, this.state.posts)
    const parsedPosts = parsePostsContent(newPosts)
    const title = `${res.discussion_common.discussion.name_static}${
      res.discussion_common.discussion.name_dynamic ? ' ' + res.discussion_common.discussion.name_dynamic : ''
    }`
    const uploadedFiles = res.discussion_common.waiting_files || []
    const images = parsedPosts.flatMap(p => p.parsed.images)
    this.setState({
      title,
      images,
      posts: parsedPosts,
      isFetching: false,
    })
    this.props.onDiscussionFetched({ title, uploadedFiles })
    this.nyx.store.activeDiscussionId = this.props.id
    return newPosts
  }

  getStoredPostById(postId) {
    return this.state && this.state.posts && this.state.posts.filter(p => p.id == postId)[0] // this.state check needed for navigating from notification
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

  showImages(image) {
    const imgIndex = this.state.images.indexOf(image)
    const images = this.state.images.map(img => ({ url: img.src }))
    this.props.onImages(images, imgIndex)
  }

  onPostDelete(postId) {
    const posts = this.state.posts.filter(p => p.id != postId)
    this.setState({ posts })
  }

  render() {
    return (
      <FlatList
        ref={r => (this.refScroll = r)}
        data={this.state.posts}
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
        renderItem={({ item }) => (
          <PostComponent
            key={item.id}
            post={item}
            nyx={this.nyx}
            isDarkMode={this.isDarkMode}
            isHeaderInteractive={true}
            onDiscussionDetailShow={(discussionId, postId) => this.jumpToPost(discussionId, postId)}
            onImage={image => this.showImages(image)}
            onDelete={postId => this.onPostDelete(postId)}
          />
        )}
      />
    )
  }
}
