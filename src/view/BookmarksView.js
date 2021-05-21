import React from 'react'
import { LayoutAnimation, SectionList, View } from 'react-native'
import { DiscussionRowComponent, SectionHeaderComponent } from '../component'
import { LayoutAnimConf, Styling } from '../lib'
import { BaseDiscussionListView } from '../view'

type Props = {
  navigation: any,
  onDetailShow: Function,
}
export class BookmarksView extends BaseDiscussionListView<Props> {
  constructor(props) {
    super(props)
    this.state = {
      reminderCount: 0,
      sectionedBookmarks: [],
      shownBookmarks: [],
      shownCategories: null,
      isShowingRead: false,
      isFetching: false,
    }
  }

  async getList() {
    this.setState({ isFetching: true })
    const res = await this.nyx.getBookmarks(this.state.isShowingRead)
    if (res?.bookmarks?.length) {
      const reminderCount = res.reminder_count || 0
      const sectionedBookmarks = res.bookmarks.map(b => ({ title: b.category.category_name, data: b.bookmarks }))
      const shownBookmarks = [...sectionedBookmarks]
      const shownCategories = this.state.shownCategories ?? Array.from(new Set(sectionedBookmarks.map(b => b.title)))
      LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
      this.setState({ reminderCount, sectionedBookmarks, shownBookmarks, shownCategories, isFetching: false })
      this.filterCategories(shownCategories, true)
    } else {
      this.setState({ isFetching: false })
    }
  }

  filterCategories(shownCategories, isAnimated = true) {
    const shownBookmarks = []
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
    const { shownCategories, shownBookmarks, isFetching } = this.state
    return (
      <View style={{ backgroundColor: this.isDarkMode ? Styling.colors.black : Styling.colors.white }}>
        <SectionList
          sections={shownBookmarks}
          stickySectionHeadersEnabled={true}
          initialNumToRender={500}
          keyExtractor={(item, index) => item.discussion_id}
          refreshing={isFetching}
          onRefresh={() => this.getList()}
          // getItemLayout={(data, index) => {
          //   return { length: 46.2, offset: 46.2 * index, index }
          // }}
          renderSectionHeader={({ section: { title } }) => (
            <SectionHeaderComponent
              isDarkMode={this.isDarkMode}
              title={title}
              icon={shownCategories.includes(title) ? null : 'plus'}
              isPressable={true}
              onPress={() => this.toggleCategory(title)}
            />
          )}
          renderItem={({ item }) => (
            <DiscussionRowComponent
              key={item.discussion_id}
              discussion={item}
              isDarkMode={this.isDarkMode}
              onPress={id => this.showDiscussion(id)}
            />
          )}
        />
        {this.renderFAB()}
      </View>
    )
  }
}
