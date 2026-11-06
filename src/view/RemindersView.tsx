import React, { Component } from 'react'
import { FlatList, InteractionManager, View } from 'react-native'
import { Button, Dialog, FAB, Portal, Text, TextInput, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { FetchProgressComponent, PostComponent } from '../component'
import {
  confirm,
  createCustomReminderList,
  CustomReminderList,
  deleteCustomReminderList,
  emptyFetchProgress,
  FetchProgressEvent,
  FetchProgressState,
  filterDiscussions,
  filterPostsByContent,
  formatTimestamp,
  galleryImagesFromPosts,
  getCustomReminderLists,
  MainContext,
  Nyx,
  preparePosts,
  readFeedCache,
  reconcilePosts,
  reduceFetchProgress,
  rememberReminders,
  resolveFetchProgressMode,
  revealImageInPosts,
  subscribeCustomReminders,
  t,
  Theme,
  toGalleryImages,
  updateFeedCache,
} from '../lib'

type TabType = 'mail' | 'discussions' | 'custom'

type Props = {
  navigation: any
}

type State = {
  activeTab: TabType
  bookmarks: any[]
  mail: any[]
  customLists: CustomReminderList[]
  images: any[]
  isFetching: boolean
  fetchProgress: FetchProgressState
  isCreateDialogOpen: boolean
  newListName: string
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
  unsubscribeCustomReminders?: () => void
  isUnmounted = false
  _revealQueue: Promise<any> = Promise.resolve()

  constructor(props) {
    super(props)
    this.state = {
      activeTab: 'mail',
      bookmarks: [],
      mail: [],
      customLists: [],
      images: [],
      isFetching: false,
      fetchProgress: emptyFetchProgress(),
      isCreateDialogOpen: false,
      newListName: '',
      theme: undefined,
    }
  }

  componentDidMount() {
    this.isUnmounted = false
    this.nyx = this.context.nyx
    this.filters = [...this.context.filters, ...this.context.blockedUsers]
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      InteractionManager.runAfterInteractions(() => {
        if (this.isUnmounted) {
          return
        }
        const isFocused =
          typeof this.props.navigation?.isFocused === 'function' ? this.props.navigation.isFocused() : true
        if (isFocused) {
          this.loadCustomLists()
          if (!this.state.isFetching) {
            this.getReminders()
          }
        }
      })
    })
    this.navTabPressListener = this.props.navigation.getParent()?.addListener('tabPress', () => {
      const isFocused =
        typeof this.props.navigation?.isFocused === 'function' ? this.props.navigation.isFocused() : true
      if (isFocused) {
        this.loadCustomLists()
        if (!this.state.isFetching) {
          this.getReminders()
        }
      }
    })
    this.setTheme()
    this.loadCustomLists()
    this.unsubscribeCustomReminders = subscribeCustomReminders(() => {
      if (!this.isUnmounted) {
        this.loadCustomLists()
      }
    })
    InteractionManager.runAfterInteractions(() => {
      if (this.isUnmounted) {
        return
      }
      const isFocused =
        typeof this.props.navigation?.isFocused === 'function' ? this.props.navigation.isFocused() : true
      if (isFocused && !this.state.isFetching) {
        this.getReminders()
      }
    })
  }

  componentWillUnmount() {
    this.isUnmounted = true
    if (this.navFocusListener) {
      this.navFocusListener()
    }
    if (this.navTabPressListener) {
      this.navTabPressListener()
    }
    if (this.unsubscribeCustomReminders) {
      this.unsubscribeCustomReminders()
    }
  }

  setTheme() {
    this.setState({ theme: this.context.theme })
  }

  async loadCustomLists() {
    const customLists = await getCustomReminderLists()
    if (!this.isUnmounted) {
      this.setState({ customLists })
    }
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

  async onCreateList() {
    const name = this.state.newListName?.trim()
    if (!name) return
    this.setState({ isCreateDialogOpen: false, newListName: '' })
    await createCustomReminderList(name)
    await this.loadCustomLists()
  }

  async onDeleteList(listId: string) {
    const ok = await confirm(
      t('reminders.deleteList') || 'Smazat seznam',
      t('reminders.deleteListConfirm') || 'Opravdu chcete smazat tento seznam?',
    )
    if (ok) {
      await deleteCustomReminderList(listId)
      await this.loadCustomLists()
    }
  }

  renderTabs() {
    const theme = this.context.theme || this.state.theme
    const colors = theme?.colors || ({} as any)
    const fontSizes = theme?.metrics?.fontSizes || { p: 14 }
    const tabs: { key: TabType; label: string; count: number }[] = [
      {
        key: 'mail',
        label: t('reminders.tabMail') || 'Pošta',
        count: this.state.mail?.length || 0,
      },
      {
        key: 'discussions',
        label: t('reminders.tabDiscussions') || 'Diskuze',
        count: this.state.bookmarks?.length || 0,
      },
      {
        key: 'custom',
        label: t('reminders.tabCustom') || 'Vlastní',
        count: this.state.customLists?.length || 0,
      },
    ]

    return (
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.row || '#1a1b1d',
          borderLeftWidth: 3,
          borderColor: colors.primary || '#d32f2f',
          marginBottom: 0,
        }}>
        {tabs.map((tab, index) => {
          const isSelected = this.state.activeTab === tab.key
          return (
            <TouchableRipple
              key={tab.key}
              onPress={() => this.setState({ activeTab: tab.key })}
              rippleColor={colors.ripple}
              style={{
                flex: 1,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                paddingHorizontal: 4,
                backgroundColor: isSelected ? (colors.card || '#2a2b2e') : colors.transparent,
                borderRightWidth: index < tabs.length - 1 ? 1 : 0,
                borderColor: colors.border || '#333',
              }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: fontSizes.small,
                  fontWeight: isSelected ? '700' : '400',
                  color: isSelected ? colors.text : (colors.faded || '#888'),
                  textAlign: 'center',
                }}>
                {`${tab.label}${tab.count > 0 ? ` (${tab.count})` : ''}`}
              </Text>
            </TouchableRipple>
          )
        })}
      </View>
    )
  }

  renderCustomListRow(item: CustomReminderList) {
    const theme = this.context.theme || this.state.theme
    const colors = theme?.colors || ({} as any)
    const fontSizes = theme?.metrics?.fontSizes || { h3: 16, p: 14, small: 12 }
    const count = item.posts?.length || 0

    return (
      <TouchableRipple
        key={item.id}
        onPress={() =>
          this.props.navigation.push('customReminderList', {
            listId: item.id,
            listName: item.name,
          })
        }
        rippleColor={colors.ripple}
        style={{
          backgroundColor: colors.card || '#2a2b2e',
          paddingVertical: 10,
          paddingHorizontal: 12,
          marginBottom: 2,
          borderRadius: 0,
          borderLeftWidth: 3,
          borderLeftColor: colors.secondary || '#4dabf7',
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <>
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}>
              <Text
                style={{
                  fontSize: fontSizes.h3,
                  fontWeight: '700',
                  color: colors.text,
                  flex: 1,
                  marginRight: 8,
                }}
                numberOfLines={1}>
                {item.name}
              </Text>
              <View
                style={{
                  backgroundColor: colors.surface || '#333',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}>
                <Text
                  style={{
                    fontSize: fontSizes.small,
                    color: colors.secondary || '#4dabf7',
                    fontWeight: '600',
                  }}>
                  {count} {count === 1 ? 'příspěvek' : count >= 2 && count <= 4 ? 'příspěvky' : 'příspěvků'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
              <Text style={{ fontSize: fontSizes.small - 1, color: colors.faded || '#888' }}>
                {t('reminders.created') || 'Vytvořeno'}: {formatTimestamp(item.createdAt)}
              </Text>
              <Text style={{ fontSize: fontSizes.small - 1, color: colors.faded || '#888' }}>
                {t('reminders.updated') || 'Upraveno'}: {formatTimestamp(item.updatedAt)}
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={20} color={colors.faded || '#888'} style={{ marginLeft: 6 }} />
        </>
      </TouchableRipple>
    )
  }

  render() {
    const theme = this.context.theme || this.state.theme
    const colors = theme?.colors || ({} as any)
    const fontSizes = theme?.metrics?.fontSizes || { h3: 16, p: 14, small: 12 }
    const { activeTab } = this.state
    const config = this.context?.config

    const currentPosts = activeTab === 'mail' ? this.state.mail : this.state.bookmarks
    const listEmpty = activeTab === 'custom' ? this.state.customLists.length === 0 : currentPosts.length === 0

    const loadSteps = this.state.fetchProgress?.steps || []
    const progressMode = resolveFetchProgressMode(config, 'lists')
    const showProgress = progressMode !== 'off' && this.state.isFetching
    const loadActive = showProgress && loadSteps.length > 0 && activeTab !== 'custom'

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {this.renderTabs()}

        {loadActive && !listEmpty && (
          <FetchProgressComponent
            progress={this.state.fetchProgress}
            fill={false}
            detailed={progressMode === 'detailed'}
          />
        )}

        {activeTab === 'custom' ? (
          <FlatList
            data={this.state.customLists}
            keyExtractor={item => item.id}
            extraData={this.state}
            refreshing={false}
            onRefresh={() => this.loadCustomLists()}
            style={{ flex: 1 }}
            contentContainerStyle={
              listEmpty
                ? { flexGrow: 1 }
                : { paddingBottom: (config?.isBottomTabs ? 45 : 0) + 70 }
            }
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 24,
                }}>
                <Icon name="bookmark" size={48} color={colors.secondary || '#4dabf7'} style={{ marginBottom: 12 }} />
                <Text
                  style={{
                    color: colors.text,
                    fontSize: fontSizes.h3,
                    fontWeight: '700',
                    textAlign: 'center',
                    marginBottom: 6,
                  }}>
                  {t('reminders.customEmpty') || 'Zatím nemáte žádný vlastní seznam'}
                </Text>
                <Text
                  style={{
                    color: colors.faded || '#888',
                    fontSize: fontSizes.p,
                    textAlign: 'center',
                  }}>
                  {t('reminders.customEmptyDesc') ||
                    'Klepněte na tlačítko + níže pro vytvoření nového seznamu'}
                </Text>
              </View>
            }
            renderItem={({ item }) => this.renderCustomListRow(item)}
          />
        ) : (
          <FlatList
            data={currentPosts}
            keyExtractor={item => String(item.id)}
            extraData={this.state}
            initialNumToRender={20}
            refreshing={this.state.isFetching && !showProgress}
            onRefresh={() => this.getReminders()}
            style={{ flex: 1 }}
            contentContainerStyle={listEmpty ? { flexGrow: 1 } : undefined}
            ListEmptyComponent={
              showProgress ? (
                <FetchProgressComponent
                  progress={this.state.fetchProgress}
                  fill
                  detailed={progressMode === 'detailed'}
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 24,
                  }}>
                  <Icon name="bell-off" size={48} color={colors.faded || '#888'} style={{ marginBottom: 12 }} />
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: fontSizes.h3,
                      fontWeight: '700',
                      textAlign: 'center',
                    }}>
                    {activeTab === 'mail'
                      ? 'Žádné upomínky v poště'
                      : 'Žádné upomínky v diskuzích'}
                  </Text>
                </View>
              )
            }
            renderItem={({ item }) => (
              <PostComponent
                key={item.id}
                post={item}
                nyx={this.nyx!}
                isHeaderInteractive={false}
                isReply={false}
                isUnread={item.new}
                isHeaderPressable={item.discussion_id > 0}
                mailMode={activeTab === 'mail' || item.location === 'mail'}
                onHeaderPress={() => (item.discussion_id > 0 ? this.showPost(item.discussion_id, item.id) : null)}
                onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
                onImage={image => this.showImages(image)}
                onReminder={post => this.onReminderRemove(post)}
              />
            )}
          />
        )}

        {/* FAB on Custom Tab */}
        {activeTab === 'custom' && (
          <Portal>
            <FAB
              icon="plus"
              color="#FFFFFF"
              style={{
                position: 'absolute',
                right: 16,
                bottom: (config?.isBottomTabs ? 45 : 0) + 16,
                backgroundColor: colors.primary || '#d32f2f',
              }}
              onPress={() => this.setState({ isCreateDialogOpen: true, newListName: '' })}
            />
          </Portal>
        )}

        {/* Dialog to create a new custom list */}
        <Portal>
          <Dialog
            visible={this.state.isCreateDialogOpen}
            onDismiss={() => this.setState({ isCreateDialogOpen: false })}
            style={{
              backgroundColor: colors.surface || '#222426',
              borderRadius: 6,
              marginHorizontal: 16,
            }}>
            <Dialog.Title
              style={{
                color: colors.text,
                fontSize: fontSizes.h3,
                fontWeight: 'bold',
              }}>
              {t('reminders.createList') || 'Vytvořit seznam'}
            </Dialog.Title>
            <Dialog.Content>
              <TextInput
                mode="outlined"
                label={t('reminders.listName') || 'Název seznamu'}
                placeholder={t('reminders.listNamePlaceholder') || 'Zadejte název seznamu...'}
                value={this.state.newListName}
                onChangeText={text => this.setState({ newListName: text })}
                autoFocus
                textColor={colors.text}
                style={{ backgroundColor: colors.card || '#1e1f21' }}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => this.setState({ isCreateDialogOpen: false })}
                color={colors.faded || '#888'}>
                {t('cancel') || 'Zrušit'}
              </Button>
              <Button
                disabled={!this.state.newListName?.trim()}
                onPress={() => this.onCreateList()}
                color={colors.primary || '#d32f2f'}>
                {t('reminders.createList') || 'Vytvořit'}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    )
  }
}
