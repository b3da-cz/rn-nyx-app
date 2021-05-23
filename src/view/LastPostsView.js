import React, { Component } from 'react'
import { FlatList, View } from 'react-native'
import { PostComponent, RatingFilterBarComponent } from '../component'
import {
  MainContext,
  Styling,
  getDistinctPosts,
  parsePostsContent,
  wait,
  filterDiscussions,
  filterPostsByAuthor,
} from '../lib'

type Props = {
  navigation: any,
  onImages: Function,
}
export class LastPostsView extends Component<Props> {
  static contextType = MainContext
  constructor(props) {
    super(props)
    this.state = {
      posts: [],
      images: [],
      isRatedByFriends: false,
      isFetching: false,
      minRating: 0,
    }
    this.navTabPressListener = null
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.filters = [...this.context.filters]
    this.blockedUsers = [...this.context.blockedUsers]
    this.navTabPressListener = this.props.navigation.dangerouslyGetParent().addListener('tabPress', () => {
      const isFocused = this.props.navigation.isFocused()
      if (isFocused && !this.state.isFetching) {
        this.getLastPosts()
      }
    })
    this.getLastPosts()
  }

  componentWillUnmount() {
    if (this.navTabPressListener) {
      this.navTabPressListener()
    }
  }

  async getLastPosts() {
    this.setState({ isFetching: true, posts: [] })
    const res = await this.nyx.getLastPosts(this.state.minRating, this.state.isRatedByFriends)
    const filteredPosts = filterDiscussions(res.posts, this.filters) // last posts have discussion_name prop
    const filteredByAuthor =
      this.blockedUsers?.length > 0 ? filterPostsByAuthor(filteredPosts, this.blockedUsers) : filteredPosts
    const newPosts = getDistinctPosts(filteredByAuthor, [])
    const parsedPosts = parsePostsContent(newPosts)
    const images = parsedPosts.flatMap(p => p.parsed.images)
    this.setState({
      posts: parsedPosts,
      images,
      isFetching: false,
    })
    return parsedPosts
  }

  async setFilter(minRating, isRatedByFriends) {
    this.setState({
      isRatedByFriends: minRating > 0 ? false : isRatedByFriends,
      minRating,
    })
    await wait()
    this.getLastPosts()
  }

  showImages(image) {
    const imgIndex = this.state.images.indexOf(image)
    const images = this.state.images.map(img => ({ url: img.src }))
    this.props.onImages(images, imgIndex)
  }

  render() {
    return (
      <View>
        <RatingFilterBarComponent
          isDarkMode={this.isDarkMode}
          height={50}
          onFilter={(minRating, isRatedByFriends) => this.setFilter(minRating, isRatedByFriends)}
        />
        <FlatList
          data={this.state.posts}
          extraData={this.state}
          keyExtractor={(item, index) => `${item.uuid}`}
          refreshing={this.state.isFetching}
          onRefresh={() => this.getLastPosts()}
          style={{
            height: '100%',
            backgroundColor: this.isDarkMode ? Styling.colors.darker : Styling.colors.lighter,
          }}
          renderItem={({ item }) => (
            <PostComponent
              key={item.id}
              post={item}
              nyx={this.nyx}
              isDarkMode={this.isDarkMode}
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
