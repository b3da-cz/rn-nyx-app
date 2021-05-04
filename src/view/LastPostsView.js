import React, { Component } from 'react'
import { FlatList } from 'react-native'
import { PostComponent } from '../component'
import { Context, Styling, getDistinctPosts, parsePostsContent } from '../lib'

type Props = {
  navigation: any,
  onImages: Function,
}
export class LastPostsView extends Component<Props> {
  static contextType = Context
  constructor(props) {
    super(props)
    this.state = {
      posts: [],
      images: [],
      isFetching: false,
    }
    this.navTabPressListener = null
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
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
    this.setState({ isFetching: true })
    const res = await this.nyx.getLastPosts()
    const newPosts = getDistinctPosts(res.posts, this.state.posts)
    const parsedPosts = parsePostsContent(newPosts)
    const images = parsedPosts.flatMap(p => p.parsed.images)
    this.setState({
      posts: parsedPosts,
      images,
      isFetching: false,
    })
    return newPosts
  }

  showImages(image) {
    const imgIndex = this.state.images.indexOf(image)
    const images = this.state.images.map(img => ({ url: img.src }))
    this.props.onImages(images, imgIndex)
  }

  render() {
    return (
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
            onHeaderPress={(discussionId, postId) => this.props.navigation.push('discussion', { discussionId, postId })}
            onDiscussionDetailShow={(discussionId, postId) =>
              this.props.navigation.push('discussion', { discussionId, postId })
            }
            onImage={image => this.showImages(image)}
            onDelete={() => null}
          />
        )}
      />
    )
  }
}
