import React, { Component } from 'react'
import { FlatList, LayoutAnimation, View } from 'react-native'
import { FormRowSelectComponent, MessageBoxDialog, PostComponent } from '../component'
import { MainContext, getDistinctPosts, LayoutAnimConf, parsePostsContent, Theme, wait, Nyx } from '../lib'

type Props = {
  onImages: Function
  onNavigation: Function
  navigation: any
}
type State = {
  activeRecipient: string
  conversations: any[]
  messages: any[]
  isSubmenuVisible: boolean
  isMsgBtnVisible: boolean
  isFetching: boolean
  theme?: Theme
}
export class MailView extends Component<Props> {
  static contextType = MainContext
  state: Readonly<State>
  nyx?: Nyx
  refMsgBoxDialog: any
  refScroll: any
  navFocusListener?: Function
  navBlurListener?: Function
  navTabPressListener?: Function
  constructor(props) {
    super(props)
    this.state = {
      activeRecipient: 'all',
      conversations: [],
      messages: [],
      isSubmenuVisible: false,
      isMsgBtnVisible: false,
      isFetching: false,
    }
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      this.setState({ isSubmenuVisible: true, isMsgBtnVisible: true })
    })
    this.navBlurListener = this.props.navigation.addListener('blur', () => {
      this.setState({ isSubmenuVisible: false, isMsgBtnVisible: false })
    })
    this.navTabPressListener = this.props.navigation.dangerouslyGetParent().addListener('tabPress', () => {
      const isFocused = this.props.navigation.isFocused()
      if (isFocused && !this.state.isFetching) {
        this.getLatestMessages()
      }
    })
    this.setTheme()
    setTimeout(() => this.getLatestMessages(), 100)
  }

  componentWillUnmount() {
    if (this.navFocusListener) {
      this.navFocusListener()
    }
    if (this.navBlurListener) {
      this.navBlurListener()
    }
    if (this.navTabPressListener) {
      this.navTabPressListener()
    }
  }

  setTheme() {
    this.setState({ theme: this.context.theme })
  }

  async getLatestMessages() {
    const isFocused = this.props.navigation.isFocused()
    this.setState({
      isFetching: true,
      isSubmenuVisible: isFocused,
      isMsgBtnVisible: isFocused,
    })
    const res = await this.nyx?.api.getMail()
    const parsedMessages = parsePostsContent(res?.posts)
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({
      conversations: res?.conversations,
      messages: parsedMessages,
      isFetching: false,
    })
  }

  async getOlderMessages() {
    this.setState({ isFetching: true })
    const { activeRecipient, messages } = this.state
    const queryString = `?${activeRecipient === 'all' ? '' : `user=${activeRecipient}&`}order=older_than&from_id=${
      messages[messages.length - 1].id
    }`
    const res = await this.nyx?.api.getMail(queryString)
    const newMessages = getDistinctPosts(res?.posts || [], messages)
    const parsedMessages = parsePostsContent(newMessages)
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({
      conversations: res?.conversations,
      messages: parsedMessages,
      isFetching: false,
    })
  }

  async onConversationSelected(username) {
    this.setState({ isFetching: true, messages: [] })
    const queryString = username === 'all' ? '' : `?user=${username}`
    const res = await this.nyx?.api.getMail(queryString)
    const parsedMessages = parsePostsContent(res?.posts)
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({
      activeRecipient: username,
      conversations: res?.conversations,
      messages: parsedMessages,
      isFetching: false,
    })
  }

  showImages(image) {
    this.props.onImages([{ url: image.src }], 0)
  }

  showPost(discussionId, postId) {
    this.props.onNavigation({ discussionId, postId })
  }

  onPostDelete(postId: number) {
    console.warn('todo', postId) // TODO: remove
  }

  async onReply(username) {
    if (this.state.activeRecipient !== username) {
      this.setState({ activeRecipient: username })
      await wait()
      // await this.onConversationSelected(username)
    }
    this.refMsgBoxDialog?.showDialog()
  }

  getPickerItemColor(val, hasUnreadMail?: boolean) {
    return hasUnreadMail
      ? this.state.theme!.colors.accent
      : // : this.state.activeRecipient === val
        // ? this.state.theme!.colors.primary
        this.state.theme!.colors.text
  }

  renderMessage(msg) {
    return (
      <PostComponent
        key={msg.id}
        post={msg}
        nyx={this.nyx!}
        isReply={msg.incoming}
        isUnread={msg.unread}
        isHeaderInteractive={false}
        isHeaderPressable={true}
        onHeaderPress={() => this.onReply(msg.username)}
        onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
        onImage={image => this.showImages(image)}
        onDelete={postId => this.onPostDelete(postId)}
      />
    )
  }

  render() {
    const { activeRecipient, conversations, theme } = this.state
    if (!theme) {
      return null
    }
    return (
      <View style={{ backgroundColor: theme.colors.background }}>
        {this.state.conversations && this.state.conversations.length > 0 && (
          <FormRowSelectComponent
            hasAll={true}
            value={activeRecipient}
            onSelect={val => this.onConversationSelected(val)}
            options={conversations.map(c => ({
              value: c.username,
              icon: c.has_unread_mail
                ? 'message-alert'
                : c.incoming
                ? 'message-arrow-right-outline'
                : 'message-outline',
            }))}
          />
        )}
        <FlatList
          style={{ height: '100%' }}
          ref={r => (this.refScroll = r)}
          data={this.state.messages}
          extraData={this.state}
          keyExtractor={item => `${item.id}`}
          refreshing={this.state.isFetching}
          onRefresh={() => this.getLatestMessages()}
          onEndReached={() => this.getOlderMessages()}
          onEndReachedThreshold={0.01}
          renderItem={({ item }) => this.renderMessage(item)}
        />
        <MessageBoxDialog
          ref={r => (this.refMsgBoxDialog = r)}
          nyx={this.nyx!}
          params={{ mailRecipient: this.state.activeRecipient !== 'all' ? this.state.activeRecipient : '' }}
          fabBackgroundColor={theme.colors.secondary}
          fabIcon={'email'}
          fabBottomPosition={50}
          isVisible={this.state.isMsgBtnVisible}
          onSend={() => this.getLatestMessages()}
        />
      </View>
    )
  }
}
