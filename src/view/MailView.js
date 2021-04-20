import React, { Component } from 'react'
import { FlatList, Text, View } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { PostComponent } from '../component'
import { getDistinctPosts, Nyx, Styling } from '../lib'

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
      activeRecipient: 'all',
      conversations: [],
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
    this.setState({
      conversations: res.conversations,
      messages: res.posts,
      isFetching: false,
    })
  }

  async getOlderMessages() {
    this.setState({ isFetching: true })
    const { activeRecipient, messages } = this.state
    const queryString = `?${activeRecipient === 'all' ? '' : `user=${activeRecipient}&`}order=older_than&from_id=${
      messages[messages.length - 1].id
    }`
    const res = await this.props.nyx.getMail(queryString)
    const newMessages = getDistinctPosts(res.posts, messages)
    this.setState({
      conversations: res.conversations,
      messages: newMessages,
      isFetching: false,
    })
  }

  async onConversationSelected(username) {
    this.setState({ isFetching: true })
    const queryString = username === 'all' ? '' : `?user=${username}`
    const res = await this.props.nyx.getMail(queryString)
    this.setState({
      activeRecipient: username,
      conversations: res.conversations,
      messages: res.posts,
      isFetching: false,
    })
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

  getPickerItemColor(val) {
    return this.state.activeRecipient === val
      ? Styling.colors.primary
      : this.props.isDarkMode
      ? Styling.colors.lighter
      : Styling.colors.darker
  }

  renderMessage(msg) {
    return (
      <View
        style={{
          // marginHorizontal: Styling.metrics.block.small,
          borderColor: Styling.colors.dark,
          borderTopWidth: 1,
        }}>
        <PostComponent
          key={msg.id}
          post={msg}
          nyx={this.props.nyx}
          isDarkMode={this.props.isDarkMode}
          isHeaderInteractive={false}
          onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
          onImages={(images, i) => this.showImages(images, i)}
          onDelete={postId => this.onPostDelete(postId)}
        />
      </View>
    )
  }

  render() {
    return (
      <View style={{ backgroundColor: this.props.isDarkMode ? Styling.colors.black : Styling.colors.white }}>
        {this.state.conversations && this.state.conversations.length > 0 && (
          <Picker
            mode={'dropdown'}
            style={[Styling.groups.themeComponent(this.props.isDarkMode), { color: Styling.colors.primary }]}
            prompt={'Recipient'}
            selectedValue={this.state.activeRecipient}
            onValueChange={activeRecipient => this.onConversationSelected(activeRecipient)}>
            <Picker.Item label={'All'} value={'all'} color={this.getPickerItemColor('all')} />
            {this.state.conversations.map(c => (
              <Picker.Item label={c.username} value={c.username} color={this.getPickerItemColor(c.username)} />
            ))}
          </Picker>
        )}
        <FlatList
          style={{ height: '72%' }}
          ref={r => (this.refScroll = r)}
          data={this.state.messages}
          extraData={this.state}
          keyExtractor={(item, index) => `${item.id}`}
          refreshing={this.state.isFetching}
          onRefresh={() => this.getMessages()}
          onEndReached={() => this.getOlderMessages()}
          onEndReachedThreshold={0.01}
          renderItem={({ item }) => this.renderMessage(item)}
        />
      </View>
    )
  }
}
