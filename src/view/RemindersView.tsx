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
  reduceFetchProgress,
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

  async getReminders() {
    const request = { id: 'request', label: t('reminders.title'), done: 0, total: 2 }
    this.setState({ isFetching: true, fetchProgress: reduceFetchProgress(emptyFetchProgress(), request) })
    const bookmarks = await this.fetchReminders('bookmarks', this.trackScoped('bookmarks', t('reminders.inDiscussions')))
    this.trackLoad({ ...request, done: 1 })
    const mail = await this.fetchReminders('mail', this.trackScoped('mail', t('reminders.inMail')))
    this.trackLoad({ ...request, done: 2 })
    const sectionedReminders = [
      { title: t('reminders.inMail'), data: mail.reminders },
      { title: t('reminders.inDiscussions'), data: bookmarks.reminders },
    ]
    LayoutAnimation.configureNext(LayoutAnimation.Presets.linear)
    this.setState({
      images: [...mail.images, ...bookmarks.images],
      bookmarks: bookmarks.reminders,
      mail: mail.reminders,
      sectionedReminders,
      isFetching: false,
    })
  }

  async fetchReminders(type, onProgress?: (event: FetchProgressEvent) => void) {
    const res = await this.nyx?.api.getReminders(type)
    // const newPosts = getDistinctPosts(res.posts, this.state[type])
    const filteredPosts = filterPostsByContent(filterDiscussions(res?.posts || [], this.filters), this.filters)
    const parsedPosts = await preparePosts(
      filteredPosts,
      [],
      true,
      this.context?.theme?.metrics?.fontSizes?.p,
      this.context?.config?.imageDownloadMaxKb,
      onProgress,
    )
    const images = galleryImagesFromPosts(parsedPosts)
    return {
      reminders: parsedPosts,
      images,
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
    this.setState({
      bookmarks,
      mail,
      sectionedReminders: [
        { title: t('reminders.inMail'), data: mail },
        { title: t('reminders.inDiscussions'), data: bookmarks },
      ],
    })
  }

  render() {
    const { theme } = this.state
    const listEmpty = !this.state.bookmarks.length && !this.state.mail.length
    const loadSteps = this.state.fetchProgress?.steps || []
    const loadActive = this.state.isFetching && loadSteps.length > 0
    return (
      <View style={{ flex: 1, backgroundColor: theme?.colors?.background }}>
        {loadActive && !listEmpty && <FetchProgressComponent progress={this.state.fetchProgress} fill={false} />}
        <SectionList
          sections={this.state.sectionedReminders}
          extraData={this.state}
          stickySectionHeadersEnabled={true}
          initialNumToRender={20}
          keyExtractor={item => item.id}
          refreshing={this.state.isFetching && !loadActive}
          onRefresh={() => this.getReminders()}
          style={{ flex: 1 }}
          contentContainerStyle={listEmpty ? { flexGrow: 1 } : undefined}
          ListEmptyComponent={
            this.state.isFetching ? <FetchProgressComponent progress={this.state.fetchProgress} fill /> : null
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
