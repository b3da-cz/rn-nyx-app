import React from 'react'
import { SectionList, Text, View } from 'react-native'
import { FAB } from 'react-native-paper'
import { DiscussionRowComponent } from '../component'
import { Styling } from '../lib'
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
      this.setState({ reminderCount, sectionedBookmarks, isFetching: false })
    } else {
      this.setState({ isFetching: false })
    }
  }

  render() {
    return (
      <View>
        <SectionList
          sections={this.state.sectionedBookmarks}
          stickySectionHeadersEnabled={true}
          initialNumToRender={100}
          keyExtractor={(item, index) => item.discussion_id}
          refreshing={this.state.isFetching}
          onRefresh={() => this.getBookmarks()}
          renderSectionHeader={({ section: { title } }) => (
            <Text
              style={{
                fontSize: Styling.metrics.fontSize.medium,
                color: this.isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
                backgroundColor: this.isDarkMode ? Styling.colors.dark : Styling.colors.lighter,
                textAlign: 'left',
                paddingVertical: 6,
                paddingHorizontal: Styling.metrics.block.small,
                marginBottom: Styling.metrics.block.xsmall,
              }}>
              {title}
            </Text>
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
        <FAB
          small={true}
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            top: 0,
            backgroundColor: Styling.colors.darker,
            opacity: 0.75,
          }}
          icon={this.state.isShowingRead ? 'star-outline' : 'star'}
          visible={true}
          onPress={() => this.toggleRead(this.state.isShowingRead)}
        />
      </View>
    )
  }
}
