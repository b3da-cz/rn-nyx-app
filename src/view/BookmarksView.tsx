import React from 'react'
import { LayoutAnimation, SectionList, View } from 'react-native'
import { DiscussionRowComponent, SectionHeaderComponent } from '../component'
import {
  BookmarkSectionReadFilter,
  bookmarkFetchIncludesSeen,
  bookmarkSectionReadFilterIcon,
  filterBookmarkSection,
  filterDiscussions,
  LayoutAnimConf,
  nextBookmarkSectionReadFilter,
  normalizeBookmarkSectionFilters,
  recountDiscussionList,
  Storage,
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

  async getList() {
    this.ensureReady()
    this.syncSharedSettings()
    this.setState({ isFetching: true })
    const includeSeen = bookmarkFetchIncludesSeen(this.sectionFilterEnabled, this.showingRead, this.sectionFilters)
    let res
    try {
      res = await this.nyx?.api.getBookmarks(includeSeen)
    } catch {
      this.setState({ isFetching: false })
      return
    }
    if (res?.bookmarks?.length) {
      this.fetchedIncludesSeen = includeSeen
      const reminderCount = res.reminder_count || 0
      const sectionedBookmarks = res.bookmarks.map(b => ({
        title: b.category.category_name,
        data: filterDiscussions(recountDiscussionList(b.bookmarks), this.filters),
      }))
      if (this.shownCategories.length === 0) {
        this.shownCategories = Array.from(new Set(sectionedBookmarks.map(section => section.title)))
      }
      const shownCategories = this.shownCategories
      LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
      this.setState({
        reminderCount,
        sectionedBookmarks,
        shownCategories,
        sectionReadFilters: this.sectionFilters,
        isShowingRead: this.showingRead,
        isBookmarkSectionReadFilterEnabled: this.sectionFilterEnabled,
        isFetching: false,
      })
    } else {
      this.setState({
        isFetching: false,
        isShowingRead: this.showingRead,
        isBookmarkSectionReadFilterEnabled: this.sectionFilterEnabled,
        sectionReadFilters: this.sectionFilters,
      })
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
          initialNumToRender={500}
          keyExtractor={item => `${item.discussion_id}`}
          refreshing={isFetching}
          onRefresh={() => this.getList()}
          renderSectionHeader={({ section: { title } }) => {
            const expanded = shownCategories.includes(title)
            const mode = sectionReadFilters?.[title]
            const showEye = expanded && featureOn
            return (
              <SectionHeaderComponent
                title={title}
                icon={showEye ? bookmarkSectionReadFilterIcon(mode) : expanded ? undefined : 'plus'}
                iconFamily={showEye ? 'material-community' : 'feather'}
                iconColor={showEye && mode === 'unread' ? theme.colors.accent : theme.colors.text}
                isPressable={true}
                onPress={() => this.toggleCategory(title)}
                onIconPress={showEye ? () => this.cycleSectionFilter(title) : undefined}
              />
            )
          }}
          renderItem={({ item }) => (
            <DiscussionRowComponent
              key={item.discussion_id}
              discussion={item}
              onPress={id => this.showDiscussion(id, item.last_seen_post_id)}
              onLongPress={id => this.showDiscussionStats(id)}
            />
          )}
        />
        {this.renderFAB()}
      </View>
    )
  }
}
