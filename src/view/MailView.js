import React, { Component } from 'react'
import { FlatList, Text, View } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { PostComponent } from '../component'
import { Context, getDistinctPosts, Styling } from '../lib'

type Props = {
  onImages: Function,
  onNavigation: Function,
}
export class MailView extends Component<Props> {
  static contextType = Context
  constructor(props) {
    super(props)
    this.state = {
      activeRecipient: 'all',
      conversations: [],
      messages: [],
      isFetching: false,
    }
    this.refScroll = null
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.getMessages()
  }

  async getMessages() {
    this.setState({ isFetching: true })
    const res = await this.nyx.getMail()
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
    const res = await this.nyx.getMail(queryString)
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
    const res = await this.nyx.getMail(queryString)
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
      : this.isDarkMode
      ? Styling.colors.lighter
      : Styling.colors.darker
  }

  renderMessage(msg) {
    return (
      <PostComponent
        key={msg.id}
        post={msg}
        nyx={this.nyx}
        isDarkMode={this.isDarkMode}
        isHeaderInteractive={false}
        onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
        onImages={(images, i) => this.showImages(images, i)}
        onDelete={postId => this.onPostDelete(postId)}
      />
    )
  }

  render() {
    return (
      <View style={{ backgroundColor: this.isDarkMode ? Styling.colors.black : Styling.colors.white }}>
        {this.state.conversations && this.state.conversations.length > 0 && (
          <Picker
            mode={'dropdown'}
            style={[Styling.groups.themeComponent(this.isDarkMode), { color: Styling.colors.primary }]}
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
          style={{ height: '100%' }}
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
