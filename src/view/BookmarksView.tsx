import React from 'react'
import { LayoutAnimation, SectionList, View } from 'react-native'
import { DiscussionRowComponent, SectionHeaderComponent } from '../component'
import {
  BookmarkSectionReadFilter,
  applyLocalLastReadToDiscussions,
  bookmarkFetchIncludesSeen,
  bookmarkSectionReadFilterIcon,
  filterBookmarkSection,
  filterDiscussions,
  hasAnyLocalLastRead,
  LayoutAnimConf,
  nextBookmarkSectionReadFilter,
  normalizeBookmarkSectionFilters,
  readDiscussionListCache,
  recountDiscussionList,
  rememberBookmarksOnList,
  Storage,
  updateDiscussionListCache,
  Theme,
} from '../lib'
import { BaseDiscussionListView } from './BaseDiscussionListView'

type Props = {
  navigation: any
  onDetailShow: Function
}
type BookmarkSection = { title: string; data: any[] }
type State = {
  reminderCount: number
  sectionedBookmarks: BookmarkSection[]
  shownCategories: string[]
  sectionReadFilters: Record<string, BookmarkSectionReadFilter>
  isShowingRead: boolean
  isBookmarkSectionReadFilterEnabled: boolean
  isFetching: boolean
  theme?: Theme
}
export class BookmarksView extends BaseDiscussionListView<Props> {
  state: Readonly<State>
  shownCategories: string[] = []
  sectionFilters: Record<string, BookmarkSectionReadFilter> = {}
  sectionFilterEnabled = true
  showingRead = false
  ready = false
  fetchedIncludesSeen = false
  appliedFeature = true
  constructor(props) {
    super(props)
    this.state = {
      reminderCount: 0,
      sectionedBookmarks: [],
      shownCategories: [],
      sectionReadFilters: {},
      isShowingRead: false,
      isBookmarkSectionReadFilterEnabled: true,
      isFetching: false,
    }
  }

  featureEnabled() {
    const value = this.context?.config?.isBookmarkSectionReadFilterEnabled
    if (value === undefined) {
      return this.sectionFilterEnabled
    }
    return !!value
  }

  ensureReady() {
    if (this.ready) {
      return
    }
    this.ready = true
    const config = this.context?.config || this.config || {}
    this.showingRead = config.isShowingReadOnLists === undefined ? true : !!config.isShowingReadOnLists
    this.sectionFilters = normalizeBookmarkSectionFilters(config.bookmarkSectionFilters)
    this.sectionFilterEnabled = config.isBookmarkSectionReadFilterEnabled !== false
    this.appliedFeature = this.sectionFilterEnabled
    this.shownCategories = Array.isArray(config.shownCategories) ? [...config.shownCategories] : []
  }

  syncSharedSettings() {
    const config = this.context?.config
    if (!config?.isLoaded) {
      return
    }
    this.sectionFilterEnabled = config.isBookmarkSectionReadFilterEnabled !== false
    if (typeof config.isShowingReadOnLists === 'boolean') {
      this.showingRead = config.isShowingReadOnLists
    }
    this.appliedFeature = this.sectionFilterEnabled
  }

  init() {
    this.ensureReady()
    super.init()
    this.setState({
      isShowingRead: this.showingRead,
      shownCategories: this.shownCategories,
      sectionReadFilters: this.sectionFilters,
      isBookmarkSectionReadFilterEnabled: this.sectionFilterEnabled,
    })
  }

  componentDidUpdate() {
    if (!this.ready || this.state.isFetching) {
      return
    }
    const featureOn = this.featureEnabled()
    if (featureOn === this.appliedFeature) {
      return
    }
    this.sectionFilterEnabled = featureOn
    this.appliedFeature = featureOn
    this.getList()
  }

  cacheOn() {
    return this.context?.config?.isDiscussionCacheEnabled !== false
  }

  showBookmarks(bookmarks, reminderCount, includeSeen, isAnimated = false) {
    this.fetchedIncludesSeen = includeSeen
    const sectionedBookmarks = (bookmarks || []).map(b => ({
      title: b.category.category_name,
      data: applyLocalLastReadToDiscussions(
        filterDiscussions(recountDiscussionList(b.bookmarks), this.filters),
        this.context?.config,
      ),
    }))
    if (this.shownCategories.length === 0) {
      this.shownCategories = Array.from(new Set(sectionedBookmarks.map(section => section.title)))
    }
    if (isAnimated) {
      LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    }
    this.setState({
      reminderCount: reminderCount || 0,
      sectionedBookmarks,
      shownCategories: this.shownCategories,
      sectionReadFilters: this.sectionFilters,
      isShowingRead: this.showingRead,
      isBookmarkSectionReadFilterEnabled: this.sectionFilterEnabled,
      isFetching: false,
    })
  }

  async saveBookmarks(bookmarks, reminderCount, includeSeen) {
    if (!this.cacheOn()) {
      return
    }
    await updateDiscussionListCache(list => rememberBookmarksOnList(list, bookmarks, reminderCount, includeSeen))
  }

  hasData(): boolean {
    return Array.isArray(this.state.sectionedBookmarks) && this.state.sectionedBookmarks.some(s => s.data?.length > 0)
  }

