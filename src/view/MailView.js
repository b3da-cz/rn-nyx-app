import React, { Component } from 'react'
import { FlatList, Text, View } from 'react-native';
import { Nyx, Styling } from '../lib'

type Props = {
  isDarkMode: boolean,
  nyx: Nyx,
  onImages: Function,
  onNavigation: Function,
}
export class MailView extends Component<Props> {
  constructor(props) {
    super(props)
    this.state = {
      conversations: [], // todo c.username ... use when fetching messages by user, etc
      messages: [],
      isFetching: false,
    }
    this.refScroll = null
    setTimeout(() => this.getMessages(), 1000)
  }

  componentDidMount() {
    this.getMessages()
  }

  async getMessages() {
    this.setState({ isFetching: true })
    const res = await this.props.nyx.getMail()
    // console.warn(res); // TODO: remove
    this.setState({
      conversations: res.conversations,
      messages: res.posts,
      isFetching: false,
    })
    // content: "Supr"
    // id: 167401472
    // incoming: true
    // inserted_at: "2021-04-18T18:20:32"
    // username: "NYX"
  }

  showImages(images, imgIndex) {
    this.props.onImages(images, imgIndex)
  }

  showPost(discussionId, postId) {
    this.props.onNavigation({ discussionId, postId })
  }

  onPostDelete() {
    console.warn('todo'); // TODO: remove
  }
  //
  // renderItem(item) {
  //   const { replies, thumbs_up } = item.details
  //   return (
  //     <View
  //       style={[
  //         Styling.groups.themeView(this.props.isDarkMode),
  //         { borderBottomWidth: 2, borderColor: Styling.colors.primary },
  //       ]}
  //     >
  //     {/*// <TouchableOpacity*/}
  //     {/*//   style={[*/}
  //     {/*//     Styling.groups.themeView(this.props.isDarkMode),*/}
  //     {/*//     { borderBottomWidth: 2, borderColor: Styling.colors.primary },*/}
  //     {/*//   ]}*/}
  //     {/*//   accessibilityRole="button"*/}
  //     {/*//   onPress={() => this.showPost(item.data.discussion_id, item.data.id)}>*/}
  //       <PostComponent
  //         key={item.data.id}
  //         post={item.data}
  //         nyx={this.props.nyx}
  //         isDarkMode={this.props.isDarkMode}
  //         onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
  //         onImages={(images, i) => this.showImages(images, i)}
  //         onDelete={postId => this.onPostDelete(postId)}
  //       />
  //       {thumbs_up && thumbs_up.length > 0 && (
  //         <View
  //           style={{
  //             flexDirection: 'row',
  //             alignItems: 'flex-start',
  //             justifyContent: 'flex-start',
  //             flexWrap: 'wrap',
  //             minHeight: 25,
  //             // maxHeight: 75,
  //           }}>
  //           {thumbs_up.map(r => this.renderRating(r))}
  //         </View>
  //       )}
  //       {replies && replies.length > 0 && replies.map(r => this.renderReply(r))}
  //     </View>
  //     // </TouchableOpacity>
  //   )
  // }
  //
  // renderReply(post) {
  //   return (
  //     <View style={{ flexDirection: 'row' }} key={`${post.id}${post.discussionId}`}>
  //       <View
  //         style={{
  //           flex: 1,
  //           backgroundColor: this.props.isDarkMode ? Styling.colors.black : Styling.colors.white,
  //           zIndex: 1,
  //         }}
  //       />
  //       <View style={{ flex: 5 }}>
  //         <PostComponent
  //           key={post.id}
  //           post={post}
  //           nyx={this.props.nyx}
  //           isDarkMode={this.props.isDarkMode}
  //           onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
  //           onImages={(images, i) => this.showImages(images, i)}
  //           onDelete={postId => this.onPostDelete(postId)}
  //         />
  //       </View>
  //     </View>
  //   )
  // }
  //
  renderMessage(msg) {
    return (
      <View
        key={msg.id}
        style={{
          borderColor: 'red',
          borderWidth: 1,
        }}>
        <Text style={{color: 'white'}}>{msg.username}</Text>
        <Text style={{color: 'white'}}>{msg.inserted_at}</Text>
        <Text style={{color: 'white'}} selectable={true} selectionColor='orange'>{msg.content}</Text>
      </View>
    )
  }

  render() {
    // todo undefined keys in list ?
    return (
      <FlatList
        style={{ backgroundColor: this.props.isDarkMode ? Styling.colors.black : Styling.colors.white }}
        ref={r => (this.refScroll = r)}
        data={this.state.messages}
        extraData={this.state}
        keyExtractor={(item, index) => `${item.id}`}
        refreshing={this.state.isFetching}
        onRefresh={() => this.getMessages()}
        renderItem={({ item }) => this.renderMessage(item)}
      />
    )
  }
}
