import React, { Component } from 'react'
import { FlatList, View } from 'react-native'
import { Portal, FAB } from 'react-native-paper'
import { Picker } from '@react-native-picker/picker'
import { PostComponent } from '../component'
import { Context, getDistinctPosts, Styling, parsePostsContent, t } from '../lib'

type Props = {
  onImages: Function,
  onNavigation: Function,
  navigation: any,
}
export class MailView extends Component<Props> {
  static contextType = Context
  constructor(props) {
    super(props)
    this.state = {
      activeRecipient: 'all',
      conversations: [],
      messages: [],
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
    setTimeout(() => this.getLatestMessages(), 100)
  }

  componentWillUnmount() {
    if (this.navFocusListener) {
      this.navFocusListener()
    }
    if (this.navBlurListener) {
      this.navBlurListener()
    }
  }

  async getLatestMessages() {
    this.setState({
      isFetching: true,
      isSubmenuVisible: this.props.navigation.isFocused(),
    })
    const res = await this.nyx.getMail()
    const parsedMessages = parsePostsContent(res.posts)
    const parsedReminders = parsePostsContent(res.reminders)
    this.setState({
      conversations: res.conversations,
      messages: parsedMessages,
      reminders: parsedReminders,
      isFetching: false,
      isSubmenuOpen: false,
      activeRecipient: this.state.activeRecipient === 'reminders' ? 'all' : this.state.activeRecipient,
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
    const parsedMessages = parsePostsContent(newMessages)
    this.setState({
      conversations: res.conversations,
      messages: parsedMessages,
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

  async getReminders() {
    this.setState({ isFetching: true })
    const queryString = '/reminders'
    const res = await this.nyx.getMail(queryString)
    const parsedReminders = parsePostsContent(res.reminders)
    this.setState({
      activeRecipient: 'reminders',
      conversations: res.conversations,
      reminders: parsedReminders,
      isFetching: false,
    })
  }

  showImages(image) {
    this.props.onImages([{ url: image.src }], 0)
  }

  showPost(discussionId, postId) {
    this.props.onNavigation({ discussionId, postId })
  }

  onPostDelete() {
    console.warn('todo'); // TODO: remove
  }

  getPickerItemColor(val, hasUnreadMail) {
    return hasUnreadMail
      ? Styling.colors.secondary
      : this.state.activeRecipient === val
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
        isReply={msg.incoming}
        isUnread={msg.unread}
        isHeaderInteractive={false}
        isHeaderPressable={true}
        onHeaderPress={() =>
          this.props.navigation.push('composePost', {
            isMailPost: true,
            username: msg.username,
          })
        }
        onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
        onImage={image => this.showImages(image)}
        onDelete={postId => this.onPostDelete(postId)}
      />
    )
  }

  render() {
    return (
      <View style={{ backgroundColor: this.isDarkMode ? Styling.colors.black : Styling.colors.white }}>
        {this.state.conversations && this.state.conversations.length > 0 && this.state.activeRecipient !== 'reminders' && (
          <Picker
            mode={'dropdown'}
            style={[Styling.groups.themeComponent(this.isDarkMode), { color: Styling.colors.primary }]}
            prompt={'Recipient'}
            selectedValue={this.state.activeRecipient}
            onValueChange={activeRecipient => this.onConversationSelected(activeRecipient)}>
            <Picker.Item key={'all'} label={t('all')} value={'all'} color={this.getPickerItemColor('all')} />
            {this.state.conversations.map(c => (
              <Picker.Item
                key={c.username}
                label={`${c.username}`}
                value={c.username}
                color={this.getPickerItemColor(c.username, c.has_unread_mail)}
              />
            ))}
          </Picker>
        )}
        <FlatList
          style={{ height: '100%' }}
          ref={r => (this.refScroll = r)}
          data={this.state.activeRecipient === 'reminders' ? this.state.reminders : this.state.messages}
          extraData={this.state}
          keyExtractor={(item, index) => `${item.id}`}
          refreshing={this.state.isFetching}
          onRefresh={() => this.getLatestMessages()}
          onEndReached={() => this.getOlderMessages()}
          onEndReachedThreshold={0.01}
          renderItem={({ item }) => this.renderMessage(item)}
        />
        <Portal>
          <FAB.Group
            visible={this.state.isSubmenuVisible}
            open={this.state.isSubmenuOpen}
            icon={this.state.activeRecipient === 'reminders' ? 'close' : !this.state.isSubmenuOpen ? 'plus' : 'email'}
            fabStyle={{ backgroundColor: Styling.colors.secondary }}
            actions={
              this.state.activeRecipient === 'reminders'
                ? []
                : [
                    {
                      icon: 'bell',
                      label: t('reminders.title'),
                      onPress: () => this.getReminders(),
                    },
                  ]
            }
            onStateChange={({ open }) => this.setState({ isSubmenuOpen: open })}
            onPress={() => {
              if (this.state.isSubmenuOpen) {
                this.props.navigation.push('composePost', {
                  isMailPost: true,
                  username: this.state.activeRecipient !== 'all' ? this.state.activeRecipient : '',
                })
              } else if (!this.state.isSubmenuOpen && this.state.activeRecipient === 'reminders') {
                this.getLatestMessages()
              }
            }}
            style={{ marginBottom: 50 }}
          />
        </Portal>
      </View>
    )
  }
}