  async getList(isAnimated = false, force = false) {
    this.ensureReady()
    this.syncSharedSettings()
    const hasData = this.hasData()
    if (!hasData || force) {
      this.setState({ isFetching: true })
    }
    const includeSeen =
      bookmarkFetchIncludesSeen(this.sectionFilterEnabled, this.showingRead, this.sectionFilters) ||
      hasAnyLocalLastRead(this.context?.config)
    this.nyx?.holdErrors()
    let servedFromCache = false
    try {
      let res
      try {
        res = await this.nyx?.api.getBookmarks(includeSeen)
      } catch (e) {
        res = null
      }
      if (this.isUnmounted) {
        return
      }
      const totalItems = (res?.bookmarks || []).reduce(
        (sum, s) => sum + (Array.isArray(s?.bookmarks) ? s.bookmarks.length : 0),
        0,
      )
      if (!res?.error && res?.bookmarks?.length) {
        this.lastFetchAt = Date.now()
        this.showBookmarks(res.bookmarks, res.reminder_count || 0, includeSeen, isAnimated)
        if (totalItems > 0 || includeSeen) {
          this.saveBookmarks(res.bookmarks, res.reminder_count || 0, includeSeen).catch(e => console.warn(e))
        }
        return
      }
      if (!res?.error && Array.isArray(res?.bookmarks)) {
        this.lastFetchAt = Date.now()
        this.setState({
          isFetching: false,
          isShowingRead: this.showingRead,
          isBookmarkSectionReadFilterEnabled: this.sectionFilterEnabled,
          sectionReadFilters: this.sectionFilters,
        })
        return
      }
      if (this.state.sectionedBookmarks?.some(section => section.data?.length)) {
        this.setState({ isFetching: false })
        servedFromCache = true
        return
      }
      if (this.cacheOn()) {
        const store = await readDiscussionListCache()
        if (store.bookmarks?.bookmarks?.length) {
          this.showBookmarks(store.bookmarks.bookmarks, store.bookmarks.reminderCount, store.bookmarks.includeSeen, isAnimated)
          servedFromCache = true
          return
        }
      }
      this.setState({
        isFetching: false,
        isShowingRead: this.showingRead,
        isBookmarkSectionReadFilterEnabled: this.sectionFilterEnabled,
        sectionReadFilters: this.sectionFilters,
      })
    } finally {
      this.nyx?.releaseErrors(servedFromCache)
    }
  }

  toggleCategory(title) {
    let shownCategories = [...this.shownCategories]
    if (shownCategories.includes(title)) {
      shownCategories = shownCategories.filter(category => category !== title)
    } else {
      shownCategories.push(title)
    }
    this.shownCategories = shownCategories
    this.persistShownCategories(shownCategories)
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({ shownCategories })
  }

  async persistSectionReadFilters(sectionReadFilters) {
    if (this.context?.config) {
      this.context.config.bookmarkSectionFilters = sectionReadFilters
    }
    const config = await Storage.getConfig()
    config.bookmarkSectionFilters = sectionReadFilters
    await Storage.setConfig(config)
  }

  cycleSectionFilter(title: string) {
    if (!this.featureEnabled()) {
      return
    }
    this.sectionFilterEnabled = true
    const next = nextBookmarkSectionReadFilter(this.sectionFilters[title])
    const sectionFilters = { ...this.sectionFilters }
    if (next === 'all') {
      delete sectionFilters[title]
    } else {
      sectionFilters[title] = next
    }
    this.sectionFilters = sectionFilters
    this.persistSectionReadFilters(sectionFilters)
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    const needsSeen = bookmarkFetchIncludesSeen(true, this.showingRead, sectionFilters)
    this.setState({ sectionReadFilters: sectionFilters }, () => {
      if (needsSeen && !this.fetchedIncludesSeen) {
        this.getList()
      }
    })
  }

  renderSectionHeader = ({ section: { title } }) => {
    const { shownCategories, sectionReadFilters, theme } = this.state
    const featureOn = this.featureEnabled()
    const expanded = shownCategories.includes(title)
    const mode = sectionReadFilters?.[title]
    const showEye = expanded && featureOn
    return (
      <SectionHeaderComponent
        title={title}
        icon={showEye ? bookmarkSectionReadFilterIcon(mode) : expanded ? undefined : 'plus'}
        iconFamily={showEye ? 'material-community' : 'feather'}
        iconColor={showEye && mode === 'unread' ? theme?.colors.accent : theme?.colors.text}
        isPressable={true}
        onPress={() => this.toggleCategory(title)}
        onIconPress={showEye ? () => this.cycleSectionFilter(title) : undefined}
      />
    )
  }

  handleDiscussionPress = (id: any, lastSeenPostId?: any) => {
    this.showDiscussion(id, lastSeenPostId)
  }

  handleDiscussionLongPress = (id: any) => {
    this.showDiscussionStats(id)
  }

  renderItem = ({ item }: { item: any }) => (
    <DiscussionRowComponent
      key={item.discussion_id}
      discussion={item}
      onPress={this.handleDiscussionPress}
      onLongPress={this.handleDiscussionLongPress}
    />
  )

  render() {
    const { shownCategories, sectionedBookmarks, sectionReadFilters, isShowingRead, theme, isFetching } = this.state
    if (!theme) {
      return null
    }
    const featureOn = this.featureEnabled()
    const sections = sectionedBookmarks.map(section => {
      if (!shownCategories.includes(section.title)) {
        return { title: section.title, data: [] }
      }
      return {
        title: section.title,
        data: filterBookmarkSection(section.data, sectionReadFilters?.[section.title], isShowingRead, featureOn),
      }
    })
    return (
      <View style={{ backgroundColor: theme.colors.background, height: '100%' }}>
        <SectionList
          sections={sections}
          extraData={`${featureOn}|${this.state.isShowingRead}|${shownCategories.join('\n')}|${JSON.stringify(
            sectionReadFilters,
          )}`}
          stickySectionHeadersEnabled={true}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={7}
          keyExtractor={item => `${item.discussion_id}`}
          refreshing={isFetching}
          onRefresh={() => this.getList(false, true)}
          renderSectionHeader={this.renderSectionHeader}
          renderItem={this.renderItem}
        />
        {this.renderFAB()}
      </View>
    )
  }
}
