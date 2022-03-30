import React from 'react'
import { LayoutAnimation, SectionList, View } from 'react-native'
import { DiscussionRowComponent, SectionHeaderComponent } from '../component'
import { filterDiscussions, LayoutAnimConf, recountDiscussionList, Theme } from '../lib'
import { BaseDiscussionListView } from './BaseDiscussionListView'

type Props = {
  navigation: any
  onDetailShow: Function
}
type State = {
  reminderCount: number
  sectionedBookmarks: any[]
  shownBookmarks: any[]
  shownCategories: any[]
  isShowingRead: boolean
  isFetching: boolean
  theme?: Theme
}
export class BookmarksView extends BaseDiscussionListView<Props> {
  state: Readonly<State>
  constructor(props) {
    super(props)
    this.state = {
      reminderCount: 0,
      sectionedBookmarks: [],
      shownBookmarks: [],
      shownCategories: [],
      isShowingRead: false,
      isFetching: false,
    }
  }

  async getList() {
    this.setState({ isFetching: true })
    const res = await this.nyx?.api.getBookmarks(this.state.isShowingRead)
    if (res?.bookmarks?.length) {
      const reminderCount = res.reminder_count || 0
      const sectionedBookmarks = res.bookmarks.map(b => ({
        title: b.category.category_name,
        data: filterDiscussions(recountDiscussionList(b.bookmarks), this.filters),
      }))
      const shownBookmarks = [...sectionedBookmarks]
      const shownCategories =
        this.state.shownCategories.length > 0
          ? this.state.shownCategories
          : Array.from(new Set(sectionedBookmarks.map(b => b.title)))
      LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
      this.setState({ reminderCount, sectionedBookmarks, shownBookmarks, shownCategories, isFetching: false })
      this.filterCategories(shownCategories, true)
    } else {
      this.setState({ isFetching: false })
    }
  }

  filterCategories(shownCategories, isAnimated = true) {
    const shownBookmarks: Array<{ title: string; data: any[] }> = []
    for (const b of this.state.sectionedBookmarks) {
      if (!shownCategories.includes(b.title)) {
        shownBookmarks.push({ title: b.title, data: [] })
      } else {
        shownBookmarks.push({ title: b.title, data: [...b.data] })
      }
    }
    if (isAnimated) {
      LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    }
    this.setState({ shownCategories, shownBookmarks })
  }

  toggleCategory(title) {
    let shownCategories = [...this.state.shownCategories]
    if (shownCategories.includes(title)) {
      shownCategories = this.state.shownCategories.filter(c => c !== title)
    } else {
      shownCategories.push(title)
    }
    this.filterCategories(shownCategories)
    this.persistShownCategories(shownCategories)
  }

  render() {
    const { shownCategories, shownBookmarks, theme, isFetching } = this.state
    if (!theme) {
      return null
    }
    return (
      <View style={{ backgroundColor: theme.colors.background, height: '100%' }}>
        <SectionList
          sections={shownBookmarks}
          stickySectionHeadersEnabled={true}
          initialNumToRender={500}
          keyExtractor={item => item.discussion_id}
          refreshing={isFetching}
          onRefresh={() => this.getList()}
          // getItemLayout={(data, index) => {
          //   return { length: 35, offset: 35 * index, index }
          // }}
          renderSectionHeader={({ section: { title } }) => (
            <SectionHeaderComponent
              title={title}
              icon={shownCategories.includes(title) ? undefined : 'plus'}
              isPressable={true}
              onPress={() => this.toggleCategory(title)}
            />
          )}
          renderItem={({ item }) => (
            <DiscussionRowComponent
              key={item.discussion_id}
              discussion={item}
              onPress={id => this.showDiscussion(id)}
              onLongPress={id => this.showDiscussionStats(id)}
            />
          )}
        />
        {this.renderFAB()}
      </View>
    )
  }
}
