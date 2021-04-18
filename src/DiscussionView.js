import React, { Component } from 'react'
import { ActivityIndicator, FlatList, ScrollView, RefreshControl, StyleSheet, Text, TouchableOpacity, Image, View } from 'react-native'
import { Nyx, Styling, generateUuidV4, PostComponent } from './'
import { WebView } from 'react-native-webview'

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
    this.postCoords = {}
    this.scrollRef = null
    setTimeout(() => this.reloadDiscussionLatest(), 1000)
  }

  async reloadDiscussionLatest() {
    await this.fetchDiscussion(this.state.discussionId ? this.state.discussionId : this.props.id)
    // todo scroll to top? nah, called only on init
  }

  async loadDiscussionTop() {
    const discussionId = this.state.discussionId ? this.state.discussionId : this.props.id
    const topPostId = this.state.posts.length > 0 && this.state.posts[0].id
    const queryString = `${discussionId}?order=newer_than&from_id=${topPostId}`
    await this.fetchDiscussion(queryString)
    // todo scroll to top post
    // this.scrollToPost(topPostId)
  }

  async loadDiscussionBottom() {
    const discussionId = this.state.discussionId ? this.state.discussionId : this.props.id
    const bottomPostId = this.state.posts.length > 0 && this.state.posts[this.state.posts.length - 1].id
    const queryString = `${discussionId}?order=older_than&from_id=${bottomPostId}`
    await this.fetchDiscussion(queryString)
    // scroll to bottom post not needed
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
    newPosts.sort((a, b) => a.id < b.id ? 1 : a.id > b.id ? -1 : 0)
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
          this.scrollRef.scrollToItem({
            item: post,
            animated,
          })
          this.setState({ isFetching: false })
        }, 100)
      }
    } catch (e) { console.warn(e) }
  }

  // scrollToPost(postId, animated = false) {
  //   console.warn('offset', this.postCoords[postId], this.postCoords); // TODO: remove
  //   setTimeout(() => {
  //     this.scrollRef.scrollToOffset({
  //       offset: this.postCoords[postId],
  //       animated,
  //     })
  //     this.setState({ isFetching: false })
  //   }, 100)
  // }


  // async getDiscussionDetail(id?, isEndOfList = false) {
  //   this.setState({ isFetching: true })
  //   // console.warn('getddetail', {id, isEndOfList}) // TODO: remove
  //   let lastPostId = this.state.posts && this.state.posts.length ? this.state.posts[0].id : 0
  //   let postToScrollTo = lastPostId > 0 ? {...this.state.posts[0]} : null
  //   if (id && typeof id === 'string' && id.includes('from_id')) {
  //     postToScrollTo = 'first' // todo!
  //   }
  //   const isRefreshing = !id
  //   if (!id) {
  //     // onRefresh
  //     id = `${this.props.id}?order=newer_than&from_id=${lastPostId}`
  //   }
  //   if (isEndOfList) {
  //     id = `${this.props.id}?order=older_than&from_id=${this.state.posts[this.state.posts.length - 1].id}`
  //     postToScrollTo = { ...this.state.posts[this.state.posts.length - 1] }
  //     // console.warn('last ', id); // TODO: remove
  //   }
  //   const res = await this.props.nyx.getDiscussion(id);
  //   // console.warn({res}) // TODO: remove
  //   let newPosts = []
  //   if (isRefreshing) {
  //     const map = new Map()
  //     for (const item of [...res.posts, ...this.state.posts]) {
  //       if (!map.has(item.id)) {
  //         map.set(item.id, true)
  //         newPosts.push(item)
  //       }
  //     }
  //   } else {
  //     newPosts = res.posts
  //   }
  //   // console.warn('new posts', newPosts.length); // TODO: remove
  //   const title = `${res.discussion_common.discussion.name_static}${
  //     res.discussion_common.discussion.name_dynamic ? ' ' + res.discussion_common.discussion.name_dynamic : ''
  //   }`
  //   this.setState({
  //     title: title,
  //     posts: newPosts,
  //   })
  //   this.props.onDiscussionFetched({ title })
  //   // console.warn(lastPostId) // TODO: remove
  //   // console.warn(this.postCoords[lastPostId]) // TODO: remove
  //   // console.warn(this.postCoords) // TODO: remove
  //   // setTimeout(() => { // not for FlatList
  //   //   this.scrollRef.scrollTo({
  //   //     x: 0,
  //   //     y: !isRefreshing ? 0 : this.postCoords[lastPostId],
  //   //     animated: true,
  //   //   })
  //   // }, 100)
  //   if (postToScrollTo === 'first') {
  //     setTimeout(() => {
  //       this.scrollRef.scrollToOffset({
  //         offset: 0,
  //         animated: false,
  //       })
  //       this.setState({ isFetching: false })
  //     }, 100)
  //   } else if (postToScrollTo && postToScrollTo !== 'first' && !isEndOfList) { // todo refactor all of this shit
  //     setTimeout(() => {
  //       postToScrollTo = this.state.posts.filter(p => p.id === postToScrollTo.id)[0]; // get actual thing
  //       // console.warn({postToScrollTo}); // TODO: remove
  //       this.scrollRef.scrollToItem({
  //         item: postToScrollTo,
  //         animated: false,
  //       })
  //       this.setState({ isFetching: false })
  //     }, 200);
  //   } else {
  //     this.setState({ isFetching: false })
  //   }
  // }

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
        ref={r => (this.scrollRef = r)}
        data={this.state.posts}
        extraData={this.state}
        keyExtractor={(item, index) => `${item.uuid}`}
        refreshing={this.state.isFetching}
        onRefresh={() => this.loadDiscussionTop()}
        onEndReached={() => this.loadDiscussionBottom()}
        onEndReachedThreshold={0.01}
        ListFooterComponent={() => (
          this.state.isFetching && this.state.posts.length > 0 && <ActivityIndicator size="large" color={Styling.colors.primary} />
        )}
        renderItem={({item}) => (
          <PostComponent
            key={item.id}
            post={item}
            nyx={this.props.nyx}
            isDarkMode={this.props.isDarkMode}
            onLayout={(postId, y) => (this.postCoords[postId] = y)}
            onDiscussionDetailShow={(discussionId, postId) => this.jumpToPost(discussionId, postId)}
            onImages={(images, i) => this.showImages(images, i)}
            onDelete={postId => this.onPostDelete(postId)}
          />
        )}
      />
    )
  }
  // render() {
  //   return (
  //     <ScrollView
  //       ref={r => (this.scrollRef = r)}
  //       contentInsetAdjustmentBehavior="automatic"
  //       onContentSizeChange={(width, height) => this.setState({ scrollHeight: height })}
  //       refreshControl={
  //         <RefreshControl refreshing={this.state.isFetching} onRefresh={() => this.getDiscussionDetail()} />
  //       }
  //       style={Styling.groups.themeView(this.props.isDarkMode)}>
  //       <View>
  //         <View>
  //           {this.state.posts &&
  //             this.state.posts.length > 0 &&
  //             this.state.posts.map(p => (
  //               <PostComponent
  //                 key={p.id}
  //                 post={p}
  //                 nyx={this.props.nyx}
  //                 isDarkMode={this.props.isDarkMode}
  //                 onLayout={(postId, y) => (this.postCoords[postId] = y)}
  //                 onDiscussionDetailShow={id => this.getDiscussionDetail(id)}
  //               />
  //             ))}
  //           {this.state.posts && this.state.posts.length === 0 && (
  //             <View
  //               style={[
  //                 { height: Styling.metrics.window.height - 60, width: '100%', alignItems: 'center', justifyContent: 'center' },
  //                 Styling.groups.themeComponent(this.props.isDarkMode)]}>
  //               <ActivityIndicator size="large" color={Styling.colors.primary} style={{ marginBottom: 200 }} />
  //             </View>)}
  //         </View>
  //       </View>
  //     </ScrollView>
  //   )
  // }
}
