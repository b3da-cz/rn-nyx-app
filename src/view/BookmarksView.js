import React, { Component } from 'react'
import { SectionList, Text } from 'react-native'
import { DiscussionRowComponent } from '../component'
import { Context, Styling } from '../lib'

type Props = {
  navigation: any,
  onDetailShow: Function,
}
export class BookmarksView extends Component<Props> {
  static contextType = Context
  constructor(props) {
    super(props)
    this.state = {
      reminderCount: 0,
      sectionedBookmarks: [],
      isFetching: false,
    }
    this.navFocusListener = null
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      this.getBookmarks()
    })
    setTimeout(() => this.getBookmarks(), 100)
  }

  componentWillUnmount() {
    if (this.navFocusListener) {
      this.navFocusListener()
    }
  }

  async getBookmarks() {
    this.setState({ isFetching: true })
    const res = await this.nyx.getBookmarks()
    if (res?.bookmarks?.length) {
      const reminderCount = res.reminder_count || 0
      const sectionedBookmarks = res.bookmarks.map(b => ({ title: b.category.category_name, data: b.bookmarks }))
      this.setState({ reminderCount, sectionedBookmarks, isFetching: false })
    } else {
      this.setState({ isFetching: false })
    }
  }

  showDiscussion(id) {
    this.props.onDetailShow(id)
  }

  render() {
    return (
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
              textAlign: 'right',
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
    )
  }
}
