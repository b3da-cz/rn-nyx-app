import React, { Component } from 'react'
import { LayoutAnimation, SectionList, View } from 'react-native'
import { FetchProgressComponent, PostComponent, SectionHeaderComponent } from '../component'
import {
  MainContext,
  Nyx,
  t,
  Theme,
  emptyFetchProgress,
  FetchProgressEvent,
  FetchProgressState,
  filterDiscussions,
  filterPostsByContent,
  galleryImagesFromPosts,
  toGalleryImages,
  preparePosts,
  readFeedCache,
  reconcilePosts,
  rememberReminders,
  updateFeedCache,
  reduceFetchProgress,
  resolveFetchProgressMode,
  revealImageInPosts,
} from '../lib'

type Props = {
  navigation: any
}
type State = {
  sectionedReminders: any[]
  bookmarks: any[]
  mail: any[]
  images: any[]
  isFetching: boolean
  fetchProgress: FetchProgressState
  theme?: Theme
}
export class RemindersView extends Component<Props> {
  static contextType = MainContext
  state: Readonly<State>
  nyx?: Nyx
  filters: any[] = []
  refScroll: any
  navFocusListener?: Function
  navTabPressListener?: Function
  _revealQueue: Promise<any> = Promise.resolve()
  constructor(props) {
    super(props)
    this.state = {
      sectionedReminders: [],
      bookmarks: [],
      mail: [],
      images: [],
      isFetching: false,
      fetchProgress: emptyFetchProgress(),
      theme: undefined,
    }
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.filters = [...this.context.filters, ...this.context.blockedUsers]
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      setTimeout(() => this.getReminders(), 100)
    })
    this.navTabPressListener = this.props.navigation.getParent()?.addListener('tabPress', () => {
      const isFocused = this.props.navigation.isFocused()
      if (isFocused && !this.state.isFetching) {
        this.getReminders()
      }
    })
    this.setTheme()
    setTimeout(() => this.getReminders(), 100)
  }

  componentWillUnmount() {
    if (this.navFocusListener) {
      this.navFocusListener()
    }
    if (this.navTabPressListener) {
      this.navTabPressListener()
    }
  }

  setTheme() {
    this.setState({ theme: this.context.theme })
  }

  trackLoad = (event: FetchProgressEvent) => {
    this.setState(state => ({ fetchProgress: reduceFetchProgress(state.fetchProgress, event) }))
  }

  trackScoped = (scope: string, scopeLabel: string) => (event: FetchProgressEvent) => {
    this.trackLoad({
      ...event,
      id: `${scope}:${event.id}`,
      label: event.label || `${t(`load.${event.id}`)} · ${scopeLabel}`,
    })
  }

  cacheOn() {
    return this.context?.config?.isDiscussionCacheEnabled !== false
  }

  showReminders(bookmarks, mail, isFetching = false) {
    this.setState({
      images: galleryImagesFromPosts([...(mail || []), ...(bookmarks || [])]),
      bookmarks: bookmarks || [],
      mail: mail || [],
      sectionedReminders: [
        { title: t('reminders.inMail'), data: mail || [] },
        { title: t('reminders.inDiscussions'), data: bookmarks || [] },
      ],
      isFetching,
    })
  }

  async prepareMissing(posts, onProgress?: (event: FetchProgressEvent) => void) {
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
      onProgress,
    )
    const byId = new Map(prepared.map(post => [String(post.id), post]))
    return (posts || []).map(post => (post?.id != null && byId.get(String(post.id))) || post)
  }

  async getReminders() {
    const request = { id: 'request', label: t('reminders.title'), done: 0, total: 2 }
    this.nyx?.holdErrors()
    let servedFromCache = false
    let visibleBookmarks = this.state.bookmarks || []
    let visibleMail = this.state.mail || []
    try {
      if (this.cacheOn() && !visibleBookmarks.length && !visibleMail.length) {
        const store = await readFeedCache()
        if (store.reminders && (store.reminders.bookmarks.length || store.reminders.mail.length)) {
          visibleBookmarks = store.reminders.bookmarks
          visibleMail = store.reminders.mail
          this.showReminders(visibleBookmarks, visibleMail, true)
          servedFromCache = true
        }
      }
      this.setState({ isFetching: true, fetchProgress: reduceFetchProgress(emptyFetchProgress(), request) })
      const bookmarks = await this.fetchReminders(
        'bookmarks',
        visibleBookmarks,
        this.trackScoped('bookmarks', t('reminders.inDiscussions')),
      )
      this.trackLoad({ ...request, done: 1 })
      const mail = await this.fetchReminders('mail', visibleMail, this.trackScoped('mail', t('reminders.inMail')))
      this.trackLoad({ ...request, done: 2 })
      const failed = !bookmarks.ok || !mail.ok
      if (bookmarks.ok && mail.ok) {
        servedFromCache = false
      } else {
        servedFromCache = servedFromCache || visibleBookmarks.length > 0 || visibleMail.length > 0
      }
      this.showReminders(bookmarks.posts, mail.posts, false)
      if ((bookmarks.ok || mail.ok) && this.cacheOn()) {
        updateFeedCache(store => rememberReminders(store, bookmarks.posts, mail.posts)).catch(e => console.warn(e))
      }
    } finally {
      this.nyx?.releaseErrors(servedFromCache)
    }
  }

  async fetchReminders(type, visible, onProgress?: (event: FetchProgressEvent) => void) {
    try {
      const res = await this.nyx?.api.getReminders(type)
      if (!res || res.error || !Array.isArray(res.posts)) {
        return { ok: false, posts: visible || [] }
      }
      const filteredPosts = filterPostsByContent(filterDiscussions(res?.posts || [], this.filters), this.filters)
      const merged = reconcilePosts(visible || [], filteredPosts)
      const posts = await this.prepareMissing(merged.items, onProgress)
      return { ok: true, posts }
    } catch (e) {
      console.warn(e)
      return { ok: false, posts: visible || [] }
    }
  }

  showPost(discussionId, postId) {
    this.props.navigation.push('discussion', { discussionId, postId })
  }

  showImages(image) {
    this.revealPostImage(image)
    const list = galleryImagesFromPosts([...this.state.mail, ...this.state.bookmarks])
    const { images, imgIndex } = toGalleryImages(image, list)
    this.props.navigation.navigate('gallery', {
      images,
      imgIndex,
      onViewImage: (img: any) => this.revealPostImage(img),
    })
  }

  revealPostImage(image) {
    this._revealQueue = this._revealQueue.then(() => this.revealPostImageNow(image)).catch(e => console.warn(e))
    return this._revealQueue
  }

  async revealPostImageNow(image) {
    const fontSize = this.context?.theme?.metrics?.fontSizes?.p
    const bookmarks = await revealImageInPosts(this.state.bookmarks.slice(), image, fontSize)
    const mail = await revealImageInPosts(this.state.mail.slice(), image, fontSize)
    this.setState({
      bookmarks,
      mail,
      images: galleryImagesFromPosts([...mail, ...bookmarks]),
      sectionedReminders: [
        { title: t('reminders.inMail'), data: mail },
        { title: t('reminders.inDiscussions'), data: bookmarks },
      ],
    })
  }

  onReminderRemove(post) {
    let { bookmarks, mail } = this.state
    bookmarks = bookmarks.filter(p => p.id !== post.id)
    mail = mail.filter(p => p.id !== post.id)
    this.showReminders(bookmarks, mail, false)
    if (this.cacheOn()) {
      updateFeedCache(store => rememberReminders(store, bookmarks, mail)).catch(e => console.warn(e))
    }
  }

  render() {
    const { theme } = this.state
    const listEmpty = !this.state.bookmarks.length && !this.state.mail.length
    const loadSteps = this.state.fetchProgress?.steps || []
    const progressMode = resolveFetchProgressMode(this.context?.config, 'lists')
    const showProgress = progressMode !== 'off' && this.state.isFetching
    const loadActive = showProgress && loadSteps.length > 0
    return (
      <View style={{ flex: 1, backgroundColor: theme?.colors?.background }}>
        {loadActive && !listEmpty && (
          <FetchProgressComponent
            progress={this.state.fetchProgress}
            fill={false}
            detailed={progressMode === 'detailed'}
          />
        )}
        <SectionList
          sections={this.state.sectionedReminders}
          extraData={this.state}
          stickySectionHeadersEnabled={true}
          initialNumToRender={20}
          keyExtractor={item => item.id}
          refreshing={this.state.isFetching && !showProgress}
          onRefresh={() => this.getReminders()}
          style={{ flex: 1 }}
          contentContainerStyle={listEmpty ? { flexGrow: 1 } : undefined}
          ListEmptyComponent={
            showProgress ? (
              <FetchProgressComponent progress={this.state.fetchProgress} fill detailed={progressMode === 'detailed'} />
            ) : null
          }
          renderSectionHeader={({ section: { title } }) => <SectionHeaderComponent title={title} />}
          renderItem={({ item }) => (
            <PostComponent
              key={item.id}
              post={item}
              nyx={this.nyx!}
              isHeaderInteractive={false}
              isReply={false}
              isUnread={item.new}
              isHeaderPressable={item.discussion_id > 0}
              onHeaderPress={() => (item.discussion_id > 0 ? this.showPost(item.discussion_id, item.id) : null)}
              onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
              onImage={image => this.showImages(image)}
              onReminder={post => this.onReminderRemove(post)}
            />
          )}
        />
      </View>
    )
  }
}
