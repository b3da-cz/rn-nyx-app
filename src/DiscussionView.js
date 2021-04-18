import React, { Component } from 'react'
import {
  ActivityIndicator,
  FlatList,
} from 'react-native'
import { Nyx, Styling, generateUuidV4, PostComponent } from './'

type Props = {
  id: number,
  isDarkMode: boolean,
  nyx: Nyx,
  onDiscussionFetched: Function,
  onImages: Function,
}
export class DiscussionView extends Component<Props> {
  constructor(props) {
    super(props)
    this.state = {
      title: '',
      discussionId: null,
      posts: [],
      isFetching: false,
      scrollHeight: 0,
    }
    this.refScroll = null
    setTimeout(() => this.reloadDiscussionLatest(), 1000)
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
      const queryString = `${discussionId}?order=older_than&from_id=${Number(postId) + 1}`;
      await this.fetchDiscussion(queryString)
      post = this.getStoredPostById(postId)
    }
    this.scrollToPost(post)
  }

  async fetchDiscussion(idOrQueryString) {
    // console.warn('fetch ', idOrQueryString); // TODO: remove
    this.setState({ isFetching: true })
    const res = await this.props.nyx.getDiscussion(idOrQueryString)
    const newPosts = this.getDistinctPosts(res.posts)
    const title = `${res.discussion_common.discussion.name_static}${
      res.discussion_common.discussion.name_dynamic ? ' ' + res.discussion_common.discussion.name_dynamic : ''
    }`
    const uploadedFiles = res.discussion_common.waiting_files || []
    this.setState({
      title: title,
      posts: newPosts,
      isFetching: false,
    })
    this.props.onDiscussionFetched({ title, uploadedFiles })
    return newPosts
  }

  getDistinctPosts(posts) {
    let newPosts = []
    const map = new Map()
    for (const item of [...posts, ...this.state.posts]) {
      if (!map.has(item.id)) {
        map.set(item.id, true)
        if (!item.uuid) {
          item.uuid = generateUuidV4()
        }
        newPosts.push(item)
      }
    }
    newPosts.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
    // console.warn('posts len', newPosts.length); // TODO: remove
    return newPosts
  }

  getStoredPostById(postId) {
    return this.state.posts.filter(p => p.id == postId)[0]
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
        }, 100)
      }
    } catch (e) {
      console.warn(e);
    }
  }

  showImages(images, imgIndex) {
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
        ListFooterComponent={() =>
          this.state.isFetching &&
          this.state.posts.length > 0 && <ActivityIndicator size="large" color={Styling.colors.primary} />
        }
        renderItem={({ item }) => (
          <PostComponent
            key={item.id}
            post={item}
            nyx={this.props.nyx}
            isDarkMode={this.props.isDarkMode}
            onDiscussionDetailShow={(discussionId, postId) => this.jumpToPost(discussionId, postId)}
            onImages={(images, i) => this.showImages(images, i)}
            onDelete={postId => this.onPostDelete(postId)}
          />
        )}
      />
    )
  }
}
