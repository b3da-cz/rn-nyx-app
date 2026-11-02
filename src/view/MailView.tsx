import React, { Component } from 'react'
import { FlatList, InteractionManager, LayoutAnimation, View } from 'react-native'
import { FetchProgressComponent, FormRowSelectComponent, MessageBoxDialog, PostComponent } from '../component'
import {
  MainContext,
  LayoutAnimConf,
  emptyFetchProgress,
  FetchProgressEvent,
  FetchProgressState,
  preparePosts,
  readFeedCache,
  reconcileMailMessages,
  mailCacheKey,
  rememberMailPage,
  updateFeedCache,
  reduceFetchProgress,
  resolveFetchProgressMode,
  revealImageInPosts,
  galleryImagesFromPosts,
  toGalleryImages,
  Theme,
  t,
  wait,
  Nyx,
} from '../lib'

type Props = {
  onImages: Function
  onNavigation: Function
  navigation: any
  sharedText?: string
  sharedFile?: any
  sharedAt?: number
  composeUsername?: string
  composeAt?: number
}
type State = {
  activeRecipient: string
  conversations: any[]
  messages: any[]
  isSubmenuVisible: boolean
  isMsgBtnVisible: boolean
  isFetching: boolean
  fetchProgress: FetchProgressState
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
  isUnmounted = false
  lastFetchAt = 0
  _revealQueue: Promise<any> = Promise.resolve()
  _lastHandledSharedText?: string
  _lastHandledSharedFile?: any
  _lastHandledSharedAt?: number
  _lastComposeAt?: number
  constructor(props) {
    super(props)
    this.state = {
      activeRecipient: 'all',
      conversations: [],
      messages: [],
      isSubmenuVisible: false,
      isMsgBtnVisible: false,
      isFetching: false,
      fetchProgress: emptyFetchProgress(),
    }
  }

  trackLoad = (event: FetchProgressEvent) => {
    this.setState(state => ({ fetchProgress: reduceFetchProgress(state.fetchProgress, event) }))
  }

  beginMailLoad = (extra: Partial<State> = {}) => {
    const request = { id: 'request', label: t('mail'), done: 0, total: 1 }
    this.setState({
      isFetching: true,
      fetchProgress: reduceFetchProgress(emptyFetchProgress(), request),
      ...extra,
    })
    return request
  }

  scheduleLoad(force = false) {
    InteractionManager.runAfterInteractions(() => {
      if (this.isUnmounted) {
        return
      }
      const isFocused =
        typeof this.props.navigation?.isFocused === 'function' ? this.props.navigation.isFocused() : true
      if (!isFocused) {
        return
      }
      const hasMessages = this.state.messages?.length > 0
      const now = Date.now()
      if (!force && hasMessages && this.lastFetchAt > 0 && now - this.lastFetchAt < 60000) {
        return
      }
      if (!this.state.isFetching) {
        this.getLatestMessages()
      }
    })
  }

  componentDidMount() {
    this.isUnmounted = false
    this.nyx = this.context.nyx
    if (this.context?.refs) {
      this.context.refs.MailView = this
    }
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      this.setState({ isSubmenuVisible: true, isMsgBtnVisible: true })
      this.handleSharedContent()
      this.handleComposeRequest()
      this.scheduleLoad()
    })
    this.navBlurListener = this.props.navigation.addListener('blur', () => {
      this.setState({ isSubmenuVisible: false, isMsgBtnVisible: false })
    })
    this.navTabPressListener = this.props.navigation.getParent()?.addListener('tabPress', () => {
      const isFocused =
        typeof this.props.navigation?.isFocused === 'function' ? this.props.navigation.isFocused() : true
      if (isFocused && !this.state.isFetching) {
        this.getLatestMessages()
      }
    })
    this.setTheme()
    this.scheduleLoad()
    this.handleSharedContent()
    this.handleComposeRequest()
  }

  componentDidUpdate(prevProps: Props) {
    this.handleSharedContent()
    this.handleComposeRequest()
  }

  handleComposeRequest() {
    const { composeUsername, composeAt } = this.props
    if (!composeUsername || !composeAt || composeAt === this._lastComposeAt) {
      return
    }
    this._lastComposeAt = composeAt
    this.setState({ activeRecipient: composeUsername }, () => {
      const tryOpen = (attempt = 0) => {
        if (this.refMsgBoxDialog) {
          this.refMsgBoxDialog.showDialog()
        } else if (attempt < 10) {
          setTimeout(() => tryOpen(attempt + 1), 200)
        }
      }
      setTimeout(() => tryOpen(), 300)
    })
  }

  handleSharedContent(overrideParams?: { sharedText?: string; sharedFile?: any; sharedAt?: number }) {
    const sharedText = overrideParams?.sharedText ?? this.props.sharedText
    const sharedFile = overrideParams?.sharedFile ?? this.props.sharedFile
    const sharedAt = overrideParams?.sharedAt ?? this.props.sharedAt
    const isNewShare = Boolean(sharedAt && sharedAt !== this._lastHandledSharedAt)
    const hasText = Boolean(sharedText && (sharedText !== this._lastHandledSharedText || isNewShare))
    const hasFile = Boolean(sharedFile && (sharedFile !== this._lastHandledSharedFile || isNewShare))
    if (hasText || hasFile) {
      this._lastHandledSharedText = sharedText
      this._lastHandledSharedFile = sharedFile
      this._lastHandledSharedAt = sharedAt
      const tryOpen = (attempt = 0) => {
        if (this.refMsgBoxDialog) {
          this.refMsgBoxDialog.showDialog()
          if (sharedText) {
            this.refMsgBoxDialog.addText(sharedText)
          }
          if (sharedFile) {
            this.refMsgBoxDialog.uploadCustomFile(sharedFile)
          }
        } else if (attempt < 10) {
          setTimeout(() => tryOpen(attempt + 1), 200)
        }
      }
      setTimeout(() => tryOpen(), 300)
    }
  }

  componentWillUnmount() {
    this.isUnmounted = true
    if (this.context?.refs?.MailView === this) {
      this.context.refs.MailView = null
    }
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

  cacheOn() {
    return this.context?.config?.isDiscussionCacheEnabled !== false
  }

  async cachedMailPage(recipient: string) {
    if (!this.cacheOn()) {
      return null
    }
    const store = await readFeedCache()
    return store.mail?.pages?.[mailCacheKey(recipient)] || null
  }

  saveMail(recipient: string, conversations, messages) {
    if (!this.cacheOn()) {
      return
    }
    updateFeedCache(store => rememberMailPage(store, mailCacheKey(recipient), conversations, messages)).catch(e =>
      console.warn(e),
    )
  }

  async prepareMissing(posts) {
    const pending = (posts || []).filter(post => post && !post.parsed)
    if (!pending.length) {
      return posts || []
    }
    const prepared = await preparePosts(
      pending,
      [],
      true,
      this.context?.theme?.metrics?.fontSizes?.p,
      this.context?.config?.imageDownloadMaxKb,
      this.trackLoad,
    )
    const byId = new Map(prepared.map(post => [String(post.id), post]))
    return (posts || []).map(post => (post?.id != null && byId.get(String(post.id))) || post)
  }

  async loadMail(recipient: string, visibleMessages: any[] = []) {
    const queryString = !recipient || recipient === 'all' ? '' : `?user=${recipient}`
    const res = await this.nyx?.api.getMail(queryString)
    if (!res || res.error || !Array.isArray(res.posts)) {
      return null
    }
    const merged = reconcileMailMessages(visibleMessages, res.posts || [])
    const messages = await this.prepareMissing(merged.items)
    return { conversations: res.conversations || [], messages }
  }

  async getLatestMessages() {
    const isFocused =
      typeof this.props.navigation?.isFocused === 'function' ? this.props.navigation.isFocused() : true
    const recipient = 'all'
    this.nyx?.holdErrors()
    let servedFromCache = false
    let visible = this.state.activeRecipient === recipient ? this.state.messages || [] : []
    try {
      if (!visible.length) {
        const cached = await this.cachedMailPage(recipient)
        if (cached?.messages?.length) {
          visible = cached.messages
          servedFromCache = true
          this.setState({
            conversations: cached.conversations,
            messages: cached.messages,
            isSubmenuVisible: isFocused,
            isMsgBtnVisible: isFocused,
            isFetching: true,
          })
        }
      }
      const request = this.beginMailLoad({
        isSubmenuVisible: isFocused,
        isMsgBtnVisible: isFocused,
      })
      const loaded = await this.loadMail(recipient, visible)
      this.trackLoad({ ...request, done: 1 })
      if (!loaded) {
        servedFromCache = servedFromCache || visible.length > 0
        this.setState({ isFetching: false })
        return
      }
      servedFromCache = false
      LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
      this.lastFetchAt = Date.now()
      this.setState({
        conversations: loaded.conversations,
        messages: loaded.messages,
        isFetching: false,
      })
      this.saveMail(recipient, loaded.conversations, loaded.messages)
    } catch (e) {
      console.warn(e)
      servedFromCache = servedFromCache || visible.length > 0
      this.setState({ isFetching: false })
    } finally {
      this.nyx?.releaseErrors(servedFromCache)
    }
  }

  async getOlderMessages() {
    const request = this.beginMailLoad()
    const { activeRecipient, messages } = this.state
    if (!messages?.length) {
      this.setState({ isFetching: false })
      return
    }
    const queryString = `?${activeRecipient === 'all' ? '' : `user=${activeRecipient}&`}order=older_than&from_id=${
      messages[messages.length - 1].id
    }`
    const res = await this.nyx?.api.getMail(queryString)
    this.trackLoad({ ...request, done: 1 })
    if (!res || res.error || !Array.isArray(res.posts)) {
      this.setState({ isFetching: false })
      return
    }
    const parsedMessages = await preparePosts(
      res?.posts || [],
      messages,
      true,
      this.context?.theme?.metrics?.fontSizes?.p,
      this.context?.config?.imageDownloadMaxKb,
      this.trackLoad,
    )
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({
      conversations: res?.conversations || this.state.conversations,
      messages: parsedMessages,
      isFetching: false,
    })
    this.saveMail(activeRecipient, res?.conversations || this.state.conversations, parsedMessages)
  }

  async onConversationSelected(username) {
    this.nyx?.holdErrors()
    let servedFromCache = false
    let visible: any[] = []
    try {
      const cached = await this.cachedMailPage(username)
      if (cached?.messages?.length) {
        visible = cached.messages
        servedFromCache = true
        this.setState({
          activeRecipient: username,
          conversations: cached.conversations,
          messages: cached.messages,
          isFetching: true,
        })
      }
      const request = this.beginMailLoad(cached?.messages?.length ? {} : { messages: [] })
      const loaded = await this.loadMail(username, visible)
      this.trackLoad({ ...request, done: 1 })
      if (!loaded) {
        servedFromCache = servedFromCache || visible.length > 0
        this.setState({ activeRecipient: username, isFetching: false })
        return
      }
      servedFromCache = false
      LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
      this.setState({
        activeRecipient: username,
        conversations: loaded.conversations,
        messages: loaded.messages,
        isFetching: false,
      })
      this.saveMail(username, loaded.conversations, loaded.messages)
    } catch (e) {
      console.warn(e)
      servedFromCache = servedFromCache || visible.length > 0
      this.setState({ activeRecipient: username, isFetching: false })
    } finally {
      this.nyx?.releaseErrors(servedFromCache)
    }
  }

  showImages(image) {
    this.revealPostImage(image)
    const { images, imgIndex } = toGalleryImages(image, galleryImagesFromPosts(this.state.messages))
    this.props.onImages(images, imgIndex)
  }

  revealPostImage(image) {
    this._revealQueue = this._revealQueue.then(() => this.revealPostImageNow(image)).catch(e => console.warn(e))
    return this._revealQueue
  }

  async revealPostImageNow(image) {
    const next = await revealImageInPosts(
      this.state.messages.slice(),
      image,
      this.context?.theme?.metrics?.fontSizes?.p,
    )
    this.setState({ messages: next.slice() })
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

  async onMailDelete(postId: number) {
    this.getLatestMessages()
  }

  async onMailReminder(post, isReminder: boolean) {
    const next = post
    next.reminder = isReminder
    const messages = [...this.state.messages]
    const idx = messages.findIndex(m => m.id === post.id)
    if (idx >= 0) {
      messages[idx] = next
      this.setState({ messages })
    }
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
        isHeaderInteractive={true}
        isHeaderPressable={true}
        mailMode={true}
        onHeaderPress={() => this.onReply(msg.username)}
        onReply={(discussionId, postId, username) => {
          this.onReply(username || msg.username)
        }}
        onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
        onImage={image => this.showImages(image)}
        onDelete={postId => this.onMailDelete(postId)}
        onReminder={(post, isReminder) => this.onMailReminder(post, isReminder)}
      />
    )
  }

  render() {
    const { activeRecipient, conversations, theme } = this.state
    if (!theme) {
      return null
    }
    const listEmpty = !this.state.messages.length
    const loadSteps = this.state.fetchProgress?.steps || []
    const progressMode = resolveFetchProgressMode(this.context?.config, 'lists')
    const showProgress = progressMode !== 'off' && this.state.isFetching
    const loadActive = showProgress && loadSteps.length > 0
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
        {loadActive && !listEmpty && (
          <FetchProgressComponent
            progress={this.state.fetchProgress}
            fill={false}
            detailed={progressMode === 'detailed'}
          />
        )}
        <FlatList
          style={{ flex: 1 }}
          ref={r => (this.refScroll = r)}
          data={this.state.messages}
          extraData={this.state}
          keyExtractor={item => `${item.id}`}
          refreshing={this.state.isFetching && !showProgress}
          onRefresh={() => this.getLatestMessages()}
          onEndReached={() => this.getOlderMessages()}
          onEndReachedThreshold={0.01}
          contentContainerStyle={listEmpty ? { flexGrow: 1 } : undefined}
          ListEmptyComponent={
            showProgress ? (
              <FetchProgressComponent progress={this.state.fetchProgress} fill detailed={progressMode === 'detailed'} />
            ) : null
          }
          renderItem={({ item }) => this.renderMessage(item)}
        />
        <MessageBoxDialog
          ref={r => (this.refMsgBoxDialog = r)}
          nyx={this.nyx!}
          params={{ mailRecipient: this.state.activeRecipient !== 'all' ? this.state.activeRecipient : '' }}
          fabBackgroundColor={theme.colors.secondary}
          fabIcon={'email'}
          isVisible={this.state.isMsgBtnVisible}
          onSend={() => this.getLatestMessages()}
        />
      </View>
    )
  }
}
